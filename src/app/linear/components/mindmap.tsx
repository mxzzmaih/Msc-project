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

// Simplified Constants
const COLORS: string[] = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
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

// Simplified Custom Node Component with Bidirectional Handles
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
    
    // Dispatch custom event for node update
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

  // Enhanced handle style - always visible, slightly larger for better UX
  const handleStyle = useMemo((): React.CSSProperties => ({
    background: selected ? '#3B82F6' : '#10B981',
    border: '2px solid #fff',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    opacity: 1,
    transition: 'all 0.2s ease',
    zIndex: 10,
  }), [selected]);

  // Simplified node style
  const nodeStyle = useMemo((): React.CSSProperties => ({
    position: 'relative' as const,
    padding: '12px 16px',
    borderRadius: '8px',
    border: selected ? '2px solid #3B82F6' : '1px solid #CBD5E1',
    background: '#FFFFFF',
    color: '#1F2937',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: selected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
    cursor: isEditing ? 'text' : 'pointer',
    minWidth: '80px',
    maxWidth: '200px',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
  }), [selected, isEditing]);

  return (
    <div className="custom-node" onDoubleClick={handleDoubleClick} style={nodeStyle}>
      {/* Bidirectional Handles - Each handle can be both source and target */}
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
            color: '#1F2937',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'inherit',
            outline: 'none',
            width: '100%',
            textAlign: 'center',
            minWidth: '60px',
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
      data: { label: 'Node 1' },
      style: { color: '#3B82F6', zIndex: 1000 },
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 250, y: 300 },
      data: { label: 'Node 2' },
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

  // Handle node updates
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

  // Enhanced connection handler - allows any handle to connect to any other handle
  const onConnect = useCallback((params: any): void => {
    console.log('Connection params:', params);
    
    if (!params.source || !params.target) {
      console.log('Missing source or target');
      return;
    }

    // Prevent self-connections
    if (params.source === params.target) {
      console.log('Cannot connect node to itself');
      return;
    }

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
        stroke: '#64748B',
        strokeWidth: 2,
      },
      animated: false,
      markerEnd: markerType?.markerEnd
        ? { type: markerType.markerEnd.type, color: '#64748B' }
        : undefined,
      markerStart: markerType?.markerStart
        ? { type: markerType.markerStart.type, color: '#64748B' }
        : undefined,
    };

    console.log('Creating edge:', newEdge);
    setEdges((eds: CustomEdge[]) => addEdge(newEdge, eds) as CustomEdge[]);
  }, [selectedEdgeType, selectedMarkerType, setEdges]);

  // Add node
  const addNode = useCallback((): void => {
    const color: string = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newNode: CustomNode = {
      id: nodeId.toString(),
      type: 'custom',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: `Node ${nodeId}` },
      style: { color, zIndex: 1000 },
    };
    setNodes((nds: CustomNode[]) => [...nds, newNode]);
    setNodeId((id: number) => id + 1);
  }, [nodeId, setNodes]);

  // Delete selected nodes
  const deleteSelectedNodes = useCallback((): void => {
    if (selectedNodes.length === 0) return;
    
    setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => !selectedNodes.includes(n.id)));
    setEdges((eds: CustomEdge[]) =>
      eds.filter((e: CustomEdge) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target))
    );
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  // Selection change handler
  const onSelectionChange = useCallback((params: any): void => {
    const nodeIds = params.nodes.map((node: any) => node.id);
    setSelectedNodes(nodeIds);
  }, []);

  // Context menu handler
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: any): void => {
    event.preventDefault();
    if (window.confirm(`Delete node "${node.data.label || node.id}"?`)) {
      setNodes((nds: CustomNode[]) => nds.filter((n: CustomNode) => n.id !== node.id));
      setEdges((eds: CustomEdge[]) =>
        eds.filter((e: CustomEdge) => e.source !== node.id && e.target !== node.id)
      );
    }
  }, [setNodes, setEdges]);

  // Utility functions
  const clearAll = useCallback((): void => {
    if (window.confirm('Are you sure you want to clear all nodes and connections?')) {
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
          x: (index % 4) * 200 + 100,
          y: Math.floor(index / 4) * 150 + 100,
        },
      }))
    );
  }, [setNodes]);

  const toggleSidebar = useCallback((): void => {
    setSidebarVisible((prev: boolean) => !prev);
  }, []);

  // Simplified option buttons
  const renderOptionButtons = (
    options: EdgeConfig[] | MarkerConfig[], 
    selectedValue: string, 
    onSelect: (value: string) => void
  ): React.ReactElement => (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
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

  // Get current marker
  const getCurrentMarker = (): MarkerConfig | undefined => {
    return MARKER_TYPES.find(mt => mt.id === selectedMarkerType);
  };

  // Enhanced connection validation - allows any handle to connect to any other handle
  const isValidConnection = useCallback((connection: any): boolean => {
    console.log('Validating connection:', connection);
    
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }
    
    // Allow all other connections - any handle can connect to any other handle
    return true;
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#F8FAFC',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        .sidebar {
          position: absolute;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: #FFFFFF;
          border-right: 1px solid #E2E8F0;
          box-shadow: 2px 0 4px rgba(0,0,0,0.05);
          z-index: 1000;
          overflow-y: auto;
          padding: 24px;
          transform: translateX(${sidebarVisible ? '0' : '-100%'});
          transition: transform 0.3s ease;
        }
        
        .topbar {
          position: absolute;
          top: 0;
          left: ${sidebarVisible ? '280px' : '0'};
          right: 0;
          height: 56px;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          z-index: 999;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          transition: left 0.3s ease;
        }
        
        .topbar-section {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .topbar-divider {
          width: 1px;
          height: 24px;
          background: #E2E8F0;
          margin: 0 8px;
        }
        
        .topbar-label {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
          margin-right: 4px;
        }
        
        .button {
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          padding: 6px 12px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .button-primary {
          background: #3B82F6;
          color: white;
          border: 1px solid #3B82F6;
        }
        
        .button-primary:hover {
          background: #2563EB;
        }
        
        .button-danger {
          background: #EF4444;
          color: white;
          border: 1px solid #EF4444;
        }
        
        .button-danger:hover:not(:disabled) {
          background: #DC2626;
        }
        
        .button-danger:disabled {
          background: #94A3B8;
          cursor: not-allowed;
        }
        
        .button-secondary {
          background: #F8FAFC;
          color: #475569;
          border: 1px solid #E2E8F0;
        }
        
        .button-secondary:hover {
          background: #F1F5F9;
          border-color: #CBD5E1;
        }
        
        .option-button {
          padding: 4px 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 11px;
          white-space: nowrap;
        }
        
        .option-button:hover {
          background: #F8FAFC;
          border-color: #3B82F6;
        }
        
        .option-button.selected {
          background: #EFF6FF;
          border-color: #3B82F6;
          color: #3B82F6;
        }
        
        .react-flow-wrapper {
          margin-left: ${sidebarVisible ? '280px' : '0'};
          width: calc(100vw - ${sidebarVisible ? '280px' : '0px'});
          height: 100vh;
          padding-top: 56px;
          transition: all 0.3s ease;
        }
        
        .sidebar-toggle {
          position: absolute;
          top: 8px;
          left: ${sidebarVisible ? '292px' : '8px'};
          width: 40px;
          height: 40px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          z-index: 1001;
        }
        
        .sidebar-toggle:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        
        .custom-node {
          transition: all 0.2s ease;
        }
        
        .custom-node:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .react-flow__handle {
          opacity: 1;
          transition: all 0.2s ease;
        }
        
        .react-flow__handle:hover {
          transform: scale(1.3);
          opacity: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .react-flow__connection-line {
          stroke: #64748B;
          stroke-width: 2;
        }
        
        .react-flow__edge-path {
          stroke: #64748B;
          stroke-width: 2;
        }
        
        .stats {
          margin-left: auto;
          font-size: 12px;
          color: #64748B;
          padding: 6px 10px;
          background: #F8FAFC;
          border-radius: 4px;
          border: 1px solid #E2E8F0;
        }
        
        .flexibility-indicator {
          background: #10B981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 8px;
        }
      `}</style>

      {/* Enhanced Topbar with Flexibility Indicator */}
      <div className="topbar">
        <div className="topbar-section">
          <button className="button button-primary" onClick={addNode}>
            + Add Node
          </button>
          <button 
            className="button button-danger" 
            onClick={deleteSelectedNodes}
            disabled={selectedNodes.length === 0}
          >
            Delete ({selectedNodes.length})
          </button>
          <button className="button button-secondary" onClick={autoLayout}>
            Auto Layout
          </button>
          <button className="button button-secondary" onClick={clearAll}>
            Clear All
          </button>
        </div>
        
        <div className="topbar-divider" />
        
        <div className="topbar-section">
          <span className="topbar-label">Line:</span>
          {renderOptionButtons(EDGE_TYPES, selectedEdgeType, setSelectedEdgeType)}
        </div>
        
        <div className="topbar-divider" />
        
        <div className="topbar-section">
          <span className="topbar-label">Arrows:</span>
          {renderOptionButtons(MARKER_TYPES, selectedMarkerType, setSelectedMarkerType)}
        </div>
        
        <div className="flexibility-indicator">
          ✨ Flexible Connections
        </div>
        
        <div className="stats">
          {nodes.length} nodes • {edges.length} connections
        </div>
      </div>

      {/* Sidebar Toggle */}
      <div className="sidebar-toggle" onClick={toggleSidebar}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
          {sidebarVisible ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </div>

      {/* Empty Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Flexible Connections</h3>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
            All handles can now connect to any other handle. Try connecting:
          </p>
          <ul style={{ textAlign: 'left', margin: '12px 0', paddingLeft: '20px', fontSize: '13px' }}>
            <li>Top to Top</li>
            <li>Bottom to Bottom</li>
            <li>Left to Right</li>
            <li>Any direction to any direction</li>
          </ul>
        </div>
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
            stroke: '#64748B', 
            strokeWidth: 2 
          }}
          defaultEdgeOptions={{
            type: selectedEdgeType,
            style: { 
              stroke: '#64748B', 
              strokeWidth: 2,
            },
            animated: false,
            markerEnd: getCurrentMarker()?.markerEnd ? {
              type: getCurrentMarker()!.markerEnd!.type,
              color: '#64748B'
            } : undefined,
            markerStart: getCurrentMarker()?.markerStart ? {
              type: getCurrentMarker()!.markerStart!.type,
              color: '#64748B'
            } : undefined,
          }}
          fitView
          attributionPosition="bottom-right"
          multiSelectionKeyCode="Control"
          deleteKeyCode="Delete"
          selectNodesOnDrag={false}
          connectionMode="loose"
          snapToGrid={true}
          snapGrid={[15, 15]}
          minZoom={0.5}
          maxZoom={2}
          isValidConnection={isValidConnection}
        >
          <Controls />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#CBD5E1"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMapPage;