// src/app/page.tsx
"use client";

import LinearPage from "./linear/components/linearpage";
import { Flex, Text } from "@radix-ui/themes";

export default function HomePage() {
  return (
    <>
      <Flex direction="column" gap="4" className="p-6">
        <Text size="6" className="font-bold">Welcome!</Text>
        <Text size="3">Here are your notes:</Text>
      </Flex>

      {/* now this will render your sidebar + grid (including the + New note button) */}
      <LinearPage />
    </>
  );
}
