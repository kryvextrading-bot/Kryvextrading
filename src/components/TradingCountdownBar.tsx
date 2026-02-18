import { useState, useEffect } from 'react';

interface TradingCountdownBarProps {
  expiryTime: string | Date;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TradingCountdownBar: React.FC<TradingCountdownBarProps> = ({
  expiryTime,
  onComplete,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const expiry = new Date(expiryTime).getTime();
    const now = Date.now();
    const initialTimeLeft = Math.max(0, Math.floor((expiry - now) / 1000));
    
    setTimeLeft(initialTimeLeft);
    setIsRunning(initialTimeLeft > 0);

    if (initialTimeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, onComplete]);

  // Calculate progress based on original duration (assuming 60s max)
  const maxDuration = 60;
  const progress = ((maxDuration - timeLeft) / maxDuration) * 100;
  
  const getBarColor = () => {
    if (timeLeft <= 5) return 'bg-red-500';
    if (timeLeft <= 10) return 'bg-yellow-500';
    if (timeLeft <= 20) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (!isRunning && timeLeft === 0) {
    return (
      <div className={`countdown-bar ${className}`}>
        <div className={`w-full ${heightClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
          <div className="h-full bg-red-500" style={{ width: '100%' }} />
        </div>
        {showLabel && (
          <div className="flex justify-between mt-1">
            <span className={`text-red-500 font-medium ${textClasses[size]}`}>Expired</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`countdown-bar ${className}`}>
      <div className={`w-full ${heightClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${getBarColor()} transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className={`text-gray-600 ${textClasses[size]}`}>Time remaining:</span>
          <span className={`font-mono font-medium ${
            timeLeft <= 5 ? 'text-red-500' : 
            timeLeft <= 10 ? 'text-yellow-600' : 
            timeLeft <= 20 ? 'text-orange-600' : 'text-green-600'
          } ${textClasses[size]}`}>
            {timeLeft}s
          </span>
        </div>
      )}
    </div>
  );
};

export default TradingCountdownBar;
