import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScratchCardProps {
  width?: number;
  height?: number;
  coverColor?: string;
  brushSize?: number;
  revealThreshold?: number; // 0 to 1, percentage scratched to auto-reveal
  onComplete?: () => void;
  children: React.ReactNode; // The hidden content
}

export const ScratchCard: React.FC<ScratchCardProps> = ({
  width = 300,
  height = 150,
  coverColor = '#cbd5e1', // Slate 300
  brushSize = 24,
  revealThreshold = 0.5,
  onComplete,
  children
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill the canvas with cover color
    ctx.fillStyle = coverColor;
    ctx.fillRect(0, 0, width, height);

    // Optional: Add some text or pattern to the cover
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#64748b'; // Slate 500
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Scratch Here!', width / 2, height / 2);

  }, [width, height, coverColor]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    // Calculate scale in case canvas is resized by CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const checkRevealThreshold = () => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    // Check alpha channel for every pixel (every 4th value)
    // Optimization: check every 4th pixel instead of all to improve performance
    const totalPixelsToCheck = pixels.length / 16; 
    
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    if (transparentPixels / totalPixelsToCheck > revealThreshold) {
      setIsRevealed(true);
      if (onComplete) onComplete();
    }
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || isRevealed) return;
    e.preventDefault(); // Prevent scrolling on touch

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { x, y } = getPointerPos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();

    // Check threshold periodically (e.g. throttle in real app)
    if (Math.random() > 0.8) {
      checkRevealThreshold();
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsScratching(true);
    scratch(e);
  };

  const handleEnd = () => {
    setIsScratching(false);
    checkRevealThreshold();
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl shadow-md cursor-crosshair select-none"
      style={{ width, height }}
    >
      {/* Hidden Content (Revealed underneath) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-white p-4">
        {children}
      </div>

      {/* The Scratchable Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-1000",
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onMouseDown={handleStart}
        onMouseMove={scratch}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={scratch}
        onTouchEnd={handleEnd}
      />
    </div>
  );
};
