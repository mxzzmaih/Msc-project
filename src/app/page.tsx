"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import LinearPage from "./linear/components/linearpage";

function AnimatedParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    className: string;
    style: {
      left: string;
      top: string;
      animationDelay: string;
      animationDuration: string;
    };
  }>>([]);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    setParticles([...Array(12)].map((_, i) => ({
      id: i,
      className: `animate-float-${(i % 3) + 1}`,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      }
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-1 h-1 bg-white/30 rounded-full ${particle.className}`}
          style={particle.style}
        />
      ))}
    </div>
  );
}

function FloatingElement({ className = "" }) {
  return (
    <div className={`absolute rounded-full bg-white/3 blur-2xl animate-pulse-soft ${className}`} />
  );
}

export default function HomePage() {
  const [showLinear, setShowLinear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (showLinear) {
    return <LinearPage onBack={() => setShowLinear(false)} />;
  }

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Image with effects */}
      <div className="absolute inset-0">
        <img
          src="/london4.jpg"
          alt="Background"
          className="w-full h-full object-cover animate-ken-burns"
          style={{ aspectRatio: "2048 / 1367" }}
          loading="eager"
        />
        
        {/* Multiple gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/60" />
      </div>

      {/* Animated background elements */}
      <AnimatedParticles />
      
      {/* Floating elements */}
      <FloatingElement className="w-96 h-96 top-1/4 left-1/6 animate-float-slow" />
      <FloatingElement className="w-72 h-72 bottom-1/3 right-1/5 animate-float-slower" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-3" />

      {/* Main content */}
      <div className={`relative z-10 text-center space-y-8 px-6 max-w-2xl transition-all duration-1000 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
        
        {/* Brand mark */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-lg animate-pulse-glow" />
            <div className="relative bg-white p-3 rounded-xl shadow-2xl animate-bounce-gentle">
              <div className="w-6 h-6 bg-black rounded-md" />
            </div>
          </div>
        </div>

        {/* Main heading */}
        <div className="space-y-4">
          <h1 className="text-white text-4xl md:text-6xl font-black tracking-tight leading-tight">
            <span className="inline-block animate-slide-in-left">
              Note
            </span>
            <br />
            <span className="inline-block animate-slide-in-right text-white/95">
              Canvas
            </span>
          </h1>
        </div>

        {/* Action button */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-delayed-2">
          <button
            onClick={() => setShowLinear(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white/15 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white text-black text-lg md:text-xl px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-2 active:scale-95 flex items-center gap-3 shadow-2xl">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
        }

        @keyframes ken-burns {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .animate-ken-burns {
          animation: ken-burns 25s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: opacity, transform;
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s both;
          will-change: opacity, transform;
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.8s both;
          will-change: opacity, transform;
        }

        @keyframes fade-in-delayed {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in-delayed-2 {
          animation: fade-in-delayed 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.4s both;
          will-change: opacity, transform;
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }

        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-15px) translateX(8px); }
          50% { transform: translateY(-8px) translateX(-4px); }
          75% { transform: translateY(-20px) translateX(4px); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-12px) translateX(-6px); }
          66% { transform: translateY(-18px) translateX(10px); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-25px) translateX(-12px); }
        }

        .animate-float-1 { 
          animation: float-1 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }
        .animate-float-2 { 
          animation: float-2 12s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }
        .animate-float-3 { 
          animation: float-3 14s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          33% { transform: translateY(-25px) translateX(15px) scale(1.1); }
          66% { transform: translateY(-40px) translateX(-10px) scale(0.9); }
        }

        .animate-float-slow {
          animation: float-slow 22s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }

        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-35px) translateX(-20px) scale(1.2); }
        }

        .animate-float-slower {
          animation: float-slower 28s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: transform;
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        .animate-pulse-soft {
          animation: pulse-soft 5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: opacity, transform;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          will-change: opacity, transform;
        }

        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Performance optimizations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}