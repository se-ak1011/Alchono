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

// The two brand tokens the widget leans on.
let blackBase = Color(red: 0.024, green: 0.027, blue: 0.031)   // #060708
let purpleBase = Color(red: 0.070, green: 0.051, blue: 0.090)  // #120D17 — the devil's tint

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

  // Deep black when sober; the purple devil's-tint when a session is live.
  var base: Color { entry.sessionActive ? purpleBase : blackBase }

  // The same artwork is used for small and medium widgets; the text/timer
  // layout fills the available space for each family.
  var artName: String {
    entry.sessionActive ? "WidgetDrinking" : "WidgetSober"
  }

  var body: some View {
    // Art sits on its own near-black field, so it blends seamlessly with the
    // matching base and fits both widget sizes without cropping.
    ZStack(alignment: family == .systemMedium ? .bottomLeading : .bottom) {
      Image(artName)
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

      // Scrim so the copy stays legible over the figure's lower half.
      LinearGradient(
        colors: [base.opacity(0), base.opacity(0.5), base.opacity(0.95)],
        startPoint: .center, endPoint: .bottom
      )

      overlayText
        .padding(family == .systemMedium ? 16 : 12)
    }
    .containerBackground(base, for: .widget)
  }

  @ViewBuilder
  var overlayText: some View {
    if entry.sessionActive, let start = entry.sessionStart {
      VStack(alignment: .leading, spacing: 3) {
        Text("SESSION")
          .font(.system(size: 9, weight: .bold)).tracking(2)
          .foregroundColor(.white.opacity(0.55))
        // Self-updating elapsed timer — no timeline refresh needed.
        Text(start, style: .timer)
          .font(.system(size: family == .systemMedium ? 26 : 22, weight: .bold, design: .rounded))
          .foregroundColor(.white)
          .lineLimit(1).minimumScaleFactor(0.6)
        Text(entry.nudge)
          .font(.system(size: 11, weight: .medium))
          .foregroundColor(.white.opacity(0.75))
          .lineLimit(2).fixedSize(horizontal: false, vertical: true)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    } else {
      VStack(alignment: .leading, spacing: 1) {
        Text(idleHeadline)
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.white)
          .lineLimit(1).minimumScaleFactor(0.7)
        Text(idleSub)
          .font(.system(size: 11, weight: .medium))
          .foregroundColor(.white.opacity(0.7))
          .lineLimit(1).minimumScaleFactor(0.7)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  // Idle copy is always framed positively and NEVER renders a "0 …" — an empty
  // scoreboard reads like failure. Lead with alcohol-free days (unambiguously
  // good, and it grows); reframe urges as "ridden out" to match urge-surfing.
  var idleHeadline: String {
    if entry.afDays > 0 {
      return "\(entry.afDays) alcohol-free \(entry.afDays == 1 ? "day" : "days")"
    }
    if entry.urgesBeaten > 0 {
      return "\(entry.urgesBeaten) urge\(entry.urgesBeaten == 1 ? "" : "s") ridden out"
    }
    return "You're here."
  }

  var idleSub: String {
    if entry.afDays > 0 {
      return entry.urgesBeaten > 0
        ? "\(entry.urgesBeaten) urge\(entry.urgesBeaten == 1 ? "" : "s") ridden out"
        : "this month"
    }
    if entry.urgesBeaten > 0 {
      return "you rode the wave"
    }
    return "One day at a time."
  }
}

struct AlchonoWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "AlchonoWidget", provider: Provider()) { entry in
      AlchonoWidgetView(entry: entry)
    }
    .configurationDisplayName("Alchono")
    .description("Where you're at — with a live timer when a session's on.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct AlchonoWidgetBundle: WidgetBundle {
  var body: some Widget {
    AlchonoWidget()
  }
}
