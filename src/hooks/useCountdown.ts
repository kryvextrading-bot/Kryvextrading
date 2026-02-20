import { useState, useEffect, useCallback } from 'react';

export interface CountdownState {
  remainingSeconds: number;
  progress: number;
  isExpired: boolean;
  formatted: string;
}

export const useCountdown = (endTime: number | Date) => {
  const [state, setState] = useState<CountdownState>({
    remainingSeconds: 0,
    progress: 0,
    isExpired: false,
    formatted: ''
  });

  const calculateRemaining = useCallback(() => {
    const end = typeof endTime === 'number' ? endTime : endTime.getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((end - now) / 1000));
    
    return remaining;
  }, [endTime]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds > 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSecs = seconds % 60;
      return `${minutes}:${remainingSecs.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  }, []);

  useEffect(() => {
    const end = typeof endTime === 'number' ? endTime : endTime.getTime();
    const duration = (end - Date.now()) / 1000; // Total duration in seconds

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      const progress = 1 - (remaining / duration);
      
      setState({
        remainingSeconds: remaining,
        progress: Math.max(0, Math.min(1, progress)),
        isExpired: remaining === 0,
        formatted: formatTime(remaining)
      });

      if (remaining === 0) {
        clearInterval(timer);
      }
    }, 100); // Update 10 times per second for smooth progress bar

    return () => clearInterval(timer);
  }, [endTime, calculateRemaining, formatTime]);

  return state;
};
