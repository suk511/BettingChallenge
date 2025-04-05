import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { BetSelection, FormattedResult } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

export function getNumberColor(num: number): string {
  // Green numbers: 0, 2, 4, 6, 8
  // Red numbers: 1, 3, 5, 7, 9
  // Violet is special (0 and 5)
  
  if (num === 0) return 'green';
  if (num === 5) return 'violet';
  
  return num % 2 === 0 ? 'green' : 'red';
}

export function getNumberSize(num: number): string {
  // Small: 0-4, Big: 5-9
  return num < 5 ? 'small' : 'big';
}

export function getBgColorClass(color: string): string {
  switch (color) {
    case 'green': return 'bg-[#4caf50]';
    case 'red': return 'bg-[#f44336]';
    case 'violet': return 'bg-[#9c27b0]';
    default: return 'bg-gray-500';
  }
}

export function getTextColorClass(color: string): string {
  switch (color) {
    case 'green': return 'text-[#4caf50]';
    case 'red': return 'text-[#f44336]';
    case 'violet': return 'text-[#9c27b0]';
    default: return 'text-gray-500';
  }
}

export function getBorderColorClass(color: string): string {
  switch (color) {
    case 'green': return 'border-[#4caf50]';
    case 'red': return 'border-[#f44336]';
    case 'violet': return 'border-[#9c27b0]';
    default: return 'border-gray-500';
  }
}

export function getHoverBgColorClass(color: string): string {
  switch (color) {
    case 'green': return 'hover:bg-[#4caf50]/90';
    case 'red': return 'hover:bg-[#f44336]/90';
    case 'violet': return 'hover:bg-[#9c27b0]/90';
    default: return 'hover:bg-gray-500/90';
  }
}

export function calculatePotentialWin(bet: number, selection: BetSelection | null): number {
  if (!selection) return 0;
  return bet * selection.multiplier;
}

export function formatGameResult(round: any): FormattedResult {
  return {
    roundNumber: round.roundNumber,
    result: round.result,
    resultColor: round.resultColor,
    resultSize: round.resultSize,
    formattedNumber: round.result.toString()
  };
}

export function formatTimeAmPm(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
