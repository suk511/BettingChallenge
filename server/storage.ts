import {
  users, type User, type InsertUser,
  gameRounds, type GameRound, type InsertGameRound,
  bets, type Bet, type InsertBet,
  transactions, type Transaction, type InsertTransaction
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, newBalance: number): Promise<User | undefined>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Game round operations
  createGameRound(round: InsertGameRound): Promise<GameRound>;
  getGameRound(id: number): Promise<GameRound | undefined>;
  getGameRoundByNumber(roundNumber: number): Promise<GameRound | undefined>;
  endGameRound(id: number, result: number, resultColor: string, resultSize: string): Promise<GameRound | undefined>;
  getLatestGameRounds(limit: number): Promise<GameRound[]>;
  
  // Bet operations
  createBet(bet: InsertBet): Promise<Bet>;
  getBetsForRound(roundId: number): Promise<Bet[]>;
  getBetsForUser(userId: number): Promise<Bet[]>;
  updateBetStatus(id: number, status: string, payout?: number): Promise<Bet | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsForUser(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameRounds: Map<number, GameRound>;
  private bets: Map<number, Bet>;
  private transactions: Map<number, Transaction>;
  
  private userIdCounter: number;
  private gameRoundIdCounter: number;
  private betIdCounter: number;
  private transactionIdCounter: number;
  private currentRoundNumber: number;

  constructor() {
    this.users = new Map();
    this.gameRounds = new Map();
    this.bets = new Map();
    this.transactions = new Map();
    
    this.userIdCounter = 1;
    this.gameRoundIdCounter = 1;
    this.betIdCounter = 1;
    this.transactionIdCounter = 1;
    this.currentRoundNumber = 28365;
    
    // Create admin user by default
    this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@betmaster.com",
      isAdmin: true,
      balance: 10000,
      status: "active"
    });
    
    // Create a regular user
    this.createUser({
      username: "john",
      password: "john123",
      email: "john@example.com",
      isAdmin: false,
      balance: 1250,
      status: "active"
    });
    
    // Create some initial game rounds
    const colors = ["green", "red", "violet", "red", "green"];
    const sizes = ["small", "big", "big", "big", "small"];
    const results = [2, 9, 5, 7, 0];
    
    for (let i = 0; i < 5; i++) {
      const roundNumber = this.currentRoundNumber - 5 + i;
      this.createGameRound({
        roundNumber,
        result: results[i],
        resultColor: colors[i],
        resultSize: sizes[i]
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, joinedAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserBalance(id: number, newBalance: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, balance: newBalance };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, status };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Game round operations
  async createGameRound(round: InsertGameRound): Promise<GameRound> {
    const id = this.gameRoundIdCounter++;
    const now = new Date();
    const gameRound: GameRound = { 
      ...round, 
      id, 
      createdAt: now,
      endedAt: null 
    };
    this.gameRounds.set(id, gameRound);
    return gameRound;
  }
  
  async getGameRound(id: number): Promise<GameRound | undefined> {
    return this.gameRounds.get(id);
  }
  
  async getGameRoundByNumber(roundNumber: number): Promise<GameRound | undefined> {
    return Array.from(this.gameRounds.values()).find(
      (round) => round.roundNumber === roundNumber,
    );
  }
  
  async endGameRound(id: number, result: number, resultColor: string, resultSize: string): Promise<GameRound | undefined> {
    const round = await this.getGameRound(id);
    if (!round) return undefined;
    
    const now = new Date();
    const updatedRound: GameRound = { 
      ...round, 
      result, 
      resultColor, 
      resultSize, 
      endedAt: now 
    };
    this.gameRounds.set(id, updatedRound);
    return updatedRound;
  }
  
  async getLatestGameRounds(limit: number): Promise<GameRound[]> {
    return Array.from(this.gameRounds.values())
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .slice(0, limit);
  }
  
  // Bet operations
  async createBet(bet: InsertBet): Promise<Bet> {
    const id = this.betIdCounter++;
    const now = new Date();
    const newBet: Bet = { ...bet, id, createdAt: now, payout: null };
    this.bets.set(id, newBet);
    return newBet;
  }
  
  async getBetsForRound(roundId: number): Promise<Bet[]> {
    return Array.from(this.bets.values()).filter(
      (bet) => bet.roundId === roundId,
    );
  }
  
  async getBetsForUser(userId: number): Promise<Bet[]> {
    return Array.from(this.bets.values())
      .filter((bet) => bet.userId === userId)
      .sort((a, b) => b.id - a.id);
  }
  
  async updateBetStatus(id: number, status: string, payout?: number): Promise<Bet | undefined> {
    const bet = this.bets.get(id);
    if (!bet) return undefined;
    
    const updatedBet: Bet = { ...bet, status, payout: payout ?? bet.payout };
    this.bets.set(id, updatedBet);
    return updatedBet;
  }
  
  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    const newTransaction: Transaction = { ...transaction, id, createdAt: now };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }
  
  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }
}

export const storage = new MemStorage();
