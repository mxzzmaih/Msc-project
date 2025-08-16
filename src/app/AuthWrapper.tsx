'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import AuthPage from './sign-up/page'; // Your existing auth page

interface AuthWrapperProps {
  onBack: () => void;
  onAuthSuccess: () => void;
}

export default function AuthWrapper({ onBack, onAuthSuccess }: AuthWrapperProps) {
  return (
    <div className="relative min-h-screen">
      {/* Back button overlay */}
      <div className="absolute top-6 left-6 z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
        >
          <ArrowRight size={20} className="rotate-180" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>
      
      {/* Your existing auth page */}
      <AuthPage onAuthSuccess={onAuthSuccess} />
    </div>
  );
}