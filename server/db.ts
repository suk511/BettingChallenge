import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, gameRounds, bets, transactions } from "@shared/schema";

// Create the PostgreSQL client
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString!);

// Create the drizzle db instance
export const db = drizzle(client);

// Export all tables for easier usage
export const tables = {
  users,
  gameRounds,
  bets,
  transactions
};