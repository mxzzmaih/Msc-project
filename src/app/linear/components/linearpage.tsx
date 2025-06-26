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
// Background Animation Wrapper
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-neutral-900 dark:via-black dark:to-neutral-950 animate-gradient-slow" />
  );
}

// —————————————————————————————————————
// Sidebar Component
function NotesSidebar({ onCreate }: { onCreate: () => void }) {
  return (
    <Flex
      direction="column"
      className="h-full p-6 bg-white/80 dark:bg-neutral-900/80 border-r border-border shadow-xl rounded-tr-2xl rounded-br-2xl min-w-[200px] max-w-[240px] transition-all backdrop-blur-md"
      gap="4"
    >
      <Text
        size="5"
        className="font-extrabold tracking-tight text-gray-800 dark:text-gray-100 mb-6 animate-fade-in"
        style={{ letterSpacing: "-0.03em" }}
      >
        📚 Library
      </Text>
      <div className="mt-auto">
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-[1.05] hover:shadow-2xl transition-transform duration-300 ease-in-out"
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
          "outline-none prose prose-lg dark:prose-invert w-full min-h-[300px] bg-white/90 dark:bg-neutral-900/80 rounded-2xl px-6 py-5 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-all focus-within:ring-2 ring-blue-400 backdrop-blur-md",
        style: "box-shadow: 0 6px 32px rgba(0,0,0,0.1);",
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
      {/* Title Input with Floating Label */}
      <div className="relative mb-8">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onTitleChange(e.target.value)
          }
          placeholder=" "
          className="peer w-full text-4xl font-extrabold bg-transparent outline-none border-b-2 border-gray-300 dark:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-400 px-2 py-3 transition-all duration-200 tracking-tight rounded-md shadow-sm dark:text-white"
          autoFocus={autoFocusTitle}
          spellCheck={false}
          aria-label="Note title"
        />
        <label
          className="absolute text-gray-500 dark:text-gray-400 text-base left-2 top-3 transition-all duration-200 peer-placeholder-shown:top-5 peer-placeholder-shown:text-2xl peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-500 dark:peer-focus:text-blue-400"
        >
          Title
        </label>
      </div>

      {/* Optional toolbar section */}
      <div className="flex items-center justify-between mb-2 text-sm text-gray-400 dark:text-gray-500">
        
      </div>

      {/* Editor */}
      <div ref={editorRef} className="animate-fade-in">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}


// —————————————————————————————————————
// Main Page Component
export default function LinearPage() {
  const [notes, setNotes] = useState<
    { id: string; title: string; content: string }[]
  >([{ id: nanoid(), title: "", content: "" }]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAddNote = () => {
    setNotes((prev) => [...prev, { id: nanoid(), title: "", content: "" }]);
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: newTitle } : n))
    );
  };

  const handleContentChange = (id: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: newContent } : n))
    );
  };

  const note = notes[0];

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AnimatedBackground />
      <Flex direction="column" className="h-screen animate-fade-in">
       {/* Top Bar */}
<Flex
  className="w-full px-4 md:px-8 py-4 border-b border-border items-center justify-between bg-white/90 dark:bg-neutral-900/90 shadow-md backdrop-blur-md transition-all z-10 animate-slide-down"
  style={{ minHeight: 64 }}
>
  <Flex gap="4" align="center">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-6 w-6" />
    </Button>
    <div className="relative group">
      <Avatar>
        <AvatarImage
          src="/pfp.png"
          alt="Profile"
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </Avatar>
      <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-[6px] h-[6px] bg-green-400 rounded-full shadow-md group-hover:scale-125 transition-transform duration-300" />
    </div>
    <div className="pulse-ring">
      <ModeToggle />
    </div>
  </Flex>
</Flex>

        {/* Body */}
        <Flex className="flex-1 w-full h-full overflow-hidden">
          {/* Sidebar */}
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

          {/* Editor Area */}
          <main className="flex-1 overflow-auto p-4 md:p-8 transition-all bg-neutral-50 dark:bg-neutral-950 flex flex-col min-h-0">
            {note && (
              <NoteCanvas
                title={note.title}
                content={note.content}
                onTitleChange={(val) => handleTitleChange(note.id, val)}
                onContentChange={(val) => handleContentChange(note.id, val)}
                autoFocusTitle={true}
              />
            )}
            <footer className="w-full text-center text-xs text-gray-400 mt-auto pb-6 pt-12 animate-fade-in">
              <span className="opacity-80">
                Made with <span className="text-blue-500">♥</span>
              </span>
            </footer>
          </main>
        </Flex>
      </Flex>
    </ThemeProvider>
  );
}
