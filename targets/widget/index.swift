import WidgetKit
import SwiftUI

// Data is written by the app via ExtensionStorage (@bacons/apple-targets)
// into the shared App Group whenever the member's stats change.
let appGroup = "group.com.alchono.app"

struct AlchonoEntry: TimelineEntry {
  let date: Date
  let urgesBeaten: Int
  let afDays: Int
}

func readEntry() -> AlchonoEntry {
  let defaults = UserDefaults(suiteName: appGroup)
  return AlchonoEntry(
    date: Date(),
    urgesBeaten: defaults?.integer(forKey: "urgesBeaten") ?? 0,
    afDays: defaults?.integer(forKey: "afDays") ?? 0
  )
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> AlchonoEntry {
    AlchonoEntry(date: Date(), urgesBeaten: 3, afDays: 5)
  }

  func getSnapshot(in context: Context, completion: @escaping (AlchonoEntry) -> Void) {
    completion(readEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<AlchonoEntry>) -> Void) {
    // The app reloads the timeline on every stat change; the daily refresh
    // just keeps "this month" honest if the app isn't opened.
    let nextMidnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(60 * 60 * 24)
    completion(Timeline(entries: [readEntry()], policy: .after(nextMidnight)))
  }
}

struct AlchonoWidgetView: View {
  var entry: AlchonoEntry
  @Environment(\.widgetFamily) var family

  var body: some View {
    VStack(spacing: 6) {
      Image("Character")
        .resizable()
        .scaledToFit()
        .frame(maxHeight: family == .systemMedium ? 64 : 56)

      VStack(spacing: 2) {
        Text("\(entry.urgesBeaten) urge\(entry.urgesBeaten == 1 ? "" : "s") beaten")
          .font(.system(size: 15, weight: .bold))
          .foregroundColor(.white)
          .minimumScaleFactor(0.7)
          .lineLimit(1)

        Text("\(entry.afDays) AF day\(entry.afDays == 1 ? "" : "s") this month")
          .font(.system(size: 12, weight: .medium))
          .foregroundColor(Color("AccentColor"))
          .minimumScaleFactor(0.7)
          .lineLimit(1)
      }
    }
    .containerBackground(Color("WidgetBackground"), for: .widget)
  }
}

struct AlchonoWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "AlchonoWidget", provider: Provider()) { entry in
      AlchonoWidgetView(entry: entry)
    }
    .configurationDisplayName("Alchono")
    .description("Your record, on the home screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct AlchonoWidgetBundle: WidgetBundle {
  var body: some Widget {
    AlchonoWidget()
  }
}
