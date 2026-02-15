import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  expiresAt: number;
  onExpire?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  expiresAt, 
  onExpire,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const getColor = () => {
    if (seconds > 30) return 'text-green-400';
    if (seconds > 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAnimation = () => {
    if (seconds <= 10) {
      return { scale: [1, 1.1, 1] };
    }
    return {};
  };

  return (
    <motion.div 
      animate={getAnimation()}
      transition={{ repeat: Infinity, duration: 0.5 }}
      className={`font-mono font-bold ${getColor()} ${className}`}
    >
      {minutes > 0 ? (
        <span>{minutes}:{remainingSeconds.toString().padStart(2, '0')}</span>
      ) : (
        <span>{seconds}s</span>
      )}
    </motion.div>
  );
};
