import AppIntents
import Foundation

@available(iOS 16.0, *)
private enum AlchonoShortcutURL {
  private static func make(_ value: String) -> URL {
    guard let url = URL(string: value) else {
      fatalError("Invalid Alchono shortcut URL: \(value)")
    }
    return url
  }

  // Opens the default home screen.
  static let openApp = make("alchono://")
  // Opens the urgent support chooser at /support/help-now.
  static let urgeSupport = make("alchono://support/help-now")
  // Opens the constellation screen at /constellation.
  static let yourSky = make("alchono://constellation")
  // Opens the in-app deterministic alcohol-free-day shortcut route.
  static let recordAlcoholFreeDay = make("alchono://shortcut/record-alcohol-free-day")
  // Opens the journal tab.
  static let journal = make("alchono://journal")
  // Opens the emergency support screen at /support/sos.
  static let emergencySupport = make("alchono://support/sos")
  // Opens the guided urge flow at /session/urge.
  static let urgeFlow = make("alchono://session/urge")
}

@available(iOS 16.0, *)
struct OpenAlchonoIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Alchono"
  static var description = IntentDescription("Opens the Alchono home screen.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.openApp))
  }
}

@available(iOS 16.0, *)
struct OpenUrgeSupportIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Urge Support"
  static var description = IntentDescription("Opens Alchono's urgent support options.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.urgeSupport))
  }
}

@available(iOS 16.0, *)
struct OpenYourSkyIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Your Sky"
  static var description = IntentDescription("Opens your alcohol-free day sky.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.yourSky))
  }
}

@available(iOS 16.0, *)
struct RecordAlcoholFreeDayIntent: AppIntent {
  static var title: LocalizedStringResource = "Record Alcohol-Free Day"
  static var description = IntentDescription("Opens Alchono and records today as alcohol-free.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.recordAlcoholFreeDay))
  }
}

@available(iOS 16.0, *)
struct OpenJournalIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Journal"
  static var description = IntentDescription("Opens the Alchono journal.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.journal))
  }
}

@available(iOS 16.0, *)
struct OpenEmergencySupportIntent: AppIntent {
  static var title: LocalizedStringResource = "Open Emergency Support"
  static var description = IntentDescription("Opens Alchono's emergency support screen.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.emergencySupport))
  }
}

@available(iOS 16.0, *)
struct StartUrgeFlowIntent: AppIntent {
  static var title: LocalizedStringResource = "Start Urge Flow"
  static var description = IntentDescription("Opens the guided urge flow in Alchono.")
  static var openAppWhenRun: Bool = true

  func perform() async throws -> some IntentResult & OpensIntent {
    return .result(opensIntent: OpenURLIntent(url: AlchonoShortcutURL.urgeFlow))
  }
}

@available(iOS 16.0, *)
struct AlchonoShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    [
      AppShortcut(
        intent: OpenAlchonoIntent(),
        phrases: ["Open \(.applicationName)"],
        shortTitle: "Open Alchono",
        systemImageName: "house"
      ),
      AppShortcut(
        intent: OpenUrgeSupportIntent(),
        phrases: ["Open urge support in \(.applicationName)"],
        shortTitle: "Open Urge Support",
        systemImageName: "sparkles"
      ),
      AppShortcut(
        intent: OpenYourSkyIntent(),
        phrases: ["Open your sky in \(.applicationName)"],
        shortTitle: "Open Your Sky",
        systemImageName: "moon.stars"
      ),
      AppShortcut(
        intent: RecordAlcoholFreeDayIntent(),
        phrases: ["Record alcohol-free day in \(.applicationName)"],
        shortTitle: "Record Alcohol-Free Day",
        systemImageName: "checkmark.circle"
      ),
      AppShortcut(
        intent: OpenJournalIntent(),
        phrases: ["Open journal in \(.applicationName)"],
        shortTitle: "Open Journal",
        systemImageName: "book.closed"
      ),
      AppShortcut(
        intent: OpenEmergencySupportIntent(),
        phrases: ["Open emergency support in \(.applicationName)"],
        shortTitle: "Open Emergency Support",
        systemImageName: "cross.case"
      ),
      AppShortcut(
        intent: StartUrgeFlowIntent(),
        phrases: ["Start urge flow in \(.applicationName)"],
        shortTitle: "Start Urge Flow",
        systemImageName: "waveform.path.ecg"
      ),
    ]
  }
}
