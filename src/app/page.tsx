'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, FileText, Edit3, Brain, Sparkles } from 'lucide-react';
import LinearPage from './linear/components/linearpage';

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
    setParticles([...Array(16)].map((_, i) => ({
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
          className={`absolute w-1 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full ${particle.className}`}
          style={particle.style}
        />
      ))}
    </div>
  );
}

function FloatingElement({ className = "", gradient = "from-indigo-500/10 to-purple-500/10" }) {
  return (
    <div className={`absolute rounded-full bg-gradient-to-br ${gradient} blur-3xl animate-pulse-soft ${className}`} />
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <div 
      className={`group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={24} className="text-white" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-100 transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
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
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Animated background elements */}
      <AnimatedParticles />
      
      {/* Floating elements with design system colors */}
      <FloatingElement className="w-96 h-96 top-1/4 left-1/6 animate-float-slow" gradient="from-indigo-500/10 to-purple-500/10" />
      <FloatingElement className="w-72 h-72 bottom-1/3 right-1/5 animate-float-slower" gradient="from-purple-500/10 to-pink-500/10" />
      <FloatingElement className="w-48 h-48 top-1/3 right-1/4 animate-float-slow" gradient="from-blue-500/10 to-indigo-500/10" />

      {/* Main content */}
      <div className={`relative z-10 text-center space-y-8 px-6 max-w-4xl transition-all duration-1000 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
        
        {/* Brand mark */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur-lg animate-pulse-glow" />
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl shadow-2xl animate-bounce-gentle transform group-hover:scale-110 transition-transform duration-300">
              <div className="flex items-center justify-center">
                <FileText size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main heading */}
        <div className="space-y-6">
          <h1 className="text-white text-5xl md:text-7xl font-black tracking-tight leading-tight">
            <span className="inline-block animate-slide-in-left bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Note
            </span>
            <br />
            <span className="inline-block animate-slide-in-right bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Canvas
            </span>
          </h1>
          
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in-delayed-1">
            Transform your thoughts into beautiful, organized notes. Experience the future of digital note-taking with our intuitive canvas.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16 animate-fade-in-delayed-2">
          <FeatureCard 
            icon={Edit3}
            title="Intuitive Writing"
            description="Write naturally with our distraction-free interface designed for focus and creativity."
            delay={0.5}
          />
          <FeatureCard 
            icon={Brain}
            title="Mind Mapping"
            description="Visualize your thoughts with intelligent mind maps that connect your ideas seamlessly."
            delay={0.7}
          />
          <FeatureCard 
            icon={Sparkles}
            title="Smart Organization"
            description="Automatically organize and categorize your notes with powerful search and tagging."
            delay={0.9}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16 animate-fade-in-delayed-2">
          <button
            onClick={() => setShowLinear(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-2 active:scale-95 flex items-center gap-3 shadow-2xl">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </button>
          
          <button className="group relative">
            <div className="absolute inset-0 bg-white/10 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-transparent border-2 border-white/30 text-white text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-2 active:scale-95 hover:bg-white/10 hover:border-white/50 shadow-lg">
              Learn More
            </div>
          </button>
        </div>

        {/* Stats or additional info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-16 text-center animate-fade-in-delayed-3">
          <div className="group">
            <div className="text-3xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors duration-300">10K+</div>
            <div className="text-gray-400 text-sm">Active Users</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-600"></div>
          <div className="group">
            <div className="text-3xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors duration-300">50K+</div>
            <div className="text-gray-400 text-sm">Notes Created</div>
          </div>
          <div className="hidden sm:block w-px h-8 bg-gray-600"></div>
          <div className="group">
            <div className="text-3xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors duration-300">99%</div>
            <div className="text-gray-400 text-sm">Satisfaction</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
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

        .animate-fade-in-delayed-1 {
          animation: fade-in-delayed 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.2s both;
          will-change: opacity, transform;
        }

        .animate-fade-in-delayed-2 {
          animation: fade-in-delayed 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.4s both;
          will-change: opacity, transform;
        }

        .animate-fade-in-delayed-3 {
          animation: fade-in-delayed 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1.6s both;
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