import AppIntents
import WidgetKit
import Foundation

// "I had a drink" — exposes Alchono's drink logging to Shortcuts, Siri, Back
// Tap, the Action Button, Widgets and Lock Screen shortcuts, so a drink can be
// logged in one tap WITHOUT opening the app (the assumption being that someone
// intoxicated simply won't open it). Named for the person, not the database:
// "I had a drink", never "Log drink" — Alchono reduces shame.
//
// It never touches the network or the app's JS. It writes to the shared App
// Group: it optimistically reflects the change so the widget updates instantly,
// and queues the drink in `pendingDrinks` for the app to reconcile into the
// real drinking session (Supabase) the next time it opens. Existing drinking
// logic is untouched — this only records intent into shared storage.
@available(iOS 16.0, *)
struct LogDrinkIntent: AppIntent {
  static var title: LocalizedStringResource = "I had a drink"
  static var description = IntentDescription(
    "Logs a drink to your current session — or gently starts one — without opening the app."
  )
  // Run silently. No shame, no app launch. Shortcuts still gives its normal
  // success haptic from the returned result.
  static var openAppWhenRun: Bool = false

  func perform() async throws -> some IntentResult {
    let appGroup = "group.com.alchono.app"
    guard let d = UserDefaults(suiteName: appGroup) else { return .result() }

    let now = Int(Date().timeIntervalSince1970)
    let active = d.integer(forKey: "sessionActive") == 1 && d.integer(forKey: "sessionStart") > 0

    if !active {
      // Start a session optimistically so the widget reflects it at once.
      d.set(1, forKey: "sessionActive")
      d.set(now, forKey: "sessionStart")
      d.set(now, forKey: "pendingSessionStart")
      d.set(0, forKey: "drinksCount")
    }

    d.set(d.integer(forKey: "drinksCount") + 1, forKey: "drinksCount")
    // The unsynced queue the app drains into Supabase when it next opens.
    d.set(d.integer(forKey: "pendingDrinks") + 1, forKey: "pendingDrinks")

    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}

// Zero-config registration: makes the intent discoverable in Shortcuts and
// enables "Hey Siri, I had a drink." Users can then assign it to Back Tap or
// the Action Button from Settings.
@available(iOS 16.0, *)
struct AlchonoShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogDrinkIntent(),
      phrases: [
        "I had a drink in \(.applicationName)",
        "Log a drink in \(.applicationName)",
      ],
      shortTitle: "I had a drink",
      systemImageName: "wineglass"
    )
  }
}
