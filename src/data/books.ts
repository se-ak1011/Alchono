import type { ImageSourcePropType } from "react-native";
import type { ToolkitCategory } from "@/lib/toolkit";

/**
 * Hand-drawn book art per toolkit category — a closed cover and an open spread.
 * Added in pairs as Marta draws them. A category with no entry here falls back
 * to the plain toolkit list (the reader redirects), so half-drawn shelves still
 * work: every book opens something, the drawn ones just open the real book.
 */
export type BookArt = { cover: ImageSourcePropType; open: ImageSourcePropType };

export const BOOKS: Partial<Record<ToolkitCategory, BookArt>> = {
  "in-the-moment": {
    cover: require("../../assets/books/in-the-moment-cover.png"),
    open: require("../../assets/books/in-the-moment-open.png"),
  },
  understand: {
    cover: require("../../assets/books/understand-cover.png"),
    open: require("../../assets/books/understand-open.png"),
  },
};
