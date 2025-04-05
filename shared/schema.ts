import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  balance: real("balance").notNull().default(1000),
  isAdmin: boolean("is_admin").notNull().default(false),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const gameRounds = pgTable("game_rounds", {
  id: serial("id").primaryKey(),
  roundNumber: integer("round_number").notNull().unique(),
  result: integer("result").notNull(),
  resultColor: text("result_color").notNull(),
  resultSize: text("result_size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roundId: integer("round_id").notNull(),
  betType: text("bet_type").notNull(), // 'number', 'color', 'size'
  betValue: text("bet_value").notNull(), // '0-9', 'red', 'green', 'violet', 'big', 'small'
  amount: real("amount").notNull(),
  potentialWin: real("potential_win").notNull(),
  status: text("status").notNull().default("pending"),
  payout: real("payout"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'deposit', 'withdrawal', 'bet', 'win'
  amount: real("amount").notNull(),
  balance: real("balance").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  joinedAt: true,
});

export const insertGameRoundSchema = createInsertSchema(gameRounds).omit({
  id: true,
  createdAt: true,
  endedAt: true,
});

export const insertBetSchema = createInsertSchema(bets).omit({
  id: true,
  createdAt: true,
  payout: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type GameRound = typeof gameRounds.$inferSelect;

export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
