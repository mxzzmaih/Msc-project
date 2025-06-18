// src/app/linear/components/NoteCard.tsx
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Text } from "@radix-ui/themes";

export interface Note {
  id: string;
  year: number;
  title: string;
  description: string;
  categoryColor: string; // e.g. "bg-red-400"
}

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Card className="w-full">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{note.year}</CardTitle>
        <span className={`h-2 w-2 rounded-full ${note.categoryColor}`} />
      </CardHeader>
      <CardContent>
        <Text size="4" className="font-semibold mb-2">
          {note.title}
        </Text>
        <CardDescription className="text-sm text-muted-foreground">
          {note.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
