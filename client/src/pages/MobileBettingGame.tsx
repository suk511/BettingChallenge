import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { BetSelection, FormattedResult, GameRound, Bet } from "@/lib/types";
import { calculatePotentialWin, formatGameResult, getNumberColor, getNumberSize } from "@/lib/utils";

// Number grid for the betting UI
const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// ResultBall component for displaying results
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
        small ? 'w-8 h-8 text-lg' : 'w-12 h-12 text-xl'
      }`}
    >
      {number}
    </div>
  );
};

// Countdown component
const CountdownDisplay: React.FC<{ 
  minutes: number;
  seconds: number;
  roundNumber: number;
}> = ({ minutes, seconds, roundNumber }) => {
  return (
    <div className="flex flex-col items-end">
      <div className="text-white font-medium mb-1">Time</div>
      <div className="flex items-center space-x-1">
        <div className="bg-white rounded w-8 h-8 flex items-center justify-center text-lg font-bold">{minutes < 10 ? "0" : Math.floor(minutes/10)}</div>
        <div className="bg-white rounded w-8 h-8 flex items-center justify-center text-lg font-bold">{minutes < 10 ? minutes : minutes % 10}</div>
        <div className="text-white font-bold text-lg">:</div>
        <div className="bg-white rounded w-8 h-8 flex items-center justify-center text-lg font-bold">{seconds < 10 ? "0" : Math.floor(seconds/10)}</div>
        <div className="bg-white rounded w-8 h-8 flex items-center justify-center text-lg font-bold">{seconds < 10 ? seconds : seconds % 10}</div>
      </div>
      <div className="text-xs text-white mt-1">
        {roundNumber.toString().padStart(5, '0')}
      </div>
    </div>
  );
};

const MobileBettingGame: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [latestResults, setLatestResults] = useState<FormattedResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [bets, setBets] = useState<Bet[]>([]);
  const [activeTab, setActiveTab] = useState('gameHistory'); // 'gameHistory' or 'myHistory'

  // Format time
  const minutes = Math.floor(timeLeft / 60);
  const remainingSeconds = timeLeft % 60;

  // Fetch latest results
  const { data: roundsData = [] } = useQuery<GameRound[]>({
    queryKey: ['/api/rounds/latest'],
    refetchInterval: 5000,
  });

  // Fetch user bets
  const { data: betsData = [] } = useQuery<Bet[]>({
    queryKey: ['/api/bets/user'],
    refetchInterval: 5000,
  });

  // Start countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Refresh the data when countdown hits zero
          queryClient.invalidateQueries({ queryKey: ['/api/rounds/latest'] });
          queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
          return 60; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [queryClient]);

  // Process data when it loads
  useEffect(() => {
    if (Array.isArray(roundsData) && roundsData.length > 0) {
      const formattedResults = roundsData.map(formatGameResult);
      setLatestResults(formattedResults);
      
      // Set current round number to be the last round number + 1
      const maxRoundNumber = Math.max(...roundsData.map((r: GameRound) => r.roundNumber));
      
      // Only update if the round number has actually changed
      if (maxRoundNumber + 1 !== currentRound) {
        setCurrentRound(maxRoundNumber + 1);
      }
    }
  }, [roundsData, currentRound]);

  useEffect(() => {
    if (betsData) {
      setBets(betsData);
    }
  }, [betsData]);

  // Place bet mutation
  const placeBetMutation = useMutation<Response, Error, any>({
    mutationFn: async (betData) => {
      return await apiRequest('POST', '/api/bets', betData);
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      
      // Update the user bets query cache
      queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
      
      // Display success toast with custom styling to match screenshot
      toast({
        title: "Bet Placed",
        description: `Successfully placed a bet of ₹${betAmount} on ${selectedBet?.value}`,
        className: "bg-pink-100 border-0 text-black font-medium p-4 rounded-xl shadow-md",
        duration: 3000,
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

  // State for bet prompt
  const [showBetPrompt, setShowBetPrompt] = useState(false);
  const [tempBetType, setTempBetType] = useState<'number' | 'color' | 'size' | null>(null);
  const [tempBetValue, setTempBetValue] = useState<string>("");
  const [tempMultiplier, setTempMultiplier] = useState<number>(1);
  const [customBetAmount, setCustomBetAmount] = useState<number>(0);
  
  // Predefined bet amounts
  const predefinedAmounts = [100, 500, 1000];
  
  // Multiplier options
  const multiplierOptions = [1, 2, 5, 10, 50];

  // Handle bet selections
  const handleSelectNumber = (number: number) => {
    setTempBetType('number');
    setTempBetValue(number.toString());
    setTempMultiplier(10); // Default multiplier for numbers
    setShowBetPrompt(true);
  };

  const handleSelectColor = (color: string) => {
    setTempBetType('color');
    setTempBetValue(color);
    setTempMultiplier(color === 'violet' ? 3 : 2); // Default multiplier for colors
    setShowBetPrompt(true);
  };

  const handleSelectSize = (size: string) => {
    setTempBetType('size');
    setTempBetValue(size);
    setTempMultiplier(2); // Default multiplier for sizes
    setShowBetPrompt(true);
  };
  
  // Confirm the bet from the prompt
  const confirmBet = (amount: number) => {
    if (!tempBetType || !tempBetValue) return;
    
    setSelectedBet({
      type: tempBetType,
      value: tempBetValue,
      multiplier: tempMultiplier
    });
    
    setBetAmount(amount);
    setShowBetPrompt(false);
    
    // Auto-place bet if configured
    if (user && amount > 0 && amount <= user.balance) {
      placeBetMutation.mutate({
        roundId: currentRound,
        betType: tempBetType,
        betValue: tempBetValue,
        amount: amount,
        potentialWin: calculatePotentialWin(amount, {
          type: tempBetType,
          value: tempBetValue,
          multiplier: tempMultiplier
        }),
        status: "pending"
      });
    }
  };
  
  // Handle custom bet amount with multiplier
  const handleCustomBet = () => {
    const finalAmount = customBetAmount * tempMultiplier;
    confirmBet(finalAmount);
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
        description: "Minimum bet amount is ₹10.",
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

  // Filter pending bets for the current user
  const pendingBets = bets.filter(bet => bet.status === "pending");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-500 text-white p-3 flex justify-between items-center">
        <button className="text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">{user?.username || "User"}</h1>
        <div className="flex space-x-3">
          {user?.isAdmin && (
            <a href="/adminpanel" className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          )}
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
            <button className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <button className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
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
          <CountdownDisplay 
            minutes={minutes} 
            seconds={remainingSeconds}
            roundNumber={currentRound}
          />
        </div>
        
        {/* Previous Results */}
        <div className="flex mt-4 justify-center space-x-3">
          {latestResults.slice(1, 3).map((result, index) => (
            <ResultBall key={index} number={result.result} small />
          ))}
        </div>
      </div>

      {/* Betting Options */}
      <div className="mx-3 my-4 space-y-3">
        {/* Color Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleSelectColor('green')}
            className={`bg-green-500 text-white py-3 rounded-xl text-center text-lg font-bold shadow-md ${
              selectedBet?.type === 'color' && selectedBet.value === 'green' ? 'ring-2 ring-white' : ''
            }`}
          >
            Green
          </button>
          <button 
            onClick={() => handleSelectColor('violet')}
            className={`bg-violet-500 text-white py-3 rounded-xl text-center text-lg font-bold shadow-md ${
              selectedBet?.type === 'color' && selectedBet.value === 'violet' ? 'ring-2 ring-white' : ''
            }`}
          >
            Violet
          </button>
          <button 
            onClick={() => handleSelectColor('red')}
            className={`bg-red-500 text-white py-3 rounded-xl text-center text-lg font-bold shadow-md ${
              selectedBet?.type === 'color' && selectedBet.value === 'red' ? 'ring-2 ring-white' : ''
            }`}
          >
            Red
          </button>
        </div>

        {/* Number Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {numbers.map((number) => {
            const color = getNumberColor(number);
            let bgColorClass = 'bg-gray-500';
            
            if (color === 'green') {
              bgColorClass = 'bg-green-500';
            } else if (color === 'red') {
              bgColorClass = 'bg-red-500';
            } else if (color === 'violet') {
              bgColorClass = 'bg-violet-500';
            }
            
            return (
              <button
                key={number}
                onClick={() => handleSelectNumber(number)}
                className={`${bgColorClass} text-white h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-md ${
                  selectedBet?.type === 'number' && parseInt(selectedBet.value) === number ? 'ring-2 ring-white' : ''
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
            className={`bg-orange-500 text-white py-3 rounded-xl text-center text-lg font-bold shadow-md ${
              selectedBet?.type === 'size' && selectedBet.value === 'big' ? 'ring-2 ring-white' : ''
            }`}
          >
            Big
          </button>
          <button 
            onClick={() => handleSelectSize('small')}
            className={`bg-blue-500 text-white py-3 rounded-xl text-center text-lg font-bold shadow-md ${
              selectedBet?.type === 'size' && selectedBet.value === 'small' ? 'ring-2 ring-white' : ''
            }`}
          >
            Small
          </button>
        </div>

        {/* Bet Amount Input */}
        <div className="mt-2">
          <div className="relative">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
              min="10"
              step="10"
              className="w-full py-3 px-4 rounded-xl border border-gray-300 text-lg font-bold"
            />
            <button
              onClick={handlePlaceBet}
              disabled={!selectedBet || placeBetMutation.isPending}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-white font-bold ${
                !selectedBet 
                  ? 'bg-gray-400' 
                  : 'bg-red-500'
              }`}
            >
              {placeBetMutation.isPending ? "..." : "Bet"}
            </button>
          </div>
          {selectedBet && (
            <div className="mt-1 text-sm text-gray-500">
              Potential win: ₹{calculatePotentialWin(betAmount, selectedBet).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Bet Prompt Modal */}
      {showBetPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-11/12 p-4 shadow-lg">
            <h3 className="text-xl font-bold text-center mb-4">
              Place Bet
            </h3>
            
            <div className="flex items-center justify-center mb-4">
              {tempBetType === 'number' && (
                <div className={`w-16 h-16 rounded-full ${getBgColorClass(getNumberColor(parseInt(tempBetValue)))} flex items-center justify-center text-white text-2xl font-bold`}>
                  {tempBetValue}
                </div>
              )}
              {tempBetType === 'color' && (
                <div className={`w-16 h-16 rounded-full ${getBgColorClass(tempBetValue)} flex items-center justify-center text-white text-lg font-bold`}>
                  {tempBetValue.charAt(0).toUpperCase() + tempBetValue.slice(1)}
                </div>
              )}
              {tempBetType === 'size' && (
                <div className={`w-16 h-16 rounded-full ${tempBetValue === 'big' ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center text-white text-xl font-bold`}>
                  {tempBetValue.charAt(0).toUpperCase() + tempBetValue.slice(1)}
                </div>
              )}
            </div>
            
            <h4 className="font-semibold text-center mb-2">Choose amount</h4>
            
            {/* Predefined amounts */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {predefinedAmounts.map(amount => (
                <button 
                  key={amount}
                  onClick={() => confirmBet(amount * tempMultiplier)}
                  className="bg-green-500 text-white py-2 rounded-lg font-bold"
                >
                  ₹{amount.toLocaleString()}
                </button>
              ))}
            </div>
            
            {/* Custom amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Custom amount</label>
              <div className="flex">
                <input
                  type="number"
                  min="10"
                  value={customBetAmount}
                  onChange={(e) => setCustomBetAmount(Math.max(10, Number(e.target.value)))}
                  className="w-full rounded-l-lg border border-gray-300 px-3 py-2"
                  placeholder="Enter amount"
                />
                <button
                  onClick={handleCustomBet}
                  className="bg-blue-500 text-white px-4 rounded-r-lg font-bold"
                >
                  Bet
                </button>
              </div>
            </div>
            
            {/* Multiplier options */}
            <h4 className="font-semibold text-center mb-2">Multiplier</h4>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {multiplierOptions.map(mult => (
                <button
                  key={mult}
                  onClick={() => setTempMultiplier(mult)}
                  className={`py-2 rounded-lg font-medium ${
                    tempMultiplier === mult 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
            
            <div className="flex justify-between items-center border-t pt-3">
              <div>
                <p className="text-sm font-medium">Potential win: 
                  <span className="ml-1 text-green-600 font-bold">
                    ₹{calculatePotentialWin(
                      customBetAmount > 0 ? customBetAmount * tempMultiplier : predefinedAmounts[0] * tempMultiplier, 
                      {type: tempBetType!, value: tempBetValue, multiplier: tempMultiplier}
                    ).toLocaleString()}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowBetPrompt(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game/My History Tabs */}
      <div className="mx-3 mb-3">
        <div className="grid grid-cols-2 gap-0 rounded-t-xl overflow-hidden">
          <button
            onClick={() => setActiveTab('gameHistory')}
            className={`py-3 px-4 text-center font-bold ${
              activeTab === 'gameHistory' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-700'
            }`}
          >
            Game history
          </button>
          <button
            onClick={() => setActiveTab('myHistory')}
            className={`py-3 px-4 text-center font-bold ${
              activeTab === 'myHistory' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-700'
            }`}
          >
            My history
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white mx-3 mb-5 p-3 rounded-b-xl shadow-md">
        {activeTab === 'gameHistory' ? (
          <div className="grid grid-cols-3 border-b pb-2 text-center font-medium text-gray-600">
            <div>Number</div>
            <div>Color</div>
            <div>Size</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 border-b pb-2 text-center font-medium text-gray-600">
            <div>Bet</div>
            <div>Amount</div>
            <div>Result</div>
          </div>
        )}

        {activeTab === 'gameHistory' ? (
          // Game history view
          <div className="max-h-48 overflow-y-auto">
            {latestResults.slice(0, 10).map((result, index) => (
              <div key={index} className="grid grid-cols-3 py-3 border-b text-center items-center">
                <div className="flex justify-center">
                  <div className={`w-8 h-8 rounded-full ${getBgColorClass(result.resultColor)} flex items-center justify-center text-white font-bold`}>
                    {result.result}
                  </div>
                </div>
                <div className="capitalize">{result.resultColor}</div>
                <div className="capitalize">{result.resultSize}</div>
              </div>
            ))}
          </div>
        ) : (
          // My history view
          <div className="max-h-48 overflow-y-auto">
            {pendingBets.length > 0 ? (
              pendingBets.map((bet, index) => (
                <div key={index} className="grid grid-cols-3 py-3 border-b text-center items-center">
                  <div>
                    <span className="font-medium capitalize">{bet.betType}</span>
                    <div className="text-gray-600 text-sm">{bet.betValue}</div>
                  </div>
                  <div>
                    <span className="font-medium">₹{bet.amount}</span>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-500">
                No active bets
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get background color class
function getBgColorClass(color: string): string {
  switch (color) {
    case 'green': return 'bg-green-500';
    case 'red': return 'bg-red-500';
    case 'violet': return 'bg-violet-500';
    default: return 'bg-gray-500';
  }
}

export default MobileBettingGame;