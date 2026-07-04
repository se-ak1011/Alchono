# Trends-Sharing Contract (v0.1 — skeleton)

How any consumer app (Alchono, Hassle, future apps) lets a member share a
**consent-gated, content-free** view of their progress with a professional,
and how **Path** consumes it as the single counsellor-side hub.

> Status: skeleton / north-star. Alchono is the reference implementation;
> everything here is generalised from what it already does. Mark decisions as
> we lock them.

---

## 1. Principles (non-negotiable)

1. **Consent-first.** A professional never sees a member until the member
   explicitly links them (exact username or QR — never browse/fuzzy search).
2. **Content-free.** Only trends/aggregates cross the boundary. Journals,
   voice notes, AI chats, raw logs **never leave the consumer app.**
3. **Revocable, always.** The member can revoke a link at any time; access
   dies immediately.
4. **Professionals are the only public identities**, because they're verified
   businesses who opted in. Members stay unsearchable.
5. **The consumer app owns the member's data and the consent.** Path never
   stores member content — only the trend numbers it's shown, and only while
   a link is active.

---

## 2. The three roles

| Role | Lives in | Owns |
|---|---|---|
| **Member** | a consumer app (Alchono / Hassle / …) | their data + who can see trends |
| **Professional** | Path (their hub) + a linked record in each consumer app | their practice; a roster of clients across apps |
| **Path** | its own backend/identity | aggregation, practice admin, billing |

**Identity boundary:** Path is a **separate backend**. Consumer apps do NOT
share tables with Path. They connect through the contract below.

---

## 3. Link lifecycle (shared state machine)

Every consumer app models a `client_link` (Alchono already does):

```
none ──request──▶ pending ──member approves──▶ accepted ──member revokes──▶ revoked
                     │
                     └── member declines ──▶ declined
```

- `professional_ref` — stable id of the professional (see §6 on cross-app id)
- `member_id` — member in this app
- `status` — pending | accepted | declined | revoked
- `created_at`, `responded_at`
- Only a **verified** professional may create a link.
- Approvals/declines/revokes are **member-only** actions.

---

## 4. The two entry points (member → professional)

Both must exist in every app, both member-initiated:

1. **Exact username.** Professional enters the member's exact username. No
   partial/fuzzy match. (Alchono: `useRequestClient`, exact match on
   `public_profiles`.)
2. **QR / deep link.** Member shows a QR encoding an app-scoped deep link:
   `` <scheme>://pro/add/{username} `` (Alchono: `alchono://pro/add/{username}`).
   Path/pro app opens it → prefilled link request → member approves.

> **Decision to lock:** custom schemes don't work if the app isn't installed.
> Post-launch, move to **HTTPS universal links** (`https://<app>/pro/add/...`)
> so a QR works from any camera. Tracked, deferred.

---

## 5. The trends payload (the actual contract)

A stable **envelope** every app returns, with an app-specific `metrics` block.
Content-free by construction — numbers and enums only, no free text.

```jsonc
{
  "contract_version": "0.1",
  "app": "alchono",                 // "alchono" | "hassle" | ...
  "member_ref": "opaque-link-id",   // NOT the member's real user id
  "window_days": 30,
  "generated_at": "2026-07-03T20:00:00Z",
  "headline": [                     // 2-4 glanceable stats for Path's card
    { "key": "af_days",      "label": "Alcohol-free days", "value": 12 },
    { "key": "urges_beaten", "label": "Urges beaten",      "value": 7 }
  ],
  "series": [                       // optional sparkline data, aggregate only
    { "key": "mood", "points": [{ "t": "2026-07-01", "v": 3 }, ...] }
  ],
  "flags": {                        // coarse booleans, never content
    "checked_in_today": true,
    "active_now": false
  }
}
```

**Rules:**
- Every field is an aggregate, boolean, or enum. If you can reconstruct a
  sentence the member wrote, it doesn't belong here.
