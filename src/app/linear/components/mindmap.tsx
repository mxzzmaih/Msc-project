import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Handle,
  Position,
  ConnectionLineType,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

// My type definitions - spent a while getting these right to make the mindmap work smoothly
interface CustomNodeData {
  label: string;
  isEditing?: boolean; // Tracks if user is currently editing this node
  color?: string; // For color-coding different nodes
}

interface EdgeConfig {
  id: string;
  label: string;
  type: string; // Different line styles between nodes
}

interface MarkerConfig {
  id: string;
  label: string;
  markerEnd?: { type: string; color?: string }; // Arrow at end of connection
  markerStart?: { type: string; color?: string }; // Arrow at start of connection
}

interface CustomNode {
  id: string;
  type: string;
  position: { x: number; y: number }; // Where to render on the canvas
  data: CustomNodeData;
  style?: any; // For custom styling
}

interface CustomEdge {
  id: string;
  source: string; // ID of starting node
  target: string; // ID of ending node
  sourceHandle?: string; // Which handle on the source node
  targetHandle?: string; // Which handle on the target node
  type?: string; // Line style
  style?: any;
  animated?: boolean; // For fancy animated connections
  markerEnd?: any; // Arrow at end
  markerStart?: any; // Arrow at start
}

interface MindMapPageProps {
  onBack?: () => void; // For navigation back to main page
}

// I picked these colors carefully - they're vibrant but not too harsh on the eyes
const COLORS: string[] = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899'
];

// Different connection styles between nodes - the curved ones look nicest to me
const EDGE_TYPES: EdgeConfig[] = [
  { id: 'smoothstep', label: 'Curved', type: 'smoothstep' },
  { id: 'straight', label: 'Straight', type: 'straight' },
  { id: 'step', label: 'Step', type: 'step' },
];

// Arrow options for the connections - helps show relationships between ideas
const MARKER_TYPES: MarkerConfig[] = [
  { id: 'none', label: 'None' },
  { id: 'arrow', label: 'Arrow', markerEnd: { type: 'arrowclosed' } },
  { id: 'both', label: 'Both', markerEnd: { type: 'arrowclosed' }, markerStart: { type: 'arrowclosed' } },
];

// My custom node component - this is where most of the UI magic happens
interface NodeComponentProps {
  data: CustomNodeData;
  id: string;
  selected: boolean; // Needed to show different styling when selected
}

const CustomNodeComponent: React.FC<NodeComponentProps> = ({ data, id, selected }) => {
  // Track editing state and node text
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [label, setLabel] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null); // Need this to focus the input when editing starts

  // Double-click to edit - simple but effective UX
  const handleDoubleClick = useCallback((): void => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0); // Small delay ensures the input is ready to focus
  }, []);

  // Save changes when user is done editing
  const handleSubmit = useCallback((): void => {
    const newLabel: string = label.trim() || 'Untitled'; // Fallback to prevent empty nodes
    setIsEditing(false);
    setLabel(newLabel);
    
    // Let the parent component know about the change - custom events are so useful here!
    window.dispatchEvent(new CustomEvent('updateNode', {
      detail: { id, label: newLabel }
    }));
  }, [id, label]);

  // Handle keyboard shortcuts while editing
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit(); // Save on Enter
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label); // Revert changes on Escape - saved me from many accidental edits!
    }
  }, [data.label, handleSubmit]);

  // Style for the connection points - I keep them invisible until hover for a cleaner look
  const handleStyle = useMemo((): React.CSSProperties => ({
    background: '#FFFFFF',
    border: `2px solid ${data.color || '#6366F1'}`,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    opacity: 0, // Hidden by default - they appear on hover via CSS
    transition: 'all 0.2s ease',
    zIndex: 10,
  }), [data.color]);

  // Main node styling - spent hours tweaking these values to get the perfect look
  const nodeStyle = useMemo((): React.CSSProperties => ({
    position: 'relative' as const,
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    background: selected 
      ? `linear-gradient(135deg, ${data.color || '#6366F1'}15, ${data.color || '#6366F1'}08)` // Subtle gradient when selected
      : '#FFFFFF',
    color: '#1F2937',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', // My favorite font stack
    lineHeight: '1.4',
    boxShadow: selected 
      ? `0 4px 20px ${data.color || '#6366F1'}30, 0 0 0 1px ${data.color || '#6366F1'}40` // Deeper shadow when selected
      : '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)',
    cursor: isEditing ? 'text' : 'pointer',
    minWidth: '100px',
    maxWidth: '200px', // Prevents nodes from getting too wide
    textAlign: 'center' as const,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth animation for all changes
    transform: selected ? 'translateY(-1px)' : 'translateY(0)', // Subtle lift effect when selected
  }), [selected, isEditing, data.color]);

  return (
    <div className="custom-node" onDoubleClick={handleDoubleClick} style={nodeStyle}>
      <Handle 
        type="source" 
        position={Position.Top} 
        style={handleStyle} 
        id="top"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        style={handleStyle} 
        id="top"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        style={handleStyle} 
        id="right"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        style={handleStyle} 
        id="right"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={handleStyle} 
        id="bottom"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        style={handleStyle} 
        id="bottom"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Left} 
        style={handleStyle} 
        id="left"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        style={handleStyle} 
        id="left"
        isValidConnection={(connection: { source: string; target: string; }) => connection.source !== connection.target}
      />

      {/* Little color accent at the top - adds a nice touch of personality to each node */}
      <div style={{
        position: 'absolute',
        top: '-2px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '20px',
        height: '2px',
        borderRadius: '1px',
        background: data.color || '#6366F1',
      }} />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1F2937',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'inherit',
            outline: 'none',
            width: '100%',
            textAlign: 'center',
          }}
          placeholder="Enter text"
        />
      ) : (
        <div style={{ wordBreak: 'break-word' }}>{label}</div>
      )}
    </div>
  );
};

