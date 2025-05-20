import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CVData, sampleData } from '../types/types';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { XYCoord, DropTargetMonitor, DragSourceMonitor } from 'react-dnd';

interface CanvaEditorProps {
  initialData?: CVData;
  onSave?: (data: CVData) => void;
}

// Define styling types
interface TextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  position?: {
    x: number;
    y: number;
  };
}

// Element styling interface
interface ElementStyle {
  id: string;
  style: TextStyle;
}

// Interface for drag item
interface DragItem {
  id: string;
  type: string;
}

const defaultStyle: TextStyle = {
  fontFamily: 'Arial',
  fontSize: '16px',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  textAlign: 'left',
};

// Add a helper function to convert TextStyle to CSSProperties
const textStyleToCssProperties = (style: TextStyle): React.CSSProperties => {
  const { position, ...rest } = style;
  
  return {
    ...rest,
    left: position?.x || 0,
    top: position?.y || 0,
  };
};

// Create a draggable field component
const DraggableField = ({ 
  id,
  children,
  style,
  onDragEnd
}: { 
  id: string;
  children: React.ReactNode;
  style: TextStyle;
  onDragEnd: (id: string, x: number, y: number) => void;
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'field',
    item: { id, type: 'field' } as DragItem,
    end: (item: DragItem | undefined, monitor: DragSourceMonitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord | null;
      if (delta && item) {
        const x = Math.round(delta.x);
        const y = Math.round(delta.y);
        onDragEnd(item.id, x, y);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const fieldStyle = {
    position: 'relative' as const,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    left: style.position?.x || 0,
    top: style.position?.y || 0,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    color: style.color,
    textAlign: style.textAlign,
  };

  return (
    <div ref={drag} style={fieldStyle}>
      <div className="drag-handle absolute -left-5 top-0 opacity-30 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </div>
      {children}
    </div>
  );
};

// Add a drop target for the CV canvas
const CVCanvas = ({ children, onDrop }: { children: React.ReactNode, onDrop: (id: string, x: number, y: number) => void }) => {
  const [, drop] = useDrop(() => ({
    accept: 'field',
    drop: (item: DragItem, monitor: DropTargetMonitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord | null;
      if (delta) {
        const x = Math.round(delta.x);
        const y = Math.round(delta.y);
        onDrop(item.id, x, y);
      }
      return undefined;
    },
  }));

  return (
    <div ref={drop} className="relative w-full h-full">
      {children}
    </div>
  );
};

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
  
  // Styles management
  const [elementStyles, setElementStyles] = useState<ElementStyle[]>([]);
  const [activeStyle, setActiveStyle] = useState<TextStyle>(defaultStyle);
  
  // After the existing states at the top of the component
  const [selectedElement, setSelectedElement] = useState<{
    field: string;
    section?: string;
    index?: number;
    subfield?: string;
  } | null>(null);
  
  // Get element ID
  const getElementId = (field: string, section?: string, index?: number, subfield?: string): string => {
    return `${field}${section ? `-${section}` : ''}${index !== undefined ? `-${index}` : ''}${subfield ? `-${subfield}` : ''}`;
  };
  
  // Get style for an element
  const getStyleForElement = (field: string, section?: string, index?: number, subfield?: string): TextStyle => {
    const id = getElementId(field, section, index, subfield);
    const elementStyle = elementStyles.find(style => style.id === id);
    return elementStyle ? elementStyle.style : defaultStyle;
  };
  
  // Replace the startEditing function
  const startEditing = (field: string, section?: string, index?: number, subfield?: string) => {
    setCurrentlyEditing({ field, section, index, subfield });
    setSelectedElement({ field, section, index, subfield });
    setActiveElement('text');
  };
  
  // Replace the stopEditing function
  const stopEditing = () => {
    setCurrentlyEditing(null);
    // Keep the element selected for styling
  };
  
  // Add a new handler for selecting without editing
  const selectElement = (field: string, section?: string, index?: number, subfield?: string) => {
    setSelectedElement({ field, section, index, subfield });
    setActiveElement('text');
  };
  
  // Modify the useEffect that updates activeStyle to use selectedElement instead of currentlyEditing
  useEffect(() => {
    if (selectedElement) {
      const { field, section, index, subfield } = selectedElement;
      const style = getStyleForElement(field, section, index, subfield);
      setActiveStyle(style);
    }
  }, [selectedElement]);
  
  // Modify the updateActiveElementStyle function to use selectedElement
  const updateActiveElementStyle = (styleUpdates: Partial<TextStyle>) => {
    if (!selectedElement) return;
    
    const { field, section, index, subfield } = selectedElement;
    const id = getElementId(field, section, index, subfield);
    
    const newStyle = { ...activeStyle, ...styleUpdates };
    setActiveStyle(newStyle);
    
    setElementStyles(prev => {
      const elementIndex = prev.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...prev];
        updated[elementIndex] = { id, style: newStyle };
        return updated;
      } else {
        return [...prev, { id, style: newStyle }];
      }
    });
  };
  
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
  
  // Handle field keydown (save on Enter)
  const handleFieldKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    }
  };

  // Font style handlers
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateActiveElementStyle({ fontFamily: e.target.value });
  };
  
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateActiveElementStyle({ fontSize: `${e.target.value}px` });
  };
  
  const handleBoldClick = () => {
    updateActiveElementStyle({ 
      fontWeight: activeStyle.fontWeight === 'bold' ? 'normal' : 'bold' 
    });
  };
  
  const handleItalicClick = () => {
    updateActiveElementStyle({ 
      fontStyle: activeStyle.fontStyle === 'italic' ? 'normal' : 'italic' 
    });
  };
  
  const handleUnderlineClick = () => {
    updateActiveElementStyle({ 
      textDecoration: activeStyle.textDecoration === 'underline' ? 'none' : 'underline' 
    });
  };
  
  const handleAlignClick = () => {
    const alignments = ['left', 'center', 'right'];
    const currentIndex = alignments.indexOf(activeStyle.textAlign);
    const nextIndex = (currentIndex + 1) % alignments.length;
    updateActiveElementStyle({ textAlign: alignments[nextIndex] as 'left' | 'center' | 'right' });
  };
  
  const handleColorClick = (color: string) => {
    updateActiveElementStyle({ color });
  };

  // Add a special handler for the name field
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    const nameParts = fullName.split(' ');
    
    setCvData(prev => {
      const newData = { ...prev };
      if (nameParts.length > 1) {
        newData.firstName = nameParts[0];
        newData.lastName = nameParts.slice(1).join(' ');
      } else {
        newData.firstName = fullName;
        newData.lastName = '';
      }
      
      // Call onSave if provided
      if (onSave) {
        onSave(newData);
      }
      
      return newData;
    });
  };
  
  // Handle field position update
  const handleFieldMove = (id: string, xDelta: number, yDelta: number) => {
    setElementStyles(prev => {
      const elementIndex = prev.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...prev];
        const currentStyle = updated[elementIndex].style;
        const currentPosition = currentStyle.position || { x: 0, y: 0 };
        
        updated[elementIndex] = { 
          ...updated[elementIndex], 
          style: { 
            ...currentStyle, 
            position: {
              x: currentPosition.x + xDelta,
              y: currentPosition.y + yDelta
            }
          } 
        };
        return updated;
      }
      return prev;
    });
  };
  
  // Update EditableField to use DraggableField
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
    
    const isSelected = selectedElement?.field === field && 
                      selectedElement?.section === section && 
                      selectedElement?.index === index &&
                      selectedElement?.subfield === subfield;
    
    const style = getStyleForElement(field, section, index, subfield);
    const cssStyle = textStyleToCssProperties(style);
    const fieldId = getElementId(field, section, index, subfield);
    
    const content = isEditing ? (
      isMultiline ? (
        <textarea
          value={value}
          onChange={handleFieldChange}
          onBlur={stopEditing}
          onKeyDown={handleFieldKeyDown}
          className={`w-full border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          style={cssStyle}
          autoFocus
          rows={3}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleFieldChange}
          onBlur={stopEditing}
          onKeyDown={handleFieldKeyDown}
          className={`w-full border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          style={cssStyle}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      )
    ) : (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (e.detail === 2) {
            // Double click to edit
            startEditing(field, section, index, subfield);
          } else {
            // Single click to select
            selectElement(field, section, index, subfield);
          }
        }}
        className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'ring-2 ring-blue-400' : ''} ${className}`}
      >
        {value}
      </div>
    );
    
    return (
      <DraggableField 
        id={fieldId}
        style={style}
        onDragEnd={(id, x, y) => handleFieldMove(id, x, y)}
      >
        {content}
      </DraggableField>
    );
  };
  
  // Add a color picker handler
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActiveElementStyle({ color: e.target.value });
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
                <CVCanvas onDrop={handleFieldMove}>
                  {/* Header section */}
                  <div className="mb-8 border-2 border-transparent hover:border-blue-400 p-2">
                    <h1 className="text-3xl font-bold">
                      {currentlyEditing?.field === 'fullName' ? (
                        <input
                          type="text"
                          value={`${cvData.firstName} ${cvData.lastName}`}
                          onChange={handleNameChange}
                          onBlur={stopEditing}
                          onKeyDown={handleFieldKeyDown}
                          className="w-full border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 inline-block"
                          style={textStyleToCssProperties(getStyleForElement('fullName'))}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <DraggableField 
                          id={getElementId('fullName')}
                          style={getStyleForElement('fullName')}
                          onDragEnd={(id, x, y) => handleFieldMove(id, x, y)}
                        >
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (e.detail === 2) {
                                // Double click to edit
                                startEditing('fullName');
                              } else {
                                // Single click to select
                                selectElement('fullName');
                              }
                            }}
                            className={`cursor-pointer hover:bg-blue-50 ${selectedElement?.field === 'fullName' ? 'ring-2 ring-blue-400' : ''} inline-block`}
                          >
                            {`${cvData.firstName} ${cvData.lastName}`}
                          </div>
                        </DraggableField>
                      )}
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
                </CVCanvas>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-64 border-l border-gray-200 bg-white">
            <div className="p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Properties</h2>
              
              {activeElement === 'text' && (
                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Font</label>
                    <select 
                      className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm"
                      value={activeStyle.fontFamily}
                      onChange={handleFontChange}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Size</label>
                    <select 
                      className="block w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm"
                      value={activeStyle.fontSize.replace('px', '')}
                      onChange={handleFontSizeChange}
                    >
                      <option value="8">8</option>
                      <option value="10">10</option>
                      <option value="12">12</option>
                      <option value="14">14</option>
                      <option value="16">16</option>
                      <option value="18">18</option>
                      <option value="24">24</option>
                      <option value="36">36</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Style</label>
                    <div className="flex gap-2">
                      <button 
                        className={`p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 ${activeStyle.textAlign !== 'left' ? 'bg-blue-100' : ''}`}
                        onClick={handleAlignClick}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button 
                        className={`p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 font-bold ${activeStyle.fontWeight === 'bold' ? 'bg-blue-100' : ''}`}
                        onClick={handleBoldClick}
                      >
                        B
                      </button>
                      <button 
                        className={`p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 italic ${activeStyle.fontStyle === 'italic' ? 'bg-blue-100' : ''}`}
                        onClick={handleItalicClick}
                      >
                        I
                      </button>
                      <button 
                        className={`p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 underline ${activeStyle.textDecoration === 'underline' ? 'bg-blue-100' : ''}`}
                        onClick={handleUnderlineClick}
                      >
                        U
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div 
                        className={`w-6 h-6 rounded-full bg-black cursor-pointer ${activeStyle.color === '#000000' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#000000')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-gray-600 cursor-pointer ${activeStyle.color === '#4B5563' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#4B5563')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-red-500 cursor-pointer ${activeStyle.color === '#EF4444' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#EF4444')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-blue-500 cursor-pointer ${activeStyle.color === '#3B82F6' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#3B82F6')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-green-500 cursor-pointer ${activeStyle.color === '#10B981' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#10B981')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-yellow-500 cursor-pointer ${activeStyle.color === '#F59E0B' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#F59E0B')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-purple-500 cursor-pointer ${activeStyle.color === '#8B5CF6' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#8B5CF6')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-pink-500 cursor-pointer ${activeStyle.color === '#EC4899' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#EC4899')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-indigo-500 cursor-pointer ${activeStyle.color === '#6366F1' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#6366F1')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-orange-500 cursor-pointer ${activeStyle.color === '#F97316' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#F97316')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-teal-500 cursor-pointer ${activeStyle.color === '#14B8A6' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#14B8A6')}
                      ></div>
                      <div 
                        className={`w-6 h-6 rounded-full bg-amber-500 cursor-pointer ${activeStyle.color === '#F59E0B' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        onClick={() => handleColorClick('#F59E0B')}
                      ></div>
                      <div className="w-6 h-6 rounded-full cursor-pointer relative overflow-hidden border border-gray-300">
                        <input 
                          type="color"
                          value={activeStyle.color}
                          onChange={handleCustomColorChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 to-blue-500">
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs">+</span>
                        </div>
                      </div>
                    </div>
                    <input 
                      type="text"
                      value={activeStyle.color}
                      onChange={(e) => handleColorClick(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
                      placeholder="#RRGGBB"
                    />
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
    </DndProvider>
  );
};

export default CanvaEditor; 