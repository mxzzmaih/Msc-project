"use client";

import { Flex, Text } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";

export default function NotesSidebar() {
  return (
    <Flex direction="column" className="h-full p-4" gap="4">
      <Text size="4" className="font-bold">
        Library
      </Text>

      {/* here’s your “+ New note” button, always visible */}
      <div className="mt-auto">
        <Button className="w-full" size="sm">
          + New note
        </Button>
      </div>
    </Flex>
  );
}
