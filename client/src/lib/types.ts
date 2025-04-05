export interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  isAdmin: boolean;
  status?: string;
  joinedAt?: string;
}

export interface GameRound {
  id: number;
  roundNumber: number;
  result: number;
  resultColor: string;
  resultSize: string;
  createdAt: string;
  endedAt: string | null;
}

export interface Bet {
  id: number;
  userId: number;
  roundId: number;
  betType: string;
  betValue: string;
  amount: number;
  potentialWin: number;
  status: string;
  payout: number | null;
  createdAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
}

export interface BetSelection {
  type: 'number' | 'color' | 'size';
  value: string;
  multiplier: number;
}

export interface FormattedResult {
  roundNumber: number;
  result: number;
  resultColor: string;
  resultSize: string;
  formattedNumber: string;
}

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
};
