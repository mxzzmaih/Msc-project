// src/app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./Providers";

export const metadata: Metadata = {
  title: "My Note App",
  description: "A Next.js note-taking app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
