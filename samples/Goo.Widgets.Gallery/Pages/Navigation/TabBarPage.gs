package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class TabBarExample : Cell {
  private var selected string = "overview"
  public override func Build() Blob -> Container {Width: 600, Gap: 20, Children: {
    Text{Key: "hint", Content: "Arrow keys move and select. Disabled tabs are skipped.", Color: "#a1a1aa"},
    Cell.Mount[TabBarInput, TabBar]("tabs", TabBarInput{
      SelectedId: selected, OnSelect: (id string) -> { selected = id },
      Items: []NavigationItem{
        NavigationItem{Id: "overview", Label: "Overview"}, NavigationItem{Id: "activity", Label: "Activity"},
        NavigationItem{Id: "locked", Label: "Unavailable", Disabled: true}, NavigationItem{Id: "files", Label: "Documents"},
        NavigationItem{Id: "settings", Label: "Preferences"}, NavigationItem{Id: "connections", Label: "Connections"},
      },
    }),
    Container{Key: "panel", Padding: 24, MinHeight: 180, BackgroundColor: "#18181b", BorderRadius: 8, Children: {
      Text{Content: "Selected: " + selected, FontSize: 22, Color: "#fafafa"},
      Text{Content: "The host owns this panel and its mounted state.", Color: "#a1a1aa"},
    }},
  }}
}
internal class TabBarPage : GalleryPage {
  override func Title() string -> "Tab bar"
  override func Build() Blob -> Cell.Mount[TabBarExample]("tabs-example")
}
