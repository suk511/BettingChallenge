import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { formatTimeAmPm } from '@/lib/utils';

interface CountdownTimerProps {
  onComplete?: () => void;
}

const CountdownTimer = ({ onComplete }: CountdownTimerProps) => {
  const { countdown, setCountdown, nextDrawTime, setNextDrawTime } = useGameStore();
  const [circumference] = useState(283); // 2 * PI * r where r is 45
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate next draw time
  useEffect(() => {
    const now = new Date();
    const nextDraw = new Date(now.getTime() + countdown * 1000);
    setNextDrawTime(formatTimeAmPm(nextDraw));
  }, [countdown, setNextDrawTime]);

  // Set up countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          // Reset timer to 60 seconds
          const resetValue = 60;
          
          // Call onComplete callback
          if (onComplete) {
            onComplete();
          }
          
          // Calculate new draw time
          const now = new Date();
          const nextDraw = new Date(now.getTime() + resetValue * 1000);
          setNextDrawTime(formatTimeAmPm(nextDraw));
          
          return resetValue;
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setCountdown, setNextDrawTime, onComplete]);

  // Calculate stroke dashoffset based on countdown
  const dashOffset = circumference - (countdown / 60) * circumference;

  return (
    <div className="flex items-center space-x-4">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8"></circle>
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#3f51b5" 
            strokeWidth="8" 
            className="countdown-animation" 
            style={{ strokeDashoffset: dashOffset }}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-[#3f51b5]">
          {countdown}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-500">Next Result</div>
        <div className="font-bold text-lg">{nextDrawTime}</div>
      </div>
    </div>
  );
};

export default CountdownTimer;
