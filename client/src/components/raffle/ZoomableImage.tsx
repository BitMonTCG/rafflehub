import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, MoveHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

interface ZoomableImageProps {
  imageUrl: string;
  alt: string;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ imageUrl, alt }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const SCALE_STEP = 0.25;

  // Reset position when scale is 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  };

  const handleSliderChange = (value: number[]) => {
    setScale(value[0]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(MAX_SCALE);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={containerRef}
        className={`relative overflow-hidden w-full max-w-md h-96 bg-gray-100 rounded-xl ${scale > 1 ? 'cursor-move' : 'cursor-zoom-in'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        style={{ touchAction: 'none' }}
      >
        <motion.div
          animate={{
            scale,
            x: position.x,
            y: position.y,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            duration: 0.1
          }}
          className="w-full h-full"
        >
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-contain"
            draggable="false"
          />
        </motion.div>
        {scale > 1 && (
          <div className="absolute bottom-2 left-2 text-xs text-white px-2 py-1 bg-black/50 rounded-md">
            <MoveHorizontal className="h-3 w-3 inline mr-1" />
            Drag to pan
          </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-3 mt-4 w-full max-w-md">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          disabled={scale <= MIN_SCALE}
          className="h-8 w-8"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Slider
          value={[scale]}
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={SCALE_STEP}
          className="w-full max-w-xs"
          onValueChange={handleSliderChange}
        />
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          disabled={scale >= MAX_SCALE}
          className="h-8 w-8"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-sm text-gray-500 mt-2">
        {Math.round(scale * 100)}% • Double-click to {scale > 1 ? 'reset' : 'zoom'}
      </div>
    </div>
  );
};

export default ZoomableImage; 