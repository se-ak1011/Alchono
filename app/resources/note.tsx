import React from 'react';
import type { Rect } from '@/components/paper/DrawnForm';
import { ResourcesSheet } from '@/components/resources/ResourcesSheet';

/**
 * Resources — the handwritten loose note, reused everywhere inside except the
 * living room. Same services as the book, folded into quarters: CALL top-left
 * (111/Drinkline/AA bottom-left), TEXT top-right, MEETINGS bottom-right. Rough
 * taps — position over each line in the editor and Export.
 */
const SRC = require('../../assets/folder/resources-note.png');

const R: Record<string, Rect> = {
  res_999: { x: 0.13, y: 0.38, w: 0.26, h: 0.045 },
  res_samaritans: { x: 0.13, y: 0.43, w: 0.26, h: 0.045 },
  res_111: { x: 0.13, y: 0.52, w: 0.26, h: 0.045 },
  res_drinkline: { x: 0.13, y: 0.57, w: 0.26, h: 0.045 },
  res_aa: { x: 0.13, y: 0.62, w: 0.26, h: 0.045 },
  res_shout: { x: 0.56, y: 0.37, w: 0.3, h: 0.045 },
  res_nhs: { x: 0.56, y: 0.42, w: 0.3, h: 0.045 },
  res_7cups: { x: 0.56, y: 0.47, w: 0.3, h: 0.045 },
  res_aameet: { x: 0.56, y: 0.6, w: 0.3, h: 0.045 },
  res_smart: { x: 0.56, y: 0.66, w: 0.3, h: 0.045 },
};

export default function ResourcesNote() {
  return <ResourcesSheet source={SRC} label="resources-note" rects={R} />;
}
