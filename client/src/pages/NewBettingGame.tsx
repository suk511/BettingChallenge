import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BetSelection, FormattedResult, GameRound } from "@/lib/types";
import { calculatePotentialWin, formatGameResult, getNumberColor, getNumberSize } from "@/lib/utils";

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface CountdownProps {
  seconds: number;
  roundNumber: number;
}

const Countdown: React.FC<CountdownProps> = ({ seconds, roundNumber }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (seconds <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

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

const ResultBall: React.FC<{ number: number; small?: boolean }> = ({ number, small = false }) => {
  const color = getNumberColor(number);
  const bgColor = {
    'green': 'bg-green-500',
    'red': 'bg-red-500',
    'violet': 'bg-violet-500'
  }[color] || 'bg-gray-500';

  return (
    <div 
      className={`${bgColor} rounded-full flex items-center justify-center text-white font-bold ${
        small ? 'w-8 h-8 text-lg' : 'w-12 h-12 text-2xl'
      }`}
    >
      {number}
    </div>
  );
};

const NewBettingGame: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [latestResults, setLatestResults] = useState<FormattedResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // Fetch latest results
  const { data: roundsData = [] } = useQuery<GameRound[]>({
    queryKey: ['/api/rounds/latest'],
    refetchInterval: 5000,
  });

  // Process data when it loads
  useEffect(() => {
    if (Array.isArray(roundsData) && roundsData.length > 0) {
      const formattedResults = roundsData.map(formatGameResult);
      setLatestResults(formattedResults);
      
      // Set current round number to be the last round number + 1
      const maxRoundNumber = Math.max(...roundsData.map((r: GameRound) => r.roundNumber));
      setCurrentRound(maxRoundNumber + 1);
    }
  }, [roundsData]);

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async (betData: any) => {
      return await apiRequest('POST', '/api/bets', betData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Update the user bets query cache
      queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
      
      toast({
        title: "Success!",
        description: "Your bet has been placed successfully.",
      });
      
      // Reset selection after successful bet
      setSelectedBet(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bet",
        variant: "destructive",
      });
    }
  } as any);

  // Handle bet selections
  const handleSelectNumber = (number: number) => {
    setSelectedBet({
      type: 'number',
      value: number.toString(),
      multiplier: 10
    });
  };

  const handleSelectColor = (color: string) => {
    const multiplier = color === 'violet' ? 3 : 2;
    setSelectedBet({
      type: 'color',
      value: color,
      multiplier
    });
  };

  const handleSelectSize = (size: string) => {
    setSelectedBet({
      type: 'size',
      value: size,
      multiplier: 2
    });
  };

  // Handle place bet
  const handlePlaceBet = () => {
    if (!selectedBet) {
      toast({
        title: "Selection Required",
        description: "Please select a bet option first.",
        variant: "destructive",
      });
      return;
    }

    if (betAmount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum bet amount is $10.",
        variant: "destructive",
      });
      return;
    }

    if (!user || betAmount > user.balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this bet.",
        variant: "destructive",
      });
      return;
    }

    // Create a new bet for the current round
    const roundId = currentRound;
    const potentialWin = calculatePotentialWin(betAmount, selectedBet);
    
    placeBetMutation.mutate({
      roundId,
      betType: selectedBet.type,
      betValue: selectedBet.value,
      amount: betAmount,
      potentialWin,
      status: "pending"
    });
  };

  // Get the last three result numbers
  const lastThreeResults = latestResults.slice(0, 3).map(r => r.result);

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-red-500 text-white p-3 flex justify-between items-center">
        <button className="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">
          {user?.username || "Guest"}
        </h1>
        <div className="flex space-x-3">
          <button className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-white rounded-lg mx-3 my-2 p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Balance</p>
            <h2 className="text-2xl font-bold">₹{user?.balance.toLocaleString() || 0}</h2>
          </div>
          <div className="flex space-x-2">
            <button className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <button className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Game Result Section */}
      <div className="bg-gradient-to-r from-purple-800 to-red-600 rounded-lg mx-3 my-2 p-4 shadow-sm">
        <div className="flex justify-between">
          <div className="flex items-center space-x-3">
            <p className="text-white text-lg">Result:</p>
            {latestResults.length > 0 && (
              <ResultBall number={latestResults[0].result} />
            )}
          </div>
          <Countdown seconds={60} roundNumber={currentRound} />
        </div>
        
        {/* Previous Results */}
        <div className="flex mt-4 justify-center space-x-3">
          {lastThreeResults.slice(1).map((result, index) => (
            <ResultBall key={index} number={result} small />
          ))}
        </div>
      </div>

      {/* Betting Options */}
      <div className="mx-3 my-4 space-y-3">
        {/* Color Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleSelectColor('green')}
            className={`bg-green-500 text-white py-4 rounded-lg text-center text-lg font-bold ${
              selectedBet?.type === 'color' && selectedBet.value === 'green' ? 'ring-4 ring-green-300' : ''
            }`}
          >
            Green
          </button>
          <button 
            onClick={() => handleSelectColor('violet')}
            className={`bg-violet-500 text-white py-4 rounded-lg text-center text-lg font-bold ${
              selectedBet?.type === 'color' && selectedBet.value === 'violet' ? 'ring-4 ring-violet-300' : ''
            }`}
          >
            Violet
          </button>
          <button 
            onClick={() => handleSelectColor('red')}
            className={`bg-red-500 text-white py-4 rounded-lg text-center text-lg font-bold ${
              selectedBet?.type === 'color' && selectedBet.value === 'red' ? 'ring-4 ring-red-300' : ''
            }`}
          >
            Red
          </button>
        </div>

        {/* Number Buttons */}
        <div className="grid grid-cols-5 gap-3">
          {numbers.map((number) => {
            const color = getNumberColor(number);
            const bgColor = {
              'green': 'bg-green-500',
              'red': 'bg-red-500',
              'violet': 'bg-violet-500'
            }[color] || 'bg-gray-500';
            
            return (
              <button
                key={number}
                onClick={() => handleSelectNumber(number)}
                className={`${bgColor} text-white h-14 rounded-lg flex items-center justify-center text-xl font-bold ${
                  selectedBet?.type === 'number' && parseInt(selectedBet.value) === number ? 'ring-4 ring-blue-300' : ''
                }`}
              >
                {number}
              </button>
            );
          })}
        </div>

        {/* Size Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => handleSelectSize('big')}
            className={`bg-orange-500 text-white py-4 rounded-lg text-center text-lg font-bold ${
              selectedBet?.type === 'size' && selectedBet.value === 'big' ? 'ring-4 ring-orange-300' : ''
            }`}
          >
            Big
          </button>
          <button 
            onClick={() => handleSelectSize('small')}
            className={`bg-blue-500 text-white py-4 rounded-lg text-center text-lg font-bold ${
              selectedBet?.type === 'size' && selectedBet.value === 'small' ? 'ring-4 ring-blue-300' : ''
            }`}
          >
            Small
          </button>
        </div>

        {/* Bet Amount and Place Bet */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">Bet Amount:</span>
            <span className="text-gray-700">
              {selectedBet && `Potential Win: ₹${calculatePotentialWin(betAmount, selectedBet).toLocaleString()}`}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="10"
                step="10"
                className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 text-lg font-bold"
              />
              <div className="absolute top-0 right-0 h-full flex">
                <button
                  onClick={() => setBetAmount(prev => Math.max(10, prev - 10))}
                  className="h-full px-3 bg-gray-200 border-l border-gray-300 rounded-r-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setBetAmount(prev => prev + 10)}
                  className="h-full px-3 bg-gray-200 border-l border-gray-300 rounded-r-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <button
              onClick={handlePlaceBet}
              disabled={!selectedBet || placeBetMutation.isPending}
              className={`px-6 py-3 rounded-lg text-white font-bold ${
                !selectedBet ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {placeBetMutation.isPending ? "Placing..." : "Place Bet"}
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <button 
              onClick={() => setBetAmount(100)} 
              className="bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">₹100</button>
            <button 
              onClick={() => setBetAmount(500)} 
              className="bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">₹500</button>
            <button 
              onClick={() => setBetAmount(1000)} 
              className="bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">₹1,000</button>
            <button 
              onClick={() => setBetAmount(5000)} 
              className="bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">₹5,000</button>
            <button 
              onClick={() => user && setBetAmount(user.balance)} 
              className="bg-gray-200 px-3 py-1 rounded-md text-xs font-medium">All In</button>
          </div>
        </div>
      </div>

      {/* Game History */}
      <div className="mx-3 my-4">
        <div className="bg-red-500 text-white py-3 px-4 rounded-t-lg grid grid-cols-3">
          <div className="text-center font-bold">Number</div>
          <div className="text-center font-bold">Color</div>
          <div className="text-center font-bold">Size</div>
        </div>
        <div className="bg-white rounded-b-lg divide-y divide-gray-100">
          {latestResults.slice(0, 5).map((result, index) => (
            <div key={index} className="py-3 px-4 grid grid-cols-3">
              <div className="flex justify-center">
                <ResultBall number={result.result} small />
              </div>
              <div className="text-center self-center capitalize">{result.resultColor}</div>
              <div className="text-center self-center capitalize">{result.resultSize}</div>
              <div className="col-span-3 text-center text-xs text-gray-500 mt-1">
                {result.roundNumber.toString().padStart(5, '0')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around">
        <button className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs">Records</span>
        </button>
        <button className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-xs">Wallet</span>
        </button>
      </div>
    </div>
  );
};

export default NewBettingGame;