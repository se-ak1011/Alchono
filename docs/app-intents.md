# App Intents — safe shortcuts only

Alchono's iOS App Intents expose only deterministic shortcut actions that open
the app into a specific, safe destination. There is no free-text or natural
language alcohol logging path.

## What it does

- **Open Alchono**
- **Open Urge Support**
- **Open Your Sky**
- **Record Alcohol-Free Day**
- **Open Journal**
- **Open Emergency Support**
- **Start Urge Flow**

`Record Alcohol-Free Day` opens `app/shortcut/record-alcohol-free-day.tsx`,
which uses the existing in-app alcohol-free toggle flow rather than any
transcribed speech input.

Files: `targets/widget/LogDrinkIntent.swift` (safe shortcuts),
`app/shortcut/record-alcohol-free-day.tsx` (deterministic alcohol-free-day
entry point).

## Where users enable it

Add Alchono shortcuts to your Home Screen, Action Button, Lock Screen, or
Shortcuts app.

**Back Tap** can also run a shortcut, but only as an optional extra because
phone cases can make it unreliable.

## Validation notes (device build)

App Intents can't be exercised in CI — verify on a TestFlight build:

- Each shortcut appears in the Shortcuts app with its explicit action title.
- `Record Alcohol-Free Day` opens the app and marks today without any speech
  parsing or quantity interpretation.
- Home Screen, Lock Screen, and Action Button placement should all trigger the
  same deterministic destinations.
- Back Tap remains optional only; do not present it as the primary setup path.
