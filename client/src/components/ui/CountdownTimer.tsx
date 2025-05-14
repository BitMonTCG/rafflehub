import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDetailedTimeRemaining } from '@/utils/format';

interface CountdownTimerProps {
  endDate: string | Date | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endDate, 
  className = '', 
  size = 'md',
  showIcon = true
}) => {
  // Handle case when endDate is undefined
  if (!endDate) {
    return (
      <div className={`flex items-center text-gray-500 ${className} ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        {showIcon && <Clock className="mr-1" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
        <span>No end date</span>
      </div>
    );
  }

  const [timeLeft, setTimeLeft] = useState(getDetailedTimeRemaining(endDate));
  const [isEnded, setIsEnded] = useState(timeLeft.total <= 0);
  
  useEffect(() => {
    if (isEnded) return;
    
    const timer = setInterval(() => {
      const updated = getDetailedTimeRemaining(endDate);
      setTimeLeft(updated);
      
      if (updated.total <= 0) {
        setIsEnded(true);
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endDate, isEnded]);
  
  // Determine text size based on the size prop
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Determine icon size based on the size prop
  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  };
  
  // Determine digit size based on the size prop
  const digitSize = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-medium',
    lg: 'text-base font-bold'
  };
  
  const AnimatedDigit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center mx-1">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`${digitSize[size]} text-[#3B4CCA]`}
        >
          {value.toString().padStart(2, '0')}
        </motion.div>
      </AnimatePresence>
      <span className={`${textSizeClasses[size]} text-gray-500`}>{label}</span>
    </div>
  );
  
  if (isEnded) {
    return (
      <div className={`flex items-center text-red-500 ${className} ${textSizeClasses[size]}`}>
        {showIcon && <Clock className="mr-1" size={iconSize[size]} />}
        <span>Ended</span>
      </div>
    );
  }
  
  const shouldShowDays = timeLeft.days > 0;
  const shouldShowHours = shouldShowDays || timeLeft.hours > 0;
  
  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <Clock className="mr-1 text-gray-500" size={iconSize[size]} />}
      <span className={`mr-1 text-gray-500 ${textSizeClasses[size]}`}>Ends in</span>
      <div className="flex items-center">
        {shouldShowDays && (
          <AnimatedDigit value={timeLeft.days} label="d" />
        )}
        {shouldShowHours && (
          <AnimatedDigit value={timeLeft.hours} label="h" />
        )}
        <AnimatedDigit value={timeLeft.minutes} label="m" />
        <AnimatedDigit value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
};

export default CountdownTimer; 