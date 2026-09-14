package Goo.Widgets.Gallery.Pages.Data

import System
import Goo
import Goo.Widgets.Data
import Goo.Widgets.Gallery

internal class TimeAxisExample : Cell {
  private var selected string?
  private var overflow bool
  private func Event(input TimeAxisInput, placement TimeAxisPlacement, prepared Button) Button {
    prepared.BackgroundColor = placement.Event.Id == "release" ? Color.Parse("#275d56") : Color.Parse("#393151")
    if placement.Event.Id == selected { prepared.BorderWidth = 2
      prepared.BorderColor = "#d1fae5" }
    return prepared
  }
  public override func Build() Blob {
    let start = DateTimeOffset(2026, 9, 14, 8, 0, 0, TimeSpan.Zero)
    return Container{Width: 660, Gap: 18, Children: {
      Text{Key: "heading", Content: "Team schedule", FontSize: 22, Color: "#fafafa"},
      Cell.Mount[TimeAxisInput, TimeAxis]("timeline", TimeAxisInput{
        Start: start, End: start.AddHours(8), PixelsPerHour: 100, MaximumLanes: 2, CurrentTime: start.AddHours(2.75),
        SelectedId: selected ?? "", OnSelect: (id string) -> { selected = id
          Rebuild() }, OnOverflow: (items []TimeAxisEvent) -> { overflow = !overflow
            Rebuild() }, CreateEvent: Event,
        Events: []TimeAxisEvent{
          TimeAxisEvent{Id: "backup", Label: "Backup", Start: start, End: start.AddHours(2)},
          TimeAxisEvent{Id: "index", Label: "Index refresh", Start: start.AddHours(.5), End: start.AddHours(1.75)},
          TimeAxisEvent{Id: "checks", Label: "Diagnostics", Start: start.AddHours(1), End: start.AddHours(1.5)},
          TimeAxisEvent{Id: "reports", Label: "Reports", Start: start.AddHours(2), End: start.AddHours(3.5)},
          TimeAxisEvent{Id: "release", Label: "Release window", Start: start.AddHours(3.5), End: start.AddHours(5.5)},
        },
      }),
      Text{Key: "state", Content: overflow ? "Collapsed event: Diagnostics · 09:00–09:30" : selected == nil ? "Select an event or inspect the overlapping entry." : "Selected: " + selected, Color: "#a1a1aa", FontSize: 13},
    }}
  }
}
internal class TimeAxisPage : GalleryPage {
  override func Title() string -> "Time axis"
  override func Build() Blob -> Cell.Mount[TimeAxisExample]("time-axis-example")
}
