import { create } from 'zustand';
import { BetSelection, Bet, GameRound } from '@/lib/types';
import { calculatePotentialWin } from '@/lib/utils';

interface GameState {
  currentRound: number;
  countdown: number;
  nextDrawTime: string;
  selectedBet: BetSelection | null;
  betAmount: number;
  currentBets: Bet[];
  lastResults: GameRound[];
  isLoading: boolean;
  
  // Actions
  setCurrentRound: (round: number) => void;
  setCountdown: (seconds: number) => void;
  setNextDrawTime: (time: string) => void;
  selectBet: (selection: BetSelection) => void;
  updateBetAmount: (amount: number) => void;
  placeBet: (bet: Bet) => void;
  setLastResults: (results: GameRound[]) => void;
  setIsLoading: (loading: boolean) => void;
  resetSelection: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentRound: 28365,
  countdown: 60,
  nextDrawTime: '3:45 PM',
  selectedBet: null,
  betAmount: 50,
  currentBets: [],
  lastResults: [],
  isLoading: false,
  
  setCurrentRound: (round) => set({ currentRound: round }),
  
  setCountdown: (seconds) => set({ countdown: seconds }),
  
  setNextDrawTime: (time) => set({ nextDrawTime: time }),
  
  selectBet: (selection) => set((state) => ({
    selectedBet: selection,
  })),
  
  updateBetAmount: (amount) => set((state) => {
    const newAmount = Math.max(10, Math.min(10000, amount));
    return {
      betAmount: newAmount,
    };
  }),
  
  placeBet: (bet) => set((state) => ({
    currentBets: [bet, ...state.currentBets],
  })),
  
  setLastResults: (results) => set({ lastResults: results }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  resetSelection: () => set({ selectedBet: null }),
}));
