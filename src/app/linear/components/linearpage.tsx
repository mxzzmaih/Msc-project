import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Search, MoreHorizontal, ArrowLeft, Share2, X, Menu, Mic, Code, Calculator, Bold, Italic, Underline, Type, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../../firebase/config'; // Adjust path as needed

// Interface definitions
interface MindMapPageProps {
  onBack: () => void;
}

interface VoiceTranscriptionPageProps {
  onBack: () => void;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
}

interface LinearPageProps {
  onBack?: () => void;
  onSignOut?: () => void;
}

interface SelectionMenuPosition {
  x: number;
  y: number;
}

// Profile Avatar Component
const ProfileAvatar: React.FC<{ user: FirebaseUser | null; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const getInitials = (name: string | null, email: string | null): string => {
    if (name) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || 'Profile'}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm`}>
      {getInitials(user?.displayName || null, user?.email || null)}
    </div>
  );
};

// Profile Dropdown Component
const ProfileDropdown: React.FC<{ user: FirebaseUser | null; onSignOut?: () => void }> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      // Navigate to homepage by calling onSignOut which should handle navigation
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const exportNotes = () => {
    setIsOpen(false);
    // Export notes functionality - you can implement this
    console.log('Export notes clicked');
    // Example: Create a JSON file with all notes
    alert('Export feature coming soon!');
  };

  const clearAllData = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      // Clear all notes functionality
      localStorage.removeItem('notes');
      window.location.reload();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        type="button"
      >
        <ProfileAvatar user={user} size="md" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <ProfileAvatar user={user} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={exportNotes}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              type="button"
            >
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileText size={14} className="text-blue-600" />
              </div>
              <span>Export Notes</span>
            </button>

            <button
              onClick={clearAllData}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-200"
              type="button"
            >
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <X size={14} className="text-orange-600" />
              </div>
              <span>Clear All Notes</span>
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              type="button"
            >
              <div className="p-1.5 bg-red-100 rounded-lg">
                <LogOut size={14} className="text-red-600" />
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Import the actual components
const MindMapPage = React.lazy(() => import('./mindmap'));
const VoiceTranscriptionPage = React.lazy(() => import('./voice_text'));

// Rich Text Editor Component
const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState<boolean>(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<SelectionMenuPosition>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showFontMenu, setShowFontMenu] = useState<boolean>(false);
  const [showSizeMenu, setShowSizeMenu] = useState<boolean>(false);
  const [currentFont, setCurrentFont] = useState<string>('Inter');
  const [currentSize, setCurrentSize] = useState<string>('16px');

  const fonts = [
    { name: 'Inter', value: 'Inter, system-ui, -apple-system, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Monaco', value: 'Monaco, Consolas, monospace' },
    { name: 'Courier', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
    { name: 'Comic Sans', value: 'Comic Sans MS, cursive' }
  ];

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Smart detection functions
  const detectCodePattern = (text: string): boolean => {
    const codePatterns: RegExp[] = [
      /^(function|const|let|var|if|for|while|class|import|export)\s/,
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*[^=]/,
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)\s*{/,
      /^\s*(console\.log|print|echo|printf)\(/,
      /^[a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\(/,
      /^<[a-zA-Z][^>]*>/,
      /^\{[^}]*\}$/,
      /^\[[^\]]*\]$/
    ];
    return codePatterns.some((pattern: RegExp) => pattern.test(text.trim()));
  };

  const detectMathPattern = (text: string): boolean => {
    const mathPatterns: RegExp[] = [
      /[+\-*/=<>]/,
      /\b\d+\.?\d*\b/,
      /\b(sin|cos|tan|log|ln|sqrt|exp|abs|floor|ceil|round)\b/i,
      /[∑∏∫∆∇±≤≥≠∞π]/,
      /\^|\*\*|\_\{|\_\d|\^\{|\^\d/,
      /\\[a-zA-Z]+/,
      /\$[^$]+\$/
    ];
    return mathPatterns.some((pattern: RegExp) => pattern.test(text)) && text.length > 1;
  };

  const handleSelection = (): void => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      
      if (text.length > 0) {
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setSelectedRange(range.cloneRange());
        setSelectionMenuPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 60
        });
        setShowSelectionMenu(true);
      }
    } else {
      setShowSelectionMenu(false);
    }
  };

  const applyFormatting = (type: 'code' | 'math' | 'auto'): void => {
    if (!selectedRange) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(selectedRange);

    let className: string;
    let icon: string;
    
    switch (type) {
      case 'code':
        className = 'bg-gray-100 px-2 py-1 rounded font-mono text-sm border';
        icon = '💻';
        break;
      case 'math':
        className = 'bg-blue-50 px-2 py-1 rounded text-blue-800 font-serif border border-blue-200';
        icon = '🔢';
        break;
      case 'auto':
        if (detectCodePattern(selectedText)) {
          className = 'bg-gray-100 px-2 py-1 rounded font-mono text-sm border';
          icon = '💻';
        } else if (detectMathPattern(selectedText)) {
          className = 'bg-blue-50 px-2 py-1 rounded text-blue-800 font-serif border border-blue-200';
          icon = '🔢';
        } else {
          className = 'bg-yellow-100 px-2 py-1 rounded border border-yellow-300';
          icon = '✨';
        }
        break;
    }

    const span = document.createElement('span');
    span.className = className;
    span.setAttribute('data-type', type === 'auto' ? (detectCodePattern(selectedText) ? 'code' : detectMathPattern(selectedText) ? 'math' : 'highlight') : type);
    span.innerHTML = `<span class="inline-block w-4 h-4 mr-1 text-xs">${icon}</span>${selectedText}`;

    try {
      selectedRange.deleteContents();
      selectedRange.insertNode(span);
      
      // Position cursor after the formatted span to continue typing normally
      const newRange = document.createRange();
      newRange.setStartAfter(span);
      newRange.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      // Add a space after the formatted text to make it easier to continue typing
      const spaceNode = document.createTextNode(' ');
      newRange.insertNode(spaceNode);
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(newRange);
      
    } catch (e) {
      console.error('Error applying formatting:', e);
    }

    setShowSelectionMenu(false);
    handleContentChange();
  };

  const handleContentChange = (): void => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    // Handle some basic shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
    
    // Escape key to clear selection menu
    if (e.key === 'Escape') {
      setShowSelectionMenu(false);
    }
    
    // Right arrow key to exit formatting when at the end of a formatted span
    if (e.key === 'ArrowRight') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Check if we're at the end of a formatted span
        if (container.parentElement && 
            (container.parentElement.hasAttribute('data-type') || 
             container.parentElement.closest('[data-type]'))) {
          
          const span = container.parentElement.closest('[data-type]') || container.parentElement;
          if (span && range.endOffset === container.textContent?.length) {
            e.preventDefault();
            
            // Move cursor after the span
            const newRange = document.createRange();
            newRange.setStartAfter(span);
            newRange.collapse(true);
            
            // Add space if there isn't one already
            const nextSibling = span.nextSibling;
            if (!nextSibling || (nextSibling.nodeType === Node.TEXT_NODE && !nextSibling.textContent?.startsWith(' '))) {
              const spaceNode = document.createTextNode(' ');
              newRange.insertNode(spaceNode);
              newRange.setStartAfter(spaceNode);
              newRange.collapse(true);
            }
            
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, command: string): void => {
    e.preventDefault();
    document.execCommand(command);
  };

  const handleFontChange = (fontValue: string, fontName: string): void => {
    if (editorRef.current) {
      editorRef.current.style.fontFamily = fontValue;
      setCurrentFont(fontName);
      setShowFontMenu(false);
      handleContentChange();
    }
  };

  const handleSizeChange = (size: string): void => {
    if (editorRef.current) {
      editorRef.current.style.fontSize = size;
      setCurrentSize(size);
      setShowSizeMenu(false);
      handleContentChange();
    }
  };

  return (
    <div className="relative h-full">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex-wrap">
        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFontMenu(!showFontMenu);
              setShowSizeMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors min-w-0"
            title="Font Family"
            type="button"
          >
            <Type size={14} />
            <span className="truncate max-w-20">{currentFont}</span>
            <ChevronDown size={12} />
          </button>
          {showFontMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-40 max-h-60 overflow-y-auto">
              {fonts.map((font) => (
                <button
                  key={font.name}
                  onClick={() => handleFontChange(font.value, font.name)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: font.value }}
                  type="button"
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSizeMenu(!showSizeMenu);
              setShowFontMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
            title="Font Size"
            type="button"
          >
            <span className="text-xs">{currentSize}</span>
            <ChevronDown size={12} />
          </button>
          {showSizeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-20 max-h-60 overflow-y-auto">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  type="button"
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* Text Formatting Buttons */}
        <button
          onMouseDown={(e) => handleMouseDown(e, 'bold')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold size={16} />
        </button>
        <button
          onMouseDown={(e) => handleMouseDown(e, 'italic')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic size={16} />
        </button>
        <button
          onMouseDown={(e) => handleMouseDown(e, 'underline')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Underline (Ctrl+U)"
          type="button"
        >
          <Underline size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        <span className="text-xs text-gray-500 flex-shrink-0">Select text to highlight as code or math • Press → or Esc to exit formatting</span>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        className="w-full h-full p-6 outline-none text-gray-900 leading-relaxed bg-transparent resize-none overflow-auto"
        style={{ 
          fontFamily: fonts.find(f => f.name === currentFont)?.value || 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: currentSize,
          minHeight: 'calc(100% - 80px)'
        }}
        onInput={handleContentChange}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Selection Menu */}
      {showSelectionMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-2 z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${selectionMenuPosition.x}px`,
            top: `${selectionMenuPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => applyFormatting('auto')}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded transition-colors text-purple-600 border border-purple-200"
            title="Smart detect and highlight"
            type="button"
          >
            ✨ Smart
          </button>
          <button
            onClick={() => applyFormatting('code')}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded transition-colors text-gray-600 border border-gray-200"
            title="Format as code"
            type="button"
          >
            <Code size={14} />
            Code
          </button>
          <button
            onClick={() => applyFormatting('math')}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors text-blue-600 border border-blue-200"
            title="Format as math"
            type="button"
          >
            <Calculator size={14} />
            Math
          </button>
        </div>
      )}

      {/* Placeholder Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

const LinearPage: React.FC<LinearPageProps> = ({ onBack, onSignOut }) => {
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
  const [showVoiceTranscription, setShowVoiceTranscription] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [animatingNotes, setAnimatingNotes] = useState<Set<number>>(new Set());
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Element;
      if (showDeleteMenu && !target.closest('.delete-menu')) {
        setShowDeleteMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDeleteMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
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

  const activeNote: Note | undefined = notes.find((note: Note) => note.id === activeNoteId);

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
    setAnimatingNotes((prev: Set<number>) => new Set(prev).add(newNote.id));
    setTimeout(() => {
      setAnimatingNotes((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(newNote.id);
        return newSet;
      });
    }, 600);
  };

  const deleteNote = (noteId: number): void => {
    const remainingNotes = notes.filter((note: Note) => note.id !== noteId);
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
    setNotes(notes.map((note: Note) => 
      note.id === id ? { ...note, title } : note
    ));
  };

  const updateNoteContent = (id: number, content: string): void => {
    setNotes(notes.map((note: Note) => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const filteredNotes = notes.filter((note: Note) => {
    const searchLower = searchTerm.toLowerCase();
    // Strip HTML tags for search
    const contentText = note.content.replace(/<[^>]*>/g, '');
    return note.title.toLowerCase().includes(searchLower) ||
           contentText.toLowerCase().includes(searchLower);
  });

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
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Mind Map...</p>
          </div>
        </div>
      }>
        <MindMapPage onBack={() => setShowMindMap(false)} />
      </React.Suspense>
    );
  }

  // Show Voice Transcription if requested
  if (showVoiceTranscription) {
    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Voice Transcription...</p>
          </div>
        </div>
      }>
        <VoiceTranscriptionPage onBack={() => setShowVoiceTranscription(false)} />
      </React.Suspense>
    );
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
                  type="button"
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
                type="button"
              >
                <X size={18} className="text-gray-600" />
              </button>
              <button
                onClick={createNewNote}
                className="group flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                type="button"
              >
                <Plus size={16} className="transform group-hover:rotate-90 transition-transform duration-200" />
                New
              </button>
            </div>
          </div>
          
          {/* Mind Map Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowMindMap(true)}
              className="group flex items-center gap-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              type="button"
            >
              <Share2 size={16} className="transform group-hover:rotate-12 transition-transform duration-200" />
              Mind Map
            </button>
          </div>

          {/* Voice Transcription Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowVoiceTranscription(true)}
              className="group flex items-center gap-2 w-full px-4 py-3 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              type="button"
            >
              <Mic size={16} className="transform group-hover:scale-110 transition-transform duration-200" />
              Voice to Text
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
          {filteredNotes.map((note: Note, index: number) => {
            // Strip HTML tags for preview
            const contentPreview = note.content.replace(/<[^>]*>/g, '').substring(0, 100);
            
            return (
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
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {contentPreview || 'No content'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="relative delete-menu">
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setShowDeleteMenu(showDeleteMenu === note.id ? null : note.id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                      type="button"
                    >
                      <MoreHorizontal size={14} className="text-gray-400" />
                    </button>
                    {showDeleteMenu === note.id && (
                      <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-xl z-20 transform origin-top-right animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-all duration-200 rounded-lg"
                          type="button"
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
            );
          })}
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className={`p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
            sidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          type="button"
        >
          <Menu size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Profile Dropdown - Top Right Corner */}
        <div className="absolute top-4 right-4 z-20">
          <ProfileDropdown user={currentUser} onSignOut={onSignOut} />
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
        </div>
        
        {activeNote ? (
          <div className="relative z-10 flex-1 flex flex-col">
            {/* Note Header */}
            <div className="p-8 pt-16 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNoteTitle(activeNote.id, e.target.value)}
                className="text-4xl font-bold text-gray-900 w-full bg-transparent border-none outline-none placeholder-gray-400 transition-all duration-300 focus:scale-105 transform-gpu"
                placeholder="Page title"
                style={{ 
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                  transform: 'perspective(1000px) rotateX(2deg)'
                }}
              />
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1 bg-white/30 backdrop-blur-sm flex flex-col">
              <div className="flex-1 max-w-4xl mx-auto w-full">
                <RichTextEditor
                  content={activeNote.content}
                  onChange={(content: string) => updateNoteContent(activeNote.id, content)}
                  placeholder="Start writing your thoughts... Select text to highlight as code or math!"
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
              <p className="text-gray-500">Create rich content with code and math highlighting!</p>
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