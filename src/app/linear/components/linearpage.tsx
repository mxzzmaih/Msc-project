import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Search, MoreHorizontal, ArrowLeft, Share2, X, Menu, Mic, Code, Calculator, Bold, Italic, Underline, Type, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config'; // Adjust path as needed

// My interface definitions - keeping these clean and organized makes my life easier later!
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
  onEscape?: () => void; // Optional escape handler - might need this for canceling edits
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Need this to link notes to specific users
}

interface LinearPageProps {
  onBack?: () => void;
  onSignOut?: () => void; // Added this for logout functionality
}

interface SelectionMenuPosition {
  x: number;
  y: number; // Tracks where to show the floating menu
}

// Lazy-loading these components to keep initial load time snappy
const MindMapPage = React.lazy(() => import('./mindmap'));
const VoiceTranscriptionPage = React.lazy(() => import('./voice_text'));

// My custom Rich Text Editor - this was tricky to build but worth it for the UX
const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder, onEscape }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showSelectionMenu, setShowSelectionMenu] = useState<boolean>(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<SelectionMenuPosition>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showFontMenu, setShowFontMenu] = useState<boolean>(false);
  const [showSizeMenu, setShowSizeMenu] = useState<boolean>(false);
  const [currentFont, setCurrentFont] = useState<string>('Inter');
  const [currentSize, setCurrentSize] = useState<string>('16px');
  const [isInFormattedSpan, setIsInFormattedSpan] = useState<boolean>(false);

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

  // Need to check if the cursor is inside a formatted span - helps with proper editing behavior
  const checkFormattedSpanContext = (): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // Check if we're inside a formatted span
    let currentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    while (currentElement && currentElement !== editorRef.current) {
      if (currentElement.hasAttribute && currentElement.hasAttribute('data-type')) {
        return true;
      }
      currentElement = currentElement.parentElement;
    }
    
    return false;
  };

  // These detection functions help identify code snippets automatically - saves users from manual formatting
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

  // Similar pattern detection for math expressions - pretty handy for my note-taking needs
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

  // This handles text selection and shows my custom formatting menu
  const handleSelection = (): void => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      
      if (text.length > 0) {
        // Position the menu above the selection - had to fiddle with these values a bit
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

    // Need to check if we're inside a formatted span to update UI accordingly
    setIsInFormattedSpan(checkFormattedSpanContext());
  };

  // This lets users escape from formatted spans - took me a while to get this right!
  const exitFormattedSpan = (): void => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let container = range.startContainer;
    
    // Need to climb up the DOM tree to find our formatted span
    let formattedSpan: Element | null = null;
    let currentElement = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
    
    while (currentElement && currentElement !== editorRef.current) {
      if (currentElement.hasAttribute && currentElement.hasAttribute('data-type')) {
        formattedSpan = currentElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    if (formattedSpan) {
      // Jump out of the formatted area and position cursor after it
      const newRange = document.createRange();
      newRange.setStartAfter(formattedSpan);
      newRange.collapse(true);
      
      // Adding a space makes typing flow more naturally - small UX detail that matters
      const nextSibling = formattedSpan.nextSibling;
      if (!nextSibling || (nextSibling.nodeType === Node.TEXT_NODE && !nextSibling.textContent?.startsWith(' '))) {
        const spaceNode = document.createTextNode(' ');
        newRange.insertNode(spaceNode);
        newRange.setStartAfter(spaceNode);
        newRange.collapse(true);
      }
      
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      setIsInFormattedSpan(false);
    }
  };

  // This is where the magic happens for text formatting - one of my favorite features!
  const applyFormatting = (type: 'code' | 'math' | 'auto'): void => {
    if (!selectedRange) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(selectedRange);

    let className: string;
    let icon: string;
    
    // I've chosen these styles carefully to make different content types visually distinct
    switch (type) {
      case 'code':
        className = 'bg-gray-100 px-2 py-1 rounded font-mono text-sm border';
        icon = '💻'; // Cute little code icon
        break;
      case 'math':
        className = 'bg-blue-50 px-2 py-1 rounded text-blue-800 font-serif border border-blue-200';
        icon = '🔢'; // Math icon
        break;
      case 'auto':
        // The auto-detection is pretty smart - saves a lot of clicks!
        if (detectCodePattern(selectedText)) {
          className = 'bg-gray-100 px-2 py-1 rounded font-mono text-sm border';
          icon = '💻';
        } else if (detectMathPattern(selectedText)) {
          className = 'bg-blue-50 px-2 py-1 rounded text-blue-800 font-serif border border-blue-200';
          icon = '🔢';
        } else {
          className = 'bg-yellow-100 px-2 py-1 rounded border border-yellow-300';
          icon = '✨'; // Generic highlight
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
    
    // Escape key handling
    if (e.key === 'Escape') {
      if (showSelectionMenu) {
        setShowSelectionMenu(false);
      } else if (isInFormattedSpan) {
        e.preventDefault();
        exitFormattedSpan();
      } else if (onEscape) {
        onEscape();
      }
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
            exitFormattedSpan();
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
        <span className="text-xs text-gray-500 flex-shrink-0">
          Select text to highlight
        </span>
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showMindMap, setShowMindMap] = useState<boolean>(false);
  const [showVoiceTranscription, setShowVoiceTranscription] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [animatingNotes, setAnimatingNotes] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadNotes(user.uid);
      } else {
        setNotes([]);
        setActiveNoteId(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load notes from Firestore - Modified to avoid composite index requirement
  const loadNotes = async (userId: string) => {
    try {
      setLoading(true);
      const notesRef = collection(db, 'notes');
      const q = query(
        notesRef, 
        where('userId', '==', userId)
        // Removed orderBy to avoid composite index requirement
      );
      
      // Use real-time listener
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notesData: Note[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notesData.push({
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            userId: data.userId
          });
        });
        
        // Sort in memory by updatedAt descending
        notesData.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        setNotes(notesData);
        
        // Set first note as active if no active note and notes exist
        if (!activeNoteId && notesData.length > 0) {
          setActiveNoteId(notesData[0].id);
        }
        
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading notes:', error);
      setLoading(false);
    }
  };

  // Create new note
  const createNewNote = async (): Promise<void> => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const newNote = {
        title: '',
        content: '',
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notes'), newNote);
      setActiveNoteId(docRef.id);
      
      // Animate new note
      setAnimatingNotes((prev: Set<string>) => new Set(prev).add(docRef.id));
      setTimeout(() => {
        setAnimatingNotes((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(docRef.id);
          return newSet;
        });
      }, 600);
      
      setSaving(false);
    } catch (error) {
      console.error('Error creating note:', error);
      setSaving(false);
    }
  };

  // Update note title
  const updateNoteTitle = async (id: string, title: string): Promise<void> => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        title,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating note title:', error);
    }
  };

  // Update note content
  const updateNoteContent = async (id: string, content: string): Promise<void> => {
    try {
      setSaving(true);
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        content,
        updatedAt: serverTimestamp()
      });
      setSaving(false);
    } catch (error) {
      console.error('Error updating note content:', error);
      setSaving(false);
    }
  };

  // Sign out
  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user display name or email
  const getUserDisplayName = (): string => {
    if (!currentUser) return '';
    return currentUser.displayName || currentUser.email || 'User';
  };

  // Get user email
  const getUserEmail = (): string => {
    if (!currentUser) return '';
    return currentUser.email || '';
  };

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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your notes...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notes</h1>
              {saving && <span className="text-xs text-blue-600 animate-pulse">Saving...</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                type="button"
              >
                <X size={18} className="text-gray-600" />
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-gray-600"
                  title="Profile"
                  type="button"
                >
                  <User size={18} />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {getUserEmail()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        type="button"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={createNewNote}
                disabled={saving}
                className="group flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          {filteredNotes.length === 0 && !loading ? (
            <div className="text-center py-8">
              <FileText size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No notes match your search' : 'No notes yet. Create your first note!'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note: Note, index: number) => {
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
                  onClick={() => setActiveNoteId(note.id)}
                >
                  <div className="flex items-center gap-3">
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
                        {formatDate(note.updatedAt)}
                      </p>
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
            })
          )}
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
                  onEscape={() => {
                    // Additional escape handling if needed
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
              <p className="text-xl font-medium text-gray-600 mb-2">
                {notes.length === 0 ? 'Create your first note' : 'Select a note to start writing'}
              </p>
              <p className="text-gray-500">Create rich content with code and math highlighting!</p>
              {notes.length === 0 && (
                <button
                  onClick={createNewNote}
                  disabled={saving}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <Plus size={20} className="inline mr-2" />
                  Create First Note
                </button>
              )}
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