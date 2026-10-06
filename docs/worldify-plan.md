# Worldification Plan

Pulling every remaining administrative screen into the drawn world. The trick:
**7 reusable illustrated surfaces + the zone-overlay engine** (the same system
behind the Personal File). One illustration serves 6–12 screens; the per-screen
work is laying out zones in code, not new art.

Status key: ⬜ not started · 🟡 art in, wiring to do · ⏳ art pending · ✅ done

## Surfaces (Marta's art, 1998–2003 community-centre era)

| # | Asset | File | In repo |
|---|-------|------|---------|
| 1 | Membership binder | `assets/surfaces/binder.webp` | ✅ |
| 2 | Spiral notebook + voice recorder | `assets/surfaces/notebook.webp` | ✅ |
| 3 | Corkboard | `assets/surfaces/corkboard.webp` | ✅ |
| 4 | Paper wall chart | `assets/surfaces/wallchart.webp` | ✅ |
| 5 | Information sheet + leaflet rack | `assets/surfaces/infosheet.webp` | ✅ |
| 6 | Pigeonholes + answering machine | `assets/surfaces/pigeonholes.webp` | ⏳ resend |
| 7 | CRT television + VHS trolley | `assets/surfaces/crt.webp` | ⏳ resend |

## Clusters

### 1. Membership binder → forms 🟡
Engine: DrawnForm (exists). Each screen = a different zone layout on the binder.
- ⬜ profile/identity (personal details)
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

### 2. Spiral notebook + recorder → journal & message replies 🟡
Engine: DrawnForm / zones.
- ⬜ journal/notes
- ⬜ journal/write
- ⬜ journal/voice (recorder = record + playback)
- ⬜ messages/[requestId] (opened thread + reply)

### 3. Corkboard → pinned lists 🟡
Engine: zone overlay (Me-room corkboard inlay proves it).
- ⬜ moments (index/new/play)
- ⬜ saved
- ⬜ support/community
- ⬜ support/mentors (mentor directory)
- ⬜ support/recommendations (listings)
- ⬜ counsellors (listings)

### 4. Paper wall chart → progress & stats 🟡
- ⬜ timeline
- ⬜ today
- ⬜ summary
- ⬜ insights
- ⬜ plan
- ⬜ evidence

### 5. Information sheet + leaflet rack → reference ⏳🟡
Engine: can reuse the Book engine for multi-page content.
- ⬜ support/help-now
- ⬜ support/sos
- ⬜ support/recovery
- ⬜ toolkit/[id] (articles)
- ⬜ toolkit/c/[cat]
- ⬜ recommendation details (per-item)
- ⬜ recipe/[id]
- ⬜ newsletter

### 6. Pigeonholes + answering machine → messages ⏳
Art pending resend.
- ⬜ messages/index (inbox + conversation selection)

### 7. CRT + VHS trolley → watch-something ⏳
Art pending resend.
- ⬜ session/good-feed
- ⬜ giggles

### Already in the world ✅
hub, Profile & Support tabs, urge porch, Personal File, Resources book, toolkit
books, AI Coach room, Looking-Forward map, Letters desk, Barista, My Sky.

### Reuse (no new art)
- Phone list (resources, counsellors) → the Resources book, already done.
- Letters (letters/[id]) → the existing Letters desk/stationery.

### Left plain (by design)
login, signup, onboarding, admin/*, pro/*, companion/choose, not-found, games
(their own UI — optional arcade-cabinet frame later).
