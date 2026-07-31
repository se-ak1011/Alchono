# The Companions

**Read this before touching companion art, copy, or the pose system.**

The companions are not six characters. They are **six perspectives on
addiction and recovery.** The user doesn't pick an avatar they like the look
of — they pick the *voice* they need in their corner. Choosing a companion is
choosing what kind of support fits you: someone still in it, someone a step
ahead, someone who loves you from outside it.

That distinction is the whole product. Flatten them back into "six mascots" and
you lose the reason any of this works.

## Why they aren't tied to emotional states

The original idea was to use the companions sparingly and *mixed* — to reflect
the user's state back at them. That idea was deliberately abandoned. Tying the
art to a mood would box people into declaring the state they're in, and make a
relapse feel like a **downgrade** — the app quietly demoting you when you're
already at your lowest. Recovery has enough shame in it without the interface
adding more.

So the poses are **not states. They are activities.** The companion isn't
mirroring your condition — they're just *doing life alongside you*, room to
room. Kai reading in the Reading Corner isn't "Kai is sad now"; it's "Kai's
here with you, doing this." You can relapse and the companion is still simply
*there*, same as ever. Presence, not diagnosis.

## The six perspectives

### 🌧️ Kai — The One Who Gets It
*The person still in the trenches.*

Kai is at rock bottom. Tired. Scruffy. A little emotionally flat. He's lost his
way and knows it. He isn't there to inspire you — he's there to remind you that
you don't have to pretend you're okay. Download Alchono after your worst night
in months and Kai says: *"Yeah… I've been there too."* He's the **default**
companion because he's the easiest to relate to when everything feels hopeless.

### ☕ Amara — The One Who Cares
*The family friend.*

Not an addict. Not a therapist. Not your mum — she's your *friend's* mum. The
woman who worries about you without making a fuss. She'll put the kettle on
before asking questions, make sure you've eaten, quietly pack leftovers into a
container before you leave. She doesn't try to fix your life. She just wants you
to know someone cares. Her comfort comes from kindness.

### 🌤️ Yara — The One Beside You
*The peer.*

Younger. Optimistic — but that optimism has been *earned*; she's been through
difficult things herself. She doesn't have all the answers. She simply walks
alongside you. She's the one who says: *"We're figuring this out together."*

### 🤝 Marco — The Mate
*The one a little further ahead.*

Maybe he's just reached a year sober. Not a sponsor, not a counsellor,
definitely not trying to be a guru. He's just the bloke who remembers exactly
how hard the first months were. Practical. Dependable. He'd probably suggest
going for coffee before giving advice. His whole attitude is: *"Come on, mate.
We'll get through today."*

### 🪵 Amos — The Mentor
*The recovered alcoholic.*

Amos has lived it. Made the mistakes, rebuilt his life. Maybe he volunteers,
maybe he mentors, maybe he helps run AA meetings — whatever he does, he isn't
defined by it. He never lectures. He simply offers the reassurance that comes
from experience. He represents **hope that's been tested.**

### 🌹 Rose — The One Left Behind
*The family member.*

Rose isn't in recovery. She loved someone who couldn't escape addiction — maybe
her son, maybe her grandson, maybe someone else she held dear. She understands
addiction from the *other* side: the fear, the waiting, the heartbreak. Her
warmth comes from grief transformed into compassion. She reminds people that
addiction doesn't only affect the person drinking — it affects everyone who
loves them.

## The spectrum

Ordered by relationship-distance, the six form a deliberate axis — from *in it
with you* to *loving you from the shore*:

| Companion | Perspective |
|-----------|-------------|
| **Kai**   | you, right now, in it |
| **Yara**  | beside you, a half-step in |
| **Marco** | a step ahead |
| **Amos**  | all the way through and back |
| **Amara** | loves you from outside it |
| **Rose**  | loved someone it took |

## The Rose eyeline (keep this)

In the **token** pose, every companion holds up a sobriety chip and *looks at
it* — because for someone in recovery, the token is the thing: the milestone,
the count, the proof of another day.

**Rose is the exception, on purpose.** She holds hers up too, but her eyes go
*past* it — up, to the stars. She never earned a chip; she's not counting days
sober. For her the token isn't a milestone, it's a **keepsake** — something of
the person who's gone — and her gaze lifts through it to the constellation sky,
where the app puts the people who aren't here anymore.

Same pose, same token, same page — and one gaze quietly tells you she's on the
other side of the glass. That's the entire difference between *"I survived"* and
*"I'm grieving,"* encoded in a single eyeline. It reads as feeling, not
cleverness. That's the point. Don't "fix" it.

## How the pose system works

Art lives in `assets/companions/` as `{id}_{pose}.png`. Poses are registered
per companion in `src/lib/companions.ts` (`COMPANIONS`), and `companionPose()`
falls back to `standing` for any pose a companion doesn't have yet — so a new
companion needs only a `standing` image to slot in; the rest fill in over time.

Screens ask for a pose by name via `useCompanion().pose('...')` and get that
pose for **whichever** companion the user chose. **Wire each page to a pose name
once**, and every present and future companion flows through automatically.

### Pose → page map

| Pose | Page | Feeling |
|------|------|---------|
| `bust` | Home | the companion's steady in-app presence (kept as-is) |
| `armchair` | AI Coach | settled in, ready to talk |
| `tea` | Support | kettle on, unhurried |
| `reading` | Reading Corner | reading alongside you |
| `journal` | Writing Room | writing |
| `elbows` | Urge flow | leaned in, elbows on knees |
| `playing` | Games Arcade | already deep in a game — *come join* |
| `token` | Constellation | holding the chip; Rose looks to the sky |

### The Games Arcade

Not a menu with a mascot on top. The companion sits **centre**, already
immersed in a game (the `playing` pose), with the games scattered around them
like pieces on the floor. The feeling is **walking into the arcade and finding
your friend who's already there.** The companion models the very thing the games
are *for* — being pulled out of the urge and into absorption.

---

*New companions: a single `standing` pose is enough to add one; poses fill in as
the art is drawn. Never tie the art to the user's emotional state — see above.*
