import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Search, MoreHorizontal, ArrowLeft, Share2 } from 'lucide-react';
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

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface LinearPageProps {
  onBack?: () => void;
}

// Mind Map Component (exported from the original code)
const MindMapPage = ({ onBack }: { onBack?: () => void }) => {
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any[]);
  const [nodeId, setNodeId] = useState<number>(4);

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
        background: colors[Math.floor(Math.random() * colors.length)],
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: '#6b7280', color: 'white', border: 'none',
                padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back
            </button>
          )}
          <h1 style={{ margin: 0, fontSize: '20px', color: '#374151' }}>
            Mind Map
          </h1>
        </div>
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
};

const LinearPage: React.FC<LinearPageProps> = ({ onBack }) => {
  // Create initial note once to avoid ID mismatch
  const initialNote: Note = {
    id: Date.now(),
    title: '',
    content: '',
    createdAt: new Date()
  };

  const [notes, setNotes] = useState<Note[]>([initialNote]);
  const [activeNoteId, setActiveNoteId] = useState<number>(initialNote.id);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteMenu, setShowDeleteMenu] = useState<number | null>(null);
  const [showMindMap, setShowMindMap] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDeleteMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // If showing mind map, render it instead
  if (showMindMap) {
    return <MindMapPage onBack={() => setShowMindMap(false)} />;
  }

  const activeNote: Note | undefined = notes.find(note => note.id === activeNoteId);

  const createNewNote = (): void => {
    const newNote: Note = {
      id: Date.now(),
      title: '',
      content: '',
      createdAt: new Date()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (noteId: number): void => {
    const remainingNotes = notes.filter(note => note.id !== noteId);
    setNotes(remainingNotes);
    
    // If we deleted the active note, select another one or clear selection
    if (activeNoteId === noteId) {
      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id);
      } else {
        // Create a new note if no notes remain
        const newNote: Note = {
          id: Date.now(),
          title: '',
          content: '',
          createdAt: new Date()
        };
        setNotes([newNote]);
        setActiveNoteId(newNote.id);
      }
    }
    setShowDeleteMenu(null);
  };

  const updateNoteTitle = (id: number, title: string): void => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, title } : note
    ));
  };

  const updateNoteContent = (id: number, content: string): void => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <ArrowLeft size={16} className="text-gray-600" />
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
            </div>
            <button
              onClick={createNewNote}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              New
            </button>
          </div>
          
          {/* Mind Map Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowMindMap(true)}
              className="flex items-center gap-1 w-full px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Share2 size={14} />
              Mind Map
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                activeNoteId === note.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-2 flex-1 min-w-0"
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteMenu(showDeleteMenu === note.id ? null : note.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <MoreHorizontal size={14} className="text-gray-400" />
                  </button>
                  {showDeleteMenu === note.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            {/* Note Header */}
            <div className="p-6">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNoteTitle(activeNote.id, e.target.value)}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none outline-none placeholder-gray-400"
                placeholder="Page title"
              />
            </div>

            {/* Note Content */}
            <div className="flex-1 p-6">
              <textarea
                value={activeNote.content}
                onChange={(e) => updateNoteContent(activeNote.id, e.target.value)}
                placeholder="Start writing..."
                className="w-full h-full resize-none border-none outline-none text-gray-900 text-base leading-relaxed placeholder-gray-400 bg-transparent"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default LinearPage;