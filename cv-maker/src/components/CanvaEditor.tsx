import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CVData, sampleData } from '../types/types';
import { DndProvider, useDrag, useDrop, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { XYCoord, DropTargetMonitor, DragSourceMonitor } from 'react-dnd';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';

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
  width?: number;
  position?: {
    x: number;
    y: number;
    zIndex: number;
  };
}

// Element styling interface
interface ElementStyle {
  id: string;
  style: TextStyle;
}

// Add a section for drag and drop types
interface DragItem {
  id: string;
  type: string;
  index: number;
  section?: string;
  fieldType?: string;
}

const defaultStyle: TextStyle = {
  fontFamily: 'Arial',
  fontSize: '16px',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#000000',
  textAlign: 'left',
  position: {
    x: 0,
    y: 0,
    zIndex: 1
  }
};

// Add a helper function to convert TextStyle to CSSProperties
const textStyleToCssProperties = (style: TextStyle): React.CSSProperties => {
  const { position, ...rest } = style;
  
  return {
    ...rest,
    position: 'absolute',
    left: position?.x || 0,
    top: position?.y || 0,
    zIndex: position?.zIndex || 1,
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
  const initialPosition = { x: style.position?.x || 0, y: style.position?.y || 0 };
  const [position, setPosition] = useState(initialPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Update local position when style props change
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: style.position?.x || 0, y: style.position?.y || 0 });
    }
  }, [style.position?.x, style.position?.y]);

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: 'field',
    item: (monitor) => {
      // Store initial position when drag starts
      const initialOffset = monitor.getInitialClientOffset();
      const currentOffset = monitor.getClientOffset();
      
      if (initialOffset && currentOffset) {
        setDragOffset({
          x: currentOffset.x - initialOffset.x,
          y: currentOffset.y - initialOffset.y
        });
      }
      
      return { id, type: 'field', initialPosition } as DragItem & { initialPosition: { x: number, y: number } };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (delta) {
        onDragEnd(id, delta.x, delta.y);
      }
      // Reset drag offset when drag ends
      setDragOffset({ x: 0, y: 0 });
    },
  }), [id, position, style.position]);

  // Handle real-time dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Update local position immediately for real-time visual feedback
        setPosition(prevPos => ({
          x: prevPos.x + e.movementX,
          y: prevPos.y + e.movementY
        }));
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  // Apply current position for real-time visual updates during dragging
  const fieldStyle = {
    position: 'absolute' as const,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'move',
    left: position.x,
    top: position.y,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    color: style.color,
    textAlign: style.textAlign,
    zIndex: isDragging ? 1000 : (style.position?.zIndex || 1), // Ensure dragged element stays on top
    transition: isDragging ? 'none' : 'opacity 0.2s',
    boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
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

// Create a DesignCanvas component that extends CVCanvas
const DesignCanvas = ({ children, onDrop }: { children: React.ReactNode, onDrop: (id: string, x: number, y: number) => void }) => {
  return <CVCanvas onDrop={onDrop}>{children}</CVCanvas>;
};

// Create a floating toolbar component for selected elements
interface FloatingToolbarProps {
  onDuplicate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPaste: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  onDuplicate,
  onDelete,
  onCopy,
  onPaste
}) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  return (
    <div className="absolute -top-10 left-0 bg-white shadow-md rounded-md flex items-center z-50">
      <button 
        className="p-1.5 hover:bg-gray-100 text-gray-700 rounded-l-md"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        title="Duplicate"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      <button 
        className="p-1.5 hover:bg-gray-100 text-gray-700 border-l border-gray-200"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      
      <div className="relative">
        <button 
          className="p-1.5 hover:bg-gray-100 text-gray-700 border-l border-gray-200 rounded-r-md"
          onClick={(e) => {
            e.stopPropagation();
            setShowMoreOptions(!showMoreOptions);
          }}
          title="More options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
        
        {showMoreOptions && (
          <div className="absolute right-0 mt-1 py-1 w-32 bg-white rounded-md shadow-lg z-50">
            <button
              className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
                setShowMoreOptions(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy
            </button>
            
            <button
              className="w-full text-left px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onPaste();
                setShowMoreOptions(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Paste
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Create a CanvaElement component
interface CanvaElementProps {
  id: string;
  style: TextStyle;
  isSelected: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDragEnd: (id: string, xDelta: number, yDelta: number, styleUpdates?: Partial<TextStyle>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (id: string) => void;
  onPaste: () => void;
}

const CanvaElement: React.FC<CanvaElementProps> = ({ 
  id, 
  style, 
  isSelected, 
  children, 
  onClick, 
  onDragEnd,
  onDuplicate,
  onDelete,
  onCopy,
  onPaste
}) => {
  const initialPosition = { x: style.position?.x || 0, y: style.position?.y || 0 };
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const [mouseDownInside, setMouseDownInside] = useState(false);
  
  // Update local position when style props change
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: style.position?.x || 0, y: style.position?.y || 0 });
    }
  }, [style.position?.x, style.position?.y, isDragging]);

  // Apply current position for real-time visual updates during dragging
  const elementStyle = {
    position: 'absolute' as const,
    opacity: isDragging ? 0.8 : 1,
    cursor: 'default', // Change to default since we have dedicated drag handles
    width: typeof style.width === 'number' ? `${style.width}px` : 'auto',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    color: style.color,
    textAlign: style.textAlign,
    zIndex: isDragging ? 1000 : (style.position?.zIndex || 1), // Ensure dragged element stays on top
    transition: isDragging ? 'none' : 'opacity 0.2s',
    boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : (isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'),
  };
  
  // Handle the end of dragging to update state with new position
  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    setIsDragging(false);
    
    // Get the canvas dimensions
    const canvas = elementRef.current?.closest('.cv-canvas');
    const canvasWidth = canvas?.clientWidth || 800;
    const canvasHeight = canvas?.clientHeight || 1100;
    
    // Get element dimensions
    const width = elementRef.current?.offsetWidth || 0;
    const height = elementRef.current?.offsetHeight || 0;
    
    // Constrain position within canvas boundaries
    const x = Math.max(0, Math.min(data.x, canvasWidth - width));
    const y = Math.max(0, Math.min(data.y, canvasHeight - height));
    
    // Update position state
    setPosition({ x, y });
    
    // Calculate deltas from original position
    const xDelta = x - (style.position?.x || 0);
    const yDelta = y - (style.position?.y || 0);
    
    // Call the parent handler with the deltas
    onDragEnd(id, xDelta, yDelta);
    
    // Show a brief notice
    const element = document.getElementById('drag-notice');
    if (element) {
      element.style.opacity = '1';
      setTimeout(() => {
        element.style.opacity = '0';
      }, 1000);
    }
  };
  
  // Handle mouse down for resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: style.width as number || 200,
    });
    
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };
  
  // Handle mouse move for resizing
  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const newWidth = Math.max(50, resizeStart.width + deltaX);
    
    if (elementRef.current) {
      elementRef.current.style.width = `${newWidth}px`;
    }
  };
  
  // Handle mouse up for resizing
  const handleResizeMouseUp = () => {
    if (!isResizing) return;
    
    setIsResizing(false);
    
    // Update width in parent component
    if (elementRef.current) {
      const newWidth = elementRef.current.offsetWidth;
      if (typeof style.width === 'number' && newWidth !== style.width) {
        // Call parent handler to update the style with width
        onDragEnd(id, 0, 0, { width: newWidth });
      }
    }
    
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, []);

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick(e);
  };

  const handleDuplicate = () => {
    onDuplicate(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const handleCopy = () => {
    onCopy(id);
  };

  const handlePaste = () => {
    onPaste();
  };

  // Define draggable bounds to keep elements on canvas
  const bounds = {
    left: 0,
    top: 0,
    right: 1000, // set based on canvas width
    bottom: 1500 // set based on canvas height
  };

  // Handle mouse down inside the content
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelected && e.button === 0) { // Only for left clicks and only when selected
      setMouseDownInside(true);
    }
  };
  
  // Handle mouse up event
  const handleMouseUp = () => {
    setMouseDownInside(false);
  };
  
  useEffect(() => {
    // Add global mouse up handler
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <Draggable
      bounds=".cv-canvas"
      handle=".move-handle, .draggable-content"
      defaultPosition={position}
      position={position}
      onStart={() => {
        setIsDragging(true);
      }}
      onStop={handleDragStop}
      disabled={!isSelected} // Only draggable when selected
    >
      <div 
        ref={elementRef}
        className={`canva-element group ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging scale-105 opacity-75' : ''}`}
        style={elementStyle}
        onClick={handleWrapperClick}
        onMouseDown={handleMouseDown}
      >
        {isSelected && (
          <div className="element-toolbar">
            <FloatingToolbar 
              onDuplicate={handleDuplicate} 
              onDelete={handleDelete}
              onCopy={handleCopy}
              onPaste={handlePaste}
            />
            {typeof style.width === 'number' && (
              <div 
                className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-75 hover:opacity-100"
                onMouseDown={handleResizeMouseDown}
              ></div>
            )}
          </div>
        )}
        <div className="element-content p-1 break-words relative">
          <div className={`move-handle absolute -left-8 top-0 w-7 h-7 flex items-center justify-center bg-blue-100 hover:bg-blue-200 rounded-md shadow-sm cursor-move ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <div className={`draggable-content ${isSelected ? 'cursor-move' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

// Add a component for draggable sections
const DraggableSection = ({
  id,
  index,
  title,
  children,
  onMove
}: {
  id: string;
  index: number;
  title: string;
  children: React.ReactNode;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: { id, type: 'section', index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  const [, drop] = useDrop({
    accept: 'section',
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref}
      className={`mb-6 border-2 ${isDragging ? 'border-dashed border-gray-400 opacity-50' : 'border-transparent hover:border-blue-400'} p-2`}
    >
      <div className="flex items-center mb-2">
        <div className="mr-2 cursor-move opacity-30 hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
};

// Add a component for draggable list items
const DraggableListItem = ({
  id,
  index,
  section,
  content,
  onMove
}: {
  id: string;
  index: number;
  section: string;
  content: React.ReactNode;
  onMove: (section: string, dragIndex: number, hoverIndex: number) => void;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: `${section}-item`,
    item: { id, type: `${section}-item`, index, section },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  const [, drop] = useDrop({
    accept: `${section}-item`,
    hover: (item: DragItem, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onMove(section, dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      item.index = hoverIndex;
    }
  });
  
  drag(drop(ref));
  
  return (
    <li
      ref={ref}
      className={`flex items-start ${isDragging ? 'opacity-50 bg-gray-100' : ''}`}
    >
      <div className="mr-2 mt-1 cursor-move opacity-30 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>
      <div className="flex-grow">{content}</div>
    </li>
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

  // For copy-paste functionality
  const [copiedElement, setCopiedElement] = useState<{
    style: TextStyle;
    content?: string;
    type: string;
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
    // Make sure we're using proper font family strings with quotes for fonts with spaces
    let fontFamily = e.target.value;
    
    // Add quotes around font family names with spaces
    if (fontFamily.includes(' ') && !fontFamily.includes(',') && !fontFamily.startsWith('"') && !fontFamily.startsWith("'")) {
      fontFamily = `"${fontFamily}"`;
    }
    
    // Update the active element's style with the selected font family
    updateActiveElementStyle({ fontFamily });
    
    // Apply font to selected element (in case the style update doesn't work)
    if (selectedElement) {
      const elementId = getElementId(
        selectedElement.field, 
        selectedElement.section, 
        selectedElement.index, 
        selectedElement.subfield
      );
      
      const element = document.getElementById(elementId);
      if (element) {
        element.style.fontFamily = fontFamily;
      }
    }
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
  const handleFieldMove = (id: string, xDelta: number, yDelta: number, styleUpdates?: Partial<TextStyle>) => {
    setElementStyles(prev => {
      const elementIndex = prev.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...prev];
        const currentStyle = updated[elementIndex].style;
        const currentPosition = currentStyle.position || { x: 0, y: 0, zIndex: 1 };
        
        // Create an updated style with position changes
        let updatedStyle = { 
          ...currentStyle, 
          position: {
            ...currentPosition,
            x: currentPosition.x + xDelta,
            y: currentPosition.y + yDelta
          }
        };
        
        // Apply any additional style updates if provided
        if (styleUpdates) {
          updatedStyle = {
            ...updatedStyle,
            ...styleUpdates
          };
        }
        
        // Apply the updated style
        updated[elementIndex] = { 
          ...updated[elementIndex], 
          style: updatedStyle 
        };
        
        return updated;
      }
      return prev;
    });
    
    // Automatically select the moved element
    setActiveElement(id);
  };
  
  // Add a state variable to track the next z-index to use
  const [nextZIndex, setNextZIndex] = useState<number>(100);
  
  // Handle element position update in absolute positioning
  const handleElementMove = (id: string, xDelta: number, yDelta: number, styleUpdates?: Partial<TextStyle>) => {
    setElementStyles(prev => {
      const elementIndex = prev.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...prev];
        const currentStyle = updated[elementIndex].style;
        const currentPosition = currentStyle.position || { x: 0, y: 0, zIndex: 1 };
        
        // Create an updated style with position changes
        let updatedStyle = { 
          ...currentStyle, 
          position: {
            ...currentPosition,
            x: currentPosition.x + xDelta,
            y: currentPosition.y + yDelta
          }
        };
        
        // Apply any additional style updates if provided
        if (styleUpdates) {
          updatedStyle = {
            ...updatedStyle,
            ...styleUpdates
          };
        }
        
        // Apply the updated style
        updated[elementIndex] = { 
          ...updated[elementIndex], 
          style: updatedStyle 
        };
        
        return updated;
      }
      return prev;
    });
    
    // Automatically select the moved element
    setActiveElement(id);
  };

  // Bring element to front when selected
  const bringToFront = (id: string) => {
    setElementStyles(prev => {
      const elementIndex = prev.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...prev];
        const currentStyle = updated[elementIndex].style;
        const currentPosition = currentStyle.position || { x: 0, y: 0, zIndex: 1 };
        
        updated[elementIndex] = { 
          ...updated[elementIndex], 
          style: { 
            ...currentStyle, 
            position: {
              ...currentPosition,
              zIndex: nextZIndex
            }
          } 
        };
        setNextZIndex(prev => prev + 1);
        return updated;
      }
      return prev;
    });
  };
  
  // Update EditableField to work with absolute positioning
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
    
    const elementId = getElementId(field, section, index, subfield);
    const style = getStyleForElement(field, section, index, subfield);
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Select the element
      selectElement(field, section, index, subfield);
      
      // Bring to front
      bringToFront(elementId);
      
      // Double click to edit
      if (e.detail === 2) {
        startEditing(field, section, index, subfield);
      }
    };
    
    // Conditional content based on editing state
    let content;
    if (isEditing) {
      if (isMultiline) {
        content = (
          <textarea
            value={value}
            onChange={handleFieldChange}
            onBlur={stopEditing}
            onKeyDown={handleFieldKeyDown}
            className={`border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
            rows={3}
            onClick={(e) => e.stopPropagation()}
          />
        );
      } else {
        content = (
          <input
            type="text"
            value={value}
            onChange={handleFieldChange}
            onBlur={stopEditing}
            onKeyDown={handleFieldKeyDown}
            className={`border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );
      }
    } else {
      content = (
        <div 
          className={`${className} ${isSelected ? '' : ''} p-1`}
          onClick={handleClick}
        >
          {value}
        </div>
      );
    }
    
    return (
      <CanvaElement
        id={elementId}
        style={style}
        isSelected={isSelected}
        onClick={handleClick}
        onDragEnd={(id, x, y) => handleElementMove(id, x, y)}
        onDuplicate={handleDuplicateElement}
        onDelete={handleDeleteElement}
        onCopy={handleCopyElement}
        onPaste={handlePasteElement}
      >
        {content}
      </CanvaElement>
    );
  };
  
  // Add a color picker handler
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateActiveElementStyle({ color: e.target.value });
  };

  // Add state for section order
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'personal',
    'experience',
    'education',
    'skills'
  ]);
  
  // Move a section
  const moveSection = (dragIndex: number, hoverIndex: number) => {
    const newSectionOrder = [...sectionOrder];
    const draggedSection = newSectionOrder[dragIndex];
    newSectionOrder.splice(dragIndex, 1);
    newSectionOrder.splice(hoverIndex, 0, draggedSection);
    setSectionOrder(newSectionOrder);
  };
  
  // Move an item within a section
  const moveItem = (section: string, dragIndex: number, hoverIndex: number) => {
    setCvData(prev => {
      const newData = { ...prev };
      
      if (section === 'experience') {
        // Handle experience items
        const experiences = [...newData.experience];
        const draggedExp = experiences[dragIndex];
        experiences.splice(dragIndex, 1);
        experiences.splice(hoverIndex, 0, draggedExp);
        newData.experience = experiences;
      } 
      else if (section === 'education') {
        // Handle education items
        const educations = [...newData.education];
        const draggedEdu = educations[dragIndex];
        educations.splice(dragIndex, 1);
        educations.splice(hoverIndex, 0, draggedEdu);
        newData.education = educations;
      }
      else if (section === 'skills') {
        // Handle skills
        const skills = [...newData.skills];
        const draggedSkill = skills[dragIndex];
        skills.splice(dragIndex, 1);
        skills.splice(hoverIndex, 0, draggedSkill);
        newData.skills = skills;
      }
      else if (section.startsWith('experience-tasks-')) {
        // Handle tasks within an experience item
        const expIndex = parseInt(section.replace('experience-tasks-', ''), 10);
        const tasks = [...newData.experience[expIndex].tasks];
        const draggedTask = tasks[dragIndex];
        tasks.splice(dragIndex, 1);
        tasks.splice(hoverIndex, 0, draggedTask);
        newData.experience[expIndex].tasks = tasks;
      }
      
      // Call onSave if provided
      if (onSave) {
        onSave(newData);
      }
      
      return newData;
    });
  };

  // Initialize with proper positioning if not already set
  useEffect(() => {
    // Only run once when component mounts
    if (elementStyles.length === 0) {
      // Create initial positions for common elements
      const initialStyles = [
        // Header elements
        { id: getElementId('fullName'), style: { ...defaultStyle, fontSize: '32px', fontWeight: 'bold', position: { x: 40, y: 40, zIndex: 10 }}},
        { id: getElementId('title'), style: { ...defaultStyle, fontSize: '18px', color: '#4B5563', position: { x: 40, y: 85, zIndex: 9 }}},
        
        // Contact info
        { id: getElementId('email'), style: { ...defaultStyle, position: { x: 40, y: 140, zIndex: 8 }}},
        { id: getElementId('phone'), style: { ...defaultStyle, position: { x: 300, y: 140, zIndex: 8 }}},
        { id: getElementId('address'), style: { ...defaultStyle, position: { x: 560, y: 140, zIndex: 8 }}},
        
        // Section headers
        { id: getElementId('experienceHeader'), style: { ...defaultStyle, fontSize: '22px', fontWeight: 'bold', position: { x: 40, y: 200, zIndex: 7 }}},
      ];
      
      // Experience items
      let yPos = 250;
      cvData.experience.forEach((exp, index) => {
        initialStyles.push({ 
          id: getElementId('position', 'experience', index, 'position'), 
          style: { ...defaultStyle, fontWeight: 'bold', position: { x: 40, y: yPos, zIndex: 6 }}
        });
        
        initialStyles.push({ 
          id: getElementId('company', 'experience', index, 'company'), 
          style: { ...defaultStyle, position: { x: 40, y: yPos + 30, zIndex: 5 }}
        });
        
        initialStyles.push({ 
          id: getElementId('dates', 'experience', index, 'dates'), 
          style: { ...defaultStyle, position: { x: 300, y: yPos + 30, zIndex: 5 }}
        });
        
        // Tasks
        let taskYPos = yPos + 70;
        exp.tasks.forEach((task, taskIndex) => {
          initialStyles.push({ 
            id: getElementId('task', 'experience', index, `tasks[${taskIndex}]`), 
            style: { ...defaultStyle, position: { x: 60, y: taskYPos, zIndex: 4 }}
          });
          taskYPos += 30;
        });
        
        yPos = taskYPos + 30;
      });
      
      // Add Education header
      initialStyles.push({ 
        id: getElementId('educationHeader'), 
        style: { ...defaultStyle, fontSize: '22px', fontWeight: 'bold', position: { x: 40, y: yPos, zIndex: 7 }}
      });
      
      // Education items
      yPos += 50;
      cvData.education.forEach((edu, index) => {
        initialStyles.push({ 
          id: getElementId('degree', 'education', index, 'degree'), 
          style: { ...defaultStyle, fontWeight: 'bold', position: { x: 40, y: yPos, zIndex: 6 }}
        });
        
        initialStyles.push({ 
          id: getElementId('institution', 'education', index, 'institution'), 
          style: { ...defaultStyle, position: { x: 40, y: yPos + 30, zIndex: 5 }}
        });
        
        initialStyles.push({ 
          id: getElementId('dates', 'education', index, 'dates'), 
          style: { ...defaultStyle, position: { x: 300, y: yPos + 30, zIndex: 5 }}
        });
        
        yPos += 70;
      });
      
      // Add Skills header
      initialStyles.push({ 
        id: getElementId('skillsHeader'), 
        style: { ...defaultStyle, fontSize: '22px', fontWeight: 'bold', position: { x: 40, y: yPos, zIndex: 7 }}
      });
      
      // Skills
      yPos += 50;
      let skillX = 40;
      cvData.skills.forEach((skill, index) => {
        initialStyles.push({ 
          id: getElementId('skill', 'skills', index), 
          style: { ...defaultStyle, position: { x: skillX, y: yPos, zIndex: 6 }}
        });
        
        skillX += 180;
        if (skillX > 500) {
          skillX = 40;
          yPos += 30;
        }
      });
      
      setElementStyles(initialStyles);
    }
  }, []);

  // Duplicate the selected element
  const handleDuplicateElement = (id: string) => {
    // Find the element style
    const elementIndex = elementStyles.findIndex(style => style.id === id);
    if (elementIndex === -1) return;
    
    const elementStyle = elementStyles[elementIndex];
    
    // Create a new unique ID for the duplicate
    // We'll use timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const newId = `${id}-duplicate-${timestamp}`;
    
    // Create a duplicate style with slightly offset position
    const duplicateStyle: TextStyle = {
      ...elementStyle.style,
      position: {
        ...elementStyle.style.position!,
        x: (elementStyle.style.position?.x || 0) + 20,
        y: (elementStyle.style.position?.y || 0) + 20,
        zIndex: nextZIndex
      }
    };
    
    // Add the new element style
    setElementStyles(prev => [...prev, { id: newId, style: duplicateStyle }]);
    
    // Increment the z-index for future elements
    setNextZIndex(prev => prev + 1);
    
    // Show notification
    showNotification('Element duplicated', 'success');
  };

  // Delete the selected element
  const handleDeleteElement = (id: string) => {
    // Remove the element style
    setElementStyles(prev => prev.filter(style => style.id !== id));
    
    // If the deleted element was selected, clear selection
    if (selectedElement && getElementId(
      selectedElement.field, 
      selectedElement.section, 
      selectedElement.index, 
      selectedElement.subfield
    ) === id) {
      setSelectedElement(null);
      setActiveElement(null);
    }
    
    // Show notification
    showNotification('Element deleted', 'info');
  };

  // Copy the selected element
  const handleCopyElement = (id: string) => {
    // Find the element style
    const elementIndex = elementStyles.findIndex(style => style.id === id);
    if (elementIndex === -1) return;
    
    const elementStyle = elementStyles[elementIndex];
    
    // Store the copied element's style
    setCopiedElement({
      style: { ...elementStyle.style },
      type: id.split('-')[0] // Store the type of element for potential use
    });
    
    // Show notification
    showNotification('Element copied to clipboard', 'success');
  };

  // Paste the copied element
  const handlePasteElement = () => {
    if (!copiedElement) {
      showNotification('Nothing to paste', 'error');
      return;
    }
    
    // Create a new unique ID for the pasted element
    const timestamp = new Date().getTime();
    let newId = `${copiedElement.type}-pasted-${timestamp}`;
    
    // Create a paste style with slightly offset position from the original
    const pasteStyle: TextStyle = {
      ...copiedElement.style,
      position: {
        ...copiedElement.style.position!,
        x: (copiedElement.style.position?.x || 0) + 20,
        y: (copiedElement.style.position?.y || 0) + 20,
        zIndex: nextZIndex
      }
    };
    
    // Add the new element style
    setElementStyles(prev => [...prev, { id: newId, style: pasteStyle }]);
    
    // Increment the z-index for future elements
    setNextZIndex(prev => prev + 1);
    
    // Show notification
    showNotification('Element pasted', 'success');
  };

  // Add a notification system for actions
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });

    // Hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen">
        {/* Add global styles */}
        <style>
          {`
          .dragging {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
            z-index: 1000 !important;
            transition: transform 0.1s, opacity 0.1s !important;
          }
          .move-handle {
            z-index: 1001;
          }
          `}
        </style>
        
        {/* Notification */}
        {notification.show && (
          <div 
            className={`fixed top-4 right-4 p-3 rounded-md shadow-md text-white z-50 transition-opacity duration-300 flex items-center ${
              notification.type === 'success' ? 'bg-green-500' : 
              notification.type === 'error' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}
          >
            {notification.type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.message}
          </div>
        )}
        
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

          {/* Center - Canvas with absolute positioning */}
          <div className="flex-1 bg-gray-100 overflow-auto flex justify-center items-start p-8">
            <div 
              ref={canvasRef}
              className="bg-white shadow-lg mx-auto transition-transform relative cv-canvas"
              style={{ 
                width: '210mm',
                height: 'auto', 
                minHeight: '297mm',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center top',
              }}
            >
              {/* Canvas with absolute positioned elements */}
              <DesignCanvas onDrop={handleElementMove}>
                {/* Special heading for "Experience" */}
                <CanvaElement
                  id={getElementId('experienceHeader')}
                  style={getStyleForElement('experienceHeader')}
                  isSelected={selectedElement?.field === 'experienceHeader'}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    selectElement('experienceHeader');
                    bringToFront(getElementId('experienceHeader'));
                  }}
                  onDragEnd={(id: string, x: number, y: number) => handleElementMove(id, x, y)}
                  onDuplicate={handleDuplicateElement}
                  onDelete={handleDeleteElement}
                  onCopy={handleCopyElement}
                  onPaste={handlePasteElement}
                >
                  <div className="text-xl font-bold">Experience</div>
                </CanvaElement>
                
                {/* Special heading for "Education" */}
                <CanvaElement
                  id={getElementId('educationHeader')}
                  style={getStyleForElement('educationHeader')}
                  isSelected={selectedElement?.field === 'educationHeader'}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    selectElement('educationHeader');
                    bringToFront(getElementId('educationHeader'));
                  }}
                  onDragEnd={(id: string, x: number, y: number) => handleElementMove(id, x, y)}
                  onDuplicate={handleDuplicateElement}
                  onDelete={handleDeleteElement}
                  onCopy={handleCopyElement}
                  onPaste={handlePasteElement}
                >
                  <div className="text-xl font-bold">Education</div>
                </CanvaElement>
                
                {/* Special heading for "Skills" */}
                <CanvaElement
                  id={getElementId('skillsHeader')}
                  style={getStyleForElement('skillsHeader')}
                  isSelected={selectedElement?.field === 'skillsHeader'}
                  onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    selectElement('skillsHeader');
                    bringToFront(getElementId('skillsHeader'));
                  }}
                  onDragEnd={(id: string, x: number, y: number) => handleElementMove(id, x, y)}
                  onDuplicate={handleDuplicateElement}
                  onDelete={handleDeleteElement}
                  onCopy={handleCopyElement}
                  onPaste={handlePasteElement}
                >
                  <div className="text-xl font-bold">Skills</div>
                </CanvaElement>

                {/* Full Name */}
                {currentlyEditing?.field === 'fullName' ? (
                  <CanvaElement
                    id={getElementId('fullName')}
                    style={getStyleForElement('fullName')}
                    isSelected={true}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    onDragEnd={(id: string, x: number, y: number) => handleElementMove(id, x, y)}
                    onDuplicate={handleDuplicateElement}
                    onDelete={handleDeleteElement}
                    onCopy={handleCopyElement}
                    onPaste={handlePasteElement}
                  >
                    <input
                      type="text"
                      value={`${cvData.firstName} ${cvData.lastName}`}
                      onChange={handleNameChange}
                      onBlur={stopEditing}
                      onKeyDown={handleFieldKeyDown}
                      className="border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </CanvaElement>
                ) : (
                  <CanvaElement
                    id={getElementId('fullName')}
                    style={getStyleForElement('fullName')}
                    isSelected={selectedElement?.field === 'fullName'}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                      e.stopPropagation();
                      selectElement('fullName');
                      bringToFront(getElementId('fullName'));
                      if (e.detail === 2) {
                        startEditing('fullName');
                      }
                    }}
                    onDragEnd={(id: string, x: number, y: number) => handleElementMove(id, x, y)}
                    onDuplicate={handleDuplicateElement}
                    onDelete={handleDeleteElement}
                    onCopy={handleCopyElement}
                    onPaste={handlePasteElement}
                  >
                    <div className="text-3xl font-bold">
                      {`${cvData.firstName} ${cvData.lastName}`}
                    </div>
                  </CanvaElement>
                )}

                {/* Job title */}
                <EditableField 
                  value={cvData.title} 
                  field="title"
                  className=""
                />
                
                {/* Contact Information */}
                <EditableField 
                  value={`Email: ${cvData.email}`} 
                  field="email"
                  className=""
                />
                
                <EditableField 
                  value={`Phone: ${cvData.phone}`} 
                  field="phone"
                  className=""
                />
                
                <EditableField 
                  value={`Location: ${cvData.address}`} 
                  field="address"
                  className=""
                />
                
                {/* Experience items */}
                {cvData.experience.map((exp, index) => (
                  <React.Fragment key={`exp-${index}`}>
                    <EditableField 
                      value={exp.position} 
                      field="position"
                      section="experience"
                      index={index}
                      subfield="position"
                      className=""
                    />
                    
                    <EditableField 
                      value={exp.company} 
                      field="company"
                      section="experience"
                      index={index}
                      subfield="company"
                      className=""
                    />
                    
                    <EditableField 
                      value={`${exp.startDate} - ${exp.endDate}`} 
                      field="dates"
                      section="experience"
                      index={index}
                      subfield="dates"
                      className=""
                    />
                    
                    {exp.tasks.map((task, taskIndex) => (
                      <EditableField 
                        key={`task-${index}-${taskIndex}`}
                        value={`• ${task}`} 
                        field="task"
                        section="experience"
                        index={index}
                        subfield={`tasks[${taskIndex}]`}
                        className=""
                      />
                    ))}
                  </React.Fragment>
                ))}
                
                {/* Education items */}
                {cvData.education.map((edu, index) => (
                  <React.Fragment key={`edu-${index}`}>
                    <EditableField 
                      value={edu.degree} 
                      field="degree"
                      section="education"
                      index={index}
                      subfield="degree"
                      className=""
                    />
                    
                    <EditableField 
                      value={edu.institution} 
                      field="institution"
                      section="education"
                      index={index}
                      subfield="institution"
                      className=""
                    />
                    
                    <EditableField 
                      value={`${edu.startDate} - ${edu.endDate}`} 
                      field="dates"
                      section="education"
                      index={index}
                      subfield="dates"
                      className=""
                    />
                  </React.Fragment>
                ))}
                
                {/* Skills */}
                {cvData.skills.map((skill, index) => (
                  <EditableField 
                    key={`skill-${index}`}
                    value={skill} 
                    field="skill"
                    section="skills"
                    index={index}
                    className=""
                  />
                ))}
                
                {/* Clear selection when clicking empty space */}
                <div 
                  className="absolute inset-0" 
                  style={{ pointerEvents: selectedElement ? 'auto' : 'none' }}
                  onClick={() => setSelectedElement(null)} 
                />
              </DesignCanvas>
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
                      value={activeStyle.fontFamily.replace(/['"]/g, '')}
                      onChange={handleFontChange}
                    >
                      <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
                      <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                      <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                      <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                      <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
                      <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
                      <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
                      <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
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