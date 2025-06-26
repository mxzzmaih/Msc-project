"use client";

import { useEffect, useRef, useState } from "react";
import RichTextEditor from "./RichTextEditor";

export default function NoteCanvas({
  title,
  content,
  onChange,
}: {
  title: string;
  content: string;
  onChange: (val: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [noteTitle, setNoteTitle] = useState(title);

  useEffect(() => {
    const editorEl = editorRef.current?.querySelector("[contenteditable='true']");
    if (editorEl) (editorEl as HTMLElement).focus();
  }, []);

  return (
    <div className="w-full flex justify-center pt-16 px-4" ref={editorRef}>
      <div className="w-full max-w-3xl">
        <input
          type="text"
          placeholder="Untitled"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          className="text-5xl font-bold mb-6 w-full bg-transparent outline-none placeholder:text-zinc-400"
        />
        <div className="min-h-[400px]">
          <RichTextEditor content={content} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
