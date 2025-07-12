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
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types
interface CustomNodeData {
  label: string;
  isEditing?: boolean;
}

interface EdgeConfig {
  id: string;
  label: string;
  type: string;
}

interface MarkerConfig {
  id: string;
  label: string;
  markerEnd?: { type: string; color?: string };
  markerStart?: { type: string; color?: string };
}

// Custom Node Type
interface CustomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CustomNodeData;
  style?: any;
}

// Edge Type
interface CustomEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  style?: any;
  animated?: boolean;
  markerEnd?: any;
  markerStart?: any;
}

// Design System Colors
const COLORS: string[] = [
  '#4F46E5', '#10B981', '#FBBF24', '#EF4444', '#3B82F6', '#F59E0B'
];

const EDGE_TYPES: EdgeConfig[] = [
  { id: 'smoothstep', label: 'Curved', type: 'smoothstep' },
  { id: 'straight', label: 'Straight', type: 'straight' },
  { id: 'step', label: 'Step', type: 'step' },
];

const MARKER_TYPES: MarkerConfig[] = [
  { id: 'none', label: 'None' },
  { id: 'arrow', label: 'Arrow', markerEnd: { type: 'arrowclosed' } },
  { id: 'both', label: 'Both', markerEnd: { type: 'arrowclosed' }, markerStart: { type: 'arrowclosed' } },
];

// Custom Node Component with Design System
const CustomNodeComponent: React.FC<any> = ({ data, id, selected }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [label, setLabel] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((): void => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSubmit = useCallback((): void => {
    const newLabel: string = label.trim() || 'Untitled';
    setIsEditing(false);
    setLabel(newLabel);
    
    window.dispatchEvent(new CustomEvent('updateNode', {
      detail: { id, label: newLabel }
    }));
  }, [id, label]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLabel(data.label);
    }
  }, [data.label, handleSubmit]);

  const handleStyle = useMemo((): React.CSSProperties => ({
    background: '#333333',
    border: '1px solid #FFFFFF',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    opacity: 1,
    transition: 'all 0.2s ease',
    zIndex: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  }), [selected]);

  const nodeStyle = useMemo((): React.CSSProperties => ({
    position: 'relative' as const,
    padding: '16px',
    borderRadius: '8px',
    border: selected ? '2px solid #4F46E5' : '1px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#333333',
    fontSize: '16px',
    fontWeight: '400',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    lineHeight: '1.5',
    boxShadow: selected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
    cursor: isEditing ? 'text' : 'pointer',
    minWidth: '100px',
    maxWidth: '200px',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
  }), [selected, isEditing]);

  return (
    <div className="custom-node" onDoubleClick={handleDoubleClick} style={nodeStyle}>
      <Handle 
        type="source" 
        position={Position.Top} 
        style={handleStyle} 
        id="top"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Top} 
        style={handleStyle} 
        id="top"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        style={handleStyle} 
        id="right"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        style={handleStyle} 
        id="right"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={handleStyle} 
        id="bottom"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        style={handleStyle} 
        id="bottom"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      
      <Handle 
        type="source" 
        position={Position.Left} 
        style={handleStyle} 
        id="left"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        style={handleStyle} 
        id="left"
        isValidConnection={(connection: { source: any; target: any; }) => connection.source !== connection.target}
      />

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
            color: '#333333',
            fontSize: '16px',
            fontWeight: '400',
            fontFamily: 'inherit',
            outline: 'none',
            width: '100%',
            textAlign: 'center',
            minWidth: '80px',
          }}
          placeholder="Enter text"
        />
      ) : (
        <div style={{ wordBreak: 'break-word' }}>{label}</div>
      )}
    </div>
  );
};

