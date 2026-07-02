# App Review Notes (paste into App Store Connect → App Review Information)

## Notes for the reviewer

Alchono is a harm-reduction and recovery support app for adults who want to
understand and change their relationship with alcohol.

KEY POINTS FOR REVIEW:

1. SIGN-IN REQUIRED: The app requires an account because all content is
   personal recovery data. A test account is provided below. Email
   confirmation is disabled, so you can also create a fresh account instantly.

2. AI COMPANION: The "AI Coach" is a support companion using OpenAI's API
   with a system prompt built on motivational-interviewing principles. It is
   explicitly not presented as medical advice; it directs users to emergency
   services if a medical emergency is described.

3. USER-GENERATED CONTENT (Guideline 1.2): The community feed and 1-to-1
   mentor messaging include full safeguarding controls:
   - Report on every post and every message thread (5 reason categories)
   - Block on every post and thread; blocks are enforced server-side —
     blocked pairs physically cannot exchange messages
   - Community posts are anonymous by default and reaction-only (no replies)
   - Mentor messaging exists only after both sides opt in (request + accept)

4. ACCOUNT DELETION (Guideline 5.1.1(v)): Profile → Delete account
   permanently deletes the auth record and all user data via database
   cascade. Available in-app, no contact with support needed.

5. ALCOHOL CONTENT: The app references alcohol frequently because it helps
   users reduce or stop drinking. It never glamorises or encourages
   consumption. Age rating is set to 17+.

6. DATA EXPORT: Profile → Export my data returns the user's complete data
   as JSON via the system share sheet.

## Demo account
Email:    reviewer@alchono-demo.app   ← CREATE THIS BEFORE SUBMITTING
Password: [set one and paste it here]

(Tip: create the account yourself first and complete onboarding with sample
data — a partner name, a pet, a couple of check-ins and one drinking session —
so the reviewer sees a lived-in app, then put those credentials here.)

## Contact
[Your name]
hello@alchono.app
[Your phone number — required field]
