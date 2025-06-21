"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import NotesSidebar from "./NoteSidebar";
import { Flex, Text } from "@radix-ui/themes";

type SimpleNote = {
  id: string;
  content: string;
};

export default function LinearPage() {
  const [notes, setNotes] = useState<SimpleNote[]>([]);

  const handleAddNote = () => {
    setNotes((prev) => [
      ...prev,
      { id: nanoid(), content: "" },
    ]);
  };

  const handleChange = (id: string, newContent: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content: newContent } : n))
    );
  };

  return (
    <Flex className="h-screen">
      <aside className="w-1/4 border-r border-border">
        <NotesSidebar onCreate={handleAddNote} />
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Text size="6" className="font-bold mb-4">
          My Notes
        </Text>

        <div className="space-y-4">
          {notes.map((note) => (
            <textarea
              key={note.id}
              className="w-full p-2 border rounded resize-y"
              placeholder="Type your note here…"
              value={note.content}
              onChange={(e) => handleChange(note.id, e.currentTarget.value)}
              rows={4}
            />
          ))}
        </div>
      </main>
    </Flex>
  );
}
