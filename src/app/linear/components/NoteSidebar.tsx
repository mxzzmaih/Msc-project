"use client";

import { Flex, Text } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";

export default function NotesSidebar({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <Flex direction="column" className="h-full p-4" gap="4">
      <Text size="4" className="font-bold">
        Library
      </Text>

      <div className="mt-auto">
        <Button className="w-full" size="sm" onClick={onCreate}>
          + New note
        </Button>
      </div>
    </Flex>
  );
}
