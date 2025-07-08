'use client';

import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, MoreHorizontal } from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

const LinearPage: React.FC = () => {
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

  useEffect(() => {
    const handleClickOutside = () => {
      setShowDeleteMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
            <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
            <button
              onClick={createNewNote}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              New
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
                  <h3 className="font-medium text-gray-900 truncate text-sm">
                    {note.title || 'Untitled'}
                  </h3>
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