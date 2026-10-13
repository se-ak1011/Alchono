import type { ImageSourcePropType } from "react-native";

// Hand-drawn taped "paper signs" — felt-tip room doodles on torn notebook paper
// with transparent surrounds. Placed near a door/stairway as homey wayfinding
// for a first-time visitor (no institutional signage — this is your house). They
// move/resize like any hotspot in the editor; a sign can also be wired to a room
// so it's the door you tap. Standalone, reusable — scale/perspective to each door.
export type Sticker = { id: string; label: string; image: ImageSourcePropType };

export const STICKERS: Sticker[] = [
  { id: "living-room", label: "Living room (sofa)", image: require("../../assets/signs/living-room.png") },
  { id: "entertainment-room", label: "Entertainment (PS1 pad)", image: require("../../assets/signs/entertainment-room.png") },
  { id: "kitchen", label: "Kitchen (mug)", image: require("../../assets/signs/kitchen.png") },
  { id: "me-room", label: "Your room (bed)", image: require("../../assets/signs/me-room.png") },
  { id: "study", label: "Study (book + pencil)", image: require("../../assets/signs/study.png") },
  { id: "bathroom", label: "Bathroom (toilet)", image: require("../../assets/signs/bathroom.png") },
  { id: "upstairs", label: "Upstairs (stairs + arrow)", image: require("../../assets/signs/upstairs.png") },
  { id: "outside", label: "Outside (trees + path)", image: require("../../assets/signs/outside.png") },
];

export const STICKER_BY_ID: Record<string, Sticker> = Object.fromEntries(
  STICKERS.map((s) => [s.id, s]),
);
