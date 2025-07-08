"use client";

import { useState, useEffect } from "react";
import { Plus, X, ArrowLeft, Pin } from "lucide-react";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-black">
      {/* 3D Floating geometric shapes */}
      <div className="floating-shape shape-1"></div>
      <div className="floating-shape shape-2"></div>
      <div className="floating-shape shape-3"></div>
      <div className="floating-shape shape-4"></div>
      <div className="floating-shape shape-5"></div>
      <div className="floating-shape shape-6"></div>
      <div className="floating-shape shape-7"></div>
      
      {/* 3D Floating cubes */}
      <div className="floating-cube cube-1"></div>
      <div className="floating-cube cube-2"></div>
      <div className="floating-cube cube-3"></div>
      
      {/* 3D Floating rings */}
      <div className="floating-ring ring-1"></div>
      <div className="floating-ring ring-2"></div>
      
      {/* Enhanced particles with 3D movement */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>

      {/* 3D Grid overlay with depth */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* 3D Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-3" />
    </div>
  );
}

function TextEditor({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange: (val: string) => void;
}) {
  return (
    <textarea
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      placeholder="Start writing your thoughts..."
      className="w-full h-full p-6 bg-transparent text-black placeholder:text-gray-400 resize-none focus:outline-none font-light leading-relaxed text-lg smooth-focus"
    />
  );
}

type Block = {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isPinned: boolean;
};

