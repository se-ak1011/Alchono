import type { ImageSourcePropType } from "react-native";

// Ambient "quiet bioluminescence" for the night forest. Each effect is a small
// set of transparent frames registered to one spot on that scene's NIGHT art,
// so it plays in place — a vein up a trunk, the lantern fluttering, embers in
// the fire. The engine plays ONE effect at a time, on a random timer, only at
// night (and never with reduce-motion on). Each frame bakes its own fade
// (faint → peak → gone), so the player just cross-dissolves through them.
// Keyed by hub node id; only the nodes listed here come alive.
export type AmbientEffect = { id: string; frames: ImageSourcePropType[] };

export const AMBIENT_LIFE: Record<string, AmbientEffect[]> = {
  // The archway entrance (forest_canopy_night): a vein up the right post, the
  // ivy in the top-left pulsing, the left lantern fluttering.
  forest_canopy: [
    {
      id: "ivy-vein",
      frames: [
        require("../../assets/ambient/forest_canopy/ivy-vein-01.png"),
        require("../../assets/ambient/forest_canopy/ivy-vein-02.png"),
        require("../../assets/ambient/forest_canopy/ivy-vein-03.png"),
        require("../../assets/ambient/forest_canopy/ivy-vein-04.png"),
        require("../../assets/ambient/forest_canopy/ivy-vein-05.png"),
      ],
    },
    {
      id: "lantern-flutter",
      frames: [
        require("../../assets/ambient/forest_canopy/lantern-flutter-01.png"),
        require("../../assets/ambient/forest_canopy/lantern-flutter-02.png"),
        require("../../assets/ambient/forest_canopy/lantern-flutter-03.png"),
        require("../../assets/ambient/forest_canopy/lantern-flutter-04.png"),
        require("../../assets/ambient/forest_canopy/lantern-flutter-05.png"),
      ],
    },
    {
      id: "leaf-pulse",
      frames: [
        require("../../assets/ambient/forest_canopy/leaf-pulse-01.png"),
        require("../../assets/ambient/forest_canopy/leaf-pulse-02.png"),
        require("../../assets/ambient/forest_canopy/leaf-pulse-03.png"),
        require("../../assets/ambient/forest_canopy/leaf-pulse-04.png"),
        require("../../assets/ambient/forest_canopy/leaf-pulse-05.png"),
      ],
    },
  ],
  // The clearing arrival (clearing_front_night): embers in the campfire, a
  // glimpse on the river, a pulse up the right-hand trunk.
  clearing_front: [
    {
      id: "embers",
      frames: [
        require("../../assets/ambient/clearing_front/embers-01.png"),
        require("../../assets/ambient/clearing_front/embers-02.png"),
        require("../../assets/ambient/clearing_front/embers-03.png"),
        require("../../assets/ambient/clearing_front/embers-04.png"),
        require("../../assets/ambient/clearing_front/embers-05.png"),
      ],
    },
    {
      id: "water-glimpse",
      frames: [
        require("../../assets/ambient/clearing_front/water-glimpse-01.png"),
        require("../../assets/ambient/clearing_front/water-glimpse-02.png"),
        require("../../assets/ambient/clearing_front/water-glimpse-03.png"),
        require("../../assets/ambient/clearing_front/water-glimpse-04.png"),
        require("../../assets/ambient/clearing_front/water-glimpse-05.png"),
      ],
    },
    {
      id: "bark-pulse",
      frames: [
        require("../../assets/ambient/clearing_front/bark-pulse-01.png"),
        require("../../assets/ambient/clearing_front/bark-pulse-02.png"),
        require("../../assets/ambient/clearing_front/bark-pulse-03.png"),
        require("../../assets/ambient/clearing_front/bark-pulse-04.png"),
        require("../../assets/ambient/clearing_front/bark-pulse-05.png"),
      ],
    },
  ],
};
