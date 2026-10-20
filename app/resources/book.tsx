import React from 'react';
import type { Rect } from '@/components/paper/DrawnForm';
import { ResourcesSheet } from '@/components/resources/ResourcesSheet';

/**
 * Resources — the full typewriter "yellow pages" book in the living room.
 * CALL on the left page; TEXT + MEETINGS on the right. Rough taps — position
 * over each line in the editor and Export.
 */
const SRC = require('../../assets/folder/resources-book.png');

const R: Record<string, Rect> = {
  res_999: { x: 0.14, y: 0.49, w: 0.26, h: 0.045 },
  res_samaritans: { x: 0.14, y: 0.54, w: 0.26, h: 0.045 },
  res_111: { x: 0.14, y: 0.585, w: 0.26, h: 0.045 },
  res_drinkline: { x: 0.14, y: 0.63, w: 0.26, h: 0.045 },
  res_aa: { x: 0.14, y: 0.675, w: 0.26, h: 0.045 },
  res_shout: { x: 0.56, y: 0.49, w: 0.3, h: 0.045 },
  res_nhs: { x: 0.56, y: 0.535, w: 0.3, h: 0.045 },
  res_7cups: { x: 0.56, y: 0.58, w: 0.3, h: 0.045 },
  res_aameet: { x: 0.56, y: 0.66, w: 0.3, h: 0.045 },
  res_smart: { x: 0.56, y: 0.705, w: 0.3, h: 0.045 },
};

export default function ResourcesBook() {
  return <ResourcesSheet source={SRC} label="resources-book" rects={R} />;
}
