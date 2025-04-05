import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBetSchema, insertUserSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Admin middleware
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any)?.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // API /api/user endpoint is included in auth.ts
  // Map /api/me to /api/user for backward compatibility
  app.get("/api/me", isAuthenticated, (req, res) => {
    if (req.user) {
      // Remove password from the response
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } else {
      res.sendStatus(401);
    }
  });

  // GAME ROUTES
  app.get("/api/rounds/latest", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const rounds = await storage.getLatestGameRounds(limit);
    res.json(rounds);
  });

  app.get("/api/rounds/:roundNumber", async (req, res) => {
    const roundNumber = parseInt(req.params.roundNumber);
    const round = await storage.getGameRoundByNumber(roundNumber);
    
    if (!round) {
      return res.status(404).json({ message: "Round not found" });
    }
    
    res.json(round);
  });

  app.post("/api/bets", isAuthenticated, async (req, res) => {
    try {
      const betData = insertBetSchema.parse(req.body);
      const user = req.user as any;
      
      // Check if user has enough balance
      if (user.balance < betData.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create bet
      const bet = await storage.createBet({
        ...betData,
        userId: user.id,
      });
      
      // Update user balance
      const newBalance = user.balance - betData.amount;
      await storage.updateUserBalance(user.id, newBalance);
      
      // Create transaction
      await storage.createTransaction({
        userId: user.id,
        type: "bet",
        amount: -betData.amount,
        balance: newBalance,
        description: `Bet on round #${betData.roundId} - ${betData.betType}: ${betData.betValue}`,
      });
      
      res.status(201).json({ 
        bet,
        newBalance,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid bet data", error });
    }
  });

  app.get("/api/bets/user", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const bets = await storage.getBetsForUser(user.id);
    res.json(bets);
  });

  // ADMIN ROUTES
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.put("/api/admin/users/:id/balance", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { balance } = req.body;
    
    if (typeof balance !== "number" || balance < 0) {
      return res.status(400).json({ message: "Invalid balance amount" });
    }
    
    const user = await storage.updateUserBalance(userId, balance);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create transaction record
    await storage.createTransaction({
      userId,
      type: "admin",
      amount: balance - (await storage.getUser(userId))!.balance,
      balance,
      description: "Balance adjusted by admin",
    });
    
    res.json(user);
  });

  app.put("/api/admin/users/:id/status", isAdmin, async (req, res) => {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (typeof status !== "string" || !["active", "banned", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const user = await storage.updateUserStatus(userId, status);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });

  app.post("/api/admin/rounds", isAdmin, async (req, res) => {
    try {
      const { roundNumber, result, resultColor, resultSize } = req.body;
      
      // Validate round data
      if (!roundNumber || result === undefined || !resultColor || !resultSize) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const existingRound = await storage.getGameRoundByNumber(roundNumber);
      
      if (existingRound) {
        // Update existing round
        const updatedRound = await storage.endGameRound(
          existingRound.id,
          result,
          resultColor,
          resultSize
        );
        
        // Process bets for this round
        const bets = await storage.getBetsForRound(existingRound.id);
        
        for (const bet of bets) {
          let won = false;
          let payout = 0;
          
          // Check if bet won based on type
          if (bet.betType === "number" && parseInt(bet.betValue) === result) {
            won = true;
            payout = bet.amount * 10; // Number bets pay 10x
          } else if (bet.betType === "color" && bet.betValue === resultColor) {
            won = true;
            // Different multipliers for colors
            if (resultColor === "green") payout = bet.amount * 2;
            else if (resultColor === "red") payout = bet.amount * 2;
            else if (resultColor === "violet") payout = bet.amount * 3;
          } else if (bet.betType === "size" && bet.betValue === resultSize) {
            won = true;
            payout = bet.amount * 2; // Size bets pay 2x
          }
          
          // Update bet status and payout
          const status = won ? "won" : "lost";
          await storage.updateBetStatus(bet.id, status, won ? payout : 0);
          
          // If won, update user balance and create transaction
          if (won) {
            const user = await storage.getUser(bet.userId);
            if (user) {
              const newBalance = user.balance + payout;
              await storage.updateUserBalance(user.id, newBalance);
              
              await storage.createTransaction({
                userId: user.id,
                type: "win",
                amount: payout,
                balance: newBalance,
                description: `Won bet on round #${roundNumber} - ${bet.betType}: ${bet.betValue}`,
              });
            }
          }
        }
        
        res.status(200).json(updatedRound);
      } else {
        // Create new round
        const newRound = await storage.createGameRound({
          roundNumber,
          result,
          resultColor,
          resultSize,
        });
        
        res.status(201).json(newRound);
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid round data", error });
    }
  });

  app.get("/api/admin/transactions", isAdmin, async (req, res) => {
    const transactions = await storage.getAllTransactions();
    res.json(transactions);
  });

  const httpServer = createServer(app);
  return httpServer;
}
