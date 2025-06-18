// src/app/linear/page.tsx
"use client";

import NotesSidebar from "./NoteSidebar";
import NoteCard, { Note } from "./NoteCard";
import { Flex, Text } from "@radix-ui/themes";

const SAMPLE_NOTES: Note[] = [
  {
    id: "1",
    year: 2021,
    title: "Lejarraga and Hertwig",
    description:
      "How experimental methods shaped views on human competence and rationality.",
    categoryColor: "bg-red-400",
  },
  {
    id: "2",
    year: 2019,
    title: "Spiliopoulos and Hertwig",
    description:
      "The ecological rationality of heuristics in decision-making.",
    categoryColor: "bg-green-400",
  },
  // …more notes
];

export default function LinearPage() {
  return (
    <Flex className="h-screen">
      <aside className="w-1/4 border-r border-border">
        <NotesSidebar />
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Text size="6" className="font-bold mb-6">
          All Notes
        </Text>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SAMPLE_NOTES.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </main>
    </Flex>
  );
}
