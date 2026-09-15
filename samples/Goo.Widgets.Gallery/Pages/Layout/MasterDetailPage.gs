package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal open class MasterDetailExample : Cell {
    private var selected bool
    private var narrow bool

    /// Builds the interactive master-detail example.
    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 360.0,
        Gap: 12.0,
        Container{
            FlexDirection: FlexDirection.Row,
            Gap: 8.0,
            ActionButton{
                Label: "Toggle layout",
                OnClick: () -> {
                    narrow = !narrow
                }
            }.Build(),
            ActionButton{
                Label: "Select item",
                OnClick: () -> {
                    selected = true
                }
            }.Build(),
        },
        MasterDetail{
            Narrow: narrow,
            Selected: selected,
            OnBack: () -> {
                selected = false
            },
            Master: Container{Padding: 16.0, Text{Content: "Master list", Color: "#fafafa"},},
            Detail: Container{Padding: 16.0, Text{Content: "Selected item details", Color: "#fafafa"},},
        }.Build(),
    }
}

internal class MasterDetailPage : GalleryPage {
    override func Title() string -> "Master detail"

    override func Build() Blob -> Cell.Mount[MasterDetailExample]("master-detail-example")
}
