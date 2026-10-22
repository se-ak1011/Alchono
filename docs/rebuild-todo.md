# Alchono — rebuild / positioning pass TODO

_Paused for sleep: 2026-10-22, ~01:45. Resume here._

This tracks the in-app repositioning pass (clear-everything-and-rebuild) and the
fixes/tools found along the way. Pickers are being trimmed **without** purging the
underlying nodes/code yet — a full code purge comes later.

---

## ✅ Done so far

- **New 3-game arcade lineup** swapped in (replaces the old 4), one per console:
  Game Boy → **Skull Patrol**, Arcade → **Grave Shift**, PS1 → **Spirit Drift**.
  Each has a live inlay + an attract-loop preview inlay. Old 4 fully retired.
- **Device-independence (bake-once):** hub, close-ups (DrawnForm), reader (PageTuner)
  and the letter paper all anchor to the drawing (cover-fit), so one baked coord set
  works on any phone size/shape. Position on one phone only.
- **Exterior (360) baked** from the positioning pass (see reference at the bottom).
  `exterior_forest` is now orphaned → flagged for the eventual purge.
- **Builds off `main` with the new games:** Android ✅ green (APK at the usual release
  link), iOS on **TestFlight** (the red "Publish to TestFlight" step is just Apple's
  external-review paperwork, not the build).
- Branch `claude/alchono-expo-native-mvp-edl82z` **and `main` in sync**, tsc clean (156 baseline).

---

## ⏳ Outstanding — resume here

### 1. Link-picker cleanup — IN PROGRESS (batch 1 captured)
Trim the destination picker (`src/data/destinations.ts`) + inlay picker
(`INLAY_OPTIONS` in `src/components/home/HubInlays.tsx`) to only what's used.
**Dot = remove.** Pickers only for now — do NOT delete the underlying nodes/screens yet.

**Batch 1 — REMOVE from the destination picker (captured 01:28):**
- Urge/Forest: `Urge — walk into the forest`
- Rooms: `forest_canopy`; Games Room ×3 (`entertainment_left/front/right`);
  Landing ×3 (`landing_front/left/right`); Study ×3 (`study_left/front/right`);
  `reading_shelf` (the bookshelf); Your Room ×3 (`me_room_left/front/right`);
  `bathroom`; `exterior_forest` (the archway)
- Resources: `resources_living`, `resources_entertainment`, `resources_study`,
  `resources_kitchen`  — **KEEP `resources_outdoors`** (= the "outside" resource)
- 0.0 — all four cards: `zerozero_beer`, `zerozero_cider`, `zerozero_spirits`, `zerozero_wine`
- Support & people: `Recommendations (0.0)`; `Care team`; `Trusted person`
  (keep the combined `Connections (care team + trusted)`)
- Other: `The Grounds (ecosystem)`

**Batch 2 confirmed KEEP (no dots):** all Reading — the 9 books (+ "bookshelf — all
reading"); the entire **Crisis lines** group (999 / Samaritans / 111 / Drinkline / AA /
Al-Anon / NACOA / Shout / NHS advice / 7 Cups / AA meeting finder / SMART Recovery);
`Bar / drinks menu` (→ to be renamed "Mocktails (menu)").

**Keep (notable):** jump-to-clearing, `forest_hall`, clearing ×3, living room ×3,
kitchen ×3, `hobby_room`, loft ×3, exterior ×4, `resources_outdoors`, AI Coach,
Recovery, Mentors, Messages, Community, Connections, all You & Tracking, all Writing,
all Games (Skull Patrol / Grave Shift / Spirit Drift).

**Also do during the trim:**
- [ ] ADD **Resources Book** (`/resources/book`) + **Resources Note** (`/resources/note`)
      → resources picker becomes **Book · Note · Outside (`resources_outdoors`)**
