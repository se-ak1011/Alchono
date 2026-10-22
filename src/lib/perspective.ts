// 4-corner (quad) perspective. Maps a source box's rect onto a dragged destination
// quad in the same pixel space, producing a CSS matrix3d — so content laid out in the
// box (e.g. an arcade game in its WebView) warps onto an angled cabinet screen.
//
// Corner order is TL, TR, BR, BL. The algorithm (basis-to-points homography) is
// verified in scratchpad/persp_test.js (identity, translate, trapezoid — corners
// map exactly). Applied as CSS inside the WebView so the browser engine does the
// warp identically on iOS and Android (a native RN projective matrix does NOT warp
// reliably on Android).

export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL

/** Default quad (no warp) — box corners, in box-relative fractions 0..1. */
export const IDENTITY_QUAD: Quad = [[0, 0], [1, 0], [1, 1], [0, 1]];

function adj(m: number[]): number[] {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
}
function multmm(a: number[], b: number[]): number[] {
  const c = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; }
  return c;
}
function multmv(m: number[], v: number[]): number[] {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
function basisToPoints(p: Quad): number[] {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
  const v = multmv(adj(m), [p[3][0], p[3][1], 1]);
  return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
function general2DProjection(src: Quad, dst: Quad): number[] {
  return multmm(basisToPoints(dst), adj(basisToPoints(src)));
}

/** The box (w×h px) warped so its corners land on `quad` (px, same space).
 *  Returns the 16-value column-major CSS matrix3d array. */
export function quadToMatrix3d(w: number, h: number, quad: Quad): number[] {
  const src: Quad = [[0, 0], [w, 0], [w, h], [0, h]];
  const t = general2DProjection(src, quad);
  for (let i = 0; i < 9; i++) t[i] = t[i] / t[8]; // normalise
  const [a, b, c, d, e, f, g, hh, i] = t;
  return [a, d, 0, g, b, e, 0, hh, 0, 0, 1, 0, c, f, 0, i];
}

/** A CSS `matrix3d(...)` string for a `w×h` box warped onto `quad` (px). */
export function matrix3dCss(w: number, h: number, quad: Quad): string {
  const m = quadToMatrix3d(w, h, quad).map((n) => (Number.isFinite(n) ? +n.toFixed(6) : 0));
  return `matrix3d(${m.join(",")})`;
}

/** True when a quad is (near enough) the identity — nothing to warp. */
export function isIdentityQuad(q?: Quad | null): boolean {
  if (!q) return true;
  const id = IDENTITY_QUAD;
  return q.every((p, i) => Math.abs(p[0] - id[i][0]) < 1e-4 && Math.abs(p[1] - id[i][1]) < 1e-4);
}
