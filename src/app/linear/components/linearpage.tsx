"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { nanoid } from "nanoid";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Flex, Text } from "@radix-ui/themes";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ThemeProvider } from "next-themes";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

// —————————————————————————————————————
// Animated Background (sparkles + pencil)
function AnimatedBackground() {
  const sparkles = Array.from({ length: 32 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 4,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 3,
  }));

  return (
    <div className="fixed inset-0 -z-10 bg-white dark:bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white dark:bg-white opacity-10 animate-sparkle"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              filter: "blur(1px)",
            }}
          />
        ))}
      </div>
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="opacity-15 animate-pencil-draw"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }}
      >
        <rect x="120" y="80" width="60" height="120" rx="20" fill="#f4c542" stroke="#bfa13b" strokeWidth="4" />
        <polygon points="150,60 170,80 130,80" fill="#e0b07c" stroke="#bfa13b" strokeWidth="4" />
        <polygon points="150,60 155,75 145,75" fill="#444" />
        <rect x="120" y="200" width="60" height="24" rx="12" fill="#ff8fa3" stroke="#bfa13b" strokeWidth="4" />
        <path
          d="M150 60 Q140 40 110 50 Q80 60 90 100"
          stroke="#444"
          strokeWidth="3"
          fill="none"
          className="animate-pencil-line"
        />
      </svg>
    </div>
  );
}

// —————————————————————————————————————
// Sidebar Component
function NotesSidebar({ onCreate }: { onCreate: () => void }) {
  return (
    <Flex
      direction="column"
      className="h-full p-6 bg-black/5 dark:bg-white/5 border-r border-black/10 dark:border-white/10 shadow-xl rounded-tr-2xl rounded-br-2xl min-w-[200px] max-w-[240px] transition-all backdrop-blur-md animate-slide-down"
      gap="4"
    >
      <Text size="5" className="font-extrabold tracking-tight text-black dark:text-white mb-6 animate-fade-in">
        🗂 Notes
      </Text>
      <div className="mt-auto">
        <Button
          className="w-full bg-white/10 dark:bg-white/10 text-white hover:bg-white/20 dark:hover:bg-white/20 border border-white/20 transition-transform transform hover:scale-105 backdrop-blur-md"
          size="sm"
          onClick={onCreate}
        >
          + New note
        </Button>
      </div>
    </Flex>
  );
}

// —————————————————————————————————————
// Note Canvas
function NoteCanvas({
  title,
  content,
  onTitleChange,
  onContentChange,
  autoFocusTitle,
}: {
  title: string;
  content: string;
  onTitleChange: (val: string) => void;
  onContentChange: (val: string) => void;
  autoFocusTitle?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [autoFocusTitle]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "outline-none prose prose-lg dark:prose-invert w-full min-h-[300px] bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 shadow-2xl border border-black/10 dark:border-white/20 focus-within:ring-2 ring-black dark:ring-white backdrop-blur-md text-black dark:text-white animate-fade-in",
        style: "box-shadow: 0 6px 32px rgba(0,0,0,0.08);",
      },
    },
    onUpdate({ editor }) {
      onContentChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!autoFocusTitle && editorRef.current) {
      const el = editorRef.current.querySelector("[contenteditable='true']");
      if (el) (el as HTMLElement).focus();
    }
  }, [autoFocusTitle]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-14 transition-all duration-500 px-4">
      <div className="relative mb-8 animate-fade-in">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value)}
          placeholder=" "
          className="peer w-full text-4xl font-extrabold bg-transparent outline-none border-b-2 border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white px-2 py-3 transition-all tracking-tight rounded-md text-black dark:text-white"
          autoFocus={autoFocusTitle}
          spellCheck={false}
        />
        <label className="absolute text-gray-500 dark:text-gray-400 text-base left-2 top-3 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-2xl peer-focus:top-2 peer-focus:text-sm peer-focus:text-black dark:peer-focus:text-white animate-fade-in">
          Title
        </label>
      </div>

      <div ref={editorRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// —————————————————————————————————————
// Main Component
export default function LinearPage() {
  const [notes, setNotes] = useState([{ id: nanoid(), title: "", content: "" }]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAddNote = () => {
    setNotes((prev) => [...prev, { id: nanoid(), title: "", content: "" }]);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title: newTitle } : n)));
  };

  const handleContentChange = (id: string, newContent: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content: newContent } : n)));
  };

  const note = notes[0];

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AnimatedBackground />
      <Flex direction="column" className="h-screen">
        <Flex
          className="w-full px-4 md:px-8 py-4 border-b border-black/10 dark:border-white/10 items-center justify-between bg-white/90 dark:bg-black/90 shadow-md backdrop-blur-md z-10 animate-slide-down"
          style={{ minHeight: 64 }}
        >
          <Flex gap="4" align="center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-transform transform hover:scale-110"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-6 w-6 text-black dark:text-white" />
            </Button>
            <div className="relative group">
              <Avatar>
                <AvatarImage
                  src="/pfp.png"
                  alt="Profile"
                  className="transition-transform duration-300 group-hover:scale-110"
                />
              </Avatar>
            </div>
            <ModeToggle />
          </Flex>
        </Flex>

        <Flex className="flex-1 w-full h-full overflow-hidden">
          <aside
            className={`transition-all duration-700 ease-in-out ${
              sidebarOpen
                ? "max-w-[240px] min-w-[200px] opacity-100 translate-x-0"
                : "max-w-0 min-w-0 opacity-0 -translate-x-16 pointer-events-none"
            } h-full`}
            aria-label="Notes Sidebar"
          >
            <NotesSidebar onCreate={handleAddNote} />
          </aside>

          <main className="flex-1 overflow-auto p-4 md:p-8 bg-white/90 dark:bg-black/90 text-black dark:text-white flex flex-col min-h-0 animate-fade-in backdrop-blur-md">
            {note && (
              <NoteCanvas
                title={note.title}
                content={note.content}
                onTitleChange={(val) => handleTitleChange(note.id, val)}
                onContentChange={(val) => handleContentChange(note.id, val)}
                autoFocusTitle={true}
              />
            )}
            <footer className="w-full text-center text-xs text-black/40 dark:text-white/30 mt-auto pb-6 pt-12 animate-fade-in">
              Made with <span className="opacity-70">♥</span>
            </footer>
          </main>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
