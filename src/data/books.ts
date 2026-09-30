import type { ImageSourcePropType } from "react-native";
import type { ToolkitCategory } from "@/lib/toolkit";

/**
 * Hand-drawn book art per toolkit category — a closed cover and an open spread.
 * Added in pairs as Marta draws them. A category with no entry here falls back
 * to the plain toolkit list (the reader redirects), so half-drawn shelves still
 * work: every book opens something, the drawn ones just open the real book.
 *
 * Each open spread is a DIFFERENT drawing, so the page area sits in a slightly
 * different spot per book. `page`/`fontScale` let each book carry its own text
 * zone (fractions of the screen + font multiplier); left off, the reader's shared
 * default is used. Bake per book from the in-app editor Export.
 */
export type BookZone = { left: number; top: number; width: number; height: number };
export type BookArt = {
  cover: ImageSourcePropType;
  open: ImageSourcePropType;
  page?: BookZone;
  fontScale?: number;
};

export const BOOKS: Partial<Record<ToolkitCategory, BookArt>> = {
  "in-the-moment": {
    cover: require("../../assets/books/in-the-moment-cover.png"),
    open: require("../../assets/books/in-the-moment-open.png"),
  },
  understand: {
    cover: require("../../assets/books/understand-cover.png"),
    open: require("../../assets/books/understand-open.png"),
    page: { left: 0.132, top: 0.37, width: 0.76, height: 0.205 },
    fontScale: 0.7,
  },
  triggers: {
    cover: require("../../assets/books/triggers-cover.png"),
    open: require("../../assets/books/triggers-open.png"),
    page: { left: 0.126, top: 0.375, width: 0.76, height: 0.241 },
    fontScale: 0.6,
  },
  "planning-ahead": {
    cover: require("../../assets/books/planning-ahead-cover.png"),
    open: require("../../assets/books/planning-ahead-open.png"),
    page: { left: 0.131, top: 0.385, width: 0.747, height: 0.191 },
    fontScale: 0.8,
  },
  stress: {
    cover: require("../../assets/books/stress-cover.png"),
    open: require("../../assets/books/stress-open.png"),
  },
  sleep: {
    cover: require("../../assets/books/sleep-cover.png"),
    open: require("../../assets/books/sleep-open.png"),
  },
  relationships: {
    cover: require("../../assets/books/relationships-cover.png"),
    open: require("../../assets/books/relationships-open.png"),
  },
  identity: {
    cover: require("../../assets/books/identity-cover.png"),
    open: require("../../assets/books/identity-open.png"),
  },
  "after-a-slip": {
    cover: require("../../assets/books/after-a-slip-cover.png"),
    open: require("../../assets/books/after-a-slip-open.png"),
  },
};
