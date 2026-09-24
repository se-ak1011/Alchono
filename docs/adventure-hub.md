# The Adventure Hub

**Read this before adding a room, moving a hotspot, or touching the scene map.**

The Home screen isn't a menu. It's a **first-person point-and-click adventure**
— you walk *into* the café the way you walk into a room in a 00s CD-ROM game
(think Myst, The 7th Guest). Each destination in the app is a real object you
tap: a chalkboard, the counter, the arcade cabinet, the paper rack. Turn-arrows
swing you between viewpoints. A caption bar names whatever you're touching.

The whole thing is **data-driven**. The engine (`AdventureHub.tsx`) knows
nothing about the café — it just renders whatever the map in
`src/data/hubScene.ts` describes. Redraw the art, edit the map, and it's a
different place. That's the point: the art is yours, and the code just follows.

---

## The two pieces

- **`src/data/hubScene.ts`** — the map. Plain data: which rooms exist, what
  picture each one shows, and where the tappable objects sit on it. This is the
  file you edit.
- **`src/components/home/AdventureHub.tsx`** — the engine. Reads the map and
  draws the rooms, the labels, the glows, the arrows, and the caption bar. You
  rarely need to touch this.

### A room is a "node"

Each viewpoint is one `HubNode`:

```ts
front: {
  id: "front",
  title: "The Café",
  image: require("../../assets/scenes/cafe_front.png"),
  imgW: 851,          // the PNG's real pixel width…
  imgH: 1848,         // …and height. These MUST match the file.
  fit: "screen",      // fill the phone screen (cover), don't letterbox
  left: "left",       // the left turn-arrow goes to the "left" node
  right: "right",     // the right turn-arrow goes to the "right" node
  hotspots: [ ... ],  // the tappable objects (below)
}
```

- `left` / `right` / `back` are the turn-arrows. Set the ones that make sense;
  leave the rest off. `back` is what a side room uses to return to `front`.
- `placeholder: true` just marks a room whose art is still a rough draft, so
  we remember to redraw it. It doesn't change behaviour.
- `imgW` / `imgH` **must be the picture's real dimensions.** The engine uses
  them to map fractional coordinates onto the covered image, so a wrong size
  puts every hotspot in the wrong place. (Check in Preview / any image viewer,
  or `file`/`sips` on the PNG.)

### A tappable object is a "hotspot"

```ts
{ id: "community", caption: "Community", kind: "board", label: "Community",
  x: 0.012, y: 0.242, w: 0.11, h: 0.14,
  action: { kind: "route", route: "/community" } }
```

- **`x, y, w, h`** are fractions of the image, `0..1`. `x,y` is the top-left
  corner, `w,h` the size. `0.5, 0.5` is dead centre. You almost never type these
  by hand — the in-app editor does it for you (see below).
- **`caption`** is the little text that appears in the bottom bar when you touch
  the object.
- **`kind`** is how the object signals it's tappable:
  - `board` — a chalk label in the SkinnyCustard font (for the chalkboards)
  - `sign` — text with a strong shadow (Resources, the urge sign)
  - `glow` — a soft breathing light over the object, no text (the arcade, the
    counter, the paper rack)
  - `plain` — an invisible tap target, no visible hint
- **`label`** is the words drawn on `board`/`sign` hotspots. Use `\n` for a line
  break (`"Reading\nCorner"`). `glow` and `plain` ignore it.
- **`prominent: true`** makes a `sign` bigger and uppercase — used for the urge
  sign so it's impossible to miss.
- **`action`** is where a tap goes:
  - `{ kind: "route", route: "/community" }` — jump to a screen in the app
  - `{ kind: "route", route: "/session/urge", warn: true }` — same, but `warn`
    is for the urge/craving flow (it fires a warning haptic)
  - `{ kind: "node", node: "left" }` — move to another viewpoint in the hub

### One object, many views

Because the viewpoints overlap, an object you can see from two angles gets a
hotspot in **each** view it appears in. The Me door shows in `front` *and*
`left`; the counter shows in `front` *and* `right`. That's why the left room has
its own `l_me` and the right room its own `r_bar` — same destination, placed
separately for each picture. Keep this up: if you can see it, it should be
tappable from there.

> The urge button is the exception — it doesn't rely on hotspots at all. It's a
> global button (`src/components/ui/UrgeButton.tsx`) rendered once at the app
> root, so it floats over **every** screen in the app, hub or not. Someone
> mid-craving never has to find the right room. The `urge`/`r_urge` hotspots are
> just extra, in-world doorways to the same place.

---

## The editor trick (how we place hotspots)

You never have to guess coordinates. The hub has a built-in editor.

1. **Turn it on.** Tap the little **grid button** in the top-right of the hub.
   Every hotspot becomes a draggable, resizable box.
2. **Drag** a box by its middle to move it. **Resize** it with the arrow handle
   at its bottom-right corner. Line each box up over its object in the picture.
3. **Export.** Tap **"Export coordinates"** (bottom of the screen). It prints
   the exact `x, y, w, h` for every hotspot in that room.
4. **Send them over.** Screenshot the export list (or copy it) and send it to
   me. I paste the numbers into `hubScene.ts` — "baking" them in — so they
   become the real defaults.
5. **Turn it off.** Tap the grid button again to go back to the finished view.

The editor is **off by default** now that the three café rooms are placed, but
it never goes away — the grid button is always there. Add a new room, switch it
on, drag the new hotspots into place, export, send. Same loop every time.

### Why export instead of saving in the app?

The dragging happens on your phone, but the *source of truth* is
`hubScene.ts` in the repo — that's what ships to everyone. Exporting is how the
positions travel from your screen back into the code. (An in-app drag only lives
on your device until it's baked in.)

---

## Adding a new room — the checklist

1. **Draw the scene** tall (phone-shaped, portrait). Note its real pixel size.
2. **Drop the PNG** in `assets/scenes/` (e.g. `cafe_kitchen.png`).
3. **Add a node** to `HUB_NODES` in `hubScene.ts`: the `require(...)`, the real
   `imgW`/`imgH`, `fit: "screen"`, and the turn-arrows (`left`/`right`/`back`)
   that connect it to its neighbours. **Wire it both ways** — if the new room's
   `back` points to `front`, give `front` (or whichever room) an arrow *to* the
   new room, or there's no way in.
4. **Add rough hotspots** — one per tappable object, any rough `x,y,w,h` to
   start, with the right `kind`, `label`, `caption`, and `action`. Don't sweat
   the numbers; the editor fixes them.
5. **Build, open the editor** (grid button), drag everything into place,
   **export**, send the numbers over to bake in.
6. Done. The room's live.

---

## Handy facts

- **Fonts:** the chalk labels use **SkinnyCustard** (the hand-lettered display
  face). Body/UI everywhere else is Inter.
- **Fit:** `fit: "screen"` fills the phone (`cover`) so there are no black bars;
  hotspots are measured against that covered image, so they stay put across
  different phone sizes.
- **The boot screen** (`HubLoadingScreen.tsx`) — the spinning-disc "ALCHONO"
  CD-ROM intro — plays once per app launch, then the hub fades in.
- **Routes** in `action.route` are just expo-router paths — the same ones the
  rest of the app uses (`/community`, `/(tabs)/journal`, `/session/games`, …).
  If a screen exists in the app, a hotspot can point at it.
