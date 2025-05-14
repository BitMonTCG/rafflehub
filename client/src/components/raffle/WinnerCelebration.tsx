import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Confetti } from '@/components/ui/confetti';

interface WinnerCelebrationProps {
  isVisible: boolean;
  message?: string;
  onClose?: () => void;
  autoHideDuration?: number;
}

const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  isVisible,
  message = 'Congratulations! You won!',
  onClose,
  autoHideDuration = 7000 // 7 seconds
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      setShowConfetti(true);
      
      // Auto-hide after duration
      if (autoHideDuration) {
        const timer = setTimeout(() => {
          setShow(false);
          if (onClose) onClose();
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
      setShowConfetti(false);
    }
  }, [isVisible, autoHideDuration, onClose]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };
  
  if (!show) return null;
  
  return (
    <>
      <Confetti active={showConfetti} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="w-20 h-20 mx-auto bg-[#FFDE00] rounded-full flex items-center justify-center mb-6">
            <Trophy className="h-10 w-10 text-[#212121]" />
          </div>
          
          <motion.h2 
            className="text-2xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {message}
          </motion.h2>
          
          <motion.p 
            className="text-gray-600 dark:text-gray-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You've won this amazing Pokémon card! Claim your prize now at a special discounted price.
          </motion.p>
          
          <motion.div
            className="flex flex-col space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button 
              className="bg-[#FF5350] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#E94743] transition-colors"
              onClick={() => {
                setShow(false);
                if (onClose) onClose();
              }}
            >
              Claim Prize
            </button>
            
            <button 
              className="text-gray-500 hover:underline"
              onClick={() => {
                setShow(false);
                if (onClose) onClose();
              }}
            >
              View Later
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default WinnerCelebration; 