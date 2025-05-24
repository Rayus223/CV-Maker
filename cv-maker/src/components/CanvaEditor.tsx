import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import Draggable from 'react-draggable';
import { saveCV, updateCV, CVProject } from '../services/cvService';
import { CVData } from '../types/types';
import html2canvas from 'html2canvas';

// Types
interface TemplateItem {
  id: string;
  name: string;
}

interface ElementItem {
  id: string;
  type: 'text' | 'image' | 'section' | 'icon' | 'shape';
  content?: string;
  style?: React.CSSProperties;
  position?: { x: number; y: number };
}

const CanvaEditor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectDescription, setProjectDescription] = useState('');
  const [elements, setElements] = useState<ElementItem[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const [templates, setTemplates] = useState<TemplateItem[]>([
    { id: 'template1', name: 'Template 1' },
    { id: 'template2', name: 'Template 2' },
    { id: 'template3', name: 'Template 3' },
    { id: 'template4', name: 'Template 4' },
  ]);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [selectedFontSize, setSelectedFontSize] = useState(16);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedWidth, setSelectedWidth] = useState(20);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedStateRef = useRef<string>('');

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const projectParam = params.get('project');
    const projectIdParam = params.get('projectId');
    const isNewProject = params.get('blank') === 'true';
    
    if (isNewProject) {
      // Create a new project without setting an ID first
      // Let MongoDB generate the ID when saving
      setProjectId('');
      
      // Use a default name for new projects that can be changed
      setProjectName('Untitled Project');
      
      // Initialize with empty canvas
      setElements([]);
      
      console.log('Initialized new blank project');
    } else if (projectParam) {
      // Load existing project
      setProjectId(projectParam);
      fetchProjectData(projectParam);
    } else {
      // Fallback to creating a new project without a set ID
      setProjectId('');
      setElements([]);
    }
  }, [location.search]);

  // Helper function to get current project state as a string for comparison
  const getProjectStateString = useCallback(() => {
    return JSON.stringify({
      projectName,
      projectDescription,
      elements
    });
  }, [projectName, projectDescription, elements]);

  // Set up auto-save functionality
  useEffect(() => {
    // Skip auto-save if not authenticated or no project ID yet
    if (!isAuthenticated || !projectId) return;
    
    // Mark that we have unsaved changes
    const currentState = getProjectStateString();
    if (lastSavedStateRef.current && currentState !== lastSavedStateRef.current) {
      setHasUnsavedChanges(true);
    }
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        autoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [projectName, projectDescription, elements, isAuthenticated, projectId, hasUnsavedChanges]);

  // Auto-save function
  const autoSave = async () => {
    if (!isAuthenticated || isSaving || isAutoSaving) return;
    
    try {
      setIsAutoSaving(true);
      
      // Generate a thumbnail
      const thumbnail = await generateThumbnail();
      
      // Prepare CV data to be saved
      const cvData: CVData = {
        firstName: user?.name?.split(' ')[0] || 'Your',
        lastName: user?.name?.split(' ')[1] || 'Name',
        pronouns: '',
        title: projectName || 'Untitled Project',
        dob: '',
        phone: '',
        email: user?.email || 'your.email@example.com',
        address: '',
        skills: [],
        links: [],
        experience: [],
        education: [],
        projects: [],
        recentProjects: [],
        customTextElements: {
          _canvaElements: JSON.stringify(elements) // Store elements as string in customTextElements
        }
      };
      
      // Check the size of the data
      const dataSize = JSON.stringify(cvData).length;
      console.log(`Auto-save data size: ${dataSize} bytes`);
      
      // If data is too large, only save essential data
      if (dataSize > 1000000) { // 1MB limit
        console.log("Data exceeds size limit, reducing payload");
        cvData.customTextElements = {
          _canvaElements: JSON.stringify(elements.map(el => ({
            id: el.id,
            type: el.type,
            content: el.content?.substring(0, 1000), // Truncate long content
            position: el.position,
            style: el.style ? {
              fontFamily: el.style.fontFamily,
              fontSize: el.style.fontSize,
              color: el.style.color,
              fontWeight: el.style.fontWeight
            } : undefined
          })))
        };
      }
      
      let savedProject: CVProject;
      
      if (!projectId || projectId === '' || projectId === 'undefined' || projectId === 'null') {
        // This is a new project, use saveCV
        try {
          console.log('Creating a new project via saveCV');
          savedProject = await saveCV(
            cvData, 
            projectName, 
            projectDescription, 
            thumbnail
          );
          
          // Update the URL to include the project ID for future saves
          const newUrl = `/canva-editor?project=${savedProject.id}`;
          window.history.replaceState(null, '', newUrl);
          
          // Update local state with the new MongoDB-generated ID
          setProjectId(savedProject.id);
          console.log('New project created with ID:', savedProject.id);
        } catch (saveError) {
          console.error('Error saving new project:', saveError);
          throw saveError;
        }
      } else {
        // This is an existing project, use updateCV
        try {
          console.log(`Updating existing project with ID: ${projectId}`);
          savedProject = await updateCV(
            projectId,
            cvData,
            projectName,
            projectDescription,
            thumbnail
          );
          
          // Make sure the projectId state is correct
          if (savedProject.id !== projectId) {
            console.log(`Project ID changed from ${projectId} to ${savedProject.id}`);
            setProjectId(savedProject.id);
            // Update URL if needed
            const newUrl = `/canva-editor?project=${savedProject.id}`;
            window.history.replaceState(null, '', newUrl);
          }
        } catch (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
      }
      
      // Update last saved state
      lastSavedStateRef.current = getProjectStateString();
      setHasUnsavedChanges(false);
      
      console.log('Project auto-saved successfully:', savedProject.id);
      
    } catch (error) {
      console.error('Error auto-saving project:', error);
      // Don't show error messages for auto-save failures to avoid distracting the user
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Click outside to exit editing mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingElementId && 
          editorRef.current && 
          !editorRef.current.contains(event.target as Node)) {
        setEditingElementId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingElementId]);

  // Fetch project data if editing an existing project
  const fetchProjectData = async (id: string) => {
    try {
      // This would be replaced with an actual API call to fetch the project by ID
      console.log(`Fetching project data for ID: ${id}`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, cannot fetch project');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'x-auth-token': token
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const project = await response.json();
      
      // Update state with project data
      setProjectName(project.name || 'Untitled Project');
      setProjectDescription(project.description || '');
      
      // Check if project has elements data
      if (project.data && project.data.customTextElements && project.data.customTextElements._canvaElements) {
        try {
          const canvaElements = JSON.parse(project.data.customTextElements._canvaElements);
          setElements(canvaElements);
        } catch (parseError) {
          console.error('Error parsing canvas elements:', parseError);
          setElements([]);
        }
      } else {
        // Fallback sample data if no elements found
        setElements([
          {
            id: 'sample-text',
            type: 'text',
            content: 'Sample Resume Text',
            style: {
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              fontFamily: 'Arial'
            },
            position: { x: 100, y: 100 }
          }
        ]);
      }
      
      // Update last saved state reference
      setTimeout(() => {
        lastSavedStateRef.current = getProjectStateString();
        setHasUnsavedChanges(false);
      }, 0);
      
    } catch (error) {
      console.error('Error fetching project data:', error);
      // Set some default data
      setProjectName(`Project ${id.substring(0, 6)}`);
      setElements([
        {
          id: 'sample-text',
          type: 'text',
          content: 'Sample Resume Text',
          style: {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            fontFamily: 'Arial'
          },
          position: { x: 100, y: 100 }
        }
      ]);
    }
  };

  // Generate thumbnail from canvas
  const generateThumbnail = async (): Promise<{ url: string; publicId: string } | undefined> => {
    if (!editorRef.current) return undefined;
    
    try {
      // Use html2canvas to capture the current state of the editor
      const canvas = await html2canvas(editorRef.current, {
        background: '#ffffff',
        logging: false,
        width: editorRef.current.offsetWidth * 0.3, // Use width instead of scale
        height: editorRef.current.offsetHeight * 0.3 // Use height instead of scale
      });
      
      // Convert canvas to base64 data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Reduced quality for smaller size
      
      // Generate a unique ID that doesn't include undefined
      const uniqueId = projectId && projectId !== 'undefined' && projectId !== 'null' 
        ? `canva-thumbnail-${projectId}` 
        : `canva-thumbnail-${Date.now()}`;
      
      console.log(`Generated thumbnail with ID: ${uniqueId}`);
      
      // Return a valid thumbnail object
      return {
        url: dataUrl,
        publicId: uniqueId
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return a default thumbnail if generation fails
      return {
        url: '',
        publicId: `canva-thumbnail-default-${Date.now()}`
      };
    }
  };

  // Save the current project (manual save)
  const saveProject = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Generate a thumbnail
      const thumbnail = await generateThumbnail();
      
      // Prepare CV data to be saved
      const cvData: CVData = {
        firstName: user?.name?.split(' ')[0] || 'Your',
        lastName: user?.name?.split(' ')[1] || 'Name',
        pronouns: '',
        title: projectName || 'Untitled Project',
        dob: '',
        phone: '',
        email: user?.email || 'your.email@example.com',
        address: '',
        skills: [],
        links: [],
        experience: [],
        education: [],
        projects: [],
        recentProjects: [],
        customTextElements: {
          _canvaElements: JSON.stringify(elements) // Store elements as string in customTextElements
        }
      };
      
      // Check the size of the data
      const dataSize = JSON.stringify(cvData).length;
      console.log(`Save data size: ${dataSize} bytes`);
      
      // If data is too large, only save essential data
      if (dataSize > 1000000) { // 1MB limit
        console.log("Data exceeds size limit, reducing payload");
        cvData.customTextElements = {
          _canvaElements: JSON.stringify(elements.map(el => ({
            id: el.id,
            type: el.type,
            content: el.content?.substring(0, 1000), // Truncate long content
            position: el.position,
            style: el.style ? {
              fontFamily: el.style.fontFamily,
              fontSize: el.style.fontSize,
              color: el.style.color,
              fontWeight: el.style.fontWeight
            } : undefined
          })))
        };
      }
      
      let savedProject: CVProject;
      
      if (!projectId || projectId === '' || projectId === 'undefined' || projectId === 'null') {
        // This is a new project, use saveCV
        try {
          console.log('Creating a new project via saveCV');
          savedProject = await saveCV(
            cvData, 
            projectName, 
            projectDescription, 
            thumbnail
          );
          
          // Update the URL to include the project ID for future saves
          const newUrl = `/canva-editor?project=${savedProject.id}`;
          window.history.replaceState(null, '', newUrl);
          
          // Update local state
          setProjectId(savedProject.id);
          console.log('New project created with ID:', savedProject.id);
        } catch (saveError) {
          console.error('Error saving new project:', saveError);
          throw saveError;
        }
      } else {
        // This is an existing project, use updateCV
        try {
          console.log(`Updating existing project with ID: ${projectId}`);
          savedProject = await updateCV(
            projectId,
            cvData,
            projectName,
            projectDescription,
            thumbnail
          );
          
          // Make sure the projectId state is correct
          if (savedProject.id !== projectId) {
            console.log(`Project ID changed from ${projectId} to ${savedProject.id}`);
            setProjectId(savedProject.id);
            // Update URL if needed
            const newUrl = `/canva-editor?project=${savedProject.id}`;
            window.history.replaceState(null, '', newUrl);
          }
        } catch (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
      }
      
      // Show success message
      setIsSaveSuccess(true);
      setTimeout(() => setIsSaveSuccess(false), 3000);
      
      // Update last saved state
      lastSavedStateRef.current = getProjectStateString();
      setHasUnsavedChanges(false);
      
      console.log('Project saved successfully:', savedProject);
      
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveError(typeof error === 'string' ? error : 'Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new element to the canvas
  const addElement = (type: ElementItem['type']) => {
    // Calculate center position if editor ref is available
    let centerX = 150;
    let centerY = 150;
    
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      centerX = rect.width / 2 - 50; // Offset by half element width
      centerY = rect.height / 2 - 50; // Offset by half element height
    }
    
    const newElement: ElementItem = {
      id: uuidv4(),
      type,
      position: { x: centerX, y: centerY }
    };

    switch (type) {
      case 'text':
        newElement.content = 'Double-click to edit text';
        newElement.style = {
          fontSize: '16px',
          fontFamily: selectedFont,
          color: selectedColor,
          padding: '8px',
          minWidth: '100px',
          minHeight: '20px'
        };
        break;
      case 'image':
        // In a real app, this would open an image selector
        newElement.content = 'https://via.placeholder.com/150';
        break;
      case 'section':
        newElement.style = {
          width: '100%',
          height: '100px',
          backgroundColor: '#f0f0f0',
          border: '1px dashed #ccc'
        };
        break;
      case 'icon':
        newElement.content = '⭐'; // Just a placeholder
        break;
      case 'shape':
        newElement.style = {
          width: '50px',
          height: '50px',
          backgroundColor: selectedColor,
          borderRadius: '50%'
        };
        break;
    }

    const newElementsList = [...elements, newElement];
    setElements(newElementsList);
    setSelectedElementId(newElement.id);
    setHasUnsavedChanges(true);
  };

  // Handle element selection
  const selectElement = (id: string, e?: React.MouseEvent) => {
    // Prevent event bubbling if provided
    if (e) {
      e.stopPropagation();
    }
    
    setSelectedElementId(id);
    
    // Exit editing mode if we're selecting a different element
    if (editingElementId && editingElementId !== id) {
      setEditingElementId(null);
    }
  };

  // Handle double-click to enter edit mode
  const handleDoubleClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingElementId(id);
    setSelectedElementId(id);
  };

  // Handle drag stop with unsaved changes tracking
  const handleDragStop = (id: string, data: { x: number; y: number }) => {
    setElements(elements.map(element => 
      element.id === id 
        ? { 
            ...element, 
            position: { 
              x: data.x,
              y: data.y 
            } 
          } 
        : element
    ));
    setHasUnsavedChanges(true);
  };

  // Update text content with unsaved changes tracking
  const updateTextContent = (id: string, content: string) => {
    setElements(elements.map(element => 
      element.id === id ? { ...element, content } : element
    ));
    setHasUnsavedChanges(true);
  };

  // Get the current selected element
  const selectedElement = elements.find(element => element.id === selectedElementId);

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    setHasUnsavedChanges(true);
  };

  // Update element style with unsaved changes tracking
  const updateElementStyle = (property: string, value: any) => {
    if (selectedElementId) {
      setElements(elements.map(element => 
        element.id === selectedElementId 
          ? { 
              ...element, 
              style: { 
                ...element.style, 
                [property]: value 
              } 
            } 
          : element
      ));
      setHasUnsavedChanges(true);
    }
  };

  // Handle click on canvas background (deselect all)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if we're clicking directly on the canvas, not on an element
    if ((e.target as Element).id === 'canvas-main') {
      setSelectedElementId(null);
      setEditingElementId(null);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    // Ask about saving changes if there are unsaved changes
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header/Toolbar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={handleBackToDashboard}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <input
            type="text"
            value={projectName}
            onChange={handleNameChange}
            className="border-gray-300 border rounded-md px-2 py-1 text-lg font-medium w-56"
            placeholder="Project Name"
          />
        </div>
        <div className="flex items-center space-x-3">
          {saveError && (
            <div className="text-red-500 text-sm">{saveError}</div>
          )}
          {isSaveSuccess && (
            <div className="text-green-500 text-sm">Saved successfully!</div>
          )}
          {isAutoSaving && (
            <div className="text-gray-500 text-sm flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Auto-saving...
            </div>
          )}
          {hasUnsavedChanges && !isAutoSaving && !isSaving && (
            <div className="text-amber-500 text-sm">Unsaved changes</div>
          )}
          <button
            onClick={saveProject}
            disabled={isSaving}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Share
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Templates */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-bold mb-4">Templates</h2>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className="border border-gray-200 rounded-md aspect-square flex items-center justify-center hover:border-brand-primary cursor-pointer"
                >
                  <span className="text-xs text-gray-600">{template.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <h2 className="font-bold mb-4">Elements</h2>
            <div className="space-y-2">
              <button 
                onClick={() => addElement('text')} 
                className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors active:bg-gray-200"
              >
                <span className="mr-2">T</span> Add Text
              </button>
              <button 
                onClick={() => addElement('image')} 
                className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
              >
                <span className="mr-2">🖼️</span> Images
              </button>
              <button 
                onClick={() => addElement('section')} 
                className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
              >
                <span className="mr-2">□</span> Sections
              </button>
              <button 
                onClick={() => addElement('icon')} 
                className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
              >
                <span className="mr-2">⭐</span> Icons
              </button>
              <button 
                onClick={() => addElement('shape')} 
                className="w-full flex items-center p-2 rounded-md hover:bg-gray-100"
              >
                <span className="mr-2">◯</span> Shapes
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center">
          <div 
            id="canvas-main"
            ref={editorRef}
            className="w-[794px] h-[1123px] bg-white shadow-lg relative" 
            style={{ margin: '2rem' }}
            onClick={handleCanvasClick}
          >
            {/* Render elements on the canvas */}
            {elements.map(element => {
              const isSelected = element.id === selectedElementId;
              const isEditing = element.id === editingElementId;
              
              // Base style for the element
              const elementStyle: React.CSSProperties = {
                ...element.style,
                boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
                zIndex: isSelected ? 10 : 1,
              };
              
              // Styles specific to the draggable container
              const draggableStyle: React.CSSProperties = {
                position: 'absolute',
                left: 0,
                top: 0,
                outline: isSelected ? '2px solid #3b82f6' : 'none',
                cursor: isEditing ? 'text' : 'grab',
              };
              
              // Create a draggable wrapper for the element
              switch (element.type) {
                case 'text':
                  return (
                    <Draggable
                      key={element.id}
                      defaultPosition={element.position}
                      position={element.position}
                      onStop={(e, data) => handleDragStop(element.id, { x: data.x, y: data.y })}
                      disabled={isEditing}
                      bounds="parent"
                      handle=".handle-drag"
                    >
                      <div style={draggableStyle} className="handle-drag">
                        <div
                          style={elementStyle}
                          onClick={(e) => selectElement(element.id, e)}
                          onDoubleClick={(e) => handleDoubleClick(element.id, e)}
                          contentEditable={isEditing}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            updateTextContent(element.id, e.currentTarget.textContent || '');
                            setEditingElementId(null);
                          }}
                          className={`transition-shadow select-text ${isEditing ? 'focus:outline-none bg-blue-50' : ''}`}
                        >
                          {element.content}
                        </div>
                      </div>
                    </Draggable>
                  );
                case 'image':
                  return (
                    <Draggable
                      key={element.id}
                      defaultPosition={element.position}
                      position={element.position}
                      onStop={(e, data) => handleDragStop(element.id, { x: data.x, y: data.y })}
                      bounds="parent"
                    >
                      <div style={draggableStyle}>
                        <img
                          src={element.content}
                          alt="Element"
                          style={elementStyle}
                          onClick={(e) => selectElement(element.id, e)}
                          className="transition-shadow"
                        />
                      </div>
                    </Draggable>
                  );
                case 'section':
                  return (
                    <Draggable
                      key={element.id}
                      defaultPosition={element.position}
                      position={element.position}
                      onStop={(e, data) => handleDragStop(element.id, { x: data.x, y: data.y })}
                      bounds="parent"
                    >
                      <div style={draggableStyle}>
                        <div
                          style={elementStyle}
                          onClick={(e) => selectElement(element.id, e)}
                          className="transition-shadow"
                        ></div>
                      </div>
                    </Draggable>
                  );
                case 'icon':
                  return (
                    <Draggable
                      key={element.id}
                      defaultPosition={element.position}
                      position={element.position}
                      onStop={(e, data) => handleDragStop(element.id, { x: data.x, y: data.y })}
                      bounds="parent"
                    >
                      <div style={draggableStyle}>
                        <div
                          style={elementStyle}
                          onClick={(e) => selectElement(element.id, e)}
                          className="transition-shadow"
                        >
                          {element.content}
                        </div>
                      </div>
                    </Draggable>
                  );
                case 'shape':
                  return (
                    <Draggable
                      key={element.id}
                      defaultPosition={element.position}
                      position={element.position}
                      onStop={(e, data) => handleDragStop(element.id, { x: data.x, y: data.y })}
                      bounds="parent"
                    >
                      <div style={draggableStyle}>
                        <div
                          style={elementStyle}
                          onClick={(e) => selectElement(element.id, e)}
                          className="transition-shadow"
                        ></div>
                      </div>
                    </Draggable>
                  );
                default:
                  return null;
              }
            })}
            
            {/* Empty state */}
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Click Add Text or other elements to start designing your CV
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-bold mb-4">Properties</h2>
            
            {selectedElement ? (
              <div className="space-y-4">
                {/* Font family selector (for text elements) */}
                {selectedElement.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font
                      </label>
                      <select
                        value={selectedElement.style?.fontFamily || selectedFont}
                        onChange={(e) => {
                          setSelectedFont(e.target.value);
                          updateElementStyle('fontFamily', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-light focus:border-brand-light"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                      </select>
                    </div>

                    {/* Font size selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size
                      </label>
                      <select
                        value={parseInt(selectedElement.style?.fontSize?.toString() || '') || selectedFontSize}
                        onChange={(e) => {
                          const size = parseInt(e.target.value);
                          setSelectedFontSize(size);
                          updateElementStyle('fontSize', `${size}px`);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-light focus:border-brand-light"
                      >
                        {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    {/* Style buttons */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Style
                      </label>
                      <div className="flex space-x-2">
                        <button 
                          className={`p-2 border border-gray-300 rounded-md hover:bg-gray-100 ${
                            selectedElement.style?.fontWeight === 'bold' ? 'bg-gray-200' : ''
                          }`}
                          onClick={() => updateElementStyle('fontWeight', 
                            selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold'
                          )}
                        >
                          B
                        </button>
                        <button 
                          className={`p-2 border border-gray-300 rounded-md hover:bg-gray-100 ${
                            selectedElement.style?.fontStyle === 'italic' ? 'bg-gray-200' : ''
                          }`}
                          onClick={() => updateElementStyle('fontStyle', 
                            selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic'
                          )}
                        >
                          I
                        </button>
                        <button 
                          className={`p-2 border border-gray-300 rounded-md hover:bg-gray-100 ${
                            selectedElement.style?.textDecoration === 'underline' ? 'bg-gray-200' : ''
                          }`}
                          onClick={() => updateElementStyle('textDecoration', 
                            selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline'
                          )}
                        >
                          U
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Color selector (for text and shapes) */}
                {(selectedElement.type === 'text' || selectedElement.type === 'shape') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
                        '#FF00FF', '#00FFFF', '#FFFFFF', '#888888', '#FF8800'
                      ].map(color => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full cursor-pointer border border-gray-300 ${
                            (selectedElement.type === 'text' && selectedElement.style?.color === color) ||
                            (selectedElement.type === 'shape' && selectedElement.style?.backgroundColor === color)
                              ? 'ring-2 ring-offset-2 ring-blue-500'
                              : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setSelectedColor(color);
                            updateElementStyle(
                              selectedElement.type === 'text' ? 'color' : 'backgroundColor',
                              color
                            );
                          }}
                        ></div>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => {
                        setSelectedColor(e.target.value);
                        updateElementStyle(
                          selectedElement.type === 'text' ? 'color' : 'backgroundColor',
                          e.target.value
                        );
                      }}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-light focus:border-brand-light"
                    />
                  </div>
                )}

                {/* Width slider (for shape elements) */}
                {(selectedElement.type === 'shape' || selectedElement.type === 'section') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={selectedWidth}
                        onChange={(e) => {
                          const width = parseInt(e.target.value);
                          setSelectedWidth(width);
                          updateElementStyle('width', `${width}px`);
                        }}
                        className="w-full"
                      />
                      <span className="text-sm">{selectedWidth}</span>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <button 
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => updateElementStyle('width', 'auto')}
                      >
                        Auto width
                      </button>
                      <button 
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => updateElementStyle('width', '100%')}
                      >
                        Full width
                      </button>
                    </div>
                  </div>
                )}

                {/* Element position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">X</label>
                      <input 
                        type="number"
                        value={selectedElement.position?.x || 0}
                        onChange={(e) => {
                          const x = parseInt(e.target.value);
                          setElements(elements.map(element => 
                            element.id === selectedElementId 
                              ? { 
                                ...element, 
                                position: { 
                                  x: x,
                                  y: element.position?.y || 0 
                                } 
                              }
                              : element
                          ));
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y</label>
                      <input 
                        type="number"
                        value={selectedElement.position?.y || 0}
                        onChange={(e) => {
                          const y = parseInt(e.target.value);
                          setElements(elements.map(element => 
                            element.id === selectedElementId 
                              ? { 
                                ...element, 
                                position: { 
                                  x: element.position?.x || 0,
                                  y: y 
                                } 
                              }
                              : element
                          ));
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Delete element button */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (selectedElementId) {
                        setElements(elements.filter(elem => elem.id !== selectedElementId));
                        setSelectedElementId(null);
                      }
                    }}
                    className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Element
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
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
