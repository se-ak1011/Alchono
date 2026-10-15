# The Grounds & the Era System

The design spine for the whole app family. This is the "why" behind the shared
reception and the per-app eras — read it before building any sibling app.

## The core idea

Alchono doesn't work because it's a nice drawn world. It works because it's **a
specific place in a specific time you recognise** — a late-90s / early-2000s
community centre, with the arcade cabinet, the VHS, the CRT, the paper ledgers.
The nostalgia is doing half the therapeutic lifting: you're not in a sterile
"recovery app", you're somewhere warm you half-remember.

A generic "modern nice room" has no memory attached, so it can't pull that
thread. That's why the first drafts of the sibling previews felt flat — they
looked good but read as "modern and the same".

**Fix: every app gets its own era.** Each sibling is its own distinct,
recognisable period. Walking door-to-door in the reception becomes walking
through *time*.

## The Grounds (shared reception)

- A shared **reception lobby** is the civic heart. Each **door** is a sibling
  app; its crest (colour + motif) is baked onto the door in the art.
- Each app ships its **own viewpoint** of the same lobby (you stand on your
  app's mat; your door is behind you). 5 apps → 5 angles of the same room.
- The reception is reached from Alchono via: the **Outside → Reception door**,
  and the **urge porch → "the grounds"** right path.
- Tapping a sibling door **steps into a preview** of that app's home (scenery to
  look around); only the **front counter** is live — the "get this app" CTA
  (points at `/ecosystem` for now; becomes the store link once the app ships).
- The **central corkboard** opens "The Grounds" directory (`/ecosystem`), which
  lists every app with its status and the ethos: *"struggling with two things
  doesn't make you twice as broken, it makes you human."*

### Door order (chronological, left → right)

The reception doors run in era order so the room is a timeline you walk across,
and **cannabis + nicotine sit adjacent** (weed & tobacco travel together):

`Cocaine (Cocano) → Cannabis (Cannano) → [corkboard] → Nicotine (Nicono) → Prescription (Medano)`

## The era / timeline map

| App | Substance | Era | Colour | World & tech signature |
|-----|-----------|-----|--------|------------------------|
| **Alchono** | Alcohol | **1998–2003** | Purple `#A489DE` | VHS, CRT televisions, arcades, newspapers, paper ledgers (the café / community centre) |
| **Cocano** | Cocaine | **2003–2007** | Ivory `#E8E0CF` | Internet café — beige computer cubicles, CD wallets, DVDs, PS2 |
| **Cannano** | Cannabis | **2008–2012** | Green `#5FA463` | Community media club — Wii, iPod docks, shared computers, beanbags |
| **Nicono** | Nicotine | **2013–2017** | Orange `#D08A4E` | Community workshop — communal project tables, pinboards, compact laptops, Bluetooth stereo, PS4 corner |
| **Medano** | Prescription meds | **2018–2022** | Teal `#4FA0A8` | Community wellbeing library — quiet study booths, shared charging points, video-call room, Nintendo Switch nook |

The shared visual language travels across all eras: **skull-flowers**, hooded
skeletons, ivy, laurel crests, warm low lighting. The *era* localises the props;
the *motif* keeps it one family.

### App logos / crests
- Alchono — (existing mark)
- Cannano — bronze medallion: skull in ferns behind an open garden gate
- Cocano — laurel crest: hooded bust, split bone/charred-horned skull
- Nicono — death's-head moth, skull on the thorax, one skeletal wing
- Medano — Rod of Asclepius: teal snake on a staff, its own ribcage showing, skull at the base

## Which apps we build (and which we don't)

Building only the ones with genuine lived experience / domain knowledge:
**Alcohol, Cannabis, Cocaine, Nicotine, Prescription medication.**

**Not** building Gambling or Pornography (for now) — different mechanics,
different crisis points, different safe/unsafe moves. Building a recovery tool
for something you don't understand from the inside risks being useless or
harmful. Removed from the reception and the directory entirely.

## Architecture (when we build the siblings)

Decision: **Option A — each sibling is its own repo, a copy of the Alchono
engine, reskinned.** Repos created and connected: `se-ak1011/cannano`,
`se-ak1011/cocano` (empty for now; more to follow).

Why A over a single shared engine: the **world/engine is shared, but the
recovery is genuinely different per substance** — different timelines, crisis
points, "what helps right now", coach behaviour, resources. Forcing all five
through one brain would water each one down.

To keep the eventual copy clean, we keep **engine** (world/scene system, editor,
renderer) and **content** (recovery copy, tools, coach prompts, resources)
cleanly separated in Alchono, so copying brings the skeleton over untouched and
only the content layer is swapped.

## Status

- **Alchono** — in active build (the one everything else is cloned from).
- **Cannano / Cocano** — repos created + connected, empty, parked until Alchono
  is finished. Nicono / Medano repos to follow.
- Build order when the time comes: **Cannano first** (furthest along on art).
