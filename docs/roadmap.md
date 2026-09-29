# Alchono — Master Build Log & Roadmap

The living, cross-session record of what's built, what's in flight, and what's
next for the adventure-hub reimagining of Alchono. **Keep this current** — update
it at the end of a working session so the next one starts oriented.

_Last updated: 2026-09-29_

---

## How we work (conventions)

- **Branch:** we build from and push to `main`.
- **Art → coordinates workflow:** Marta draws the art (scenes, books, objects) in
  her style and drops it in; Claude wires it and places rough hotspot/zone boxes;
  Marta opens the in-app editor, drags things onto their exact spots, and taps
  **Export**; she sends the numbers; Claude bakes them into the data. In-app edits
  are for _seeing_ — they reset on rebuild, so always Export + send to make them
  permanent.
- **Builds:** every JS/art change needs a fresh **Codemagic** build to reach
  TestFlight. There is **no OTA / EAS Update** (decided against — too fiddly).
  So changes land in batches per build.
- **Voice/tone:** warm, second-person, non-clinical. Gallows-humour skeleton
  world (skull flowers, "existence is exhausting" posters) but tender underneath.
  Display face is **Patrick Hand** (handwritten chalk); body/UI is Inter.

## Architecture map (where things live)

- `src/data/hubScene.ts` — the whole first-person world as data: `HubNode`s
  (viewpoints) with `Hotspot[]` (fractional rects). Engine is art-agnostic.
- `src/components/home/AdventureHub.tsx` — the engine: renders nodes/hotspots,
  the drag **editor** (grid button), glows, inlays, nav arrows. Consumes
  `hubStore.pendingNode` on focus to return to a specific room.
- `src/components/home/HubInlays.tsx` — live content painted onto objects
  (arcade screens, community videos, sky).
- `src/store/hubStore.ts` — tiny cross-screen note; e.g. arcade games set
  `returnNode: "arcade"` so finishing a game lands back at the arcade.
- `src/data/books.ts` — per-category reading-book art (cover + open spread).
- `app/reading/[cat].tsx` — the book reader (cover → contents → article as two
  pages with a spine gutter).
- `src/data/resourceBooks.ts` — per-landline Resources directory art.
- `app/resources/[room].tsx` — the tabbed Resources directory (Call/Text/Meetings).
- `src/components/reader/PageTuner.tsx` — in-app editor for reader pages: drag
  the text box, resize it, step the font, Export. `scroll={false}` lets children
  own layout (the two book columns).

---

## ✅ Done — the world

**Rooms (first-person, connected building):**
- **Café** — front / left (Reading & Writing) / right (The Counter). Side arrows
  now pan between views like the other rooms.
- **Arcade** — front / left / right. Cabinets play live game inlays; games launched
  here return to the arcade front view on finish/back. Left door → Café-Bar.
- **Support** — front / left / right. AI Coach, Recovery, Mentors, Messages,
  Recommendations, Break-Room door.
- **Close-ups:** the **Writing desk** (notebook → note, envelopes → letters,
  recorder → press-to-record Voice note screen, tray → saved notes) and the
  **Reading shelf** (9 drawn books).

**Features:**
- **Reading books** — all 9 categories drawn (cover + open spread); reader opens
  cover → contents → article laid out as **two pages** with a spine gutter.
- **Resources directories** — tabbed "yellow-pages" books for the **home** and
  **arcade** landlines (Call / Text / Meetings; tap to call/text/open).
- **Recommendations** screen (0.0 alcohol-free swaps).
- **Single cold-launch splash** (splash art + CD-ROM loader).
- **In-app editors:** the hub drag editor (hotspots, labels, glows, depth/tilt/
  opacity) and the reader **PageTuner** (text box + font).

## ▶ In progress / next up

- **Me — 3-view room** (NEXT). Marta's bedroom aesthetic (Massive Attack
  _Mezzanine_ poster, moments, looking-forward-to, your sky, profile, tonight).
  Replaces the current single "Me" screen. Art incoming.
- **Bake pending coordinates:** book page zone + font (from Marta's Export), and
  double-check the Resources thumb-tab tap-zones (currently guessed).

## 🔮 Backlog & ideas

- **Emergency "I need a drink" — the LAST thing.** The floating purple pill has
  been **removed for now** (it overlapped editors; in-world urge spots remain in
  each room). Once all rooms/popups are built, replace it with a **diegetic 00s
  emergency fixture** — leaning **break-glass "in case of craving" box** — pinned
  to the **same corner of every screen** (hub, readers, games), subtle with a
  faint breathing glow so it's always findable without hunting. Implementation:
  one global overlay, Marta draws the fixture, Claude mounts it + glow + tap→urge,
  maybe a red "alarm" flash on tap. **Must be on every page.**
- **Future rooms:** two bar rooms — **Café-Bar** (mocktails you can make at home)
  and **Break Room** (social hub: maybe profile / community / coffee mixes).
- **More popups** in the same spirit as the books/directory where they fit.

## 🎨 Editable in-app vs code

- **In-app (Marta, via editors):** hotspot placement/size, labels (size, rotate,
  tilt/depth, opacity, glow), reader text-box placement/size, text size, the
  two-page break.
- **Code (Claude):** where a hotspot _leads_ (routes/doors/nav), the article/
  resource _words_ (curated, proofread — content is good, changes on request),
  live inlays, colours, screens outside the hub, new rooms/books.
