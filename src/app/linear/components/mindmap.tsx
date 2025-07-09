"use client";

import React, { JSX, useCallback, useState } from 'react';
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'default',
    position: { x: 250, y: 250 },
    data: { label: 'Main Idea' },
    style: {
      background: '#6366f1',
      color: 'white',
      border: '2px solid #4f46e5',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      padding: '10px',
    },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Branch 1' },
    style: {
      background: '#10b981',
      color: 'white',
      border: '2px solid #059669',
      borderRadius: '8px',
      fontSize: '14px',
      padding: '8px',
    },
  },
  {
    id: '3',
    type: 'default',
    position: { x: 400, y: 100 },
    data: { label: 'Branch 2' },
    style: {
      background: '#f59e0b',
      color: 'white',
      border: '2px solid #d97706',
      borderRadius: '8px',
      fontSize: '14px',
      padding: '8px',
    },
  },
];

const initialEdges = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
  },
];

const colors = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

export default function MindMapPage(): JSX.Element {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes as any[]);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges as any[]);
  const [nodeId, setNodeId] = useState<number>(4);

  // explicitly type params as `any` so TS won't infer & complain
  const onConnect = useCallback((params: any): void => {
    setEdges((eds: any[]) => addEdge(params, eds));
  }, [setEdges]);

  const addNode = useCallback((): void => {
    const newNode = {
      id: nodeId.toString(),
      type: 'default',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: `Node ${nodeId}` },
      style: {
        background:
          colors[Math.floor(Math.random() * colors.length)],
        color: 'white',
        border: '2px solid #374151',
        borderRadius: '8px',
        fontSize: '14px',
        padding: '8px',
      },
    };
    setNodes((nds: any[]) => nds.concat(newNode));
    setNodeId((id) => id + 1);
  }, [nodeId, setNodes]);

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: any): void => {
      const newLabel = prompt('Enter new label:', node.data.label);
      if (newLabel !== null) {
        setNodes((nds: any[]) =>
          nds.map((n: any) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, label: newLabel } }
              : n
          )
        );
      }
    },
    [setNodes]
  );

  const deleteNode = useCallback((id: string): void => {
    setNodes((nds: any[]) => nds.filter((n: any) => n.id !== id));
    setEdges((eds: any[]) =>
      eds.filter((e: any) => e.source !== id && e.target !== id)
    );
  }, [setNodes, setEdges]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any): void => {
      event.preventDefault();
      if (confirm('Delete this node?')) {
        deleteNode(node.id);
      }
    },
    [deleteNode]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* toolbar */}
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000,
        background: 'white', padding: '10px', borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, marginBottom: '10px', fontSize: '20px', color: '#374151' }}>
          Mind Map
        </h1>
        <button
          onClick={addNode}
          style={{
            background: '#6366f1', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Add Node
        </button>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
          • Double-click nodes to edit<br />
          • Right-click to delete<br />
          • Drag to connect nodes
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#6366f1', strokeWidth: 2 },
        }}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap
          nodeColor={(n: any) => n.style?.background || '#6366f1'}
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
