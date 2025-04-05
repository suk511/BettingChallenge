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

import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";
const { Pool } = pg;

// Create the PostgreSQL connection pool for sessions
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Postgres session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Initialize database with default data if empty
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Check if users table is empty
      const usersList = await db.select().from(users).limit(1);
      
      if (usersList.length === 0) {
        // Create admin user
        await this.createUser({
          username: "admin",
          password: "admin123",
          email: "admin@betmaster.com",
          isAdmin: true,
          balance: 10000,
          status: "active"
        });
        
        // Create a regular user
        await this.createUser({
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
        const currentRoundNumber = 28365;
        
        for (let i = 0; i < 5; i++) {
          const roundNumber = currentRoundNumber - 5 + i;
          await this.createGameRound({
            roundNumber,
            result: results[i],
            resultColor: colors[i],
            resultSize: sizes[i]
          });
        }
      }
    } catch (error) {
      console.error("Error initializing database: ", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserBalance(id: number, newBalance: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Game round operations
  async createGameRound(round: InsertGameRound): Promise<GameRound> {
    const [newRound] = await db.insert(gameRounds).values(round).returning();
    return newRound;
  }
  
  async getGameRound(id: number): Promise<GameRound | undefined> {
    const [round] = await db.select().from(gameRounds).where(eq(gameRounds.id, id));
    return round;
  }
  
  async getGameRoundByNumber(roundNumber: number): Promise<GameRound | undefined> {
    const [round] = await db
      .select()
      .from(gameRounds)
      .where(eq(gameRounds.roundNumber, roundNumber));
      
    return round;
  }
  
  async endGameRound(id: number, result: number, resultColor: string, resultSize: string): Promise<GameRound | undefined> {
    const [updatedRound] = await db
      .update(gameRounds)
      .set({ 
        result, 
        resultColor, 
        resultSize, 
        endedAt: new Date() 
      })
      .where(eq(gameRounds.id, id))
      .returning();
      
    return updatedRound;
  }
  
  async getLatestGameRounds(limit: number): Promise<GameRound[]> {
    return await db
      .select()
      .from(gameRounds)
      .orderBy(desc(gameRounds.roundNumber))
      .limit(limit);
  }
  
  // Bet operations
  async createBet(bet: InsertBet): Promise<Bet> {
    const [newBet] = await db.insert(bets).values(bet).returning();
    return newBet;
  }
  
  async getBetsForRound(roundId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId));
  }
  
  async getBetsForUser(userId: number): Promise<Bet[]> {
    return await db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.id));
  }
  
  async updateBetStatus(id: number, status: string, payout?: number): Promise<Bet | undefined> {
    const [updatedBet] = await db
      .update(bets)
      .set({ 
        status,
        ...(payout !== undefined ? { payout } : {})
      })
      .where(eq(bets.id, id))
      .returning();
      
    return updatedBet;
  }
  
  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
      
    return newTransaction;
  }
  
  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }
  
  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
