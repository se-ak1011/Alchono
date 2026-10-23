# Alchono — 3D World Vision

_Status: vision / pre-build · drafted 2026-10-23_

The redesign of Alchono from a 2D hotspot app into an **explorable 3D world**.
This is the map we build from. It will grow as decisions land.

---

## 0. Direction update — 2.5D first-person (2026-10-23 eve) · SUPERSEDES the 3D-first plan below

After the Phase-0 grey-box we sharpened the direction. We're building **2.5D
first-person**, not full real-time 3D. (3D/WebXR/Quest becomes the future v2 dream.)

- **Look:** realistic/atmospheric **natural backdrops** (forest → root-arch
  entrance → root staircase → cave) with Marta's **hand-drawn objects layered on
  top**. The clash of a raw real cave and cartoony-macabre drawn life is the signature.
- **Structure — "natural structure, layered life":** nothing is man-made. Every
  space is a naturally-formed backdrop (caves, roots, rock); rooms and stairs exist
  only as natural features (like the root entrance), never built. Fiction: you found
  the cave on a walk during a hard time, and you make it yours by **bringing your
  life in** and layering it over the bare stone.
- **Movement:** first-person **node-based** — stand in a location and **pan** (drag
  to look across a wide plate); tap objects to use them, tap passages to move to the
  next natural space. Main chamber pans left/right; more areas branch off it.
- **Engine:** an **evolution of the existing hotspot engine** (scene + layered
  interactables) — wide pannable backdrops, first-person framing, drawn hands on
  interaction, and a drawn avatar others see in community. Reuses most of what's
  built; Supabase/data/features and the HTML arcade games all carry over.
- **Build in from day one:** organic **wayfinding** (glow on interactables, shimmer
  on passages, hand reacts) so "all natural" never means "lost."
- **On the table:** the cave **furnishes over time** — starts bare, fills with your
  life as you use it / hit milestones. The sanctuary grows more yours as you recover.

The 3D sections below are kept as the **future v2 dream**, not the near path.

---

## 1. The north star — why

Alchono is being rebuilt as **its creator's own space** — a personal sanctuary,
not a clinical tool. The guiding reframe:

> You're not a patient being treated. You're the hero returning to your hidden
> base to regroup, arm up, and get strong — then go back out to your life.

Everything serves that feeling: **hidden, safe, yours.** The purpose is unchanged
(an alcohol-recovery companion); what changes is whose world it is and how it
feels to be in it. Design decisions get measured against one question: *does this
make it feel more like a refuge that's mine, or less?*

---

## 2. The world — what you experience

One continuous journey, no menus-as-rooms:

1. **The forest.** You control an avatar in an ancient wood. Calm, explorable,
   alive. This is also where you go to *walk out an urge* — the outside, the air.
2. **The hidden entrance.** Somewhere in the trees stands an ancient tree with a
   concealed way in. Finding it is part of the ritual — you arrive on purpose.
3. **The descent.** Down through the roots, into the dark.
4. **The chamber.** One main underground space that **contains everything** — an
   earthy Batcave. Every feature lives here as an object you walk up to. Because
   it's one cavern, it can never feel like scattered, disconnected rooms again.

The forest above / cave below split keeps the outdoor world she always wanted
**and** the hidden sanctuary, in one coherent place.

---

## 3. Look & feel — the design language

**Earthy Batcave.** Not sci-fi, not sterile. Natural and hand-made:

- **Materials:** dramatic tree roots breaking through, wet stone, timber, bone.
- **Analogue tech, 90s–00s:** CRTs, cassette decks, arcade cabinets, a console
  of real buttons and dials. The tech is warm and tactile, not glossy.
- **The motif is hers:** the **drained skeletons** come home — carved into stone,
  lantern-lit in the shadows. Cosy-macabre. This is the signature that makes it
  unmistakably Alchono and not a generic 3D scene.
- **Light:** darkness with *pools* of glow — lanterns, screen-light,
  bioluminescence. Mood comes from contrast, not brightness.
- **Colour:** the existing **purple** becomes the glow-in-the-dark — so the
  current palette was right all along; it just needed the dark around it to mean
  something. Earthy browns, wet black, bone, with purple light.

**Art pipeline — DECIDED: hand-drawn textures AND objects.** Her hand-drawn work
becomes both the surfaces (bark, stone, bone) and the objects themselves, so the
world stays unmistakably hers and avoids a generic modelled look — no 3D sculpting
required. A **hand-drawn diorama** look is on the table (drawn objects standing in
real 3D space, pop-up-book / painted-set style; lighter on mobile), with the exact
technique following the art once concepts land.

**Workflow — concept-driven.** Marta draws the world in **2D first** (the visual
target), then the 3D is built in code to *reach* that drawing. She's art director;
the build chases her concept. Most useful inputs: a **scene drawing** per space =
the composition target; **individual objects/textures on transparent backgrounds**
(like the deck cards / magazine spreads) = dropped straight into the 3D.

---

## 4. The tech path — how

**Confirmed direction: a web-3D engine + WebXR.** One codebase that:

