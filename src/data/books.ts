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
    page: { left: 0.135, top: 0.366, width: 0.771, height: 0.357 },
    fontScale: 0.6,
  },
  stress: {
    cover: require("../../assets/books/stress-cover.png"),
    open: require("../../assets/books/stress-open.png"),
    page: { left: 0.143, top: 0.384, width: 0.724, height: 0.195 },
    fontScale: 0.8,
  },
  sleep: {
    cover: require("../../assets/books/sleep-cover.png"),
    open: require("../../assets/books/sleep-open.png"),
    page: { left: 0.134, top: 0.366, width: 0.734, height: 0.246 },
    fontScale: 0.6,
  },
  relationships: {
    cover: require("../../assets/books/relationships-cover.png"),
    open: require("../../assets/books/relationships-open.png"),
    page: { left: 0.125, top: 0.369, width: 0.763, height: 0.223 },
    fontScale: 0.65,
  },
  identity: {
    cover: require("../../assets/books/identity-cover.png"),
    open: require("../../assets/books/identity-open.png"),
    page: { left: 0.112, top: 0.327, width: 0.785, height: 0.274 },
    fontScale: 0.65,
  },
  "after-a-slip": {
    cover: require("../../assets/books/after-a-slip-cover.png"),
    open: require("../../assets/books/after-a-slip-open.png"),
    page: { left: 0.08, top: 0.341, width: 0.847, height: 0.238 },
    fontScale: 0.7,
  },
};
