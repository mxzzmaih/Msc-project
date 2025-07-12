import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Search, MoreHorizontal, ArrowLeft, Share2, X, Menu } from 'lucide-react';
import MindMapPage from './mindmap';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface LinearPageProps {
  onBack?: () => void;
}

const LinearPage: React.FC<LinearPageProps> = ({ onBack }) => {
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
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [animatingNotes, setAnimatingNotes] = useState<Set<number>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDeleteMenu && !(e.target as Element).closest('.delete-menu')) {
        setShowDeleteMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') {
          e.preventDefault();
          createNewNote();
        } else if (e.key === 'k') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    
    // Animate new note
    setAnimatingNotes(prev => new Set(prev).add(newNote.id));
    setTimeout(() => {
      setAnimatingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(newNote.id);
        return newSet;
      });
    }, 600);
  };

  const deleteNote = (noteId: number): void => {
    const remainingNotes = notes.filter(note => note.id !== noteId);
    setNotes(remainingNotes);
    
    if (activeNoteId === noteId) {
      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id);
      } else {
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

  // Show MindMap if requested
  if (showMindMap) {
    return <MindMapPage onBack={() => setShowMindMap(false)} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-500 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white/90 backdrop-blur-md border-r border-gray-200/50 flex flex-col shadow-lg z-10 md:relative absolute md:translate-x-0`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-sm"></div>
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notes</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X size={18} className="text-gray-600" />
              </button>
              <button
                onClick={createNewNote}
                className="group flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                <Plus size={16} className="transform group-hover:rotate-90 transition-transform duration-200" />
                New
              </button>
            </div>
          </div>
          
          {/* Mind Map Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowMindMap(true)}
              className="group flex items-center gap-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
            >
              <Share2 size={16} className="transform group-hover:rotate-12 transition-transform duration-200" />
              Mind Map
            </button>
          </div>
          
          {/* Search */}
          <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : 'scale-100'}`}>
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${isSearchFocused ? 'text-indigo-500' : 'text-gray-400'}`} size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes... (Ctrl+K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-3 text-sm border rounded-lg focus:outline-none transition-all duration-300 ${
                isSearchFocused 
                  ? 'border-indigo-500 bg-white shadow-lg ring-2 ring-indigo-500/20' 
                  : 'border-gray-200 bg-gray-50/50 hover:bg-white hover:border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
              className={`group relative p-4 border border-gray-200/50 cursor-pointer rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                activeNoteId === note.id 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg scale-105' 
                  : 'bg-white/80 hover:bg-white hover:shadow-md'
              } ${animatingNotes.has(note.id) ? 'animate-pulse' : ''}`}
              style={{
                animationDelay: `${index * 50}ms`,
                transform: `perspective(1000px) rotateY(${activeNoteId === note.id ? '0deg' : '1deg'})`,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    activeNoteId === note.id 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate text-sm transition-colors duration-200 ${
                      activeNoteId === note.id ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="relative delete-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteMenu(showDeleteMenu === note.id ? null : note.id);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} className="text-gray-400" />
                  </button>
                  {showDeleteMenu === note.id && (
                    <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-xl z-20 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Animated border */}
              <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                activeNoteId === note.id 
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-100' 
                  : 'opacity-0'
              }`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className={`p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Menu size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
        </div>
        
        {activeNote ? (
          <div className="relative z-10 flex-1 flex flex-col">
            {/* Note Header */}
            <div className="p-8 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNoteTitle(activeNote.id, e.target.value)}
                className="text-4xl font-bold text-gray-900 w-full bg-transparent border-none outline-none placeholder-gray-400 transition-all duration-300 focus:scale-105 transform-gpu"
                placeholder="Page title"
                style={{ 
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  transform: 'perspective(1000px) rotateX(2deg)'
                }}
              />
            </div>

            {/* Note Content */}
            <div className="flex-1 p-8 bg-white/30 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto h-full">
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateNoteContent(activeNote.id, e.target.value)}
                  placeholder="Start writing your thoughts..."
                  className="w-full h-full resize-none border-none outline-none text-gray-900 text-lg leading-relaxed placeholder-gray-400 bg-transparent transition-all duration-300 focus:scale-105 transform-gpu"
                  style={{ 
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    transform: 'perspective(1000px) rotateX(1deg)'
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center transform perspective-1000 rotate-y-12">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl transform hover:scale-110 transition-all duration-300">
                <FileText size={32} className="text-white" />
              </div>
              <p className="text-xl font-medium text-gray-600 mb-2">Select a note to start writing</p>
              <p className="text-gray-500">Or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-5"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default LinearPage;