import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BetSelection, FormattedResult, GameRound } from "@/lib/types";
import { calculatePotentialWin, formatGameResult, getNumberColor, getNumberSize } from "@/lib/utils";
import CountdownTimer from "@/components/CountdownTimer";

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const ResultBall: React.FC<{ number: number; small?: boolean }> = ({ number, small = false }) => {
  const color = getNumberColor(number);
  const bgColor = {
    'green': 'bg-green-500',
    'red': 'bg-red-500',
    'violet': 'bg-violet-500'
  }[color] || 'bg-gray-500';

  return (
    <div 
      className={`${bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-md ${
        small ? 'w-8 h-8 text-lg' : 'w-14 h-14 text-2xl border-2 border-white'
      }`}
      style={{ boxShadow: small ? '0 2px 4px rgba(0,0,0,0.2)' : '0 3px 6px rgba(0,0,0,0.3)' }}
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

  // Define the bet data interface
  interface BetData {
    roundId: number;
    betType: 'number' | 'color' | 'size';
    betValue: string;
    amount: number;
    potentialWin: number;
    status: string;
  }

  // Place bet mutation
  const placeBetMutation = useMutation<Response, Error, BetData>({
    mutationFn: async (betData: BetData) => {
      return await apiRequest('POST', '/api/bets', betData);
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      
      // Update the user bets query cache
      queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
      
      // Display success toast with custom styling to match the design
      toast({
        title: "Bet Placed",
        description: `Successfully placed a bet of ₹${betAmount} on ${selectedBet?.value}`,
        className: "bg-pink-100 border-0 text-black font-medium p-4 rounded-xl shadow-md",
      });
      
      // Reset selection after successful bet
      setSelectedBet(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bet",
        variant: "destructive",
      });
    }
  });

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

  // Function to handle successful bet placement
  const handleBetPlaced = (amount: number, betType: string, betValue: string) => {
    const message = `Successfully placed a bet of ₹${amount} on ${betValue}`;
    
    toast({
      title: "Bet Placed",
      description: message,
      className: "bg-pink-200 border-0 text-black font-medium",
    });
  };
  
  // Function to handle countdown completion
  const handleCountdownComplete = () => {
    // Refresh game data when countdown completes
    queryClient.invalidateQueries({ queryKey: ['/api/rounds/latest'] });
    queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
  };

  return (
    <div className="bg-white min-h-screen">
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
      <div className="bg-white rounded-xl mx-3 my-2 p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">Balance</p>
            <h2 className="text-2xl font-bold">₹{user?.balance.toLocaleString() || 0}</h2>
          </div>
          <div className="flex space-x-2">
            <button className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_0_0_rgba(22,101,52,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(22,101,52,0.8)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <button className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_0_0_rgba(153,27,27,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(153,27,27,0.8)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Game Result Section */}
      <div className="bg-gradient-to-r from-purple-800 to-red-600 rounded-xl mx-3 my-2 p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-lg">Result:</p>
            <div className="flex mt-2">
              {latestResults.length > 0 && (
                <ResultBall number={latestResults[0].result} />
              )}
            </div>
          </div>
          <div>
            <CountdownTimer seconds={60} roundNumber={currentRound} onComplete={handleCountdownComplete} />
          </div>
        </div>
        
        {/* Previous Results - Display previous numbers in a row */}
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
            className={`bg-green-500 text-white py-4 rounded-xl text-center text-lg font-bold shadow-[0_4px_0_0_rgba(22,101,52,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(22,101,52,0.8)] ${
              selectedBet?.type === 'color' && selectedBet.value === 'green' ? 'ring-2 ring-green-300' : ''
            }`}
          >
            Green
          </button>
          <button 
            onClick={() => handleSelectColor('violet')}
            className={`bg-violet-500 text-white py-4 rounded-xl text-center text-lg font-bold shadow-[0_4px_0_0_rgba(91,33,182,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(91,33,182,0.8)] ${
              selectedBet?.type === 'color' && selectedBet.value === 'violet' ? 'ring-2 ring-violet-300' : ''
            }`}
          >
            Violet
          </button>
          <button 
            onClick={() => handleSelectColor('red')}
            className={`bg-red-500 text-white py-4 rounded-xl text-center text-lg font-bold shadow-[0_4px_0_0_rgba(153,27,27,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(153,27,27,0.8)] ${
              selectedBet?.type === 'color' && selectedBet.value === 'red' ? 'ring-2 ring-red-300' : ''
            }`}
          >
            Red
          </button>
        </div>

        {/* Number Buttons */}
        <div className="grid grid-cols-5 gap-3">
          {numbers.map((number) => {
            const color = getNumberColor(number);
            
            // Define shadow colors for each button type based on color
            let shadowColor = 'rgba(75,85,99,0.8)'; // default gray
            let bgColorClass = 'bg-gray-500';
            
            if (color === 'green') {
              shadowColor = 'rgba(22,101,52,0.8)';
              bgColorClass = 'bg-green-500';
            } else if (color === 'red') {
              shadowColor = 'rgba(153,27,27,0.8)';
              bgColorClass = 'bg-red-500';
            } else if (color === 'violet') {
              shadowColor = 'rgba(91,33,182,0.8)';
              bgColorClass = 'bg-violet-500';
            }
            
            return (
              <button
                key={number}
                onClick={() => handleSelectNumber(number)}
                className={`${bgColorClass} text-white h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-[0_4px_0_0_${shadowColor}] active:translate-y-[2px] active:shadow-[0_2px_0_0_${shadowColor}] ${
                  selectedBet?.type === 'number' && parseInt(selectedBet.value) === number ? 'ring-2 ring-blue-300' : ''
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
            className={`bg-orange-500 text-white py-4 rounded-xl text-center text-lg font-bold shadow-[0_4px_0_0_rgba(194,65,12,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(194,65,12,0.8)] ${
              selectedBet?.type === 'size' && selectedBet.value === 'big' ? 'ring-2 ring-orange-300' : ''
            }`}
          >
            Big
          </button>
          <button 
            onClick={() => handleSelectSize('small')}
            className={`bg-blue-500 text-white py-4 rounded-xl text-center text-lg font-bold shadow-[0_4px_0_0_rgba(29,78,216,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(29,78,216,0.8)] ${
              selectedBet?.type === 'size' && selectedBet.value === 'small' ? 'ring-2 ring-blue-300' : ''
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
                className="w-full py-3 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-400 focus:border-red-400 text-lg font-bold"
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
              className={`px-6 py-3 rounded-xl text-white font-bold ${
                !selectedBet 
                  ? 'bg-gray-400' 
                  : 'bg-red-500 shadow-[0_4px_0_0_rgba(153,27,27,0.8)] active:translate-y-[2px] active:shadow-[0_2px_0_0_rgba(153,27,27,0.8)]'
              }`}
            >
              {placeBetMutation.isPending ? "Placing..." : "Place Bet"}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-2">
            <button 
              onClick={() => setBetAmount(100)} 
              className="bg-gray-200 px-3 py-2 rounded-lg text-xs font-medium shadow-[0_2px_0_0_rgba(107,114,128,0.5)] active:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(107,114,128,0.5)]">₹100</button>
            <button 
              onClick={() => setBetAmount(500)} 
              className="bg-gray-200 px-3 py-2 rounded-lg text-xs font-medium shadow-[0_2px_0_0_rgba(107,114,128,0.5)] active:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(107,114,128,0.5)]">₹500</button>
            <button 
              onClick={() => setBetAmount(1000)} 
              className="bg-gray-200 px-3 py-2 rounded-lg text-xs font-medium shadow-[0_2px_0_0_rgba(107,114,128,0.5)] active:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(107,114,128,0.5)]">₹1K</button>
            <button 
              onClick={() => setBetAmount(5000)} 
              className="bg-gray-200 px-3 py-2 rounded-lg text-xs font-medium shadow-[0_2px_0_0_rgba(107,114,128,0.5)] active:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(107,114,128,0.5)]">₹5K</button>
            <button 
              onClick={() => user && setBetAmount(user.balance)} 
              className="bg-pink-100 text-red-700 px-3 py-2 rounded-lg text-xs font-bold shadow-[0_2px_0_0_rgba(190,24,93,0.3)] active:translate-y-[1px] active:shadow-[0_1px_0_0_rgba(190,24,93,0.3)]">All In</button>
          </div>
        </div>
      </div>

      {/* Game History Tabs */}
      <div className="mx-3 my-4 mb-20">
        <div className="grid grid-cols-2 gap-0">
          <button 
            className="bg-red-500 text-white py-3 px-4 rounded-tl-xl font-bold shadow"
          >
            Game history
          </button>
          <button 
            className="bg-white text-gray-700 py-3 px-4 rounded-tr-xl font-bold border-t border-r border-gray-200"
          >
            My history
          </button>
        </div>
        
        {/* Game History Table */}
        <div className="bg-white shadow-md">
          <div className="py-3 px-4 border-b grid grid-cols-3 text-gray-500 font-medium">
            <div className="text-center">Number</div>
            <div className="text-center">Color</div>
            <div className="text-center">Size</div>
          </div>
          <div className="divide-y divide-gray-100">
            {latestResults.slice(0, 5).map((result, index) => (
              <div key={index} className="py-3 px-4 grid grid-cols-3">
                <div className="flex justify-center">
                  <ResultBall number={result.result} small />
                </div>
                <div className="text-center self-center capitalize font-medium">{result.resultColor}</div>
                <div className="text-center self-center capitalize font-medium">{result.resultSize}</div>
                <div className="col-span-3 text-center text-xs text-gray-500 mt-1">
                  {result.roundNumber.toString().padStart(5, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around shadow-lg">
        <button className="flex flex-col items-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-medium mt-1">Records</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-xs font-medium mt-1">Wallet</span>
        </button>
        <button className="flex flex-col items-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default NewBettingGame;