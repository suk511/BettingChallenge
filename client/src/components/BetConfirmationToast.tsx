import React from 'react';

interface BetConfirmationToastProps {
  betType: string;
  betValue: string;
  amount: number;
}

const BetConfirmationToast: React.FC<BetConfirmationToastProps> = ({ betType, betValue, amount }) => {
  return (
    <div className="w-full bg-pink-100 p-4 rounded-xl shadow-md">
      <h3 className="font-bold text-black mb-1">Bet Placed</h3>
      <p className="text-gray-800">
        Successfully placed a bet of ₹{amount} on {betValue}
      </p>
    </div>
  );
};

export default BetConfirmationToast;