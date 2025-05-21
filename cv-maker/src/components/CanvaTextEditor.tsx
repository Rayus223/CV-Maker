import React, { useState, useRef, useEffect } from 'react';

// Define types for text boxes
interface TextBox {
  id: string;
  content: string;
  position: { x: number, y: number };
  style: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    width: number;
    zIndex: number;
  };
}

// Track active dragging element globally (outside of React state)
let activeElement: HTMLElement | null = null;
let initialMousePosition = { x: 0, y: 0 };
let initialElementPosition = { x: 0, y: 0 };

const CanvaTextEditor: React.FC = () => {
  // Canvas dimensions (resembling A4 proportions)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 1100;
  
  // State for text boxes
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  
  // Ref for the canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  // Ref map to access DOM elements directly
  const textBoxRefs = useRef<{ [key: string]: HTMLDivElement }>({});
  
  // Default text box style
  const defaultTextBoxStyle = {
    fontFamily: 'Arial',
    fontSize: '16px',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    textAlign: 'left' as 'left',
    width: 200,
    zIndex: 1
  };
  
  // Add new text boxes
  const addTextBox = (template?: string) => {
    let content = 'Edit this text';
    let posX = CANVAS_WIDTH / 2 - 100;
    let posY = 50;
    let width = 200;
    let fontSize = '16px';
    let fontWeight = 'normal';
    
    // Define common CV elements as templates
    if (template === 'header') {
      content = 'John Doe';
      fontSize = '32px';
      fontWeight = 'bold';
      posY = 40;
      width = 300;
    } else if (template === 'title') {
      content = 'Software Engineer';
      fontSize = '18px';
      posY = 90;
      width = 300;
    } else if (template === 'section') {
      content = 'Experience';
      fontSize = '22px';
      fontWeight = 'bold';
      posY = 150;
      width = 300;
    } else if (template === 'bullet') {
      content = '• Professional experience with React, TypeScript and Node.js';
      posY = 200;
      width = 500;
    }
    
    const newTextBox: TextBox = {
      id: `text-${Date.now()}`,
      content,
      position: { x: posX, y: posY },
      style: { 
        ...defaultTextBoxStyle, 
        fontSize, 
        fontWeight, 
        width,
        zIndex: nextZIndex 
      }
    };
    
    setTextBoxes(prev => [...prev, newTextBox]);
    setSelectedTextBox(newTextBox.id);
    setNextZIndex(prev => prev + 1);
  };
  
  // Handle text box selection
  const handleSelectTextBox = (id: string) => {
    setSelectedTextBox(id);
    // Bring the selected text box to front
    bringToFront(id);
  };
  
  // Bring text box to front
  const bringToFront = (id: string) => {
    setTextBoxes(prev => {
      return prev.map(box => {
        if (box.id === id) {
          return { ...box, style: { ...box.style, zIndex: nextZIndex } };
        }
        return box;
      });
    });
    setNextZIndex(prev => prev + 1);
  };
  
  // Handle text content change
  const handleTextChange = (id: string, content: string) => {
    setTextBoxes(prev => {
      return prev.map(box => {
        if (box.id === id) {
          return { ...box, content };
        }
        return box;
      });
    });
  };
  
  // Handle style change
  const updateTextStyle = (id: string, styleUpdates: Partial<TextBox['style']>) => {
    setTextBoxes(prev => {
      return prev.map(box => {
        if (box.id === id) {
          return { ...box, style: { ...box.style, ...styleUpdates } };
        }
        return box;
      });
    });
  };
  
  // Delete selected text box
  const deleteTextBox = (id: string) => {
    setTextBoxes(prev => prev.filter(box => box.id !== id));
    if (selectedTextBox === id) {
      setSelectedTextBox(null);
    }
    
    // Remove from refs
    if (textBoxRefs.current[id]) {
      delete textBoxRefs.current[id];
    }
  };
  
  // Direct DOM manipulation for drag
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = textBoxRefs.current[id];
    if (!element) return;
    
    // Store the active element globally
    activeElement = element;
    
    // Calculate initial positions
    initialMousePosition = { x: e.clientX, y: e.clientY };
    
    // Get the current element position
    const box = textBoxes.find(box => box.id === id);
    if (!box) return;
    
    initialElementPosition = { x: box.position.x, y: box.position.y };
    
    // Apply dragging style
    element.classList.add('dragging');
    
    // Add dragging class to body for cursor management
    document.body.classList.add('dragging');
    
    // Select the element
    handleSelectTextBox(id);
    
    // Ensure we clean up if mouse is released outside our elements
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!activeElement || !canvasRef.current) return;
    
    // Calculate the delta from initial position
    const deltaX = e.clientX - initialMousePosition.x;
    const deltaY = e.clientY - initialMousePosition.y;
    
    // Calculate new position
    let newX = initialElementPosition.x + deltaX;
    let newY = initialElementPosition.y + deltaY;
    
    // Get the active element's ID
    const id = activeElement.getAttribute('data-id');
    if (!id) return;
    
    // Find the corresponding textBox to get its width
    const box = textBoxes.find(box => box.id === id);
    if (!box) return;
    
    // Apply constraints to keep box within canvas
    newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - box.style.width));
    newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - 50));
    
    // Apply new position directly to DOM for immediate feedback
    activeElement.style.left = `${newX}px`;
    activeElement.style.top = `${newY}px`;
    
    // Store the updated position for when we update state
    activeElement.dataset.newX = String(newX);
    activeElement.dataset.newY = String(newY);
  };
  
  const handleMouseUp = () => {
    if (!activeElement) return;
    
    // Remove dragging style
    activeElement.classList.remove('dragging');
    
    // Remove dragging class from body
    document.body.classList.remove('dragging');
    
    // Get the element's id and new position
    const id = activeElement.getAttribute('data-id');
    const newX = Number(activeElement.dataset.newX || initialElementPosition.x);
    const newY = Number(activeElement.dataset.newY || initialElementPosition.y);
    
    // Update React state with new position
    if (id) {
      setTextBoxes(prev => 
        prev.map(box => 
          box.id === id 
            ? { ...box, position: { x: newX, y: newY } } 
            : box
        )
      );
    }
    
    // Clean up
    activeElement = null;
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
  };
  
  // Handle click outside of any text box
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if click is inside the canvas but outside any text box
      if (
        canvasRef.current && 
        canvasRef.current.contains(target) && 
        !target.closest('.text-box')
      ) {
        setSelectedTextBox(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Cleanup global event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Font size options
  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
  
  // Font family options
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Roboto', 'Open Sans'];
  
  // Color options
  const colorOptions = [
    '#000000', '#4B5563', '#EF4444', '#3B82F6', '#10B981', 
    '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#F97316'
  ];
  
  // Selected text box data
  const selectedBox = textBoxes.find(box => box.id === selectedTextBox);
  
  // Duplicate the selected text box
  const duplicateTextBox = () => {
    if (!selectedBox) return;
    
    const newBox: TextBox = {
      id: `text-${Date.now()}`,
      content: selectedBox.content,
      position: {
        x: selectedBox.position.x + 20,
        y: selectedBox.position.y + 20
      },
      style: { ...selectedBox.style, zIndex: nextZIndex }
    };
    
    setTextBoxes(prev => [...prev, newBox]);
    setSelectedTextBox(newBox.id);
    setNextZIndex(prev => prev + 1);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top toolbar */}
      <div className="bg-white shadow-sm border border-gray-200 p-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              onClick={() => addTextBox()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Text
            </button>
            
            <div className="dropdown relative group">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center">
                Templates
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="dropdown-menu absolute hidden group-hover:block bg-white shadow-lg rounded-md mt-1 p-2 z-10">
                <button onClick={() => addTextBox('header')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">
                  Name Header
                </button>
                <button onClick={() => addTextBox('title')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">
                  Job Title
                </button>
                <button onClick={() => addTextBox('section')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">
                  Section Header
                </button>
                <button onClick={() => addTextBox('bullet')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md">
                  Bullet Point
                </button>
              </div>
            </div>
            
            {selectedBox && (
              <button 
                onClick={duplicateTextBox}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                </svg>
                Duplicate
              </button>
            )}
          </div>
          
          <div className="text-gray-700 font-medium">CV Text Editor</div>
          
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">
            Save
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Text properties */}
        <div className="bg-white w-64 border-r border-gray-200 shadow-sm p-4 overflow-y-auto">
          <h3 className="font-medium text-gray-700 mb-4">Text Properties</h3>
          
          {selectedBox ? (
            <div className="space-y-4">
              {/* Font Family */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Font</label>
                <select
                  value={selectedBox.style.fontFamily}
                  onChange={(e) => updateTextStyle(selectedBox.id, { fontFamily: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1"
                >
                  {fontFamilies.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Font Size */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Size</label>
                <select
                  value={selectedBox.style.fontSize}
                  onChange={(e) => updateTextStyle(selectedBox.id, { fontSize: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-2 py-1"
                >
                  {fontSizes.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Text Styles */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Style</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateTextStyle(
                      selectedBox.id, 
                      { fontWeight: selectedBox.style.fontWeight === 'bold' ? 'normal' : 'bold' }
                    )}
                    className={`px-2 py-1 border border-gray-300 rounded ${
                      selectedBox.style.fontWeight === 'bold' ? 'bg-gray-200' : ''
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() => updateTextStyle(
                      selectedBox.id, 
                      { fontStyle: selectedBox.style.fontStyle === 'italic' ? 'normal' : 'italic' }
                    )}
                    className={`px-2 py-1 border border-gray-300 rounded italic ${
                      selectedBox.style.fontStyle === 'italic' ? 'bg-gray-200' : ''
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() => updateTextStyle(
                      selectedBox.id, 
                      { textDecoration: selectedBox.style.textDecoration === 'underline' ? 'none' : 'underline' }
                    )}
                    className={`px-2 py-1 border border-gray-300 rounded underline ${
                      selectedBox.style.textDecoration === 'underline' ? 'bg-gray-200' : ''
                    }`}
                  >
                    U
                  </button>
                </div>
              </div>
              
              {/* Text Alignment */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Alignment</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateTextStyle(selectedBox.id, { textAlign: 'left' })}
                    className={`px-2 py-1 border border-gray-300 rounded ${
                      selectedBox.style.textAlign === 'left' ? 'bg-gray-200' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => updateTextStyle(selectedBox.id, { textAlign: 'center' })}
                    className={`px-2 py-1 border border-gray-300 rounded ${
                      selectedBox.style.textAlign === 'center' ? 'bg-gray-200' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => updateTextStyle(selectedBox.id, { textAlign: 'right' })}
                    className={`px-2 py-1 border border-gray-300 rounded ${
                      selectedBox.style.textAlign === 'right' ? 'bg-gray-200' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Color */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <div
                      key={color}
                      onClick={() => updateTextStyle(selectedBox.id, { color })}
                      className={`w-6 h-6 rounded-full cursor-pointer ${
                        selectedBox.style.color === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer relative overflow-hidden">
                    <input
                      type="color"
                      value={selectedBox.style.color}
                      onChange={(e) => updateTextStyle(selectedBox.id, { color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                  </div>
                </div>
              </div>
              
              {/* Width */}
              <div>
                <label className="block text-sm text-gray-500 mb-1">Width (px)</label>
                <input
                  type="range"
                  min="50"
                  max="600"
                  value={selectedBox.style.width}
                  onChange={(e) => updateTextStyle(selectedBox.id, { width: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{selectedBox.style.width}px</div>
              </div>
              
              {/* Delete Button */}
              <button
                onClick={() => deleteTextBox(selectedBox.id)}
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Delete Text Box
              </button>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Select a text box to edit its properties or click the "Add Text" button to create one.
            </div>
          )}
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-100">
          <div 
            ref={canvasRef}
            className="bg-white shadow-lg border border-gray-200 mx-auto relative"
            style={{ 
              width: `${CANVAS_WIDTH}px`, 
              height: `${CANVAS_HEIGHT}px`,
              minHeight: `${CANVAS_HEIGHT}px`,
            }}
          >
            {/* Text Boxes */}
            {textBoxes.map((textBox) => (
              <div
                key={textBox.id}
                ref={(el) => { 
                  if (el) textBoxRefs.current[textBox.id] = el; 
                }}
                data-id={textBox.id}
                className={`text-box absolute ${
                  selectedTextBox === textBox.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ 
                  left: textBox.position.x,
                  top: textBox.position.y,
                  zIndex: textBox.style.zIndex,
                  width: `${textBox.style.width}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTextBox(textBox.id);
                }}
              >
                {/* Custom drag handle - this is what initiates the drag */}
                <div 
                  className="drag-handle cursor-move absolute -top-5 left-0 right-0 h-5 flex justify-center items-center opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleMouseDown(e, textBox.id)}
                >
                  <div className="w-20 h-2 bg-blue-500 rounded-full"></div>
                </div>
                
                <div
                  className="element-content bg-white p-2 shadow-sm border border-transparent hover:border-gray-200"
                  style={{
                    fontFamily: textBox.style.fontFamily,
                    fontSize: textBox.style.fontSize,
                    fontWeight: textBox.style.fontWeight,
                    fontStyle: textBox.style.fontStyle,
                    textDecoration: textBox.style.textDecoration,
                    color: textBox.style.color,
                    textAlign: textBox.style.textAlign,
                    minHeight: '1em',
                  }}
                >
                  {selectedTextBox === textBox.id ? (
                    <textarea
                      value={textBox.content}
                      onChange={(e) => handleTextChange(textBox.id, e.target.value)}
                      className="w-full outline-none resize-none bg-transparent"
                      style={{
                        fontFamily: textBox.style.fontFamily,
                        fontSize: textBox.style.fontSize,
                        fontWeight: textBox.style.fontWeight,
                        fontStyle: textBox.style.fontStyle,
                        textDecoration: textBox.style.textDecoration,
                        color: textBox.style.color,
                        textAlign: textBox.style.textAlign,
                        minHeight: '1em',
                        height: 'auto',
                      }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => {
                        e.target.select();
                        handleSelectTextBox(textBox.id);
                      }}
                    />
                  ) : (
                    <div 
                      className="whitespace-pre-wrap"
                      style={{ minHeight: '1em' }}
                      onDoubleClick={() => handleSelectTextBox(textBox.id)}
                    >
                      {textBox.content || <span className="opacity-50">Click to edit text</span>}
                    </div>
                  )}
                </div>
                
                {/* Show resize handle when selected */}
                {selectedTextBox === textBox.id && (
                  <div className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                      <path d="M6 16h12M6 12h12M6 8h12" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvaTextEditor; 