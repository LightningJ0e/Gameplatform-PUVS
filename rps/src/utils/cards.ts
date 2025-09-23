// src/utils/cards.ts

export type Card = "rock" | "paper" | "scissors";
export type RpsCard = Card;
export type Move = 0 | 1 | 2;

// Praktisch für Maps/Loops im UI
export const PLAYER_CARDS = [
  "rock",
  "paper",
  "scissors",
] as const satisfies readonly RpsCard[];

// Mappings zwischen Karte und Move-Index
export const CARD_TO_MOVE: Record<RpsCard, Move> = {
  rock: 0,
  paper: 1,
  scissors: 2,
} as const;

export const MOVE_TO_CARD: Record<Move, RpsCard> = {
  0: "rock",
  1: "paper",
  2: "scissors",
} as const;

// Gewinner-Helper
export function winnerOf(a: RpsCard, b: RpsCard): "a" | "b" | "tie" {
  if (a === b) return "tie";
  if (
    (a === "rock" && b === "scissors") ||
    (a === "scissors" && b === "paper") ||
    (a === "paper" && b === "rock")
  ) {
    return "a";
  }
  return "b";
}
