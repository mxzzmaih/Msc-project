// src/app/page.tsx
"use client";

import LinearPage from "./linear/components/linearpage";
import { Flex, Text } from "@radix-ui/themes";

export default function HomePage() {
  return (
    <>
      

      {/* now this will render your sidebar + grid (including the + New note button) */}
      <LinearPage />
    </>
  );
}