function DraggableNote({
  block,
  onUpdate,
  onDelete,
  bringToFront,
  onSwap,
  canPin,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  bringToFront: () => void;
  onSwap: (sourceId: string, targetId: string) => void;
  canPin: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "drag" | "resize"
  ) => {
    e.preventDefault();
    bringToFront();
    if (type === "drag") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - block.x, y: e.clientY - block.y });
    } else {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePin = () => {
    if (block.isPinned) {
      onUpdate({ isPinned: false });
    } else if (canPin) {
      onUpdate({ isPinned: true });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Constrain to canvas bounds and prevent negative positions
        const constrainedX = Math.max(0, Math.min(newX, 2680));
        const constrainedY = Math.max(0, Math.min(newY, 1760));
        
        onUpdate({
          x: constrainedX,
          y: constrainedY,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        onUpdate({
          width: Math.max(200, Math.min(500, block.width + deltaX)),
          height: Math.max(150, Math.min(400, block.height + deltaY)),
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetNoteElement = elements.find(el => 
          el.classList.contains('note-card') && 
          el.getAttribute('data-note-id') !== block.id
        );
        
        if (targetNoteElement) {
          const targetId = targetNoteElement.getAttribute('data-note-id');
          if (targetId) {
            onSwap(block.id, targetId);
          }
        }
      }
      
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove, { passive: true });
      document.addEventListener("mouseup", handleMouseUp, { passive: true });
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, block, onUpdate, onSwap]);

  return (
    <div
      onMouseDown={bringToFront}
      data-note-id={block.id}
      className={`group absolute bg-white border overflow-hidden flex flex-col note-card ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${block.isPinned ? 'pinned' : ''}`}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
        zIndex: block.zIndex,
        borderRadius: block.isPinned ? '24px' : '24px',
        borderColor: block.isPinned ? '#f59e0b' : '#f3f4f6',
        borderWidth: block.isPinned ? '3px' : '1px',
        boxShadow: block.isPinned 
          ? '0 0 0 1px rgba(245, 158, 11, 0.3), 0 25px 50px rgba(245, 158, 11, 0.2), 0 15px 30px rgba(0, 0, 0, 0.1), 0 0 20px rgba(245, 158, 11, 0.1)'
          : '0 10px 25px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div 
        className={`flex items-center justify-between px-6 py-4 border-b note-header cursor-move ${
          block.isPinned 
            ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50' 
            : 'bg-white'
        }`} 
        style={{ 
          borderBottomColor: block.isPinned ? '#f59e0b' : '#f3f4f6',
          borderBottomWidth: block.isPinned ? '2px' : '1px'
        }}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
      >
        <input
          type="text"
          value={block.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Untitled Note"
          className="flex-1 text-lg font-medium bg-transparent text-black placeholder:text-gray-400 focus:outline-none smooth-focus cursor-text"
          onMouseDown={(e) => e.stopPropagation()}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handlePin}
            disabled={!block.isPinned && !canPin}
            className={`p-2 rounded-xl button-hover transition-all duration-300 ${
              block.isPinned 
                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200 shadow-md' 
                : canPin 
                  ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50' 
                  : 'text-gray-300 cursor-not-allowed'
            }`}
            title={block.isPinned ? 'Unpin' : canPin ? 'Pin' : 'Already have a pinned note'}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Pin className={`w-4 h-4 ${block.isPinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-xl text-gray-600 hover:text-red-600 button-hover transition-colors duration-300"
            title="Delete"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
        <TextEditor
          content={block.content}
          onContentChange={(val) => onUpdate({ content: val })}
        />
      </div>

      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize resize-handle"
        onMouseDown={(e) => handleMouseDown(e, "resize")}
      >
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-gray-300 rounded-full resize-dot opacity-60 hover:opacity-100 hover:bg-gray-400 transition-all duration-300" />
      </div>
    </div>
  );
}

function TiledNoteCanvas({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const bringBlockToFront = (id: string) => {
    const maxZ = Math.max(...blocks.map((b) => b.zIndex));
    onChange(
      blocks.map((b) =>
        b.id === id ? { ...b, zIndex: maxZ + 1 } : b
      )
    );
  };

  const swapPositions = (sourceId: string, targetId: string) => {
    const sourceIndex = blocks.findIndex(b => b.id === sourceId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    const newBlocks = [...blocks];
    const sourceBlock = newBlocks[sourceIndex];
    const targetBlock = newBlocks[targetIndex];
    
    [sourceBlock.x, targetBlock.x] = [targetBlock.x, sourceBlock.x];
    [sourceBlock.y, targetBlock.y] = [targetBlock.y, sourceBlock.y];
    
    onChange(newBlocks);
  };

  const pinnedCount = blocks.filter(b => b.isPinned).length;

  const repositionBlocks = (updatedBlocks: Block[]) => {
    const columns = 3;
    const margin = 40;
    const noteWidth = 320;
    const noteHeight = 240;

    // Sort blocks: pinned first, then by creation order
    const sortedBlocks = [...updatedBlocks].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return parseInt(a.id) - parseInt(b.id);
    });

    // Reposition all blocks
    return sortedBlocks.map((block, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        ...block,
        x: 60 + col * (noteWidth + margin),
        y: 80 + row * (noteHeight + margin),
      };
    });
  };

  return (
    <div className="relative w-[3000px] h-[2000px] min-h-[80vh] overflow-visible canvas-container">
      {blocks.map((block) => (
        <DraggableNote
          key={block.id}
          block={block}
          onUpdate={(updates) => {
            if (updates.isPinned && pinnedCount > 0 && !block.isPinned) {
              return;
            }
            
            const updatedBlocks = blocks.map((b) =>
              b.id === block.id ? { ...b, ...updates } : b
            );

            // If a note is being pinned/unpinned, reposition all blocks
            if (updates.hasOwnProperty('isPinned')) {
              onChange(repositionBlocks(updatedBlocks));
            } else {
              onChange(updatedBlocks);
            }
          }}
          onDelete={() =>
            onChange(blocks.filter((b) => b.id !== block.id))
          }
          bringToFront={() => bringBlockToFront(block.id)}
          onSwap={swapPositions}
          canPin={pinnedCount === 0 || block.isPinned}
        />
      ))}
    </div>
  );
}

interface LinearPageProps {
  onBack?: () => void;
}

export default function LinearPage({ onBack }: LinearPageProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showBanner, setShowBanner] = useState(true);
  const [bannerFading, setBannerFading] = useState(false);

  const handleAddNote = () => {
    // Start smooth fade out
    setBannerFading(true);
    
    // Remove banner after fade completes
    setTimeout(() => {
      setShowBanner(false);
    }, 1500); // Match the fade duration

    const noteIndex = blocks.length;
    const columns = 3;
    const margin = 40;
    const noteWidth = 320;
    const noteHeight = 240;

    const col = noteIndex % columns;
    const row = Math.floor(noteIndex / columns);

    const newBlock: Block = {
      id: Date.now().toString(),
      title: "",
      content: "",
      x: 60 + col * (noteWidth + margin),
      y: 80 + row * (noteHeight + margin),
      width: noteWidth,
      height: noteHeight,
      zIndex: Math.max(0, ...blocks.map((b) => b.zIndex)) + 1,
      isPinned: false,
    };

    setBlocks([...blocks, newBlock]);
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden font-sans">
      <AnimatedBackground />

      {showBanner && (
        <div className={`fixed top-1/2 left-1/2 z-50 bg-black text-white px-8 py-4 rounded-3xl font-medium shadow-2xl welcome-banner backdrop-blur-md border border-white/10 ${bannerFading ? 'banner-fade-out' : ''}`}>
          Note Canvas Ready — Click "Add Note" to begin
        </div>
      )}

      <main className="relative z-10 p-6 md:p-10 flex flex-col min-h-screen main-content">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6 header-content">
            {onBack && (
              <button
                onClick={onBack}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors duration-300 back-button"
                title="Back to Home"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
            )}
            <div className="flex items-center gap-4">
              <div className="p-4 bg-black rounded-2xl shadow-lg logo-container">
                <div className="w-6 h-6 bg-white rounded-lg logo-mark" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-black">Note Canvas</h1>
                <p className="text-lg text-gray-600 font-light">
                  Freely organize your thoughts
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleAddNote}
            className="group relative add-note-button"
          >
            <div className="absolute inset-0 bg-black/10 rounded-3xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-black text-white text-lg px-8 py-4 rounded-3xl shadow-xl transition-all duration-300 ease-out transform hover:scale-105 hover:-translate-y-1 active:scale-95 flex items-center gap-3 font-semibold">
              <Plus className="w-5 h-5" />
              Add Note
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-auto canvas-wrapper">
          <TiledNoteCanvas blocks={blocks} onChange={setBlocks} />
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridFloat 30s ease-in-out infinite;
        }

        .bg-mesh-gradient {
          background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(255,255,255,0.08) 0%, transparent 50%);
          animation: meshPulse 25s ease-in-out infinite;
        }

        @keyframes gridFloat {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(10px) translateY(-10px); }
        }

        @keyframes meshPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        .floating-shape {
          position: absolute;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 50%;
          backdrop-filter: blur(3px);
          animation: float3D 30s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .floating-cube {
          position: absolute;
          background: linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border-radius: 8px;
          backdrop-filter: blur(2px);
          animation: cube3D 35s ease-in-out infinite;
          transform-style: preserve-3d;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .floating-ring {
          position: absolute;
          border: 2px solid rgba(255,255,255,0.06);
          border-radius: 50%;
          backdrop-filter: blur(2px);
          animation: ring3D 25s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .shape-1 {
          width: 80px;
          height: 80px;
          top: 15%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 120px;
          height: 120px;
          top: 25%;
          right: 15%;
          animation-delay: -5s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 30%;
          left: 20%;
          animation-delay: -10s;
        }

        .shape-4 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          right: 25%;
          animation-delay: -15s;
        }

        .shape-5 {
          width: 70px;
          height: 70px;
          top: 60%;
          left: 60%;
          animation-delay: -20s;
        }

        .shape-6 {
          width: 90px;
          height: 90px;
          top: 45%;
          left: 75%;
          animation-delay: -25s;
        }

        .shape-7 {
          width: 110px;
          height: 110px;
          bottom: 40%;
          right: 10%;
          animation-delay: -30s;
        }

        .cube-1 {
          width: 40px;
          height: 40px;
          top: 20%;
          left: 50%;
          animation-delay: -8s;
        }

        .cube-2 {
          width: 60px;
          height: 60px;
          bottom: 35%;
          left: 40%;
          animation-delay: -18s;
        }

        .cube-3 {
          width: 35px;
          height: 35px;
          top: 70%;
          right: 30%;
          animation-delay: -28s;
        }

        .ring-1 {
          width: 80px;
          height: 80px;
          top: 35%;
          left: 25%;
          animation-delay: -12s;
        }

        .ring-2 {
          width: 120px;
          height: 120px;
          bottom: 25%;
          right: 40%;
          animation-delay: -22s;
        }

        @keyframes float3D {
          0%, 100% {
            transform: translateY(0px) translateX(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-40px) translateX(25px) translateZ(20px) rotateX(15deg) rotateY(45deg) scale(1.1);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) translateX(-15px) translateZ(-10px) rotateX(-10deg) rotateY(90deg) scale(0.9);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-60px) translateX(20px) translateZ(15px) rotateX(20deg) rotateY(135deg) scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes cube3D {
          0%, 100% {
            transform: translateY(0px) translateX(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1);
            opacity: 0.3;
          }
          33% {
            transform: translateY(-35px) translateX(20px) translateZ(25px) rotateX(45deg) rotateY(90deg) rotateZ(45deg) scale(1.2);
            opacity: 0.6;
          }
          66% {
            transform: translateY(-15px) translateX(-25px) translateZ(-15px) rotateX(-30deg) rotateY(180deg) rotateZ(-30deg) scale(0.8);
            opacity: 0.4;
          }
        }

        @keyframes ring3D {
          0%, 100% {
            transform: translateY(0px) translateX(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) scale(1);
            opacity: 0.3;
            border-color: rgba(255,255,255,0.06);
          }
          50% {
            transform: translateY(-45px) translateX(-30px) translateZ(20px) rotateX(180deg) rotateY(360deg) scale(1.3);
            opacity: 0.7;
            border-color: rgba(255,255,255,0.12);
          }
        }

        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          animation: particleFloat3D 20s linear infinite;
          transform-style: preserve-3d;
        }

        @keyframes particleFloat3D {
          0% {
            transform: translateY(100vh) translateX(0) translateZ(0) rotateX(0deg) rotateY(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) translateX(25px) translateZ(20px) rotateX(180deg) rotateY(180deg);
            opacity: 0.8;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(50px) translateZ(0) rotateX(360deg) rotateY(360deg);
            opacity: 0;
          }
        }

        .particle-1 { left: 15%; animation-delay: 0s; }
        .particle-2 { left: 25%; animation-delay: -2s; }
        .particle-3 { left: 35%; animation-delay: -4s; }
        .particle-4 { left: 45%; animation-delay: -6s; }
        .particle-5 { left: 55%; animation-delay: -8s; }
        .particle-6 { left: 65%; animation-delay: -10s; }
        .particle-7 { left: 75%; animation-delay: -12s; }
        .particle-8 { left: 85%; animation-delay: -14s; }
        .particle-9 { left: 20%; animation-delay: -16s; }
        .particle-10 { left: 70%; animation-delay: -18s; }
        .particle-11 { left: 30%; animation-delay: -20s; }
        .particle-12 { left: 60%; animation-delay: -22s; }
        .particle-13 { left: 40%; animation-delay: -24s; }
        .particle-14 { left: 80%; animation-delay: -26s; }
        .particle-15 { left: 50%; animation-delay: -28s; }

        .note-card.pinned {
          animation: pinGlow 2s ease-in-out infinite alternate;
        }

        @keyframes pinGlow {
          0% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 
                        0 25px 50px rgba(245, 158, 11, 0.2), 
                        0 15px 30px rgba(0, 0, 0, 0.1), 
                        0 0 20px rgba(245, 158, 11, 0.1);
          }
          100% {
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5), 
                        0 30px 60px rgba(245, 158, 11, 0.3), 
                        0 20px 40px rgba(0, 0, 0, 0.15), 
                        0 0 30px rgba(245, 158, 11, 0.2);
          }
        }

        .note-card.pinned:hover {
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.6), 
                      0 35px 70px rgba(245, 158, 11, 0.4), 
                      0 25px 50px rgba(0, 0, 0, 0.2), 
                      0 0 40px rgba(245, 158, 11, 0.3) !important;
        }

        .note-card {
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
                      box-shadow 0.3s ease,
                      border-color 0.2s ease;
          animation: slideIn 0.6s ease-out;
          transform-style: preserve-3d;
          perspective: 1000px;
          will-change: transform;
        }

        .note-card:hover {
          transform: translateY(-8px) scale(1.01) rotateX(1deg);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1);
        }

        .note-card.dragging {
          transform: scale(1.03) rotate(2deg) translateZ(30px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 15px 30px rgba(0, 0, 0, 0.15);
          z-index: 1000 !important;
        }

        .note-card.resizing {
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          transform: rotateX(1deg) rotateY(1deg);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .note-header {
          transition: all 0.3s ease;
        }

        .button-hover {
          transition: transform 0.2s ease, color 0.2s ease, background-color 0.2s ease;
        }

        .button-hover:hover {
          transform: scale(1.05);
        }

        .resize-handle {
          transition: transform 0.2s ease;
        }

        .resize-handle:hover .resize-dot {
          transform: scale(1.2);
        }

        .smooth-focus {
          transition: background-color 0.2s ease;
        }

        .smooth-focus:focus {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 8px;
        }

        .welcome-banner {
          animation: smoothBannerEntry 2s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translate(-50%, -50%);
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1), 
                      transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .banner-fade-out {
          opacity: 0 !important;
          transform: translate(-50%, -50%) scale(0.8) translateY(-30px) !important;
          filter: blur(10px) !important;
        }

        @keyframes smoothBannerEntry {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8) translateY(-30px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) translateY(0px);
            filter: blur(0px);
          }
        }

        .main-content {
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-content {
          animation: slideInLeft 1s ease-out;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .back-button:hover {
          transform: translateX(-3px);
        }

        .logo-container {
          animation: logoFloat 4s ease-in-out infinite;
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .logo-mark {
          animation: logoMarkPulse 3s ease-in-out infinite;
        }

        @keyframes logoMarkPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .add-note-button {
          animation: slideInRight 1s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .canvas-container {
          animation: canvasReveal 1.2s ease-out 0.3s both;
        }

        @keyframes canvasReveal {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .canvas-wrapper {
          border-radius: 30px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.01);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}