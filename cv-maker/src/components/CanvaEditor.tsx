import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CVData, sampleData } from '../types/types';

interface CanvaEditorProps {
  initialData?: CVData;
  onSave?: (data: CVData) => void;
}

const CanvaEditor: React.FC<CanvaEditorProps> = ({ initialData, onSave }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled design');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const location = useLocation();
  
  // CV data state
  const [cvData, setCvData] = useState<CVData>(initialData || sampleData);
  
  // Editing state
  const [currentlyEditing, setCurrentlyEditing] = useState<{
    field: string;
    section?: string;
    index?: number;
    subfield?: string;
  } | null>(null);
  
  // Load saved title on initial render
  useEffect(() => {
    const projectId = new URLSearchParams(location.search).get('project');
    const templateId = new URLSearchParams(location.search).get('template');
    
    // Construct a unique key for this document
    const documentKey = projectId 
      ? `cv-title-project-${projectId}` 
      : templateId 
        ? `cv-title-template-${templateId}`
        : 'cv-title-new';
        
    const savedTitle = localStorage.getItem(documentKey);
    if (savedTitle) {
      setDocumentTitle(savedTitle);
    } else if (templateId) {
      // If using a template, set a better default name
      setDocumentTitle(`CV based on template ${templateId}`);
    }
  }, [location.search]);
  
  // Save title when it changes
  useEffect(() => {
    if (documentTitle !== 'Untitled design') {
      const projectId = new URLSearchParams(location.search).get('project');
      const templateId = new URLSearchParams(location.search).get('template');
      
      // Construct a unique key for this document
      const documentKey = projectId 
        ? `cv-title-project-${projectId}` 
        : templateId 
          ? `cv-title-template-${templateId}`
          : 'cv-title-new';
          
      localStorage.setItem(documentKey, documentTitle);
    }
  }, [documentTitle, location.search]);
  
  // Handle title click to edit
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    // Focus the input after rendering
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 10);
  };
  
  // Handle title input blur to save
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
  };
  
  // Handle title input keydown (save on Enter)
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
    }
  };
  
  // Handle zooming in and out
  const handleZoom = (zoomIn: boolean) => {
    setZoom(prev => {
      const newZoom = zoomIn ? prev + 10 : prev - 10;
      return Math.max(50, Math.min(200, newZoom));
    });
  };
  
  // Handle field editing
  const startEditing = (field: string, section?: string, index?: number, subfield?: string) => {
    setCurrentlyEditing({ field, section, index, subfield });
    setActiveElement('text');
  };
  
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentlyEditing) return;
    
    const { field, section, index, subfield } = currentlyEditing;
    
    setCvData(prev => {
      const newData = { ...prev };
      
      if (section && typeof index === 'number') {
        if (subfield) {
          // Handle nested fields like experience[0].company
          (newData[section as keyof CVData] as any)[index][subfield] = e.target.value;
        } else {
          // Handle array fields like skills[0]
          (newData[section as keyof CVData] as any)[index] = e.target.value;
        }
      } else {
        // Handle top-level fields like firstName
        (newData as any)[field] = e.target.value;
      }
      
      // Call onSave if provided
      if (onSave) {
        onSave(newData);
      }
      
      return newData;
    });
  };
  
  const stopEditing = () => {
    setCurrentlyEditing(null);
    setActiveElement(null);
  };
  
  // Handle field keydown (save on Enter)
  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    }
  };

  // Editable field component
  const EditableField = ({ 
    value, 
    field, 
    section, 
    index, 
    subfield,
    className = "",
    isMultiline = false
  }: { 
    value: string, 
    field: string,
    section?: string,
    index?: number,
    subfield?: string,
    className?: string,
    isMultiline?: boolean
  }) => {
    const isEditing = currentlyEditing?.field === field && 
                      currentlyEditing?.section === section && 
                      currentlyEditing?.index === index &&
                      currentlyEditing?.subfield === subfield;
    
    if (isEditing) {
      return isMultiline ? (
        <textarea
          value={value}
          onChange={handleFieldChange}
          onBlur={stopEditing}
          onKeyDown={handleFieldKeyDown}
          className={`w-full border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleFieldChange}
          onBlur={stopEditing}
          onKeyDown={handleFieldKeyDown}
          className={`w-full border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          autoFocus
        />
      );
    }
    
    return (
      <div 
        onClick={() => startEditing(field, section, index, subfield)}
        className={`cursor-pointer hover:bg-blue-50 ${className}`}
      >
        {value}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Toolbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-700 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="font-medium text-xl border-b border-gray-300 focus:border-brand-primary focus:outline-none py-1 px-2"
              />
            ) : (
              <h1 
                className="font-medium text-xl cursor-pointer hover:text-brand-primary"
                onClick={handleTitleClick}
              >
                {documentTitle}
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleZoom(false)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm">{zoom}%</span>
              <button 
                onClick={() => handleZoom(true)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <button className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors">
              Share
            </button>
            
            <button className="bg-brand-primary text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors">
              Download
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Elements */}
        <div className="w-64 border-r border-gray-200 bg-white">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Templates</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-[1/1.4] border border-gray-200 rounded-md cursor-pointer hover:border-brand-primary"></div>
                <div className="aspect-[1/1.4] border border-gray-200 rounded-md cursor-pointer hover:border-brand-primary"></div>
                <div className="aspect-[1/1.4] border border-gray-200 rounded-md cursor-pointer hover:border-brand-primary"></div>
                <div className="aspect-[1/1.4] border border-gray-200 rounded-md cursor-pointer hover:border-brand-primary"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Elements</h2>
              <div className="space-y-2">
                <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span>Text</span>
                </button>
                
                <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Images</span>
                </button>
                
                <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Sections</span>
                </button>
                
                <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Icons</span>
                </button>
                
                <button className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span>Shapes</span>
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Background</h2>
              <div className="flex flex-wrap gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-gray-100 cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-gray-200 cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-blue-100 cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-green-100 cursor-pointer"></div>
                <div className="w-8 h-8 rounded-full bg-red-100 cursor-pointer"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto flex justify-center items-start p-8">
          <div 
            ref={canvasRef}
            className="bg-white shadow-lg mx-auto transition-transform"
            style={{ 
              width: '210mm',
              height: 'auto', 
              minHeight: '297mm',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center top',
            }}
          >
            {/* CV content with editable fields */}
            <div className="p-8 h-full">
              {/* Header section */}
              <div className="mb-8 border-2 border-transparent hover:border-blue-400 p-2">
                <h1 className="text-3xl font-bold">
                  <EditableField 
                    value={`${cvData.firstName} ${cvData.lastName}`} 
                    field="fullName"
                    className="inline-block"
                  />
                </h1>
                <p className="text-gray-600">
                  <EditableField 
                    value={cvData.title} 
                    field="title"
                    className="inline-block"
                  />
                </p>
              </div>
              
              {/* Contact information */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border-2 border-transparent hover:border-blue-400 p-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email: </span>
                    <EditableField 
                      value={cvData.email} 
                      field="email"
                      className="inline-block"
                    />
                  </p>
                </div>
                <div className="border-2 border-transparent hover:border-blue-400 p-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Phone: </span>
                    <EditableField 
                      value={cvData.phone} 
                      field="phone"
                      className="inline-block"
                    />
                  </p>
                </div>
                <div className="border-2 border-transparent hover:border-blue-400 p-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Location: </span>
                    <EditableField 
                      value={cvData.address} 
                      field="address"
                      className="inline-block"
                    />
                  </p>
                </div>
              </div>
              
              <hr className="my-6" />
              
              {/* Experience section */}
              <div className="border-2 border-transparent hover:border-blue-400 p-2 mt-6">
                <h2 className="text-xl font-bold mb-2">Experience</h2>
                {cvData.experience.map((exp, index) => (
                  <div className="mb-4" key={`exp-${index}`}>
                    <h3 className="font-medium">
                      <EditableField 
                        value={exp.position} 
                        field="position"
                        section="experience"
                        index={index}
                        subfield="position"
                        className="inline-block"
                      />
                    </h3>
                    <p className="text-sm text-gray-600">
                      <EditableField 
                        value={exp.company} 
                        field="company"
                        section="experience"
                        index={index}
                        subfield="company"
                        className="inline-block"
                      /> • 
                      <EditableField 
                        value={`${exp.startDate} - ${exp.endDate}`} 
                        field="dates"
                        section="experience"
                        index={index}
                        subfield="dates"
                        className="inline-block ml-1"
                      />
                    </p>
                    <ul className="list-disc list-inside text-sm mt-2">
                      {exp.tasks.map((task, taskIndex) => (
                        <li key={`task-${index}-${taskIndex}`}>
                          <EditableField 
                            value={task} 
                            field="task"
                            section="experience"
                            index={index}
                            subfield={`tasks[${taskIndex}]`}
                            className="inline-block"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Education section */}
              <div className="border-2 border-transparent hover:border-blue-400 p-2 mt-6">
                <h2 className="text-xl font-bold mb-2">Education</h2>
                {cvData.education.map((edu, index) => (
                  <div className="mb-4" key={`edu-${index}`}>
                    <h3 className="font-medium">
                      <EditableField 
                        value={edu.degree} 
                        field="degree"
                        section="education"
                        index={index}
                        subfield="degree"
                        className="inline-block"
                      />
                    </h3>
                    <p className="text-sm text-gray-600">
                      <EditableField 
                        value={edu.institution} 
                        field="institution"
                        section="education"
                        index={index}
                        subfield="institution"
                        className="inline-block"
                      /> • 
                      <EditableField 
                        value={`${edu.startDate} - ${edu.endDate}`} 
                        field="dates"
                        section="education"
                        index={index}
                        subfield="dates"
                        className="inline-block ml-1"
                      />
                    </p>
                  </div>
                ))}
              </div>

              {/* Skills section */}
              <div className="border-2 border-transparent hover:border-blue-400 p-2 mt-6">
                <h2 className="text-xl font-bold mb-2">Skills</h2>
                <p className="text-sm">
                  {cvData.skills.map((skill, index) => (
                    <EditableField 
                      key={`skill-${index}`}
                      value={skill} 
                      field="skill"
                      section="skills"
                      index={index}
                      className="inline-block mr-2"
                    />
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 border-l border-gray-200 bg-white">
          <div className="p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Properties</h2>
            
            {activeElement === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Font</label>
                  <select className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm">
                    <option>Arial</option>
                    <option>Roboto</option>
                    <option>Open Sans</option>
                    <option>Montserrat</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Size</label>
                  <select className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm">
                    <option>8</option>
                    <option>10</option>
                    <option>12</option>
                    <option>14</option>
                    <option>16</option>
                    <option>18</option>
                    <option>24</option>
                    <option>36</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Style</label>
                  <div className="flex gap-2">
                    <button className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 font-bold">B</button>
                    <button className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 italic">I</button>
                    <button className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 underline">U</button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Color</label>
                  <div className="flex flex-wrap gap-2">
                    <div className="w-6 h-6 rounded-full bg-black cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-600 cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-red-500 cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-blue-500 cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-green-500 cursor-pointer"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500 cursor-pointer"></div>
                  </div>
                </div>
              </div>
            )}
            
            {!activeElement && (
              <div className="text-center py-8 text-gray-500 text-sm">
                Select an element to edit its properties
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvaEditor; 