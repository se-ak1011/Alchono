# Worldification Plan

Pulling every remaining administrative screen into the drawn world. The trick:
**a handful of reusable illustrated surfaces + the zone-overlay engine** (the
same system behind the Personal File). One illustration serves 6–10 screens;
the per-screen work is laying out zones in code, not new art.

Status key: ⬜ not started · 🟡 art in, wiring to do · ✅ done

## Art assets (Marta's, 1998–2003 community-centre era)

1. **binder** — paperwork / forms
2. **journal** — spiral exercise book
3. **corkboard** — pinned cards / lists
4. **message pigeonhole** — inbox / message slots
5. **information sheets** — leaflets / reference
6. **wall chart** — progress / stats / calendar

(Later, if wanted: CRT AV trolley for feeds, arcade cabinet frame for games,
ledger for logs — not required for the first pass.)

## Clusters

### 1. Paperwork → **binder** 🟡
Engine: DrawnForm (exists). Each screen is a different zone layout on the binder.
- ⬜ profile/identity
- ⬜ profile/trusted
- ⬜ profile/people
- ⬜ profile/care-team
- ⬜ profile/emergency-contacts
- ⬜ profile/hobbies
- ⬜ profile/preferences
- ⬜ profile/become-mentor
- ⬜ account
- ⬜ settings/index
- ⬜ settings/app-lock
- ⬜ checkin

### 2. Journal → **journal** 🟡
Engine: DrawnForm. One notebook, three screens.
- ⬜ journal/notes
- ⬜ journal/write
- ⬜ journal/voice

### 3. Noticeboard → **corkboard** 🟡
Engine: zone overlay (Me-room corkboard inlay proves it).
- ⬜ moments (index/new/play)
- ⬜ saved
- ⬜ support/community
- ⬜ support/mentors
- ⬜ support/recommendations
- ⬜ counsellors

### 4. Messages → **message pigeonhole** 🟡
- ⬜ messages/index
- ⬜ messages/[requestId]

### 5. Leaflets / reference → **information sheets** 🟡
Engine: can reuse the Book engine for multi-page content.
- ⬜ support/help-now
- ⬜ support/sos
- ⬜ support/recovery
- ⬜ toolkit/[id]
- ⬜ toolkit/c/[cat]
- ⬜ recipe/[id]
- ⬜ newsletter

### 6. Progress / stats → **wall chart** 🟡
- ⬜ timeline
- ⬜ today
- ⬜ summary
- ⬜ insights
- ⬜ plan
- ⬜ evidence

### Already in the world ✅
hub, Profile & Support tabs, urge porch, Personal File, Resources book, toolkit
books, AI Coach room, Looking-Forward map, Letters desk, Barista, My Sky.

### Reuse (no new art)
- **Phone list** (resources, counsellors) → the Resources book, already done.
- **Letters** (letters/[id]) → the existing Letters desk/stationery.

### Left plain (by design)
login, signup, onboarding, admin/*, pro/*, companion/choose, not-found, games
(their own UI — optional arcade-cabinet frame later).
