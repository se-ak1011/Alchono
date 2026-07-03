import WidgetKit
import SwiftUI

// Data is written by the app via ExtensionStorage (@bacons/apple-targets)
// into the shared App Group whenever the member's state changes.
let appGroup = "group.com.alchono.app"

// Short harm-reduction nudges, mirrored from SESSION_NUDGES in the app.
// Rotates every 20 minutes while a session is live.
let sessionNudges = [
  "Water between drinks. Still works.",
  "Eat something. It slows everything down.",
  "Car keys somewhere hard to reach.",
  "Make this next one a slow one.",
  "Message someone. You don't have to sit in it alone.",
  "Pick your stopping point now, while it's your call.",
]

struct AlchonoEntry: TimelineEntry {
  let date: Date
  let urgesBeaten: Int
  let afDays: Int
  let sessionActive: Bool
  let sessionStart: Date?
  let nudge: String
}

func loadDefaults() -> (urges: Int, af: Int, active: Bool, start: Date?) {
  let d = UserDefaults(suiteName: appGroup)
  let startSec = d?.integer(forKey: "sessionStart") ?? 0
  let active = (d?.integer(forKey: "sessionActive") ?? 0) == 1 && startSec > 0
  return (
    urges: d?.integer(forKey: "urgesBeaten") ?? 0,
    af: d?.integer(forKey: "afDays") ?? 0,
    active: active,
    start: startSec > 0 ? Date(timeIntervalSince1970: TimeInterval(startSec)) : nil
  )
}

func nudge(for date: Date, start: Date?) -> String {
  guard let start = start else { return sessionNudges[0] }
  let elapsedMin = Int(date.timeIntervalSince(start) / 60)
  let idx = max(0, elapsedMin / 20) % sessionNudges.count
  return sessionNudges[idx]
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> AlchonoEntry {
    AlchonoEntry(date: Date(), urgesBeaten: 3, afDays: 5,
                 sessionActive: false, sessionStart: nil, nudge: sessionNudges[0])
  }

  func getSnapshot(in context: Context, completion: @escaping (AlchonoEntry) -> Void) {
    let s = loadDefaults()
    completion(AlchonoEntry(date: Date(), urgesBeaten: s.urges, afDays: s.af,
                            sessionActive: s.active, sessionStart: s.start,
                            nudge: nudge(for: Date(), start: s.start)))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<AlchonoEntry>) -> Void) {
    let s = loadDefaults()

    if s.active, let start = s.start {
      // While a session runs, refresh the nudge every 20 minutes. The live
      // timer counts itself up via .timer, so no per-second entries needed.
      var entries: [AlchonoEntry] = []
      let now = Date()
      for i in 0..<9 { // ~3 hours of rotation, then the app re-arms on next open
        let t = Calendar.current.date(byAdding: .minute, value: i * 20, to: now)!
        entries.append(AlchonoEntry(date: t, urgesBeaten: s.urges, afDays: s.af,
                                    sessionActive: true, sessionStart: start,
                                    nudge: nudge(for: t, start: start)))
      }
      completion(Timeline(entries: entries, policy: .atEnd))
    } else {
      // Idle: one entry, refresh after midnight so "this month" stays honest.
      let entry = AlchonoEntry(date: Date(), urgesBeaten: s.urges, afDays: s.af,
                               sessionActive: false, sessionStart: nil, nudge: sessionNudges[0])
      let nextMidnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
      completion(Timeline(entries: [entry], policy: .after(nextMidnight)))
    }
  }
}

struct AlchonoWidgetView: View {
  var entry: AlchonoEntry
  @Environment(\.widgetFamily) var family

  // Grey when alcohol-free / idle, darkest black when a session is live.
  var background: Color {
    entry.sessionActive
      ? Color(red: 0.024, green: 0.027, blue: 0.031)   // #060708
      : Color(red: 0.204, green: 0.212, blue: 0.224)   // #34363A grey
  }

  var body: some View {
    Group {
      if entry.sessionActive, let start = entry.sessionStart {
        activeView(start: start)
      } else {
        idleView
      }
    }
    .containerBackground(background, for: .widget)
  }

  // MARK: Session live

  func activeView(start: Date) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("SESSION")
          .font(.system(size: 10, weight: .bold))
          .tracking(2)
          .foregroundColor(.white.opacity(0.5))
        Spacer()
        Circle().fill(Color.white.opacity(0.6)).frame(width: 6, height: 6)
      }

      // Self-updating elapsed timer — no timeline refresh needed.
      Text(start, style: .timer)
        .font(.system(size: family == .systemMedium ? 30 : 26, weight: .bold, design: .rounded))
        .foregroundColor(.white)
        .minimumScaleFactor(0.6)
        .lineLimit(1)

      Spacer(minLength: 0)

      Text(entry.nudge)
        .font(.system(size: 12, weight: .medium))
        .foregroundColor(.white.opacity(0.75))
        .lineLimit(family == .systemMedium ? 2 : 3)
        .fixedSize(horizontal: false, vertical: true)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }

  // MARK: Idle

  var idleView: some View {
    VStack(spacing: 6) {
      Image("Character")
        .resizable()
        .scaledToFit()
        .frame(maxHeight: family == .systemMedium ? 60 : 52)

      VStack(spacing: 2) {
        Text("\(entry.urgesBeaten) urge\(entry.urgesBeaten == 1 ? "" : "s") beaten")
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.white)
          .minimumScaleFactor(0.7)
          .lineLimit(1)

        Text("\(entry.afDays) AF day\(entry.afDays == 1 ? "" : "s") this month")
          .font(.system(size: 12, weight: .medium))
          .foregroundColor(.white.opacity(0.7))
          .minimumScaleFactor(0.7)
          .lineLimit(1)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct AlchonoWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "AlchonoWidget", provider: Provider()) { entry in
      AlchonoWidgetView(entry: entry)
    }
    .configurationDisplayName("Alchono")
    .description("Your record, and your session, on the home screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct AlchonoWidgetBundle: WidgetBundle {
  var body: some Widget {
    AlchonoWidget()
  }
}
