import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart, Ticket } from 'lucide-react';

interface PurchaseTicketAnimationProps {
  isVisible: boolean;
  onClose?: () => void;
  autoHideDuration?: number;
  cardImage?: string;
  cardName?: string;
}

// Small ticket component that flies around
const FlyingTicket = ({ index }: { index: number }) => {
  // Random position, size and rotation for each ticket
  const size = Math.random() * 10 + 20; // Size between 20-30px
  const xStart = Math.random() * 100 - 50; // Start position
  const yStart = Math.random() * 50;
  const xEnd = xStart + (Math.random() * 200 - 100); // End position (random direction)
  const yEnd = yStart - Math.random() * 100 - 50; // Always fly upward
  const rotation = Math.random() * 360;
  const duration = Math.random() * 1 + 1.5; // Between 1.5-2.5 seconds
  const delay = Math.random() * 0.5;
  
  return (
    <motion.div
      className="absolute"
      initial={{ 
        x: xStart, 
        y: yStart, 
        rotate: rotation,
        opacity: 0,
        scale: 0.5
      }}
      animate={{ 
        x: xEnd,
        y: yEnd,
        rotate: rotation + 360,
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.8]
      }}
      transition={{ 
        duration: duration,
        delay: delay,
        ease: "easeOut" 
      }}
    >
      <div className="text-[#FF5350]">
        <Ticket size={size} />
      </div>
    </motion.div>
  );
};

const PurchaseTicketAnimation: React.FC<PurchaseTicketAnimationProps> = ({
  isVisible,
  onClose,
  autoHideDuration = 3000, // 3 seconds
  cardImage,
  cardName
}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
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
    }
  }, [isVisible, autoHideDuration, onClose]);
  
  // Ticket flying animation
  const ticketVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.5, 
      y: 100,
      rotate: -15
    },
    animate: { 
      opacity: [0, 1, 1, 0.8],
      scale: [0.5, 1.2, 1],
      y: [100, -20, 0],
      rotate: [-15, 5, 0],
      transition: { 
        duration: 0.8,
        times: [0, 0.6, 1],
        ease: "easeOut" 
      }
    },
    exit: { 
      opacity: 0,
      y: -50,
      transition: { duration: 0.3 }
    }
  };
  
  // Success checkmark animation
  const checkmarkVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.5
    },
    animate: { 
      opacity: 1, 
      scale: [0.5, 1.2, 1],
      transition: { 
        delay: 0.6,
        duration: 0.5,
        times: [0, 0.6, 1],
        ease: "easeOut" 
      }
    }
  };
  
  // Container animation
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { 
        delay: 0.2,
        duration: 0.3 
      }
    }
  };
  
  // Generate 10 flying tickets
  const flyingTickets = Array.from({ length: 10 }).map((_, i) => (
    <FlyingTicket key={i} index={i} />
  ));
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="relative flex flex-col items-center">
            {/* Flying ticket main animation */}
            <motion.div
              className="bg-white rounded-lg shadow-xl p-4 w-56 flex flex-col items-center justify-center text-center border-2 border-[#FF5350]"
              variants={ticketVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex items-center mb-2">
                <ShoppingCart className="h-6 w-6 text-[#FF5350] mr-2" />
                <Ticket className="h-5 w-5 text-[#FF5350]" />
              </div>
              
              <p className="font-bold text-lg text-[#212121]">Ticket Purchased!</p>
              
              {cardImage && (
                <div className="flex items-center mt-2">
                  <div className="h-12 w-8 mr-2">
                    <img src={cardImage} alt={cardName || "Card"} className="h-full w-full object-cover rounded" />
                  </div>
                  {cardName && <p className="text-sm text-gray-600">{cardName}</p>}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">Good luck in the raffle!</p>
            </motion.div>
            
            {/* Success checkmark animation */}
            <motion.div
              className="absolute top-0 mt-36 h-12 w-12 bg-green-500 rounded-full flex items-center justify-center"
              variants={checkmarkVariants}
              initial="initial"
              animate="animate"
            >
              <Check className="h-6 w-6 text-white" />
            </motion.div>
            
            {/* Flying tickets around the main element */}
            {flyingTickets}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseTicketAnimation; 