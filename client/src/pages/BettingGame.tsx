import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import CountdownTimer from "@/components/CountdownTimer";
import ResultDisplay from "@/components/ResultDisplay";
import { useGameStore } from "@/store/gameStore";
import { BetSelection, FormattedResult } from "@/lib/types";
import { formatGameResult, getBgColorClass, formatCurrency, calculatePotentialWin, getNumberColor, getNumberSize } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const BettingGame = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    currentRound, 
    betAmount, 
    selectedBet, 
    updateBetAmount, 
    selectBet, 
    setCurrentRound,
    setLastResults,
    resetSelection
  } = useGameStore();
  
  const [latestResults, setLatestResults] = useState<FormattedResult[]>([]);
  const [userBets, setUserBets] = useState<any[]>([]);

  // Fetch latest results
  const { data: roundsData, isLoading: isLoadingRounds } = useQuery({
    queryKey: ['/api/rounds/latest'],
    refetchInterval: 5000,
  });

  // Fetch user bets
  const { data: betsData, isLoading: isLoadingBets } = useQuery({
    queryKey: ['/api/bets/user'],
    refetchInterval: 5000,
  });

  // Process data when it loads
  useEffect(() => {
    if (roundsData) {
      const formattedResults = roundsData.map(formatGameResult);
      setLatestResults(formattedResults);
      setLastResults(roundsData);
      
      // Set current round number to be the last round number + 1
      if (roundsData.length > 0) {
        const maxRoundNumber = Math.max(...roundsData.map((r: any) => r.roundNumber));
        setCurrentRound(maxRoundNumber + 1);
      }
    }
  }, [roundsData, setLastResults, setCurrentRound]);

  useEffect(() => {
    if (betsData) {
      setUserBets(betsData);
    }
  }, [betsData]);

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
        variant: "default",
        className: "bg-[#4caf50] text-white",
      });
      
      // Reset selection after successful bet
      resetSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bet",
        variant: "destructive",
      });
    }
  });

  // Handle bet selection
  const handleSelectNumber = (number: number) => {
    selectBet({
      type: 'number',
      value: number.toString(),
      multiplier: 10
    });
  };

  const handleSelectColor = (color: string) => {
    const multiplier = color === 'violet' ? 3 : 2;
    selectBet({
      type: 'color',
      value: color,
      multiplier
    });
  };

  const handleSelectSize = (size: string) => {
    selectBet({
      type: 'size',
      value: size,
      multiplier: 2
    });
  };

  // Handle bet amount change
  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      updateBetAmount(value);
    }
  };

  // Handle quick amount buttons
  const handleQuickAmount = (amount: number) => {
    updateBetAmount(betAmount + amount);
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

  const handleCountdownComplete = () => {
    // Refresh data when countdown completes
    queryClient.invalidateQueries({ queryKey: ['/api/rounds/latest'] });
    queryClient.invalidateQueries({ queryKey: ['/api/bets/user'] });
  };

  const getSelectionDisplay = () => {
    if (!selectedBet) return "None";
    
    switch (selectedBet.type) {
      case 'number':
        const numColor = getNumberColor(parseInt(selectedBet.value));
        return (
          <span className="inline-flex items-center">
            <span className={`w-5 h-5 rounded-full ${getBgColorClass(numColor)} flex items-center justify-center text-white font-bold text-xs mr-2`}>
              {selectedBet.value}
            </span>
            Number {selectedBet.value}
          </span>
        );
      case 'color':
        return (
          <span className="inline-flex items-center">
            <span className={`w-5 h-5 rounded-full ${getBgColorClass(selectedBet.value)} flex items-center justify-center text-white font-bold text-xs mr-2`}></span>
            {selectedBet.value.charAt(0).toUpperCase() + selectedBet.value.slice(1)}
          </span>
        );
      case 'size':
        const sizeColor = selectedBet.value === 'big' ? 'blue-600' : 'orange-500';
        return (
          <span className="inline-flex items-center">
            <span className={`w-5 h-5 rounded-full bg-${sizeColor} flex items-center justify-center text-white font-bold text-xs mr-2`}></span>
            {selectedBet.value.charAt(0).toUpperCase() + selectedBet.value.slice(1)} ({selectedBet.value === 'big' ? '5-9' : '0-4'})
          </span>
        );
      default:
        return "Unknown";
    }
  };

  // Filter current bets (pending bets for current round)
  const currentBets = userBets.filter(bet => bet.status === "pending");

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Timer and Game Info */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="font-montserrat font-bold text-2xl text-[#212121]">Round #{currentRound}</h2>
            <p className="text-gray-600">Place your bets before timer ends</p>
          </div>
          
          <CountdownTimer onComplete={handleCountdownComplete} />
        </div>

        {/* Last Results */}
        <ResultDisplay results={latestResults} />
        
        {/* Betting Options */}
        <div className="space-y-6">
          {/* Number Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Select Number (0-9)</h3>
            <div className="grid grid-cols-5 gap-3 md:grid-cols-10 md:gap-4">
              {numbers.map((number) => {
                const isSelected = selectedBet?.type === 'number' && selectedBet.value === number.toString();
                const numColor = getNumberColor(number);
                
                return (
                  <button
                    key={number}
                    onClick={() => handleSelectNumber(number)}
                    className={`h-14 rounded-lg border-2 ${
                      isSelected 
                        ? `border-[#3f51b5] bg-[#3f51b5]/5 text-[#3f51b5]` 
                        : `border-gray-200 hover:border-[#3f51b5] hover:bg-[#3f51b5]/5`
                    } transition-colors duration-200 font-bold text-xl`}
                    aria-label={`Select number ${number}`}
                  >
                    {number}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Color Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Select Color</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleSelectColor('green')}
                className={`h-14 rounded-lg border-2 border-[#4caf50] bg-[#4caf50] text-white font-bold transition-transform hover:scale-105 duration-200 flex items-center justify-center gap-2 ${
                  selectedBet?.type === 'color' && selectedBet.value === 'green' ? 'ring-4 ring-[#4caf50]/30' : ''
                }`}
                aria-label="Select green"
              >
                <span className="material-icons">circle</span>
                <span>Green (x2)</span>
              </button>
              <button
                onClick={() => handleSelectColor('violet')}
                className={`h-14 rounded-lg border-2 border-[#9c27b0] bg-[#9c27b0] text-white font-bold transition-transform hover:scale-105 duration-200 flex items-center justify-center gap-2 ${
                  selectedBet?.type === 'color' && selectedBet.value === 'violet' ? 'ring-4 ring-[#9c27b0]/30' : ''
                }`}
                aria-label="Select violet"
              >
                <span className="material-icons">circle</span>
                <span>Violet (x3)</span>
              </button>
              <button
                onClick={() => handleSelectColor('red')}
                className={`h-14 rounded-lg border-2 border-[#f44336] bg-[#f44336] text-white font-bold transition-transform hover:scale-105 duration-200 flex items-center justify-center gap-2 ${
                  selectedBet?.type === 'color' && selectedBet.value === 'red' ? 'ring-4 ring-[#f44336]/30' : ''
                }`}
                aria-label="Select red"
              >
                <span className="material-icons">circle</span>
                <span>Red (x2)</span>
              </button>
            </div>
          </div>
          
          {/* Size Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Select Size</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectSize('big')}
                className={`h-14 rounded-lg border-2 border-blue-600 bg-blue-600 text-white font-bold transition-transform hover:scale-105 duration-200 flex items-center justify-center gap-2 ${
                  selectedBet?.type === 'size' && selectedBet.value === 'big' ? 'ring-4 ring-blue-300' : ''
                }`}
                aria-label="Select big"
              >
                <span className="material-icons">arrow_upward</span>
                <span>Big (5-9) x2</span>
              </button>
              <button
                onClick={() => handleSelectSize('small')}
                className={`h-14 rounded-lg border-2 border-orange-500 bg-orange-500 text-white font-bold transition-transform hover:scale-105 duration-200 flex items-center justify-center gap-2 ${
                  selectedBet?.type === 'size' && selectedBet.value === 'small' ? 'ring-4 ring-orange-300' : ''
                }`}
                aria-label="Select small"
              >
                <span className="material-icons">arrow_downward</span>
                <span>Small (0-4) x2</span>
              </button>
            </div>
          </div>
          
          {/* Bet Controls */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bet Amount</label>
                <div className="flex">
                  <input
                    type="number"
                    className="w-full rounded-l-lg border-gray-300 shadow-sm focus:border-[#3f51b5] focus:ring-[#3f51b5] py-3 px-4 bg-white border"
                    placeholder="Enter amount"
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    min={10}
                    max={10000}
                  />
                  <div className="flex">
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-3 flex items-center justify-center border-t border-b border-gray-300"
                      onClick={() => handleQuickAmount(10)}
                    >
                      +10
                    </button>
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-3 flex items-center justify-center border-t border-b border-gray-300"
                      onClick={() => handleQuickAmount(50)}
                    >
                      +50
                    </button>
                    <button
                      className="bg-gray-200 hover:bg-gray-300 px-3 flex items-center justify-center border-t border-b border-r border-gray-300 rounded-r-lg"
                      onClick={() => handleQuickAmount(100)}
                    >
                      +100
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handlePlaceBet}
                  disabled={placeBetMutation.isPending}
                  className="w-full md:w-auto bg-[#3f51b5] hover:bg-[#3f51b5]/90 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons">casino</span>
                  <span>{placeBetMutation.isPending ? "Placing Bet..." : "Place Bet"}</span>
                </button>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <p className="text-gray-500">
                Current selection: <span className="font-semibold text-[#3f51b5]">{getSelectionDisplay()}</span> • 
                Potential win: <span className="font-semibold text-[#4caf50]">
                  {formatCurrency(calculatePotentialWin(betAmount, selectedBet))}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Bets */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="font-montserrat font-bold text-xl text-[#212121] mb-4">Your Current Bets</h2>
        {isLoadingBets ? (
          <div className="flex justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-t-4 border-[#3f51b5]"></div>
          </div>
        ) : currentBets.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            You don't have any active bets for the current round.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential Win</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentBets.map((bet) => {
                  // Determine color and value display based on bet type
                  let displayColor = '';
                  let displayValue = '';
                  
                  if (bet.betType === 'number') {
                    displayColor = getNumberColor(parseInt(bet.betValue));
                    displayValue = `Number ${bet.betValue}`;
                  } else if (bet.betType === 'color') {
                    displayColor = bet.betValue;
                    displayValue = bet.betValue.charAt(0).toUpperCase() + bet.betValue.slice(1);
                  } else if (bet.betType === 'size') {
                    displayColor = bet.betValue === 'big' ? 'blue-600' : 'orange-500';
                    displayValue = `${bet.betValue.charAt(0).toUpperCase() + bet.betValue.slice(1)} (${bet.betValue === 'big' ? '5-9' : '0-4'})`;
                  }
                  
                  return (
                    <tr key={bet.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{bet.roundId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center">
                          <span className={`w-6 h-6 rounded-full ${getBgColorClass(displayColor)} flex items-center justify-center text-white font-bold text-sm mr-2`}>
                            {bet.betType === 'number' ? bet.betValue : ''}
                          </span>
                          {displayValue}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(bet.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4caf50] font-medium">
                        {formatCurrency(bet.potentialWin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingGame;
