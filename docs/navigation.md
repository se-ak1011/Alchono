# Navigation — the clean wheel, and the roaming building

Two ways to move through Alchono's world. We're on the first now; the second
is the redraw you're considering. This note holds both so the plan's ready
when you pick up the pencil.

---

## Where we are now: the clean wheel

The world is **hub-and-spoke**. The Café front (`front`) is the centre of the
wheel. Every room is a spoke off it, and every room's **Back arrow returns to
the front**. You go *Café → a room → Café → another room*. Simple, never lost,
one tap home from anywhere.

```
                 Reading / Writing
                        |
   Café-Bar  —  [ CAFÉ FRONT ]  —  The Counter
                        |                 |
                  Break Room          (key holder)
                        |                 |
                     Outside  ←———————————
                        |
                   RECEPTION  (the grounds — other apps)
```

### What we just fixed (build after this commit)

The grounds were buried: *front → breakroom → breakroom_right → outside door →
reception* was **5 taps deep**. Two changes cut that in half:

1. **Key holder on the Counter** (`r_keys` on the `right` node) → `outside`.
   A shortcut straight to the yard from the home right view. *No drawn key
   holder yet — it's an invisible glow at a rough spot; drag it onto the hook
   in the editor once the art has one, then export.*
2. **Outside's Back → the Counter** (was the Break Room). So the Counter →
   Outside → Counter is a clean there-and-back.

The Break Room's back door (`brr_door → outside`) stays as a **second, scenic
entrance** — the long way round still works.

Result: the grounds are now **2 taps** from home (Counter → key holder →
Outside → Reception = 3, or straight Counter → Outside if we later put a
Reception glow on the Counter too). Nothing was redrawn.

### If you want to go further without redrawing

Cheap wins that only need a glow placed on existing art:
- A **Reception/grounds glow** right on the Counter or Café front, so the
  grounds are one tap, not through Outside.
- Surface any other buried room the same way — a glow on the front that jumps
  straight to it.

These keep the wheel; they just add more spokes to the hub.

---

## The redraw: the roaming building

Instead of a hub with spokes, the world becomes a **place you walk through** —
rooms that open onto *each other*, not just back to the Café. This is what
makes it feel like a real community centre you can wander, and it's why you'd
redraw: each new connection is a **drawn door or opening in both rooms'
art**.

### The core idea

Drop the "Back always = Café" rule. Each room remembers where you came from
(or has its own doors drawn in), so movement is *spatial*: the Break Room is
behind the Café-Bar, the quiet rooms cluster together, Reception is the
**foyer you actually enter through**, not an annex five taps away.

### A floor plan to draw toward

Think of it as wings off a central concourse:

```
              ┌───────────── THE GROUNDS (outside) ─────────────┐
              │                                                  │
         [ RECEPTION / FOYER ] ——— front door ——— [ CAFÉ CONCOURSE ]
              │  (other apps)                         /    |     \
              │                                      /     |      \
         (sibling app doors)              Café-Bar  Reading/   The Counter
                                              |      Writing       |
                                          Break Room    |       Arcade
                                              |      Support
                                           Outside ——————┘
                                          (garden)
```

**Adjacencies worth drawing** (each = a door in *both* rooms):
- **Reception ↔ Café** — the foyer opens into the concourse. This is the big
  one: it makes the grounds the *threshold* of the world, so stepping to a
  sibling app feels like walking out to the lobby, not spelunking.
- **Café ↔ Café-Bar** — they're one space anyway; an archway, not a door.
- **Café-Bar ↔ Break Room** — staff/social area behind the bar.
- **Break Room ↔ Outside** — the back door (already drawn).
- **Outside ↔ Reception** — the yard wraps round to the foyer (already there).
- **Reading/Writing ↔ Support** — the quiet, reflective wing sits together.
- **Arcade ↔ Café-Bar** — games live off the social end.

### What each connection costs you (art)

For every door above you'd draw, in the room's existing view:
- the **door/opening itself**, sitting naturally in the wall (perspective
  matters — you said the whole app lives on perspective);
- ideally a glimpse *through* it (a sliver of the next room) so it reads as a
  way out, not a painting;
- and the **matching door on the other side**, so arriving somewhere shows the
  door you just came through.

Rooms that become **corridors/junctions** (the Café concourse, Reception)
may want a wider view or a second pan so multiple doors fit without crowding.

### What it costs in code (small, once the art exists)

The engine already does most of it:
- Each drawn door is just a `hotspot` with `action: { kind: "node", node }` —
  exactly what doors already are.
- **Back** stops being a fixed `back: "front"`. Options:
  - *Breadcrumb back* — the hub store remembers the node you came from and
    Back returns there. One small change to how `back` resolves; no per-room
    wiring. Good default for a roaming feel.
  - *Drawn-door back* — no Back arrow at all; you leave the way you came
    because that door is drawn in the scene. Purest, most immersive; needs
    every exit drawn both ways.
  - A **hybrid**: drawn doors for neighbours + a breadcrumb Back as a safety
    net so no one gets stuck. Recommended — immersive but forgiving.
- `pendingNode` (the jump-to-node mechanism) already handles cross-scene jumps
  like Outside → Reception, so sibling-app previews keep working unchanged.

### Order to do it in, when you're ready

1. Redraw **Reception ↔ Café** first — biggest payoff, makes the grounds feel
   like the front door. Test it alone.
2. Add the **breadcrumb Back** so nothing's a dead end mid-redraw.
3. Draw the rest of the doors a wing at a time (social wing, quiet wing),
   testing each so the world never breaks between passes.

### The spell to protect

The reason to redraw at all: a wheel is an *app*, a building is a *place*.
The nostalgia does the therapeutic lifting, and "place" sells the nostalgia.
But the wheel is never *lost* — so there's no rush. Clean wheel holds the
fort; the building is yours to grow into when the art's ready.
