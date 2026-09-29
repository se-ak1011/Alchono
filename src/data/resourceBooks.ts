import type { ImageSourcePropType } from "react-native";

/**
 * Hand-drawn "Resources" directory art per landline. Each landline dims a
 * different room behind the book, so the art differs by room. A closed cover
 * plus one open spread per active thumb-tab (the highlight is drawn into the
 * art, so switching tab just swaps the image). A room with no entry here
 * redirects to the plain resources screen.
 */
export type ResourceTab = "call" | "text" | "meetings";

export type ResourceBookArt = {
  cover: ImageSourcePropType;
  tabs: Record<ResourceTab, ImageSourcePropType>;
};

export const RESOURCE_BOOKS: Record<string, ResourceBookArt> = {
  home: {
    cover: require("../../assets/books/resources-home-cover.png"),
    tabs: {
      call: require("../../assets/books/resources-home-call.png"),
      text: require("../../assets/books/resources-home-text.png"),
      meetings: require("../../assets/books/resources-home-meetings.png"),
    },
  },
};