- `member_ref` is the **link id**, not the real user id — Path keys off the
  link, so revocation is total.
- Apps may add `headline`/`series` keys freely; Path renders generically off
  `label` + `value`, so a new app needs **zero** Path changes.

### Per-app metric mapping (extensible)

| Concept | Alchono | Hassle |
|---|---|---|
| headline 1 | Alcohol-free days | Good-energy days |
| headline 2 | Urges beaten | Crashes / flares |
| headline 3 | Check-ins | Pacing adherence |
| series | mood over time | energy (spoons) over time |
| flags | checked_in_today, in_session | checked_in_today, in_flare |
| **never shared** | journals, AI chats, voice notes | symptom notes, private logs |

---

## 6. Cross-app professional identity (the hard part)

A counsellor has **one** Path account but needs a professional record in each
consumer app they pull from. Skeleton options:

- **Model A — token-brokered (recommended for v0.1).** Consent + link live in
  the consumer app. On approval, the app mints a per-link **read token**
  (opaque, scoped to that one link, revocable). Path stores the token and
  calls the app's trends endpoint with it. No professional account needed in
  the consumer app; the token *is* the capability.
  - Pro: content + consent stay in the consumer app; revoke = kill token.
  - Pro: Path stays app-agnostic; adding an app = implement one endpoint.
  - Con: need a small token-mint + verify path per app.

- **Model B — federated identity.** A shared IdP (e.g. Supabase third-party
  auth / Clerk) gives the counsellor one identity across all backends; each
  app stores a `professional` row keyed to that global id.
  - Pro: cleaner "one login" story, richer per-app pro features.
  - Con: heavier; every app takes an auth dependency now.

> **Recommendation:** ship **Model A** to prove the loop (it's the smallest
> thing that works and keeps content home), migrate to B only if Path needs
> real per-app professional accounts later.

---

## 7. What each consumer app must expose

Minimum surface for Path to consume (Alchono already has the first three as
RLS + a SECURITY DEFINER RPC):

1. **Link create** — verified pro requests a member by exact username.
2. **Consent actions** — member approve / decline / revoke.
3. **`get_trends(link)`** — SECURITY DEFINER, returns the §5 envelope, only if
   the link is `accepted`. Content-free by construction.
4. **Token mint/verify** (Model A) — issue a per-link read token on approval;
   verify + resolve to trends on Path's call; invalidate on revoke.

---

## 8. Security invariants (must hold in every app)

- RLS-first: member data is owner-only; the **only** cross-user window is the
  SECURITY DEFINER trends function, gated on `status = 'accepted'`.
- The trends function selects **only** aggregate columns — never a table with
  free-text content.
- Revoke is immediate and total: flip status → token invalid → next Path pull
  returns nothing.
- Professionals can't self-verify (Alchono: `protect_verified_flag` trigger).
- No professional can enumerate members; lookup is exact-match only.

---

## 9. Versioning

- `contract_version` in every payload. Additive changes (new headline keys)
  don't bump the major. Removing/renaming a field does.
- Path renders unknown keys generically, so additive changes are safe to ship
  per-app without coordinating a Path release.

---

## 10. Open decisions

- [ ] Model A vs B for professional identity (recommend A first).
- [ ] Universal links vs custom scheme for QR (recommend universal, post-launch).
- [ ] Token format + rotation (JWT signed by the app? opaque + table lookup?).
- [ ] Does Path cache trend snapshots, or always pull live? (privacy vs offline)
- [ ] Billing: counsellor pays Path once; do consumer apps stay free forever?
- [ ] Legal: data-processing boundary when trends cross from app → Path.

---

## Reference implementation

Alchono today: `client_links` table, `get_client_trends` RPC (content-free 30d
trends), `professionals` (verified/listed), `public_profiles` (username-only
lookup), QR `alchono://pro/add/{username}`, member-side care team with
approve/revoke. Generalise from there.
