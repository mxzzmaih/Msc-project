// src/app/linear/components/NotesSidebar.tsx
"use client";

import { Button, Flex, Text } from "@radix-ui/themes";

const folders = ["All notes", "Collections", "Projects", "Archives"];

export default function NotesSidebar() {
  return (
    <Flex direction="column" className="h-full p-4" gap="4">
      <Text size="4" className="font-bold">Library</Text>
      <nav className="space-y-2">
        {folders.map((name) => (
          <Text key={name} className="cursor-pointer hover:underline">
            {name}
          </Text>
        ))}
      </nav>

      <div className="mt-auto">
        <Button size="2" className="w-full">+ New note</Button>
      </div>
    </Flex>
  );
}
