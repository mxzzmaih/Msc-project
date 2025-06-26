// src/app/Providers.tsx
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme as RadixTheme } from "@radix-ui/themes";
import { MantineProvider } from "@mantine/core";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

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
    <div className={`${geistSans.variable} ${geistMono.variable}`}>
      <MantineProvider defaultColorScheme="light">
        <RadixTheme>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </RadixTheme>
      </MantineProvider>
    </div>
  );
}