// Main Component
const MindMapPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: '1',
      type: 'custom',
      position: { x: 250, y: 100 },
      data: { label: 'Central Idea' },
      style: { color: '#4F46E5', zIndex: 1000 },
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 250, y: 300 },
      data: { label: 'Supporting Concept' },
      style: { color: '#10B981', zIndex: 1000 },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState<number>(3);
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('smoothstep');
  const [selectedMarkerType, setSelectedMarkerType] = useState<string>('arrow');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(false);

  const nodeTypes = useMemo(() => ({ custom: CustomNodeComponent }), []);

  useEffect((): (() => void) => {
    const handleUpdateNode = (event: Event): void => {
      const customEvent = event as CustomEvent<{ id: string; label: string }>;
      const { id, label } = customEvent.detail;
      setNodes((nds: CustomNode[]) =>
        nds.map((node: CustomNode) =>
          node.id === id ? { ...node, data: { ...node.data, label } } : node
        )
      );
    };

    window.addEventListener('updateNode', handleUpdateNode);
    return (): void => window.removeEventListener('updateNode', handleUpdateNode);
  }, [setNodes]);

  const onConnect = useCallback((params: any): void => {
    if (!params.source || !params.target) return;
    if (params.source === params.target) return;

    const edgeType = EDGE_TYPES.find(et => et.id === selectedEdgeType);
    const markerType = MARKER_TYPES.find(mt => mt.id === selectedMarkerType);

    const newEdge: CustomEdge = {
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
      type: edgeType?.type || 'smoothstep',
      style: {
        stroke: '#555555',
        strokeWidth: 2,
      },
      animated: false,
      markerEnd: markerType?.markerEnd
        ? { type: markerType.markerEnd.type, color: '#555555' }
        : undefined,
      markerStart: markerType?.markerStart
        ? { type: markerType.markerStart.type, color: '#555555' }
        : undefined,
    };

    setEdges((eds: CustomEdge[]) => addEdge(newEdge, eds) as CustomEdge[]);
  }, [selectedEdgeType, selectedMarkerType, setEdges]);

  const addNode = useCallback((): void => {
    const color: string = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode: CustomNode = {
      id: nodeId.toString(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: `Note ${nodeId}` },
      style: { color, zIndex: 1000 },
    };
    setNodes((nds: CustomNode[]) => [...nds, newNode]);
    setNodeId((id: number) => id + 1);
  }, [nodeId, setNodes]);

  const deleteSelectedNodes = useCallback((): void => {
    if (selectedNodes.length === 0) return;
    
    setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => !selectedNodes.includes(n.id)));
    setEdges((eds: CustomEdge[]) =>
      eds.filter((e: CustomEdge) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target))
    );
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  const onSelectionChange = useCallback((params: any): void => {
    const nodeIds = params.nodes.map((node: any) => node.id);
    setSelectedNodes(nodeIds);
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any): void => {
    event.preventDefault();
    if (window.confirm(`Delete "${node.data.label || node.id}"?`)) {
      setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => n.id !== node.id));
      setEdges((eds: CustomEdge[]) =>
        eds.filter((e: CustomEdge) => e.source !== node.id && e.target !== node.id)
      );
    }
  }, [setNodes, setEdges]);

  const clearAll = useCallback((): void => {
    if (window.confirm('Clear all nodes and connections?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodes([]);
      setNodeId(1);
    }
  }, [setNodes, setEdges]);

  const autoLayout = useCallback((): void => {
    setNodes((nds: CustomNode[]) =>
      nds.map((node: CustomNode, index: number) => ({
        ...node,
        position: {
          x: (index % 4) * 250 + 100,
          y: Math.floor(index / 4) * 180 + 100,
        },
      }))
    );
  }, [setNodes]);

  const toggleSidebar = useCallback((): void => {
    setSidebarVisible((prev: boolean) => !prev);
  }, []);

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

  const isValidConnection = useCallback((connection: any): boolean => {
    if (connection.source === connection.target) return false;
    return true;
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#FDFDFD',
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        :root {
          --color-background: #FDFDFD;
          --color-surface: #FFFFFF;
          --color-border: #E5E7EB;
          --color-text-primary: #333333;
          --color-text-secondary: #555555;
          --color-placeholder: #9CA3AF;
          --color-primary: #4F46E5;
          --color-secondary: #10B981;
          --color-accent: #FBBF24;
          --color-error: #EF4444;
          --color-info: #3B82F6;
          --color-warning: #F59E0B;
          
          --spacing-xs: 4px;
          --spacing-sm: 8px;
          --spacing-md: 16px;
          --spacing-lg: 24px;
          --spacing-xl: 32px;
          
          --radius-sm: 4px;
          --radius-md: 8px;
          --radius-lg: 16px;
          
          --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
          --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
          
          --font-size-caption: 12px;
          --font-size-small: 14px;
          --font-size-body: 16px;
          --font-size-h3: 20px;
          --font-size-h2: 24px;
          --font-size-h1: 32px;
          
          --line-height-caption: 1.3;
          --line-height-small: 1.4;
          --line-height-body: 1.5;
          --line-height-h3: 1.4;
          --line-height-h2: 1.3;
          --line-height-h1: 1.25;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .sidebar {
          position: absolute;
          top: 0;
          left: 0;
          width: 320px;
          height: 100vh;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          box-shadow: var(--shadow-md);
          z-index: 1000;
          overflow-y: auto;
          padding: var(--spacing-lg);
          transform: translateX(${sidebarVisible ? '0' : '-100%'});
          transition: transform 0.3s ease;
        }
        
        .sidebar-header {
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--color-border);
        }
        
        .sidebar-title {
          font-size: var(--font-size-h3);
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-sm) 0;
          line-height: var(--line-height-h3);
        }
        
        .sidebar-subtitle {
          font-size: var(--font-size-small);
          color: var(--color-text-secondary);
          margin: 0;
          line-height: var(--line-height-small);
        }
        
        .sidebar-section {
          margin-bottom: var(--spacing-lg);
        }
        
        .sidebar-section-title {
          font-size: var(--font-size-small);
          font-weight: 500;
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-md) 0;
          line-height: var(--line-height-small);
        }
        
        .connection-info {
          padding: var(--spacing-md);
          background: #F8F9FA;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }
        
        .connection-list {
          list-style: none;
          padding: 0;
          margin: var(--spacing-sm) 0 0 0;
        }
        
        .connection-item {
          font-size: var(--font-size-caption);
          color: var(--color-text-secondary);
          margin: var(--spacing-xs) 0;
          line-height: var(--line-height-caption);
          padding-left: var(--spacing-md);
          position: relative;
        }
        
        .connection-item::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--color-secondary);
        }
        
        .topbar {
          position: absolute;
          top: 0;
          left: ${sidebarVisible ? '320px' : '0'};
          right: 0;
          height: 64px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          box-shadow: var(--shadow-sm);
          z-index: 999;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: 0 var(--spacing-lg);
          transition: left 0.3s ease;
        }
        
        .topbar-section {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .topbar-divider {
          width: 1px;
          height: 32px;
          background: var(--color-border);
          margin: 0 var(--spacing-sm);
        }
        
        .topbar-label {
          font-size: var(--font-size-small);
          color: var(--color-text-secondary);
          font-weight: 500;
          margin-right: var(--spacing-sm);
          line-height: var(--line-height-small);
        }
        
        .button {
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-small);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          padding: var(--spacing-sm) var(--spacing-md);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-family: inherit;
          line-height: var(--line-height-small);
        }
        
        .button-primary {
          background: var(--color-primary);
          color: white;
          border: 1px solid var(--color-primary);
        }
        
        .button-primary:hover {
          background: #3730A3;
          border-color: #3730A3;
        }
        
        .button-danger {
          background: var(--color-error);
          color: white;
          border: 1px solid var(--color-error);
        }
        
        .button-danger:hover:not(:disabled) {
          background: #DC2626;
          border-color: #DC2626;
        }
        
        .button-danger:disabled {
          background: var(--color-placeholder);
          border-color: var(--color-placeholder);
          cursor: not-allowed;
        }
        
        .button-secondary {
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }
        
        .button-secondary:hover {
          background: #F8F9FA;
          border-color: #D1D5DB;
        }
        
        .option-button {
          padding: var(--spacing-xs) var(--spacing-sm);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: var(--font-size-caption);
          font-weight: 500;
          white-space: nowrap;
          font-family: inherit;
          line-height: var(--line-height-caption);
        }
        
        .option-button:hover {
          background: #F8F9FA;
          border-color: var(--color-primary);
        }
        
        .option-button.selected {
          background: #EEF2FF;
          border-color: var(--color-primary);
          color: var(--color-primary);
        }
        
        .react-flow-wrapper {
          margin-left: ${sidebarVisible ? '320px' : '0'};
          width: calc(100vw - ${sidebarVisible ? '320px' : '0px'});
          height: 100vh;
          padding-top: 64px;
          transition: all 0.3s ease;
        }
        
        .sidebar-toggle-button {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-right: var(--spacing-md);
        }
        
        .sidebar-toggle-button:hover {
          background: #F8F9FA;
          border-color: #D1D5DB;
        }
        
        .connection-tracker {
          margin-left: auto;
          font-size: var(--font-size-small);
          color: var(--color-text-secondary);
          padding: var(--spacing-sm) var(--spacing-md);
          background: #F8F9FA;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          line-height: var(--line-height-small);
          font-weight: 500;
        }
        
        .custom-node {
          transition: all 0.2s ease;
        }
        
        .custom-node:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .react-flow__handle {
          opacity: 1;
          transition: all 0.2s ease;
        }
        
        .react-flow__handle:hover {
          transform: scale(1.2);
        }
        
        .react-flow__connection-line {
          stroke: var(--color-text-secondary);
          stroke-width: 2;
        }
        
        .react-flow__edge-path {
          stroke: var(--color-text-secondary);
          stroke-width: 2;
        }
        

        
        .react-flow__controls {
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border);
        }
        
        .react-flow__controls-button {
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        
        .react-flow__controls-button:hover {
          background: #F8F9FA;
        }
      `}</style>

      {/* Enhanced Topbar */}
      <div className="topbar">
        {/* Sidebar Toggle Button - now in topbar */}
        <button className="sidebar-toggle-button" onClick={toggleSidebar}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
            {sidebarVisible ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
        
        <div className="topbar-section">
          <button className="button button-primary" onClick={addNode}>
            ✨ Add Note
          </button>
          <button 
            className="button button-danger" 
            onClick={deleteSelectedNodes}
            disabled={selectedNodes.length === 0}
          >
            🗑 Delete ({selectedNodes.length})
          </button>
          <button className="button button-secondary" onClick={autoLayout}>
            📐 Layout
          </button>
          <button className="button button-secondary" onClick={clearAll}>
            🧹 Clear All
          </button>
        </div>
        
        <div className="topbar-divider" />
        
        <div className="topbar-section">
          <span className="topbar-label">Connection Style:</span>
          {renderOptionButtons(EDGE_TYPES, selectedEdgeType, setSelectedEdgeType)}
        </div>
        
        <div className="topbar-divider" />
        
        <div className="topbar-section">
          <span className="topbar-label">Arrows:</span>
          {renderOptionButtons(MARKER_TYPES, selectedMarkerType, setSelectedMarkerType)}
        </div>
        
        {/* Connection Tracker */}
        <div className="connection-tracker">
          {nodes.length} nodes • {edges.length} connections
        </div>
      </div>



      {/* Empty Sidebar */}
      <div className="sidebar">
        {/* Sidebar content removed - keeping it empty as requested */}
      </div>

      {/* React Flow */}
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
            stroke: '#555555', 
            strokeWidth: 2 
          }}
          defaultEdgeOptions={{
            type: selectedEdgeType,
            style: { 
              stroke: '#555555', 
              strokeWidth: 2,
            },
            animated: false,
            markerEnd: getCurrentMarker()?.markerEnd ? {
              type: getCurrentMarker()!.markerEnd!.type,
              color: '#555555'
            } : undefined,
            markerStart: getCurrentMarker()?.markerStart ? {
              type: getCurrentMarker()!.markerStart!.type,
              color: '#555555'
            } : undefined,
          }}
          fitView
          attributionPosition="bottom-right"
          multiSelectionKeyCode="Control"
          deleteKeyCode="Delete"
          selectNodesOnDrag={false}
          connectionMode="loose"
          snapToGrid={true}
          snapGrid={[16, 16]}
          minZoom={0.5}
          maxZoom={2}
          isValidConnection={isValidConnection}
        >
          <Controls />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1} 
            color="#E5E7EB"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMapPage;