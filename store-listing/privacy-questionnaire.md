# App Privacy Questionnaire — exact answers
(App Store Connect → App Privacy → Get Started)

## Q: Do you or your third-party partners collect data from this app?
**Yes**

## Data types to declare

### Contact Info → Email Address
- Collected: YES
- Linked to identity: YES
- Used for tracking: NO
- Purposes: App Functionality (account login)

### User Content → Emails or Text Messages
- NO (this means SMS/email content — we don't touch those)

### User Content → Other User Content
- Collected: YES
- Linked to identity: YES
- Used for tracking: NO
- Purposes: App Functionality
- (Covers: journal entries, check-ins, community posts, mentor messages,
  AI conversations, onboarding preferences)

### Health & Fitness → Health
- Collected: YES
- Linked to identity: YES
- Used for tracking: NO
- Purposes: App Functionality
- (Covers: mood check-ins and drinking session logs. Declaring this is the
  conservative, correct call for a recovery app — do not skip it.)

### Identifiers → User ID
- Collected: YES
- Linked to identity: YES
- Used for tracking: NO
- Purposes: App Functionality (account UUID)

### Everything else (Location, Contacts, Browsing History, Search History,
Purchases, Financial Info, Diagnostics, Usage Data, Advertising Data…)
- NOT collected — leave unchecked.
- Note: we run no analytics SDK, no crash reporter, no ad SDK. If you add
  one later (e.g. Sentry), come back and declare Diagnostics.

## Result shown on the store
"Data Linked to You: Contact Info, Health & Fitness, User Content, Identifiers"
"Data Used to Track You: None"

## Third parties (for your own records, no separate declaration needed)
- Supabase: database/auth processor (all data above)
- OpenAI: processes AI chat message text only, via API (no training on API data)
- Expo push service: push token only, if notifications enabled
