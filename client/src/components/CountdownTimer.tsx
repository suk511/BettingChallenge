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
    <div className="flex flex-col items-end justify-end">
      <div className="text-white text-right text-lg font-medium mb-1">Time</div>
      <div className="flex items-center">
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-white rounded-md w-10 h-10 flex items-center justify-center text-xl font-bold shadow-inner">
            {minutes < 10 ? "0" : Math.floor(minutes/10)}
          </div>
          <div className="bg-white rounded-md w-10 h-10 flex items-center justify-center text-xl font-bold shadow-inner">
            {minutes < 10 ? minutes : minutes % 10}
          </div>
          <div className="text-white font-bold text-xl flex items-center justify-center">:</div>
          <div className="bg-white rounded-md w-10 h-10 flex items-center justify-center text-xl font-bold shadow-inner">
            {remainingSeconds < 10 ? "0" : Math.floor(remainingSeconds/10)}
          </div>
          <div className="bg-white rounded-md w-10 h-10 flex items-center justify-center text-xl font-bold shadow-inner">
            {remainingSeconds < 10 ? remainingSeconds : remainingSeconds % 10}
          </div>
        </div>
      </div>
      <div className="text-xs text-white opacity-70 mt-1 text-right">
        {roundNumber.toString().padStart(5, '0')}
      </div>
    </div>
  );
};

export default CountdownTimer;