- runs as a **touch-controlled world on the phone first**, and
- flips into **real VR on a Meta Quest later** with the same scene (WebXR), and
- still talks to the **existing Supabase backend**, so data and logic survive.

**Engine:** lead candidate **Three.js + React Three Fiber** (keeps the React
mental model from the current app, huge ecosystem, WebXR built in). Strong
alternative **Babylon.js** (more batteries-included VR/scene tooling). Locked at
the Phase-0 spike (§7).

**Shell / distribution:** the 3D world is a web app. On the phone it ships as an
installable PWA or wrapped (e.g. Capacitor) for an app-store presence; on Quest it
loads in the headset's browser (WebXR) now, with a Quest-store path later. Decision
in §8.

**The key feasibility move — hybrid 3D + 2D:**
> The 3D world is for **presence and navigation**. The actual tools stay **2D UI
> panels** that open when you interact with an object. You walk up to the console,
> a panel opens. This means we **don't rebuild journaling, tracking, community,
> etc. in 3D** — we reuse/port the existing screens as summoned panels. Massive
> scope saving, and it's how real mixed apps work.

---

## 5. Preserving what exists

"Change almost everything" is about the *shell and the feel*, not the guts. These
carry over:

- **Supabase backend** — auth, recovery tracking, community, moments, messages,
  connections: the data and logic are reused by the web app directly.
- **The arcade games** — already self-contained HTML (Skull Patrol, Grave Shift,
  Spirit Drift). They become the content **on the in-world cabinet screens**
  (rendered to a texture / CSS3D), basically for free.
- **Her art** — the drawn scenes, covers, spreads become **textures** in the world.
- **Feature UIs** — ported as 2D panels (per §4), not rebuilt from scratch.

The current 2D Expo app keeps working and shipping until the 3D world is ready to
replace it. We don't break what works to build what's next.

---

## 6. Feature → in-world mapping

Each current feature becomes an object you walk to in the chamber:

| Feature (today) | In the cave |
|---|---|
| AI Coach | The command console / Batcomputer (bank of CRTs) — fixes the out-of-place coach room |
| Arcade games | The arcade cabinets, in the analogue-tech corner (existing HTML on the screens) |
| Reading / toolkit | A reading nook / archive shelf, lantern-lit |
| Tracking · AF days · victories | Trophy alcoves — a wall of milestone lights |
| Journal (write/voice/notes/letters) | A writing desk |
| Community · moments · board | A wall of screens / the comms board |
| Connections · mentors · messages | A comms station / old radio set |
| 0.0 decks · mocktails menu | A little bar / shelf |
| Goals | A planning board |
| Crisis lines · resources | A landline phone + the bookshelf |
| Profile · preferences | Settings on the console |
| Urge / "walk it off" | **The forest above** — step outside and walk |

---

## 7. Phasing — so you always see it real

Never a month of faith with nothing to look at.

- **Phase 0 — vertical slice (grey-box).** Walkable: forest → find the tree →
  descend → stand in the chamber and look around. Rough shapes, no art, no
  features. Confirms the engine, the controls, the *feeling*. Ships to your phone.
- **Phase 1 — the world takes shape.** Real art/textures on the forest + chamber.
  One feature wired as an interaction panel (probably the console / AI coach) to
  prove the hybrid pattern end-to-end.
- **Phase 2+ — furnish the cave.** Bring features in one station at a time, each
  its own small build: arcade cabinets, reading nook, trophy wall, desk, comms…
- **Later — VR.** Turn on WebXR, add Quest controls/comfort, test in the headset.

---

## 8. Open decisions

- [x] **Avatar perspective — DECIDED: embodied first-person.** You're in your own
      eyes; you see your own hands/arms when you interact (open a drawer, hold a
      thing). "Player 1" feel, and VR-native so the Quest version inherits it.
      Full-body avatars still exist and are **visible to other players in the
      community / social spaces** (Ready-Player-One model). Implementation: build
      the full body, drop the FP camera into its eyes, hide the own-head mesh.
- [ ] **Community / social presence (networked avatars)** — others see your full
      avatar and move around shared spaces. A real feature with its own design.
      _Parked — Marta will detail the community vision ("will be back to this")._
- [x] **Art pipeline — DECIDED:** hand-drawn textures AND objects; 2D-concept-first
      workflow (she draws the target, code reaches it). Diorama look likely. See §3.
- [ ] **Engine:** React Three Fiber (lead) vs Babylon.js — lock at Phase-0 spike.
- [ ] **Shell:** PWA vs Capacitor wrapper vs a thin RN shell hosting the web world.
- [ ] **How much is "game" vs "calm space":** is the forest a thing you *play*, or
      a thing you *move through*? Sets the tone of controls and pacing.
- [ ] **Mobile performance budget** — how rich the cave can be and still run smooth
      on her phone.

---

## 9. What we keep from today

Nothing learned is wasted. The current project proved out the **content, the
features, the recovery logic, the art direction, and — most of all — the shape of
what she actually wants.** The code was always the cheap part; the vision is the
expensive part, and that's now clear. We build the new shell around work that
already holds.
