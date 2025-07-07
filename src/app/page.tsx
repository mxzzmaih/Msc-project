"use client";

import { useState } from "react";
import LinearPage from "./linear/components/linearpage";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [showLinear, setShowLinear] = useState(false);

  if (showLinear) return <LinearPage />;

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Image */}
      <img
        src="/london4.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ aspectRatio: "2048 / 1367" }}
      />

      {/* Dark gradient overlay to improve contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

      {/* Center Content */}
      <div className="relative z-10 text-center space-y-6 px-4 animate-fade-in">
        <h1 className="text-white text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          Welcome to the App
        </h1>
        <Button
          onClick={() => setShowLinear(true)}
          className="text-white text-lg md:text-xl px-8 py-4 rounded-lg shadow-xl backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 transition-transform duration-300 ease-in-out transform hover:scale-105 animate-pulse"
        >
          Linear Note Taking
        </Button>
      </div>
    </div>
  );
}
