# Alchono — Master Build Log & Roadmap

The living, cross-session record of what's built, what's in flight, and what's
next for the adventure-hub reimagining of Alchono. **Keep this current** — update
it at the end of a working session so the next one starts oriented.

_Last updated: 2026-09-29 (Me room in; glows rounded; Saved stub added)_

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
- **Me** — left / front / right, your private space. **No lateral doors by
  design** (close the door and you're just there); only L↔F↔R + back to café.
  Profile (locker), Your moments (corkboard), Looking forward to (notebook),
  My Sky (window), AI Coach (armchair), Tonight (bed), Saved (bedside drawer).
  Entered from the café/support "Me". Awaiting Marta's tuned coordinates.
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

- **Saved / favourites system (NEXT).** The Me room's bedside drawer links to
  `/saved` (currently a shell — `app/saved.tsx`). Build the mechanism: a
  favourite toggle on savable items (arcade games, reading articles, moments/
  community posts, drink recommendations) + a store, then real saved rows in the
  drawer. The point: reach your saved things without leaving the room mid-craving.
- **Bake pending coordinates:** the Me room hotspots/labels/glows, the book page
  zone + font (from Marta's Export), and the Resources thumb-tab tap-zones
  (currently guessed).

## 🧹 Companion removal — done + leftover cleanup

The decorative "companion" character (a chosen mate shown as an image overlay on
many screens) is **retired** — the hub rooms replaced that presence.
- **Done:** `companions.ts` stripped of all image requires (poses resolve to
  nothing); `CompanionArt` renders null when there's no art, so the overlay is
  gone from every screen with no layout changes; the onboarding **companion step
  removed** (now 4 steps); the **73 character assets deleted** (the 4 star images
  in `assets/companions/` stay — the constellation screen may use them).
- **Leftover cleanup (cosmetic, low priority):** remove the now-imageless
  companion picker entry points (`app/companion/choose.tsx`, any Settings
  "change companion" link) and the unused `CompanionCarousel/Picker/Menu/
  ActionZone` components; drop `companionId` from `UserPreferences`. None of this
  blocks anything — they just render empty now.

## 🧭 Onboarding & AI-coach personalization (direction)

Design principle (Marta's, and it's the right one): **you can't extract the
truth up front.** Someone actively drinking "can't be bothered" with a long form
and lies to the GP, so they'll lie to (or skip) a sign-up quiz too. So:

- **Onboarding = username & in.** Done. Alchono is anonymous and account-free —
  a handle is the only thing asked. Reasons/drinking/people were removed.
- **"My circumstances" is a living page**, not a one-time form
  (`app/profile/preferences.tsx`), reachable from the **Me room's left-view desk
  drawers**. Consolidating the scattered personalisation bits here: circumstances
  (family/work/location) + **"Things I enjoy" (hobbies) now folded in**. Still
  separate and could also fold in if wanted: **Identity** (`/profile/identity`)
  and **"struggling with something else"** (`/ecosystem`). The standalone
  `/profile/hobbies` screen still exists (same data) and can be retired later.
- **The AI coach personalises from three streams, no up-front quiz:** behaviour
  (what you actually do in the app), the living circumstances page, and questions
  it asks conversationally over time (dodgeable). It starts general/useful and
  sharpens with use.
- **Follow-up:** the living page can absorb the sections onboarding dropped
  (reasons, drinking) so the coach has a fuller declared picture — as/when Marta
  wants. And wire the coach to actually read behaviour + the page.

## 🔎 Surfacing buried features (settings/profile are full of invisible stuff)

A lot lives in Settings/Profile that almost no one will find. Candidates to give
a real home in the world (diegetic object / page / pop-up), not just a settings
row:
- **The Zine** — ✅ **done**: a `ZineInlay` cover pinned to the **café-right
  corkboard** (live preview, taps through to `/newsletter`).
- **Care team** + **Trusted person** — ✅ **done**: placed on the **bed** in the
  Me right view (Tonight moved to the bedside lamp to make room). Human safety
  net, in your private room.
- **Emergency contacts** — parked: pair with the future emergency "break-glass"
  button (same idea — reach a human fast).
- **Support someone else / mentoring** — parked until the **Support/Break Room**
  work.
- **Messages** already has a home (Support room computer).
- Notifications/nudges toggles, export/delete data, privacy → stay in Settings,
  now reachable via the hub's top-right gear.

Done earlier this pass: Settings + Profile shortcuts on the hub (top-right); the
dead "Your companion" row removed from Settings.

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
