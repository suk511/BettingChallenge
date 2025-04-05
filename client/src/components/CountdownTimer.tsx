import React, { useEffect, useState } from 'react';
import { formatTimeAmPm } from '@/lib/utils';

interface CountdownTimerProps {
  seconds: number;
  roundNumber: number;
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, roundNumber, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [nextDraw, setNextDraw] = useState('');

  // Initialize time
  useEffect(() => {
    setTimeLeft(seconds);
    
    // Calculate next draw time
    const now = new Date();
    const nextDrawTime = new Date(now.getTime() + seconds * 1000);
    setNextDraw(formatTimeAmPm(nextDrawTime));
  }, [seconds]);

  // Set up countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const remainingSeconds = timeLeft % 60;

  return (
    <div className="flex items-center justify-end">
      <div className="text-white text-lg">Time</div>
      <div className="ml-2 flex items-center">
        <div className="bg-white rounded-md px-3 py-1 text-xl font-bold mx-0.5">
          {minutes < 10 ? "0" + minutes : minutes}
        </div>
        <div className="mx-0.5 text-white font-bold">:</div>
        <div className="bg-white rounded-md px-3 py-1 text-xl font-bold mx-0.5">
          {remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds}
        </div>
      </div>
      <div className="ml-3 text-xs text-white opacity-70">
        {roundNumber.toString().padStart(5, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer;