// The main mindmap component - this is where everything comes together
const MindMapPage: React.FC<MindMapPageProps> = ({ onBack }) => {
  // Set up initial nodes - I like having a starter template so users aren't facing a blank canvas
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'custom',
      position: { x: 400, y: 200 }, // Center position for the main idea
      data: { label: 'Central Idea', color: '#6366F1' },
      style: { zIndex: 1000 }, // Keep main idea on top
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 200, y: 350 }, // Left supporting idea
      data: { label: 'Supporting Concept', color: '#10B981' },
      style: { zIndex: 1000 },
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 600, y: 350 }, // Right supporting idea
      data: { label: 'Another Idea', color: '#F59E0B' },
      style: { zIndex: 1000 },
    },
  ]);
  // Initial connections between nodes - I match the edge colors to the target nodes for visual consistency
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'smoothstep', // Curved connections look more organic
      style: { stroke: '#10B981', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#10B981' }, // Arrow showing relationship direction
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      type: 'smoothstep',
      style: { stroke: '#F59E0B', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#F59E0B' },
    },
  ]);
  // Track various states for the mindmap functionality
  const [nodeId, setNodeId] = useState<number>(4); // Counter for generating unique IDs for new nodes
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('smoothstep'); // Default to curved connections
  const [selectedMarkerType, setSelectedMarkerType] = useState<string>('arrow'); // Default to arrows
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]); // Currently selected nodes
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false); // Toggle for settings panel
  const [showMiniMap, setShowMiniMap] = useState<boolean>(true); // I find the minimap super helpful for navigation
  const [searchTerm, setSearchTerm] = useState<string>(''); // For finding nodes by text
  const [undoStack, setUndoStack] = useState<any[]>([]); // For my undo/redo functionality
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false); // For responsive adjustments
  const [savedMindMaps, setSavedMindMaps] = useState<Array<{
    id: string;
    name: string;
    data: { nodes: CustomNode[]; edges: CustomEdge[] };
    timestamp: number;
  }>>([]); // Store saved mindmaps in localStorage
  const [currentMindMapName, setCurrentMindMapName] = useState<string>('Untitled Mind Map'); // Default name
  const fileInputRef = useRef<HTMLInputElement>(null); // For file import/export

  // Register my custom node component with ReactFlow
  const nodeTypes = useMemo(() => ({ custom: CustomNodeComponent }), []);

  // Load any previously saved mind maps from localStorage when the component mounts
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedMindMaps') || '[]');
      setSavedMindMaps(saved);
    } catch (error) {
      console.error('Error loading saved mind maps:', error); // This happened once when I had malformed JSON
      setSavedMindMaps([]); // Start fresh if there's an error
    }
  }, []);

  // Check if we're on mobile to adjust the UI accordingly
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // My breakpoint for mobile view
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile); // Cleanup to prevent memory leaks
  }, []);

  // Keyboard shortcuts - I'm a big fan of these for power users (and myself!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs - learned this the hard way!
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.ctrlKey || e.metaKey) { // Support both Windows/Linux and Mac
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo(); // Ctrl+Shift+Z for redo
            } else {
              e.preventDefault();
              undo(); // Ctrl+Z for undo
            }
            break;
          case 'a':
            e.preventDefault();
            selectAll(); // Ctrl+A to select all nodes
            break;
          case 'n':
            e.preventDefault();
            addNode(); // Ctrl+N to add a new node
            break;
          case 'f':
            e.preventDefault();
            document.getElementById('search-input')?.focus(); // Ctrl+F to search
            break;
          case 'd':
            e.preventDefault();
            duplicateSelected(); // Ctrl+D to duplicate - super useful for similar nodes
            break;
          case 's':
            e.preventDefault();
            saveMindMap(); // Ctrl+S to save - muscle memory from other apps
            break;
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.length > 0) {
          deleteSelectedNodes(); // Delete selected nodes with Delete/Backspace
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); // Clean up event listener
  }, [selectedNodes]);

  // Save the current state to the undo stack before making changes
  const saveState = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), { nodes, edges }]); // Limit to 20 undo steps to prevent memory issues
    setRedoStack([]); // Clear redo stack when a new action is performed
  }, [nodes, edges]);

  // Undo the last action - took me a while to get this right with the stacks
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1]; // Get the last saved state
      setRedoStack(prev => [...prev, { nodes, edges }]); // Save current state to redo stack
      setNodes(lastState.nodes); // Restore previous nodes
      setEdges(lastState.edges); // Restore previous edges
      setUndoStack(prev => prev.slice(0, -1)); // Remove the used state from undo stack
    }
  }, [undoStack, nodes, edges, setNodes, setEdges]);

  // Redo the last undone action
  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]; // Get the last redoable state
      setUndoStack(prev => [...prev, { nodes, edges }]); // Save current state to undo stack
      setNodes(nextState.nodes); // Apply the redo state
      setEdges(nextState.edges);
      setRedoStack(prev => prev.slice(0, -1)); // Remove the used state from redo stack
    }
  }, [redoStack, nodes, edges, setNodes, setEdges]);

  // Quick way to select all nodes at once - useful for mass operations
  const selectAll = useCallback(() => {
    setSelectedNodes(nodes.map((node: CustomNode) => node.id));
  }, [nodes]);

  // Duplicate selected nodes - one of my favorite features for quickly building out similar ideas
  const duplicateSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    saveState(); // Save current state for undo
    const selectedNodesData = nodes.filter((node: CustomNode) => selectedNodes.includes(node.id));
    const newNodes = selectedNodesData.map((node: CustomNode, index: number) => ({
      ...node,
      id: (nodeId + index).toString(), // Generate new unique IDs
      position: {
        x: node.position.x + 50, // Offset a bit so they don't stack exactly on top
        y: node.position.y + 50,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`, // Mark as copy to distinguish from original
      },
    }));
    
    setNodes((nds: CustomNode[]) => [...nds, ...newNodes]);
    setNodeId((prev: number) => prev + selectedNodesData.length); // Update counter for next new node
    setSelectedNodes(newNodes.map((node: CustomNode) => node.id)); // Select the new nodes
  }, [selectedNodes, nodes, nodeId, setNodes, saveState]);

  // Save/Load Functions - I added these so I wouldn't lose my work between sessions
  const saveMindMap = useCallback(() => {
    const name = prompt('Enter a name for this mind map:', currentMindMapName) || currentMindMapName;
    if (!name) return;
    
    const mindMapData = {
      id: Date.now().toString(), // Unique ID based on timestamp
      name,
      data: { nodes, edges },
      timestamp: Date.now() // For sorting by most recent
    };
    
    // Replace existing map with same name or add new one
    const updatedSaved = [...savedMindMaps.filter(m => m.name !== name), mindMapData];
    setSavedMindMaps(updatedSaved);
    setCurrentMindMapName(name);
    
    try {
      localStorage.setItem('savedMindMaps', JSON.stringify(updatedSaved)); // Store in browser storage
      alert(`Mind map "${name}" saved successfully!`); // Simple feedback is better than none
    } catch (error) {
      alert('Error saving mind map. Please try again.'); // Probably hit storage limits
    }
  }, [nodes, edges, currentMindMapName, savedMindMaps]);

  // Load a previously saved mind map - with confirmation to prevent accidental data loss
  const loadMindMap = useCallback((mindMapData: { nodes: CustomNode[]; edges: CustomEdge[]; name?: string }) => {
    if (window.confirm('Loading a new mind map will replace the current one. Continue?')) {
      saveState(); // Save current state for undo
      setNodes(mindMapData.nodes || []);
      setEdges(mindMapData.edges || []);
      setCurrentMindMapName(mindMapData.name || 'Loaded Mind Map');
      setSelectedNodes([]); // Clear selection
      
      // Update nodeId to avoid conflicts when adding new nodes
      // Took me a while to figure out this bug - new nodes were overwriting existing ones!
      const maxId = Math.max(0, ...(mindMapData.nodes || []).map((n: CustomNode) => parseInt(n.id) || 0));
      setNodeId(maxId + 1);
    }
  }, [setNodes, setEdges, saveState]);

  // Delete a saved mind map - with confirmation to prevent accidents
  const deleteSavedMindMap = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this mind map?')) {
      const updatedSaved = savedMindMaps.filter(m => m.id !== id);
      setSavedMindMaps(updatedSaved);
      try {
        localStorage.setItem('savedMindMaps', JSON.stringify(updatedSaved));
      } catch (error) {
        alert('Error deleting mind map.'); // Shouldn't happen but just in case
      }
    }
  }, [savedMindMaps]);

  // Start fresh with a new mind map - I use this when starting a completely new project
  const createNewMindMap = useCallback(() => {
    if (nodes.length > 0 && window.confirm('Creating a new mind map will clear the current one. Continue?')) {
      saveState(); // Save current state for undo
      setNodes([]);
      setEdges([]);
      setCurrentMindMapName('New Mind Map');
      setSelectedNodes([]);
      setNodeId(1); // Reset node counter
    } else if (nodes.length === 0) {
      // If already empty, just update the name
      setCurrentMindMapName('New Mind Map');
    }
  }, [nodes.length, setNodes, setEdges, saveState]);

  const exportAsPNG = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 800;
    canvas.height = 600;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text content
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(currentMindMapName, 40, 50);
    
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`${nodes.length} nodes, ${edges.length} connections`, 40, 80);
    ctx.fillText('Export Date: ' + new Date().toLocaleDateString(), 40, 110);
    
    // Draw simple representation of nodes
    nodes.forEach((node: { data: { color: string; label: string; }; }, index: number) => {
      const x = 100 + (index % 5) * 120;
      const y = 150 + Math.floor(index / 5) * 80;
      
      // Draw node
      ctx.fillStyle = node.data.color || '#6366F1';
      ctx.fillRect(x, y, 100, 40);
      
      // Draw label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      const text = node.data.label.length > 12 ? node.data.label.substring(0, 12) + '...' : node.data.label;
      ctx.fillText(text, x + 5, y + 25);
    });
    
    // Create download
    const link = document.createElement('a');
    link.download = `${currentMindMapName.replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [currentMindMapName, nodes, edges.length]);

  const exportAsJSON = useCallback(() => {
    const mindMapData = {
      name: currentMindMapName,
      nodes,
      edges,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(mindMapData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentMindMapName.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [currentMindMapName, nodes, edges]);

  const importFromFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the data structure
        if (data.nodes && Array.isArray(data.nodes)) {
          loadMindMap(data);
        } else {
          alert('Invalid mind map file format. Please select a valid JSON file.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid mind map file.');
      }
    };
    reader.readAsText(file);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [loadMindMap]);

  const centerView = useCallback(() => {
    if (nodes.length === 0) return;
    
    const centerX = nodes.reduce((sum: number, node: CustomNode) => sum + node.position.x, 0) / nodes.length;
    const centerY = nodes.reduce((sum: number, node: CustomNode) => sum + node.position.y, 0) / nodes.length;
    
    // Trigger fit view programmatically
    window.dispatchEvent(new CustomEvent('centerView', { detail: { x: centerX, y: centerY } }));
  }, [nodes]);

  useEffect((): (() => void) => {
    const handleUpdateNode = (event: Event): void => {
      const customEvent = event as CustomEvent<{ id: string; label: string }>;
      const { id, label } = customEvent.detail;
      saveState();
      setNodes((nds: CustomNode[]) =>
        nds.map((node: CustomNode) =>
          node.id === id ? { ...node, data: { ...node.data, label } } : node
        )
      );
    };

    window.addEventListener('updateNode', handleUpdateNode);
    return (): void => window.removeEventListener('updateNode', handleUpdateNode);
  }, [setNodes, saveState]);

  const onConnect = useCallback((params: { source: string; target: string; sourceHandle?: string; targetHandle?: string }): void => {
    if (!params.source || !params.target) return;
    if (params.source === params.target) return;

    saveState();
    const edgeType = EDGE_TYPES.find((et: EdgeConfig) => et.id === selectedEdgeType);
    const markerType = MARKER_TYPES.find((mt: MarkerConfig) => mt.id === selectedMarkerType);
    
    const sourceNode = nodes.find((n: CustomNode) => n.id === params.source);
    const edgeColor = sourceNode?.data.color || '#6B7280';

    const newEdge: CustomEdge = {
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: edgeType?.type || 'smoothstep',
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
      },
      animated: false,
      markerEnd: markerType?.markerEnd
        ? { type: markerType.markerEnd.type, color: edgeColor }
        : undefined,
      markerStart: markerType?.markerStart
        ? { type: markerType.markerStart.type, color: edgeColor }
        : undefined,
    };

    setEdges((eds: CustomEdge[]) => addEdge(newEdge, eds) as CustomEdge[]);
  }, [selectedEdgeType, selectedMarkerType, setEdges, nodes, saveState]);

  const addNode = useCallback((): void => {
    saveState();
    const color: string = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode: CustomNode = {
      id: nodeId.toString(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: `Note ${nodeId}`, color },
      style: { zIndex: 1000 },
    };
    setNodes((nds: CustomNode[]) => [...nds, newNode]);
    setNodeId((id: number) => id + 1);
  }, [nodeId, setNodes, saveState]);

  const deleteSelectedNodes = useCallback((): void => {
    if (selectedNodes.length === 0) return;
    
    saveState();
    setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => !selectedNodes.includes(n.id)));
    setEdges((eds: CustomEdge[]) =>
      eds.filter((e: CustomEdge) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target))
    );
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges, saveState]);

  const onSelectionChange = useCallback((params: { nodes: Array<{ id: string }> }): void => {
    const nodeIds = params.nodes.map((node: { id: string }) => node.id);
    setSelectedNodes(nodeIds);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: CustomNode): void => {
    event.preventDefault();
    if (window.confirm(`Delete "${node.data.label || node.id}"?`)) {
      saveState();
      setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => n.id !== node.id));
      setEdges((eds: CustomEdge[]) =>
        eds.filter((e: CustomEdge) => e.source !== node.id && e.target !== node.id)
      );
    }
  }, [setNodes, setEdges, saveState]);

  const clearAll = useCallback((): void => {
    if (window.confirm('Clear all nodes and connections?')) {
      saveState();
      setNodes([]);
      setEdges([]);
      setSelectedNodes([]);
      setNodeId(1);
    }
  }, [setNodes, setEdges, saveState]);

  const autoLayout = useCallback((): void => {
    saveState();
    setNodes((nds: CustomNode[]) =>
      nds.map((node: CustomNode, index: number) => ({
        ...node,
        position: {
          x: (index % 4) * 280 + 150,
          y: Math.floor(index / 4) * 200 + 100,
        },
      }))
    );
  }, [setNodes, saveState]);

  const toggleSidebar = useCallback((): void => {
    setSidebarVisible((prev: boolean) => !prev);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    return nodes.filter((node: CustomNode) => 
      node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodes, searchTerm]);

  const focusOnNode = useCallback((nodeId: string) => {
    const node = nodes.find((n: CustomNode) => n.id === nodeId);
    if (node) {
      setSelectedNodes([nodeId]);
      window.dispatchEvent(new CustomEvent('centerView', { 
        detail: { x: node.position.x, y: node.position.y } 
      }));
    }
  }, [nodes]);

  const renderOptionButtons = (
    options: EdgeConfig[] | MarkerConfig[], 
    selectedValue: string, 
    onSelect: (value: string) => void
  ): React.ReactElement => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map((option: EdgeConfig | MarkerConfig) => (
        <button
          key={option.id}
          className={`option-button ${selectedValue === option.id ? 'selected' : ''}`}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const getCurrentMarker = (): MarkerConfig | undefined => {
    return MARKER_TYPES.find(mt => mt.id === selectedMarkerType);
  };

  const isValidConnection = useCallback((connection: { source: string; target: string }): boolean => {
    if (connection.source === connection.target) return false;
    return true;
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        :root {
          --color-background: #F8FAFC;
          --color-surface: #FFFFFF;
          --color-surface-secondary: #F8FAFC;
          --color-border: #E2E8F0;
          --color-border-light: #F1F5F9;
          --color-text-primary: #1E293B;
          --color-text-secondary: #64748B;
          --color-text-muted: #94A3B8;
          --color-primary: #6366F1;
          --color-success: #10B981;
          --color-warning: #F59E0B;
          --color-error: #EF4444;
          
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          
          --radius-sm: 6px;
          --radius-md: 8px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          
          --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
          --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
          --shadow-lg: 0 8px 20px rgba(0,0,0,0.12);
        }
        
        * {
          box-sizing: border-box;
        }
        
        .sidebar {
          position: absolute;
          top: 0;
          left: 0;
          width: ${isMobile ? '100vw' : '300px'};
          height: 100vh;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          overflow-y: auto;
          padding: var(--spacing-lg);
          transform: translateX(${sidebarVisible ? '0' : '-100%'});
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-header {
          margin-bottom: var(--spacing-xl);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border-light);
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .sidebar-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-xs) 0;
          line-height: 1.3;
        }
        
        .sidebar-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.4;
        }
        
        .back-button {
          background: var(--color-surface-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          color: var(--color-text-secondary);
        }
        
        .back-button:hover {
          background: var(--color-surface);
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateX(-2px);
        }
        
        .sidebar-section {
          margin-bottom: var(--spacing-xl);
        }
        
        .sidebar-section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-md) 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .search-container {
          position: relative;
          margin-bottom: var(--spacing-md);
        }
        
        .search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          background: var(--color-surface);
          color: var(--color-text-primary);
          outline: none;
          transition: all 0.2s ease;
        }
        
        .search-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }
        
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          width: 16px;
          height: 16px;
        }
        
        .node-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 280px;
          overflow-y: auto;
        }
        
        .node-item {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          margin-bottom: 2px;
          font-size: 13px;
          color: var(--color-text-primary);
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .node-item:hover {
          background: var(--color-surface-secondary);
        }
        
        .node-color {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .topbar {
          position: absolute;
          top: 0;
          left: ${sidebarVisible && !isMobile ? '300px' : '0'};
          right: 0;
          height: 60px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border-light);
          z-index: 999;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 0 var(--spacing-lg);
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: auto;
        }
        
        .topbar-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex-shrink: 0;
        }
        
        .topbar-divider {
          width: 1px;
          height: 24px;
          background: var(--color-border-light);
          margin: 0 var(--spacing-sm);
          flex-shrink: 0;
        }
        
        .topbar-label {
          font-size: 12px;
          color: var(--color-text-muted);
          font-weight: 500;
          margin-right: var(--spacing-sm);
          white-space: nowrap;
          display: ${isMobile ? 'none' : 'block'};
        }
        
        .button {
          border: none;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
          padding: 8px 12px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          line-height: 1.3;
          min-height: 32px;
        }
        
        .button-icon-only {
          padding: 8px;
          width: 32px;
          height: 32px;
          justify-content: center;
        }
        
        .button-primary {
          background: var(--color-primary);
          color: white;
          border: 1px solid var(--color-primary);
          box-shadow: var(--shadow-xs);
        }
        
        .button-primary:hover {
          background: #5855EB;
          border-color: #5855EB;
          box-shadow: var(--shadow-sm);
        }
        
        .button-danger {
          background: var(--color-error);
          color: white;
          border: 1px solid var(--color-error);
          box-shadow: var(--shadow-xs);
        }
        
        .button-danger:hover:not(:disabled) {
          background: #DC2626;
          border-color: #DC2626;
          box-shadow: var(--shadow-sm);
        }
        
        .button-danger:disabled {
          background: var(--color-text-muted);
          border-color: var(--color-text-muted);
          cursor: not-allowed;
          opacity: 0.5;
        }
        
        .button-secondary {
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
        }
        
        .button-secondary:hover:not(:disabled) {
          background: var(--color-surface-secondary);
          border-color: var(--color-border);
          box-shadow: var(--shadow-sm);
        }
        
        .button-secondary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .option-button {
          padding: 6px 10px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          font-family: inherit;
        }
        
        .option-button:hover {
          background: var(--color-surface-secondary);
          border-color: var(--color-primary);
          color: var(--color-text-primary);
        }
        
        .option-button.selected {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        .react-flow-wrapper {
          margin-left: ${sidebarVisible && !isMobile ? '300px' : '0'};
          width: calc(100vw - ${sidebarVisible && !isMobile ? '300px' : '0px'});
          height: 100vh;
          padding-top: 60px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-toggle-button {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-right: var(--spacing-md);
          flex-shrink: 0;
          box-shadow: var(--shadow-xs);
        }
        
        .sidebar-toggle-button:hover {
          background: var(--color-surface-secondary);
          border-color: var(--color-border);
          box-shadow: var(--shadow-sm);
        }
        
        .connection-tracker {
          margin-left: auto;
          font-size: 12px;
          color: var(--color-text-muted);
          padding: 6px 10px;
          background: var(--color-surface-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-light);
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .mobile-menu {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: ${isMobile ? 'flex' : 'none'};
          flex-direction: column;
          gap: 12px;
          z-index: 1001;
        }
        
        .fab-button {
          width: 52px;
          height: 52px;
          border-radius: 26px;
          background: var(--color-primary);
          color: white;
          border: none;
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 18px;
        }
        
        .fab-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .fab-button.secondary {
          background: var(--color-surface);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          width: 44px;
          height: 44px;
          font-size: 16px;
          box-shadow: var(--shadow-md);
        }
        
        .custom-node {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-node:hover .react-flow__handle {
          opacity: 1 !important;
          transform: scale(1.1);
        }
        
        .react-flow__handle {
          transition: all 0.2s ease;
        }
        
        .react-flow__connection-line {
          stroke: var(--color-text-muted);
          stroke-width: 2;
          stroke-dasharray: 4, 4;
        }
        
        .react-flow__edge-path {
          stroke-width: 2;
        }
        
        .react-flow__controls {
          box-shadow: var(--shadow-md);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        
        .react-flow__controls-button {
          background: transparent;
          border-bottom: 1px solid var(--color-border-light);
          color: var(--color-text-secondary);
          width: 36px;
          height: 36px;
          transition: all 0.15s ease;
        }
        
        .react-flow__controls-button:hover {
          background: var(--color-surface-secondary);
          color: var(--color-text-primary);
        }
        
        .react-flow__controls-button:last-child {
          border-bottom: none;
        }
        
        .react-flow__minimap {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(10px);
        }
        
        @media (max-width: 768px) {
          .topbar-section {
            gap: 6px;
          }
          
          .topbar-divider {
            display: none;
          }
          
          .option-button {
            font-size: 11px;
            padding: 4px 8px;
          }
          
          .button {
            font-size: 12px;
            padding: 6px 10px;
            min-height: 28px;
          }
        }
        
        @media (max-width: 480px) {
          .connection-tracker {
            display: none;
          }
          
          .topbar {
            padding: 0 12px;
          }
        }
      `}</style>

      {/* Clean Topbar */}
      <div className="topbar">
        <button className="sidebar-toggle-button" onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
            {sidebarVisible ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
        
        <div className="topbar-section">
          <button className="button button-primary" onClick={addNode}>
            <span>+</span>
            {!isMobile && 'Add Note'}
          </button>
          <button 
            className="button button-danger" 
            onClick={deleteSelectedNodes}
            disabled={selectedNodes.length === 0}
          >
            <span>×</span>
            {!isMobile && `Delete ${selectedNodes.length > 0 ? `(${selectedNodes.length})` : ''}`}
          </button>
          {!isMobile && (
            <>
              <button 
                className="button button-secondary" 
                onClick={duplicateSelected}
                disabled={selectedNodes.length === 0}
              >
                <span>⧉</span>
                Duplicate
              </button>
            </>
          )}
        </div>
        
        {!isMobile && (
          <>
            <div className="topbar-divider" />
            
            <div className="topbar-section">
              <span className="topbar-label">Style</span>
              {renderOptionButtons(EDGE_TYPES, selectedEdgeType, setSelectedEdgeType)}
            </div>
            
            <div className="topbar-divider" />
            
            <div className="topbar-section">
              <span className="topbar-label">Arrows</span>
              {renderOptionButtons(MARKER_TYPES, selectedMarkerType, setSelectedMarkerType)}
            </div>
            
            <div className="topbar-divider" />
            
            <div className="topbar-section">
              <button 
                className="button button-secondary" 
                onClick={undo}
                disabled={undoStack.length === 0}
              >
                <span>↶</span>
                Undo
              </button>
              <button 
                className="button button-secondary" 
                onClick={redo}
                disabled={redoStack.length === 0}
              >
                <span>↷</span>
                Redo
              </button>
            </div>
          </>
        )}
        
        <div className="connection-tracker">
          {nodes.length} nodes • {edges.length} connections
        </div>
      </div>

      {/* Modern Sidebar with Back Button */}
      <div className="sidebar">
        <div className="sidebar-header">
          {onBack && (
            <button className="back-button" onClick={onBack} title="Back to Notes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <div>
            <h2 className="sidebar-title">Mind Map Studio</h2>
            <p className="sidebar-subtitle">Create, save, and manage your ideas</p>
          </div>
        </div>

        {/* Current Mind Map */}
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Current Map</h3>
          <div style={{ 
            background: 'var(--color-surface-secondary)', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--color-text-primary)',
              marginBottom: '4px'
            }}>
              {currentMindMapName}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--color-text-muted)'
            }}>
              {nodes.length} nodes • {edges.length} connections
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <button className="button button-secondary" onClick={createNewMindMap} style={{ justifyContent: 'flex-start' }}>
              <span>📄</span>
              New Mind Map
            </button>
            <button className="button button-secondary" onClick={saveMindMap} style={{ justifyContent: 'flex-start' }}>
              <span>💾</span>
              Save Mind Map
            </button>
            <button className="button button-secondary" onClick={importFromFile} style={{ justifyContent: 'flex-start' }}>
              <span>📁</span>
              Import from File
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Export</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <button className="button button-secondary" onClick={exportAsJSON} style={{ justifyContent: 'flex-start' }}>
              <span>📋</span>
              Export as JSON
            </button>
            <button className="button button-secondary" onClick={exportAsPNG} style={{ justifyContent: 'flex-start' }}>
              <span>🖼️</span>
              Export as PNG
            </button>
          </div>
        </div>

        {/* Saved Mind Maps */}
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Saved Mind Maps</h3>
          {savedMindMaps.length === 0 ? (
            <div style={{ 
              padding: 'var(--spacing-lg)', 
              textAlign: 'center', 
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              fontStyle: 'italic'
            }}>
              No saved mind maps yet
            </div>
          ) : (
            <div style={{ 
              maxHeight: '240px', 
              overflowY: 'auto',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)'
            }}>
              {savedMindMaps.map((mindMap) => (
                <div 
                  key={mindMap.id} 
                  style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-sm)'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: 'var(--color-text-primary)',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {mindMap.name}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-text-muted)',
                        marginBottom: '4px'
                      }}>
                        {new Date(mindMap.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-text-muted)'
                      }}>
                        {mindMap.data?.nodes?.length || 0} nodes
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '4px',
                      flexShrink: 0
                    }}>
                      <button
                        onClick={() => loadMindMap(mindMap.data)}
                        style={{
                          background: 'var(--color-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteSavedMindMap(mindMap.id)}
                        style={{
                          background: 'var(--color-error)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Nodes */}
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Find Nodes</h3>
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              id="search-input"
              type="text"
              placeholder="Search nodes..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <ul className="node-list">
              {filteredNodes.map((node: CustomNode) => (
                <li 
                  key={node.id} 
                  className="node-item"
                  onClick={() => focusOnNode(node.id)}
                >
                  <div 
                    className="node-color" 
                    style={{ backgroundColor: node.data.color || '#6366F1' }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {node.data.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="mobile-menu">
        <button 
          className="fab-button secondary" 
          onClick={duplicateSelected}
          disabled={selectedNodes.length === 0}
          title="Duplicate Selected"
        >
          ⧉
        </button>
        <button className="fab-button" onClick={addNode} title="Add Node">
          +
        </button>
      </div>

      {/* Clean React Flow */}
      <div className="react-flow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionChange={onSelectionChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ 
            stroke: '#94A3B8', 
            strokeWidth: 2,
            strokeDasharray: '4,4'
          }}
          defaultEdgeOptions={{
            type: selectedEdgeType,
            style: { 
              stroke: '#6B7280', 
              strokeWidth: 2,
            },
            animated: false,
            markerEnd: getCurrentMarker()?.markerEnd ? {
              type: getCurrentMarker()!.markerEnd!.type,
              color: '#6B7280'
            } : undefined,
            markerStart: getCurrentMarker()?.markerStart ? {
              type: getCurrentMarker()!.markerStart!.type,
              color: '#6B7280'
            } : undefined,
          }}
          fitView
          attributionPosition="bottom-right"
          multiSelectionKeyCode="Control"
          deleteKeyCode="Delete"
          selectNodesOnDrag={false}
          connectionMode="loose"
          snapToGrid={true}
          snapGrid={[20, 20]}
          minZoom={0.2}
          maxZoom={4}
          isValidConnection={isValidConnection}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Controls 
            position="bottom-left"
            showZoom={true}
            showFitView={true}
            showInteractive={true}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#E2E8F0"
          />
          {showMiniMap && (
            <MiniMap 
              position="bottom-right"
              nodeColor={(node: any) => node.data?.color || '#6366F1'}
              maskColor="rgba(248, 250, 252, 0.8)"
              style={{
                width: isMobile ? 120 : 180,
                height: isMobile ? 80 : 120,
              }}
            />
          )}
        </ReactFlow>
      </div>
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileImport}
      />
    </div>
  );
};

export default MindMapPage;