- [ ] RENAME `Bar / drinks menu` → **"Mocktails (menu)"** (it's `/bar/menu`, just mislabelled)

**Destination picker: fully captured** (both batches, all 7 shots). Not yet reviewed:
the separate **inlay picker** (`INLAY_OPTIONS`) — likely fine (games already updated),
but confirm whether it needs a trim too.

**❓ Confirm with Marta before executing the trim:**
1. **0.0 deck:** all four 0.0 cards AND `Recommendations (0.0)` are removed. *Proposed:*
   replace them with a **single "0.0 drinks deck"** entry → `zerozero_beer` (the deck
   start; you swipe through cider/spirits/wine), so a kitchen hotspot can still open the
   deck. Confirm — or say if the deck's only reached via the baked kitchen inlay.
2. **"WRITING" mark:** teal stroke by the WRITING header (no dot, not on a line) — what
   did that one mean?
3. ~~Crisis lines — cut?~~ → **RESOLVED: keep them** (nothing dotted in batch 2).
4. **Inlay picker** (`INLAY_OPTIONS`): needs a trim too, or leave as-is?

### 2. Editor BUG — translucency / hide-while-dragging not working  ⚠️ high priority
- [ ] In the **hub editor** (`AdventureHub.tsx`), the control panel is meant to go
      translucent / disappear while dragging so you can see where you're placing.
      It isn't. Investigate why and fix. (Blocks the whole positioning pass — do early.)

### 3. Editor TOOL — 4-corner perspective for arcade screens  — IN PROGRESS
- [x] Perspective maths util `src/lib/perspective.ts` — homography (basis-to-points) →
      CSS matrix3d. Tested (identity / translate / trapezoid: corners map exactly).
- [x] Approach DECIDED (Marta 👍): apply the warp as **CSS inside the game's WebView**
      (reliable on Android; a native RN projective matrix does NOT warp there). The game
      picture warps *inside* the screen box — drag the 4 corners to fit the cabinet screen.
- [x] Rendering: matrix3d injected into `GameWebInlay` / `PreviewWebInlay`, applied live
      via `injectJavaScript` from the WebView's real size. `persp` quad on Hotspot/Edits.
- [x] Editor UI: inlay panel "Edit corners" toggle → 4 draggable TL/TR/BR/BL handles
      (game warps live as you drag) + "Reset" + `persp` added to the export string.
- [ ] **NEEDS A BUILD TO VERIFY** (un-testable here): live warp smoothness, handle
      placement, and that the WebView warp renders on Android.
- [ ] Bake exported `persp` corners into hubScene (once Marta positions + exports).

### 4. Reading room — REVISED SPEC (Marta's new vision, 22 Oct) — waits on her new art
Magazines are a stack/carousel of covers; the COVER is the index.
- [ ] **Covers carry the article blurbs pre-printed** (she's redrawing them). A
      **transparent tap over each article blurb on the cover** opens THAT article.
- [ ] **Remove the contents/chapters menu** — that was a "book" idea; articles are
      chosen on the cover now.
- [ ] **Inside-page art = a magazine spread** with the article **titles pre-drawn**
      (kicker "In the moment" + title + purple rule, one article per page — e.g. the
      "In the moment" spread shows *Urge surfing* | *The HALT check*). Bodies empty;
      we **overlay the article text** under each title. No next-page / next-article arrows
      — articles are independent.
- [ ] Fix **cropped cover/page images** (image fit).
- [ ] **Picker:** she needs the individual **articles** as tap targets (not the 9 magazine
      entries). NOTE: the cover article-taps live in the /reading screen's own editor
      (it's a route, not a hub node) — confirm how she wants them authored.
- [ ] Needs a per-article open + reader rework (independent article view, text overlaid on
      the pre-drawn spread, no contents / no pagination).
- OPEN Qs: does one spread hold all of a magazine's articles (tap scrolls to the right
  one) or one article per open? How are the cover tap-zones authored (hub vs PageTuner)?
- Flow: loft table → magazine stack (swipe covers) → tap article on cover → its spread → back.

### 4b. Full in-app TEXT EDITOR — ships WITH the reading room (same build)
- [ ] A proper text editor so article/body text can be written + positioned in-app
      (overlaid on the pre-drawn spreads), instead of hard-coded in `src/lib/toolkit.ts`.
      It exists *because of* the reading pages, so it's built together with §4 and lands in
      the same build (not a separate parked item). Large, but coupled to reading.

### 5. Inside coordinates — WAITING ON MARTA
- [ ] She'll send the interior positioning coords (living room, kitchen, loft, the
      close-ups) for me to bake, same flow as the exterior.

---

## Suggested order
1. **Picker cleanup** (unblocks positioning + kills the confusion)
2. **Translucency fix** (so she can actually see where she's placing)
3. **Reading room** rework
4. **4-corner tool** build
   — baking inside coords as they come in.

---

## Reference — exterior coords already baked (2026-10-22)

| View | New hotspots | Removed | back → |
|---|---|---|---|
| `exterior_front` | front door → `living_room_front` (0.270, 0.433, 0.172, 0.217, plain); path → `forest_hall` (0.423, 0.750, 0.418, 0.190, plain) | `exf_door` | (none) |
| `exterior_right` | — (pan-through) | `exr_kitchen`, `exr_bedroom` | `exterior_front` |
| `exterior_back` | kitchen → `kitchen_front` (0.464, 0.420, 0.168, 0.200, plain); hobbies → `hobby_room` (0.194, 0.533, 0.117, 0.057, glow/purple) | `exb_hobby`, `exb_archway` | `exterior_right` |
| `exterior_left` | stair → `loft_reading` (0.133, 0.350, 0.118, 0.135, plain) | `exl_arcade` | `exterior_back` |

360 left/right pan preserved throughout. `forest_hall` = the woods trail entrance;
`exterior_left` has a real external staircase up to the loft reading room (both confirmed deliberate).
