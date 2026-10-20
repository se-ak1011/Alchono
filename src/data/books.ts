import type { ImageSourcePropType } from "react-native";
import type { ToolkitCategory } from "@/lib/toolkit";

/**
 * Magazine art per toolkit category — a cover (shown in the reading-corner
 * carousel) and an open spread (the article pages). The article text renders on
 * the open spread via the reader's tunable page zone; `page`/`fontScale` carry
 * each magazine's text zone (fractions of the screen + font multiplier), tuned
 * in-app with the pencil editor and Exported. Left off, the reader's shared
 * default is used.
 */
export type BookZone = { left: number; top: number; width: number; height: number };
export type BookArt = {
  cover: ImageSourcePropType;
  open: ImageSourcePropType;
  page?: BookZone;
  fontScale?: number;
};

// Shared starting text zone over the open magazine spread — tune per magazine
// in the editor, then paste the Exported values in here.
const PAGE: BookZone = { left: 0.08, top: 0.35, width: 0.84, height: 0.3 };

export const BOOKS: Partial<Record<ToolkitCategory, BookArt>> = {
  "in-the-moment": {
    cover: require("../../assets/reading/cover-in-the-moment.png"),
    open: require("../../assets/reading/open-in-the-moment.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  understand: {
    cover: require("../../assets/reading/cover-understand.png"),
    open: require("../../assets/reading/open-understand.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  triggers: {
    cover: require("../../assets/reading/cover-triggers.png"),
    open: require("../../assets/reading/open-triggers.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  "planning-ahead": {
    cover: require("../../assets/reading/cover-planning-ahead.png"),
    open: require("../../assets/reading/open-planning-ahead.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  stress: {
    cover: require("../../assets/reading/cover-stress.png"),
    open: require("../../assets/reading/open-stress.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  sleep: {
    cover: require("../../assets/reading/cover-sleep.png"),
    open: require("../../assets/reading/open-sleep.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  relationships: {
    cover: require("../../assets/reading/cover-relationships.png"),
    open: require("../../assets/reading/open-relationships.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  identity: {
    cover: require("../../assets/reading/cover-identity.png"),
    open: require("../../assets/reading/open-identity.png"),
    page: PAGE,
    fontScale: 0.7,
  },
  "after-a-slip": {
    cover: require("../../assets/reading/cover-after-a-slip.png"),
    open: require("../../assets/reading/open-after-a-slip.png"),
    page: PAGE,
    fontScale: 0.7,
  },
};
