package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class SplitPaneExample : Cell {
  private var horizontal float64 = .35
  private var vertical float64 = .5
  public override func Build() Blob -> Container {Width: 600, Gap: 16, Children: {
    Text{Key: "hint", Content: "Drag a divider, or focus it and use the arrow keys.", Color: "#a1a1aa"},
    Cell.Mount[SplitPaneInput, SplitPane]("horizontal", SplitPaneInput{
      Value: horizontal, OnChange: (value float64) -> { horizontal = value
        Rebuild() }, Height: 180, MinimumFirst: 110, MinimumSecond: 160,
      First: Container{Width: Length.Percent(100), Height: Length.Percent(100), Padding: 20, BackgroundColor: "#17313d", Children: {Text{Content: "Navigation", Color: "#a5e5eb"}}},
      Second: Container{Width: Length.Percent(100), Height: Length.Percent(100), Padding: 20, BackgroundColor: "#24243c", Children: {Text{Content: "Workspace", Color: "#d4c9fa"}}},
    }),
    Cell.Mount[SplitPaneInput, SplitPane]("vertical", SplitPaneInput{
      Value: vertical, OnChange: (value float64) -> { vertical = value
        Rebuild() }, Height: 180, MinimumFirst: 60, MinimumSecond: 50, Orientation: SplitOrientation.Vertical,
      First: Container{Width: Length.Percent(100), Height: Length.Percent(100), Padding: 16, BackgroundColor: "#24243c", Children: {Text{Content: "Preview", Color: "#d4c9fa"}}},
      Second: Container{Width: Length.Percent(100), Height: Length.Percent(100), Padding: 16, BackgroundColor: "#17313d", Children: {Text{Content: "Details", Color: "#a5e5eb"}}},
    }),
  }}
}
internal class SplitPanePage : GalleryPage {
  override func Title() string -> "Split pane"
  override func Build() Blob -> Cell.Mount[SplitPaneExample]("split-example")
}
