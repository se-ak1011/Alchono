# App Intents — "I had a drink"

A native iOS App Intent that logs a drink **without opening the app** — because
someone intoxicated often won't. Built on Apple's App Intents framework, not a
custom scheme, so it surfaces everywhere iOS offers actions.

## What it does

- **No active session →** starts one (seeded with this drink).
- **Active session →** adds one drink to it.
- Runs silently (`openAppWhenRun = false`) and returns a result, so Shortcuts /
  Siri give their normal success haptic.
- Existing drinking logic is untouched — the intent only records into the shared
  App Group; the app reconciles it into Supabase.

Named **"I had a drink"** (never "Log drink") — Alchono reduces shame.

## How it syncs (offline-safe)

The intent can't reach the network or the app's JS, so:

1. `LogDrinkIntent.perform()` writes to the App Group `group.com.alchono.app`:
   sets `sessionActive`/`sessionStart` if starting, bumps `drinksCount` (instant
   widget feedback) and increments `pendingDrinks` (the unsynced queue).
2. Next time the app opens/foregrounds, `useDrinkIntentSync` drains
   `pendingDrinks` via `useLogDrink` — creating/backdating the session and
   writing the real count to Supabase — then clears the queue.

So the session already reflects the drink(s) whenever the app is next opened,
and the widget reflects them immediately.

Files: `targets/widget/LogDrinkIntent.swift` (intent + `AppShortcutsProvider`),
`src/hooks/useDrinkIntentSync.ts` (reconciler), `useLogDrink` in
`src/hooks/useDrinkingSession.ts` (shared logic), `useWidgetSync.ts` (mirrors
the count).

## Where users enable it

Automatically available (no setup) in **Shortcuts** and **Siri**:
> "Hey Siri, I had a drink."

**Back Tap** (tap the back of the phone):
Settings → Accessibility → Touch → Back Tap → Triple Tap → **Shortcuts → I had a drink**

**Action Button** (iPhone 15 Pro and later):
Settings → Action Button → swipe to **Shortcut** → choose **I had a drink**

**Lock Screen / Home Screen widget & Control Center**: add the shortcut from the
Shortcuts app; it can also be pinned as a one-tap button.

## Validation notes (device build)

App Intents can't be exercised in CI — verify on a TestFlight build:

- The action appears in the Shortcuts app as **I had a drink**.
- Running it with the app closed updates the **widget** immediately.
- Opening the app then shows the drink on the active session (count matches the
  number of times the intent ran).
- `AppShortcutsProvider` lives in the widget extension. If Siri's zero-config
  phrase or the Action Button list doesn't pick it up, the provider may need to
  move to the main app target via a config plugin — the manual Back Tap →
  Shortcuts path works regardless.
- Confirm `ExtensionStorage` exposes a read method (`get`/`getItem`);
  `useDrinkIntentSync` probes both and no-ops if neither exists (the widget
  still updates; only the Supabase reconcile would need a native read shim).
