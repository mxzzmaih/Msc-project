"use client";

import NoteSidebar from "./NoteSidebar";
import { Flex, Text } from "@radix-ui/themes";

export default function LinearPage() {
  return (
    <Flex className="h-screen">
      <aside className="w-1/4 border-r border-border">
        <NoteSidebar />
      </aside>
      <main className="flex-1 p-6">
        <Text size="6" className="font-bold">
          All notes
        </Text>
      </main>
    </Flex>
  );
}
