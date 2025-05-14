import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ConfettiPieceProps {
  index: number;
  colors: string[];
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index, colors }) => {
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const isRectangle = Math.random() > 0.5;
  const size = Math.random() * 10 + 5; // Size between 5px and 15px
  
  // Random position within the viewport
  const xPos = Math.random() * 100; // percentage across screen
  const yStart = -10; // Start above the viewport
  
  // Animation properties
  const duration = Math.random() * 3 + 2; // Between 2-5 seconds
  const delay = Math.random() * 0.5; // Random delay for more natural effect
  
  // Random rotation
  const rotate = Math.random() * 360;
  const rotateSpeed = Math.random() * 360 - 180; // Rotation amount during fall
  
  return (
    <motion.div
      key={index}
      initial={{ 
        x: `${xPos}%`, 
        y: yStart, 
        rotate: rotate,
        opacity: 1
      }}
      animate={{ 
        y: '110vh', 
        rotate: rotate + rotateSpeed,
        opacity: [1, 1, 0.8, 0] 
      }}
      transition={{ 
        duration: duration,
        delay: delay,
        ease: "easeIn"
      }}
      style={{
        position: 'absolute',
        width: isRectangle ? size : size / 2,
        height: isRectangle ? size / 3 : size / 2,
        backgroundColor: randomColor,
        borderRadius: isRectangle ? '2px' : '50%',
        zIndex: 9999
      }}
    />
  );
};

interface ConfettiProps {
  active?: boolean;
  pieces?: number;
  colors?: string[];
  duration?: number;
}

const Confetti: React.FC<ConfettiProps> = ({ 
  active = false, 
  pieces = 200,
  colors = ['#FF5350', '#3B4CCA', '#FFDE00', '#4DAD5B', '#FF85DD'], // Pokemon colors
  duration = 5
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const controls = useAnimation();
  
  useEffect(() => {
    if (active) {
      setIsComplete(false);
      controls.start("animate");
      
      // Hide confetti after duration
      const timer = setTimeout(() => {
        setIsComplete(true);
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration, controls]);
  
  if (!active || isComplete) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      pointerEvents: 'none', 
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {Array.from({ length: pieces }).map((_, i) => (
        <ConfettiPiece key={i} index={i} colors={colors} />
      ))}
    </div>
  );
};

export { Confetti }; 