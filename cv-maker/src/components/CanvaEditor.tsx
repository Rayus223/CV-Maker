import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CVData, sampleData, TextStyle, ElementStyle } from '../types/types';
import { DndProvider, useDrag, useDrop, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { XYCoord, DropTargetMonitor, DragSourceMonitor } from 'react-dnd';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { saveCV, updateCV, getCVById, type CVProject } from '../services/cvService';
import { useAuth } from '../context/AuthContext';

interface CanvaEditorProps {
  initialData?: CVData;
  onSave?: (data: CVData) => void;
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
    cursor: 'default', // Default cursor
    width: typeof style.width === 'number' ? `${style.width}px` : 'auto',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
    color: style.color,
    textAlign: style.textAlign,
    zIndex: isDragging ? 1000 : (style.position?.zIndex || 1),
    transition: isDragging ? 'none' : 'opacity 0.2s',
    boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : (isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'),
  };
  
  // Handle the end of dragging to update state with new position
  const handleDragStop = (e: DraggableEvent, data: DraggableData) => {
    // If this was a click, not a drag, and it was a double-click
    if (Math.abs(data.x - (style.position?.x || 0)) < 3 && 
        Math.abs(data.y - (style.position?.y || 0)) < 3 && 
        (e as any).detail === 2) {
      // Prevent handling as a drag
      return;
    }
    
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
      defaultPosition={position}
      position={position}
      onStart={(e, data) => {
        // Don't start drag on double-click (which should trigger editing)
        if ((e as MouseEvent).detail === 2) {
          return false;
        }
        setIsDragging(true);
      }}
      onStop={handleDragStop}
      disabled={!isSelected} // Only draggable when selected
    >
      <div 
        ref={elementRef}
        className={`canva-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
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
                    className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-75 hover:opacity-100 flex items-center justify-center"
                    onMouseDown={handleResizeMouseDown}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                )}
              </div>
            )}
        <div className="element-content p-1 break-words">
          {children}
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

// Add notification system at the top of the component
const CanvaEditor: React.FC<CanvaEditorProps> = ({ initialData, onSave }) => {
  // Add notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Add showNotification function
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) => {
    setNotification({
      show: true,
      message,
      type
    });

    // Hide after specified duration
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [documentTitle, setDocumentTitle] = useState<string>('Untitled design');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Add state for project ID and loading status
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(3000); // 3 seconds for regular autosave
  // Add a new state to track if there are pending changes
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  // Add a debounce timer for changes
  const [changeDebounceTimer, setChangeDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Add saving state to track when a save is in progress
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // CV data state - ensure customTextElements and elementStyles are part of it
  const [cvData, setCvData] = useState<CVData>(() => {
    const baseData: CVData = {
      firstName: '',
      lastName: '',
      pronouns: '',
      title: '',
      dob: '',
      phone: '',
      email: '',
      address: '',
      skills: [],
      links: [],
      experience: [],
      education: [],
      projects: [],
      recentProjects: [],
      customTextElements: {}, // Always initialized
      elementStyles: []      // Always initialized
    };
    if (initialData) {
      console.log("Initializing cvData with initialData provided via props");
      return {
        ...baseData,
        ...initialData,
        customTextElements: initialData.customTextElements || {},
        elementStyles: initialData.elementStyles || []
      };
    }
    console.log("Initializing cvData with default baseData (no initialData prop)");
    return baseData;
  });
  
  // Editing state
  const [currentlyEditing, setCurrentlyEditing] = useState<{
    field: string;
    section?: string;
    index?: number;
    subfield?: string;
  } | null>(null);
  
  // Styles management
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
  
  // Add state for section order
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    'personal',
    'experience',
    'education',
    'skills'
  ]);

  // Add a state variable to track the next z-index to use
  const [nextZIndex, setNextZIndex] = useState<number>(100);

  // Near the beginning of the component, let's add a version tracking state
  const [versionTimestamp, setVersionTimestamp] = useState<string>(new Date().toISOString().split('T')[0]);

  // Helper function to calculate default styles from CVData
  const calculateDefaultStylesFromCvData = useCallback((currentCvData: CVData, getElementIdFunc: Function, defaultStyleObj: TextStyle): ElementStyle[] => {
    const initialStyles: ElementStyle[] = [];
    if (!currentCvData) return initialStyles;

    let yPos = 40;
    let zIdx = 10;

    const addStyle = (id: string, style: Partial<TextStyle>) => {
      initialStyles.push({ 
        id, 
        style: { 
          ...defaultStyleObj, 
          ...style, 
          position: { 
            x: style.position?.x ?? 40,
            y: style.position?.y ?? yPos, 
            zIndex: style.position?.zIndex ?? zIdx++ 
          }
        } 
      });
      const fontSize = parseInt(style.fontSize || defaultStyleObj.fontSize);
      const lineHeight = 1.5; 
      const padding = 8; 
      yPos += (fontSize * lineHeight) + padding + 10; 
    };

    if (currentCvData.firstName || currentCvData.lastName) {
      addStyle(getElementIdFunc('fullName'), { fontSize: '32px', fontWeight: 'bold', position: { x:40, y:40, zIndex: zIdx++} });
      yPos = 85; 
    }
    if (currentCvData.title) {
      addStyle(getElementIdFunc('title'), { fontSize: '18px', color: '#4B5563', position: {x:40, y:85, zIndex: zIdx++} });
      yPos = 120; 
    }
    
    let contactStartY = yPos;
    if (currentCvData.email) {
      addStyle(getElementIdFunc('email'), { position: { x: 40, y: contactStartY, zIndex: zIdx }});
    }
    if (currentCvData.phone) {
      addStyle(getElementIdFunc('phone'), { position: { x: 300, y: contactStartY, zIndex: zIdx }});
    }
    if (currentCvData.address) {
      addStyle(getElementIdFunc('address'), { position: { x: 560, y: contactStartY, zIndex: zIdx }});
    }
    if (currentCvData.email || currentCvData.phone || currentCvData.address) {
      yPos = contactStartY + 50; 
      zIdx++; 
    }

    if (currentCvData.experience && currentCvData.experience.length > 0) {
      let sectionStartY = yPos;
      addStyle(getElementIdFunc('experienceHeader'), { fontSize: '22px', fontWeight: 'bold', position: { x:40, y: sectionStartY, zIndex: zIdx++ } });
      yPos = sectionStartY + 50; 
      (currentCvData.experience || []).forEach((exp, index) => {
        let itemStartY = yPos;
        if(exp.position) addStyle(getElementIdFunc('position', 'experience', index, 'position'), { fontWeight: 'bold', position: { x:40, y: itemStartY, zIndex: zIdx } });
        if(exp.company) addStyle(getElementIdFunc('company', 'experience', index, 'company'), { position: { x:40, y: itemStartY + 30, zIndex: zIdx-1 } });
        if(exp.startDate || exp.endDate) addStyle(getElementIdFunc('dates', 'experience', index, 'dates'), { position: { x: 300, y: itemStartY + 30, zIndex: zIdx-1 } });
        yPos = itemStartY + 70; 
        if (exp.tasks && exp.tasks.length > 0) {
          let taskBlockStartY = yPos;
          exp.tasks.forEach((task) => {
            addStyle(getElementIdFunc('task', 'experience', index, `tasks[${exp.tasks.indexOf(task)}]`), { position: { x: 60, y: taskBlockStartY, zIndex: zIdx-2 } });
            taskBlockStartY += 30;
          });
          yPos = taskBlockStartY; 
        }
        yPos += 10; 
        zIdx++;
      });
    }

    if (currentCvData.education && currentCvData.education.length > 0) {
      let sectionStartY = yPos;
      addStyle(getElementIdFunc('educationHeader'), { fontSize: '22px', fontWeight: 'bold', position: { x:40, y: sectionStartY, zIndex: zIdx++ } });
      yPos = sectionStartY + 50;
      (currentCvData.education || []).forEach((edu, index) => {
        let itemStartY = yPos;
        if(edu.degree) addStyle(getElementIdFunc('degree', 'education', index, 'degree'), { fontWeight: 'bold', position: { x:40, y: itemStartY, zIndex: zIdx } });
        if(edu.institution) addStyle(getElementIdFunc('institution', 'education', index, 'institution'), { position: { x:40, y: itemStartY + 30, zIndex: zIdx-1 } });
        if(edu.startDate || edu.endDate) addStyle(getElementIdFunc('dates', 'education', index, 'dates'), { position: { x: 300, y: itemStartY + 30, zIndex: zIdx-1 } });
        yPos = itemStartY + 70;
        zIdx++;
      });
    }

    if (currentCvData.skills && currentCvData.skills.length > 0) {
      let sectionStartY = yPos;
      addStyle(getElementIdFunc('skillsHeader'), { fontSize: '22px', fontWeight: 'bold', position: { x:40, y: sectionStartY, zIndex: zIdx++ } });
      yPos = sectionStartY + 50;
      let skillX = 40;
      let skillRowStartY = yPos;
      (currentCvData.skills || []).forEach((skill, index) => {
        addStyle(getElementIdFunc('skill', 'skills', index), { position: { x: skillX, y: skillRowStartY, zIndex: zIdx } });
        skillX += 180;
        if (skillX > 500) {
          skillX = 40;
          skillRowStartY += 30;
        }
      });
      yPos = skillRowStartY + 30; 
    }
    return initialStyles;
  }, [defaultStyle]);

  // Duplicate the selected element
  const handleDuplicateElement = (id: string) => {
    const currentElementStyles = cvData.elementStyles || [];
    const elementIndex = currentElementStyles.findIndex(style => style.id === id);
    if (elementIndex === -1) return;

    const elementStyle = currentElementStyles[elementIndex];
    // No need to check elementStyle for null/undefined if elementIndex is valid and currentElementStyles is an array

    const timestamp = new Date().getTime();
    const newId = `custom-text-${timestamp}`;

    const duplicateStyle: TextStyle = {
      ...elementStyle.style,
      position: {
        ...(elementStyle.style.position!),
        x: (elementStyle.style.position?.x || 0) + 20,
        y: (elementStyle.style.position?.y || 0) + 20,
        zIndex: nextZIndex
      }
    };

    setCvData(prev => ({
      ...prev,
      elementStyles: [...(prev.elementStyles || []), { id: newId, style: duplicateStyle }]
    }));

    if (id.startsWith('custom-text-')) {
      setCvData(prev => ({
        ...prev,
        customTextElements: { ...(prev.customTextElements || {}), [newId]: (prev.customTextElements || {})[id] || '' }
      }));
    }

    setNextZIndex(prev => prev + 1);
    selectElement(newId);
    showNotification('Element duplicated', 'success');
  };

  // Delete the selected element
  const handleDeleteElement = (id: string) => {
    setCvData(prev => ({
      ...prev,
      elementStyles: (prev.elementStyles || []).filter(style => style.id !== id)
    }));

    if (id.startsWith('custom-text-')) {
      setCvData(prev => {
        const updatedCustomElements = { ...(prev.customTextElements || {}) };
        delete updatedCustomElements[id];
        return {
          ...prev,
          customTextElements: updatedCustomElements
        };
      });
    }

    if (selectedElement && getElementId(
      selectedElement.field,
      selectedElement.section,
      selectedElement.index,
      selectedElement.subfield
    ) === id) {
      setSelectedElement(null);
      setActiveElement(null);
    }
    showNotification('Element deleted', 'info');
  };

  // Copy the selected element
  const handleCopyElement = (id: string) => {
    const currentElementStyles = cvData.elementStyles || [];
    const elementIndex = currentElementStyles.findIndex(style => style.id === id);
    if (elementIndex === -1) return;

    const elementStyle = currentElementStyles[elementIndex];
    const currentCustomTextElements = cvData.customTextElements || {};
    const content = id.startsWith('custom-text-') ? currentCustomTextElements[id] : undefined;

    setCopiedElement({
      style: { ...elementStyle.style },
      content,
      type: id.split('-')[0]
    });
    showNotification('Element copied to clipboard', 'success');
  };

  // Paste the copied element
  const handlePasteElement = () => {
    if (!copiedElement) {
      showNotification('Nothing to paste', 'error');
      return;
    }

    const timestamp = new Date().getTime();
    const newId = `custom-text-${timestamp}`;

    const pasteStyle: TextStyle = {
      ...copiedElement.style,
      position: {
        ...(copiedElement.style.position!),
        x: (copiedElement.style.position?.x || 0) + 20,
        y: (copiedElement.style.position?.y || 0) + 20,
        zIndex: nextZIndex
      }
    };

    setCvData(prev => ({
      ...prev,
      elementStyles: [...(prev.elementStyles || []), { id: newId, style: pasteStyle }]
    }));

    if (copiedElement.content !== undefined) {
      setCvData(prev => ({
        ...prev,
        customTextElements: { ...(prev.customTextElements || {}), [newId]: copiedElement.content || '' }
      }));
    }

    setNextZIndex(prev => prev + 1);
    selectElement(newId);
    showNotification('Element pasted', 'success');
  };

  // Get element ID
  const getElementId = useCallback((field: string, section?: string, index?: number, subfield?: string): string => {
    return `${field}${section ? `-${section}` : ''}${index !== undefined ? `-${index}` : ''}${subfield ? `-${subfield}` : ''}`;
  }, []);
  
  // Get style for an element
  const getStyleForElement = (field: string, section?: string, index?: number, subfield?: string): TextStyle => {
    const id = getElementId(field, section, index, subfield);
    const currentElementStyles = cvData.elementStyles || [];
    const elementStyle = currentElementStyles.find(style => style.id === id);
    return elementStyle ? elementStyle.style : defaultStyle;
  };
  
  // Start editing with enhanced handling
  const startEditing = (field: string, section?: string, index?: number, subfield?: string) => {
    // First select the element - this ensures proper visual highlighting
    setSelectedElement({ field, section, index, subfield });
    setActiveElement('text');
    
    // Then apply editing mode - this will show the input field
    setCurrentlyEditing({ field, section, index, subfield });
    
    // Focus will happen automatically due to autoFocus on the input
    
    // Prevent any other interactions during edit mode
    document.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      // Only allow interacting with the current editing field
      if (!target.closest('input') && !target.closest('textarea')) {
        stopEditing();
      }
    }, { once: true });
  };
  
  // Replace the stopEditing function
  const stopEditing = () => {
    console.log("stopEditing called, hasPendingChanges:", hasPendingChanges, "isAuthenticated:", isAuthenticated, "isSaving:", isSaving);
    
    // Trigger immediate save if there are pending changes
    if (hasPendingChanges && isAuthenticated && !isSaving) {
      console.log('Saving changes on stop editing - triggering autosave');
      triggerAutosave();
      setHasPendingChanges(false);
    } else {
      console.log('Not saving on stop editing - conditions not met');
    }
    
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
    
    setCvData(prev => {
      const currentStyles = prev.elementStyles || [];
      const elementIndex = currentStyles.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...currentStyles];
        updated[elementIndex] = { id, style: newStyle };
        return { ...prev, elementStyles: updated };
      } else {
        return { ...prev, elementStyles: [...currentStyles, { id, style: newStyle }] };
      }
    });
    
    // Mark as having changes that need to be saved
    setHasPendingChanges(true);
    
    // Debounce autosave to prevent too many API calls
    if (changeDebounceTimer) {
      clearTimeout(changeDebounceTimer);
    }
    
    // Trigger autosave after 500ms of inactivity
    const timer = setTimeout(() => {
      if (isAuthenticated && !isSaving && hasPendingChanges) {
        console.log('Triggering autosave after text change');
        triggerAutosave();
        setHasPendingChanges(false);
      }
    }, 500);
    
    setChangeDebounceTimer(timer);
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
    // Save project when title changes
    if (isAuthenticated && projectId) {
      updateCV(projectId, cvData, documentTitle)
        .then(() => setLastSaved(new Date()))
        .catch(err => console.error('Error updating title:', err));
    }
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
  
  // Fix the handleFieldChange function to log changes and trigger immediate save
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentlyEditing) return;
    
    const { field, section, index, subfield } = currentlyEditing;
    
    // Flag that we have pending changes
    setHasPendingChanges(true);
    
    console.log(`Editing field: ${field}${section ? `, section: ${section}` : ''}${index !== undefined ? `, index: ${index}` : ''}${subfield ? `, subfield: ${subfield}` : ''}`);
    console.log(`New value: ${e.target.value}`);
    
    // Check if this is a custom text element (starts with 'custom-text-')
    if (field.startsWith('custom-text-')) {
      // Update custom text elements
      console.log('Updating custom text element');
      setCvData(prev => ({
        ...prev,
        customTextElements: { ...prev.customTextElements, [field]: e.target.value }
      }));
    } else {
      // Handle regular CV structure fields
      console.log('Updating CV data field');
      setCvData(prev => {
        const newData = { ...prev };
        
        if (section && typeof index === 'number') {
          if (subfield) {
            // Handle nested fields like experience[0].company
            console.log(`Setting ${section}[${index}].${subfield} to "${e.target.value}"`);
            (newData[section as keyof CVData] as any)[index][subfield] = e.target.value;
          } else {
            // Handle array fields like skills[0]
            console.log(`Setting ${section}[${index}] to "${e.target.value}"`);
            (newData[section as keyof CVData] as any)[index] = e.target.value;
          }
        } else {
          // Handle top-level fields like firstName
          console.log(`Setting ${field} to "${e.target.value}"`);
          (newData as any)[field] = e.target.value;
        }
        
        // Call onSave if provided
        if (onSave) {
          onSave(newData);
        }
        
        return newData;
      });
    }
    
    // Debounce the autosave to prevent too many API calls
    if (changeDebounceTimer) {
      clearTimeout(changeDebounceTimer);
    }
    
    // Trigger autosave after 500ms of inactivity
    const timer = setTimeout(() => {
      if (isAuthenticated && !isSaving && hasPendingChanges) {
        console.log('Triggering autosave after text change');
        triggerAutosave();
        setHasPendingChanges(false);
      }
    }, 500);
    
    setChangeDebounceTimer(timer);
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
    setCvData(prev => {
      const currentStyles = prev.elementStyles || [];
      const elementIndex = currentStyles.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...currentStyles];
        const currentElementStyle = updated[elementIndex].style;
        const currentPosition = currentElementStyle.position || { x: 0, y: 0, zIndex: 1 };
        let updatedElementStyleWithPos = {
          ...currentElementStyle,
          position: {
            ...currentPosition,
            x: currentPosition.x + xDelta,
            y: currentPosition.y + yDelta
          }
        };
        if (styleUpdates) updatedElementStyleWithPos = { ...updatedElementStyleWithPos, ...styleUpdates };
        updated[elementIndex] = { ...updated[elementIndex], style: updatedElementStyleWithPos };
        return { ...prev, elementStyles: updated };
      }
      return prev;
    });
    setActiveElement(id);
    setHasPendingChanges(true);
    if (changeDebounceTimer) clearTimeout(changeDebounceTimer);
    const timer = setTimeout(() => {
      if (isAuthenticated && !isSaving && hasPendingChanges) {
        triggerAutosave();
        setHasPendingChanges(false);
      }
    }, 800);
    setChangeDebounceTimer(timer);
  };
  
  // Handle element position update in absolute positioning
  const handleElementMove = (id: string, xDelta: number, yDelta: number, styleUpdates?: Partial<TextStyle>) => {
    setCvData(prev => {
      const currentStyles = prev.elementStyles || [];
      const elementIndex = currentStyles.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...currentStyles];
        const currentElementStyle = updated[elementIndex].style;
        const currentPosition = currentElementStyle.position || { x: 0, y: 0, zIndex: 1 };
        let updatedElementStyleWithPos = {
          ...currentElementStyle,
          position: {
            ...currentPosition,
            x: currentPosition.x + xDelta,
            y: currentPosition.y + yDelta
          }
        };
        if (styleUpdates) updatedElementStyleWithPos = { ...updatedElementStyleWithPos, ...styleUpdates };
        updated[elementIndex] = { ...updated[elementIndex], style: updatedElementStyleWithPos };
        return { ...prev, elementStyles: updated };
      }
      return prev;
    });
    setActiveElement(id);
    setHasPendingChanges(true);
    if (changeDebounceTimer) clearTimeout(changeDebounceTimer);
    const timer = setTimeout(() => {
      if (isAuthenticated && !isSaving && hasPendingChanges) {
        triggerAutosave();
        setHasPendingChanges(false);
      }
    }, 800);
    setChangeDebounceTimer(timer);
  };

  // Bring element to front when selected
  const bringToFront = (id: string) => {
    setCvData(prev => {
      const currentStyles = prev.elementStyles || [];
      const elementIndex = currentStyles.findIndex(style => style.id === id);
      if (elementIndex >= 0) {
        const updated = [...currentStyles];
        const currentElementStyle = updated[elementIndex].style;
        const currentPosition = currentElementStyle.position || { x: 0, y: 0, zIndex: 1 };
        updated[elementIndex] = {
          ...updated[elementIndex],
          style: {
            ...currentElementStyle,
            position: {
              ...currentPosition,
              zIndex: nextZIndex
            }
          }
        };
        setNextZIndex(prevZ => prevZ + 1);
        return { ...prev, elementStyles: updated };
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
    isMultiline = false,
    isCustomElement = false
  }: { 
    value: string, 
    field: string,
    section?: string,
    index?: number,
    subfield?: string,
    className?: string,
    isMultiline?: boolean,
    isCustomElement?: boolean
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
      
      // Double click to edit - prevent any other handlers from capturing this
      if (e.detail === 2) {
        e.preventDefault();
        startEditing(field, section, index, subfield);
        return false;
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
            className={`border border-blue-400 p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none ${className}`}
            style={{
              width: style.width || 'auto',
              minWidth: '100px',
              minHeight: '24px',
              height: 'auto',
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              color: style.color,
              lineHeight: '1.2',
              margin: 0,
              padding: '2px 4px'
            }}
            autoFocus
            rows={1}
            placeholder={isCustomElement ? "Enter text here..." : ""}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
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
            className={`border border-blue-400 p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${className}`}
            style={{
              width: style.width || 'auto',
              minWidth: '100px',
              height: '24px',
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              color: style.color,
              lineHeight: '1.2',
              margin: 0,
              padding: '2px 4px'
            }}
            autoFocus
            placeholder={isCustomElement ? "Enter text here..." : ""}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        );
      }
    } else {
      content = (
        <div 
          className={`${className} ${isSelected ? '' : ''} cursor-text break-words`}
          onClick={handleClick}
          style={{
            minHeight: '24px',
            padding: '2px 4px'
          }}
        >
          {value || (isCustomElement ? "Click to edit" : "")}
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
    const currentElementStyles = cvData.elementStyles || [];
    // Use getElementId from useCallback context
    const resolvedGetElementId = getElementId;

    console.log("Initial styling useEffect triggered. projectId:", projectId, "isLoading:", isLoading, "elementStyles.length:", currentElementStyles.length);

    if (!isLoading && currentElementStyles.length === 0 &&
        (cvData.firstName || cvData.lastName || (cvData.experience && cvData.experience.length > 0) || (cvData.education && cvData.education.length > 0) || (cvData.skills && cvData.skills.length > 0))) {

      console.log("Applying default styles based on cvData because no elementStyles were loaded.");
      const initialStyles = calculateDefaultStylesFromCvData(cvData, resolvedGetElementId, defaultStyle);
      setCvData(prev => ({ ...prev, elementStyles: initialStyles }));

      if (initialStyles.length > 0) {
        const highestZIndex = initialStyles.reduce((highest, style) => {
          const zIndex = style.style.position?.zIndex || 0;
          return Math.max(highest, zIndex);
        }, 0);
        setNextZIndex(highestZIndex + 1);
        console.log("Set nextZIndex to:", highestZIndex + 1, "based on default styles.");
      }
    } else if (!isLoading && currentElementStyles.length > 0) {
      console.log("Skipping default styling, elementStyles already loaded or initialized:", currentElementStyles.length);
    } else if (!isLoading && (cvData.elementStyles || []).length === 0) {
      console.log("Skipping default styling, cvData is empty and no elementStyles loaded.");
    }
  }, [isLoading, cvData, projectId, calculateDefaultStylesFromCvData, getElementId, defaultStyle]); // Added calculateDefaultStylesFromCvData, getElementId, defaultStyle

  // Load project useEffect
  useEffect(() => {
    const loadProject = async () => {
      const params = new URLSearchParams(location.search);
      const projectParam = params.get('project');
      const templateId = params.get('template');

      console.log("loadProject called. projectParam:", projectParam, "templateId:", templateId, "isAuthenticated:", isAuthenticated);

      if (isAuthenticated && projectParam && projectParam !== 'null' && projectParam !== 'undefined' && !projectParam.startsWith('generated-')) {
        setIsLoading(true);
        console.log("Attempting to load project with ID:", projectParam);
        try {
          const project = await getCVById(projectParam); // getCVById is stable from import
          console.log("Project loaded from backend:", project);
          
          const projectData = project.data || {}; 

          setCvData(prev => ({
            ...prev, 
            ...(projectData as CVData), 
            customTextElements: projectData.customTextElements || {},
            elementStyles: (projectData.elementStyles && projectData.elementStyles.length > 0) ? projectData.elementStyles : []
          }));
          
          const loadedElementStyles = projectData.elementStyles || [];
          if (loadedElementStyles.length > 0) {
            console.log('Found elementStyles in project data, loading them:', loadedElementStyles.length);
            const highestZIndex = loadedElementStyles.reduce((highest, style) => Math.max(highest, style.style.position?.zIndex || 0), 0);
            setNextZIndex(highestZIndex + 1);
            console.log("Set nextZIndex to:", highestZIndex + 1, "from loaded styles.");
          } else {
            console.log("No elementStyles in loaded project or it's empty. Will use defaults if cvData has content.");
          }
          
          setDocumentTitle(project.name || 'Untitled CV');
          setProjectId(project.id);
          setLastSaved(new Date(project.updatedAt));
          showNotification('Project loaded successfully', 'success'); // showNotification from useCallback
        } catch (error) {
          console.error('Failed to load project:', error);
          showNotification('Failed to load project. Starting a new one.', 'error');
          setProjectId(null);
          setCvData({
             ...sampleData, // sampleData from import
             customTextElements: {}, 
             elementStyles: [] 
          });
          setDocumentTitle('Untitled New CV');
        } finally {
          setIsLoading(false);
        }
      } else if (templateId) {
        // ... (template loading logic, ensure sampleData is stable or add to deps)
        setIsLoading(true);
        setCvData({ ...sampleData, customTextElements: {}, elementStyles: [] });
        setDocumentTitle(`CV from Template ${templateId}`);
        setProjectId(null);
        setIsLoading(false);
        showNotification(`Started new CV from template ${templateId}`, 'info');
      } else if (!projectParam || projectParam.startsWith('generated-') || projectParam === 'null' || projectParam === 'undefined') {
        // ... (new/blank canvas logic)
        const currentElementStyles = cvData.elementStyles || [];
        const currentCustomTextElements = cvData.customTextElements || {};
        if (currentElementStyles.length === 0 && Object.keys(currentCustomTextElements).length === 0 && !cvData.firstName) {
           console.log("Starting with a completely blank canvas as no data or styles found.");
           setCvData({ firstName: '', lastName: '', pronouns: '', title: '', dob: '', phone: '', email: '', address: '', skills: [], links: [], experience: [], education: [], projects: [], recentProjects: [], customTextElements: {}, elementStyles: [] });
        }
        setDocumentTitle(documentTitle || 'Untitled Design');
        setProjectId(null);
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated !== null) {
      loadProject();
    }
  }, [location.search, isAuthenticated, showNotification, navigate, sampleData]); // Removed getCVById as it's stable; Added sampleData if used in template logic

  // Define triggerAutosave with useCallback BEFORE the autoSave useEffect
  const triggerAutosave = useCallback(async () => {
    console.log("triggerAutosave called - conditions:", {
      isAuthenticated,
      isSaving,
      isLoading,
      customTextElementsCount: Object.keys(cvData.customTextElements || {}).length,
      elementStylesCount: (cvData.elementStyles || []).length,
      projectId,
      hasPendingChanges
    });

    if (!isAuthenticated || isSaving || isLoading || !hasPendingChanges) {
      if (!isSaving && hasPendingChanges) {
        // Pending changes remain if not saving
      } else if (isSaving && hasPendingChanges) {
        // Save is in progress, it will handle pending changes
      } else {
        // No pending changes, or conditions not met to save, so clear the flag
        setHasPendingChanges(false); 
      }
      return;
    }

    try {
      console.log("Starting autosave process");
      setIsSaving(true);
      
      const storageName = documentTitle || 'Untitled CV';
      // Ensure completeData has fallbacks for elements that might be undefined on cvData in theory
      const completeData: CVData = {
        ...cvData,
        customTextElements: cvData.customTextElements || {},
        elementStyles: cvData.elementStyles || []
      };
      
      // Fix the TypeScript error by creating local variables with null checks
      const textElementsForLog = completeData.customTextElements || {};
      const stylesForLog = completeData.elementStyles || [];
      
      console.log('Data prepared for autosave:', { 
        customTextElementsCount: Object.keys(textElementsForLog).length,
        elementStylesCount: stylesForLog.length
      });

      let savedOrUpdatedProject: CVProject;

      if (projectId && projectId !== 'null' && projectId !== 'undefined' && !projectId.startsWith('generated-')) {
        console.log(`Autosave: Attempting to UPDATE existing project with ID: ${projectId}`);
        try {
          savedOrUpdatedProject = await updateCV(projectId, completeData, storageName);
          console.log("Project updated successfully via autosave:", savedOrUpdatedProject.id);
        } catch (updateError: any) {
          console.error("Autosave: Error updating project, attempting to save as new instead.", updateError);
          showNotification(`Autosave update failed (${updateError.message || 'Unknown error'}), trying as new.`, 'error', 4000);
          const newProject = await saveCV(completeData, storageName);
          setProjectId(newProject.id);
          savedOrUpdatedProject = newProject;
          console.log("Autosave: Project saved as NEW after update failed, new ID:", newProject.id);
          const url = new URL(window.location.href);
          url.searchParams.set('project', newProject.id);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        console.log("Autosave: Attempting to SAVE as NEW project (no valid projectId in state or it's a placeholder).");
        savedOrUpdatedProject = await saveCV(completeData, storageName);
        setProjectId(savedOrUpdatedProject.id);
        console.log("Autosave: Project saved as NEW successfully, new ID:", savedOrUpdatedProject.id);
        const url = new URL(window.location.href);
        url.searchParams.set('project', savedOrUpdatedProject.id);
        window.history.replaceState({}, '', url.toString());
      }
      
      setLastSaved(new Date());
      setHasPendingChanges(false);
      showNotification('Auto-saved', 'success', 1500);
      localStorage.setItem('last_edited_project_id', savedOrUpdatedProject.id);

    } catch (error: any) {
      console.error('Autosave failed comprehensively:', error);
      // Don't clear hasPendingChanges here, as the save failed.
      if (String(error.message || error).includes('Authentication required')) {
        showNotification('Please login to save your CV', 'error', 3000);
        // Consider navigating to login: navigate('/login?redirect=canva-editor');
      } else {
        showNotification(`Autosave error: ${error.message || 'Could not save project.'}`, 'error', 4000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, isSaving, isLoading, cvData, projectId, documentTitle, hasPendingChanges, showNotification, navigate]); // Removed saveCV, updateCV as they are imported and stable

  // Auto-save interval useEffect (depends on triggerAutosave defined above)
  useEffect(() => {
    let autoSaveTimer: NodeJS.Timeout | null = null;
    const autoSave = async () => {
      console.log("Auto-save check - hasPendingChanges:", hasPendingChanges);
      if (hasPendingChanges) {
        console.log("Auto-save triggered - saving pending changes");
        await triggerAutosave();
      }
    };
    if (isAuthenticated && !isLoading) {
      console.log(`Setting up auto-save interval every ${autoSaveInterval}ms`);
      autoSaveTimer = setInterval(autoSave, autoSaveInterval);
    } else {
      console.log("Not setting up auto-save - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);
    }
    return () => {
      if (autoSaveTimer) {
        console.log("Clearing auto-save timer");
        clearInterval(autoSaveTimer);
      }
    };
  }, [isAuthenticated, isLoading, autoSaveInterval, hasPendingChanges, triggerAutosave]);

  const handleManualSave = async () => {
    if (!isAuthenticated) {
      showNotification('Please login to save your CV', 'error');
      navigate('/login?redirect=canva-editor');
      return;
    }
    if (isSaving) {
      showNotification('Save already in progress', 'info');
      return;
    }

    console.log("handleManualSave initiated. Current projectId from state:", projectId);
    setIsSaving(true);
    showNotification('Saving your CV...', 'info');

    try {
      const storageName = documentTitle || 'Untitled CV';
      const completeData: CVData = {
        ...cvData,
        customTextElements: cvData.customTextElements || {},
        elementStyles: cvData.elementStyles || []
      };

      // Fix the TypeScript error by creating local variables with null checks
      const textElementsForLog = completeData.customTextElements || {};
      const stylesForLog = completeData.elementStyles || [];
      
      console.log('Data prepared for manual save:', {
        customTextElementsCount: Object.keys(textElementsForLog).length,
        elementStylesCount: stylesForLog.length
      });

      let savedOrUpdatedProject: CVProject;

      if (projectId && projectId !== 'null' && projectId !== 'undefined' && !projectId.startsWith('generated-')) {
        console.log(`Attempting to UPDATE existing project with ID: ${projectId}`);
        try {
          savedOrUpdatedProject = await updateCV(projectId, completeData, storageName);
          console.log("Project updated successfully via manual save:", savedOrUpdatedProject.id);
        } catch (updateError: any) {
          console.error("Manual save: Error updating project, attempting to save as new instead.", updateError);
          showNotification(`Update failed (${updateError.message || 'Unknown error'}), trying to save as a new CV.`, 'error', 5000);
          const newProject = await saveCV(completeData, storageName);
          setProjectId(newProject.id);
          savedOrUpdatedProject = newProject;
          console.log("Project saved as NEW after update failed, new ID:", newProject.id);
          const url = new URL(window.location.href);
          url.searchParams.set('project', newProject.id);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        console.log("Attempting to SAVE as NEW project (no valid projectId in state or it's a placeholder).");
        savedOrUpdatedProject = await saveCV(completeData, storageName);
        setProjectId(savedOrUpdatedProject.id);
        console.log("Project saved as NEW successfully, new ID:", savedOrUpdatedProject.id);
        const url = new URL(window.location.href);
        url.searchParams.set('project', savedOrUpdatedProject.id);
        window.history.replaceState({}, '', url.toString());
      }

      setLastSaved(new Date());
      setHasPendingChanges(false);
      showNotification('CV saved successfully!', 'success');
      localStorage.setItem('last_edited_project_id', savedOrUpdatedProject.id);

    } catch (error: any) {
      console.error('Manual save failed comprehensively:', error);
      showNotification(`Save failed: ${error.message || 'Could not save project.'}`, 'error', 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new useEffect to clean up the change debounce timer
  // Place it after other useEffects but before the return statement
  useEffect(() => {
    // Clean up the debounce timer on unmount
    return () => {
      if (changeDebounceTimer) {
        clearTimeout(changeDebounceTimer);
      }
    };
  }, [changeDebounceTimer]);
  
  // Handle field change for custom text elements to save immediately upon changes
  const handleCustomTextChange = (id: string, value: string) => {
    console.log(`Editing text for element ${id}, new value:`, value);
    setCvData(prev => ({
      ...prev,
      customTextElements: { ...(prev.customTextElements || {}), [id]: value }
    }));
    setHasPendingChanges(true);
    if (changeDebounceTimer) clearTimeout(changeDebounceTimer);
    const timer = setTimeout(() => {
      if (isAuthenticated && !isSaving && hasPendingChanges) {
        console.log('Text changed - debounced autosave triggering');
        triggerAutosave();
      }
    }, 1000);
    setChangeDebounceTimer(timer);
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
            transform: scale(1.02);
            opacity: 0.9;
          }
          .canva-element {
            user-select: none;
            transition: box-shadow 0.2s;
            outline: none;
          }
          .canva-element.selected {
            cursor: move; /* Show move cursor when selected */
          }
          .canva-element:hover {
            box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
          }
          .element-content {
            position: relative;
          }
          /* Removed tooltip */
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
              
              <div className="flex items-center space-x-2">
                {isSaving && (
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500 mr-1"></div>
                    Saving...
                  </div>
                )}
                {!isSaving && lastSaved && (
                  <span className="text-xs text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className={`flex items-center gap-1 px-3 py-1.5 ${isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
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
                  <button 
                    className="flex items-center gap-2 w-full p-2 rounded hover:bg-gray-100"
                    onClick={() => {
                      // Create a unique ID for the new text element
                      const timestamp = new Date().getTime();
                      const id = `custom-text-${timestamp}`;
                      
                      // Calculate position - center in the visible viewport
                      const canvasRect = canvasRef.current?.getBoundingClientRect();
                      const viewportWidth = canvasRect?.width || 800;
                      const scrollTop = canvasRef.current?.parentElement?.scrollTop || 0;
                      
                      const x = (viewportWidth / 2) - 100;
                      const y = (scrollTop / (zoom / 100)) + 200;
                      
                      // Create the new text element with default style
                      const newStyle = { 
                        ...defaultStyle, 
                        fontSize: '16px',
                        fontWeight: 'normal',
                        width: 200, // Give it a default width
                        position: { 
                          x, 
                          y, 
                          zIndex: nextZIndex 
                        } 
                      };
                      
                      console.log("Adding new custom text element with ID:", id);
                      console.log("New element style:", newStyle);
                      
                      setCvData(prev => ({
                        ...prev,
                        elementStyles: [...(prev.elementStyles || []), { id, style: newStyle }],
                        customTextElements: { ...(prev.customTextElements || {}), [id]: "" }
                      }));
                      
                      setNextZIndex(prev => prev + 1);
                      
                      // Add custom text element to custom elements state
                      setCvData(prev => ({
                        ...prev,
                        customTextElements: { ...prev.customTextElements, [id]: "" }
                      }));
                      
                      // Flag that we have changes that need to be saved
                      setHasPendingChanges(true);
                      
                      // Select the new element
                      selectElement(id);
                      
                      // Start editing immediately
                      setTimeout(() => {
                        startEditing(id);
                      }, 100);
                      
                      // Show notification
                      showNotification('Text element added', 'success');
                    }}
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    <span>Add Text</span>
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
              {/* Empty state prompt when canvas is completely empty (no CV data and no custom text elements) */}
              {!cvData.firstName && !cvData.lastName && 
               (!cvData.experience || cvData.experience.length === 0) && 
               (!cvData.education || cvData.education.length === 0) && 
               Object.keys(cvData.customTextElements || {}).length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-xl font-medium mb-2">Your Canvas is Empty</h2>
                  <p className="text-center max-w-md px-6">Click the text tool in the left sidebar to add content, or use the templates to get started quickly.</p>
                </div>
              )}
              
              {/* Canvas with absolute positioned elements */}
              <DesignCanvas onDrop={handleElementMove}>
                {/* Only show section headers for existing CV data */}
                {(initialData || cvData.experience.length > 0) && (
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
                )}
                
                {/* Special heading for "Education" */}
                {(initialData || cvData.education.length > 0) && (
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
                )}
                
                {/* Special heading for "Skills" */}
                {(initialData || cvData.skills.length > 0) && (
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
                )}

                {/* Check if this is an imported/existing CV with data */}
                {(initialData || cvData.firstName || cvData.lastName || 
                 cvData.experience.length > 0 || cvData.education.length > 0 || 
                 cvData.skills.length > 0) && (
                  <>
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
                  </>
                )}
                
                {/* Render custom text elements */}
                {Object.entries(cvData.customTextElements || {}).map(([id, text]) => {
                  // Directly render custom text elements
                  const style = getStyleForElement(id);
                  
                  return (
                    <CanvaElement
                      key={id}
                      id={id}
                      style={style}
                      isSelected={selectedElement?.field === id}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectElement(id);
                        bringToFront(id);
                        if (e.detail === 2) {
                          e.preventDefault();
                          startEditing(id);
                          return false;
                        }
                      }}
                      onDragEnd={(id, x, y) => handleElementMove(id, x, y)}
                      onDuplicate={handleDuplicateElement}
                      onDelete={handleDeleteElement}
                      onCopy={handleCopyElement}
                      onPaste={handlePasteElement}
                    >
                      {currentlyEditing?.field === id ? (
                        <div className="absolute z-50">
                          <textarea
                            value={text}
                            onChange={(e) => handleCustomTextChange(id, e.target.value)}
                            onBlur={() => {
                              console.log(`Finished editing text for element ${id}, final value:`, text);
                              stopEditing();
                            }}
                            onKeyDown={handleFieldKeyDown}
                            className="border border-blue-400 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ minWidth: '200px', width: '100%' }}
                            autoFocus
                            rows={3}
                            placeholder="Enter text here..."
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          />
                        </div>
                      ) : (
                        <div 
                          className="p-1 cursor-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectElement(id);
                            bringToFront(id);
                            if (e.detail === 2) {
                              e.preventDefault();
                              startEditing(id);
                              return false;
                            }
                          }}
                        >
                          {text || 'Click to edit'}
                        </div>
                      )}
                    </CanvaElement>
                  );
                })}
                
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
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width</label>
                    <div className="flex items-center">
                      <div className="w-full">
                        <input
                          type="range"
                          min="100"
                          max="500"
                          step="10"
                          value={activeStyle.width || 200}
                          onChange={(e) => {
                            const newWidth = parseInt(e.target.value, 10);
                            if (!isNaN(newWidth) && newWidth >= 50) {
                              updateActiveElementStyle({ width: newWidth });
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="ml-2 w-16">
                        <input
                          type="number"
                          min="50"
                          max="800"
                          value={activeStyle.width || 200}
                          onChange={(e) => {
                            const newWidth = parseInt(e.target.value, 10);
                            if (!isNaN(newWidth) && newWidth >= 50) {
                              updateActiveElementStyle({ width: newWidth });
                            }
                          }}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={() => {
                          if (!activeStyle.width || activeStyle.width < 50) {
                            updateActiveElementStyle({ width: 200 });
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded ${activeStyle.width ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                      >
                        Fixed width
                      </button>
                      <button
                        onClick={() => {
                          if (activeStyle.width) {
                            const { width, ...styleWithoutWidth } = activeStyle;
                            updateActiveElementStyle(styleWithoutWidth as TextStyle);
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded ${!activeStyle.width ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                      >
                        Auto width
                      </button>
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
    </DndProvider>
  );
};

export default CanvaEditor; 