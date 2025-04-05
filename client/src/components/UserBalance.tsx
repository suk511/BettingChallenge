import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface UserBalanceProps {
  balance: number;
}

const UserBalance = ({ balance }: UserBalanceProps) => {
  const [animatedBalance, setAnimatedBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (balance !== animatedBalance) {
      setIsAnimating(true);
      
      // If we have a significant change, animate it
      if (Math.abs(balance - animatedBalance) > 1) {
        const direction = balance > animatedBalance ? 1 : -1;
        const step = Math.max(1, Math.abs(balance - animatedBalance) / 20);
        
        const animationInterval = setInterval(() => {
          setAnimatedBalance(prev => {
            const next = prev + (direction * step);
            
            // Check if we've reached or passed the target
            if ((direction > 0 && next >= balance) || 
                (direction < 0 && next <= balance)) {
              clearInterval(animationInterval);
              setIsAnimating(false);
              return balance;
            }
            
            return next;
          });
        }, 16); // ~60fps
        
        return () => clearInterval(animationInterval);
      } else {
        // For small changes, just update directly
        setAnimatedBalance(balance);
        setIsAnimating(false);
      }
    }
  }, [balance, animatedBalance]);

  return (
    <div 
      className={`bg-white/10 rounded-lg px-4 py-2 flex items-center transition-all duration-300 ${
        isAnimating ? 'scale-110' : ''
      }`}
    >
      <span className="material-icons mr-2 text-yellow-300">account_balance_wallet</span>
      <span className="font-medium">Balance: {formatCurrency(animatedBalance)}</span>
    </div>
  );
};

export default UserBalance;
