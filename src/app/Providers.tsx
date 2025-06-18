// src/app/Providers.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme as RadixTheme } from "@radix-ui/themes";
import { MantineProvider } from "@mantine/core";
import { Toaster } from "sonner"; // just this import, no diff markers

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} light`}
    >
      <body className="antialiased">
        <MantineProvider defaultColorScheme="light">
          <RadixTheme>
            {children}
            <Toaster richColors />
          </RadixTheme>
        </MantineProvider>
      </body>
    </html>
  );
}
