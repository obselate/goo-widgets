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
                Content: narrow ? "Narrow": "Wide",
                OnClick: () -> {
                    narrow = !narrow
                }
            }.Build(),
            ActionButton{
                Content: "Select item",
                OnClick: () -> {
                    selected = true
                }
            }.Build(),
        },
        Container{Height: 316.0, MasterDetail{
            Narrow: narrow,
            Selected: selected,
            OnBack: () -> {
                selected = false
            },
            Master: Container{Padding: 16.0, Text{Content: "Inbox"},},
            Detail: Container{Padding: 16.0, Text{Content: "Message from Alex"},},
        }.Build()},
    }
}

internal class MasterDetailPage : GalleryPage {
    override func Title() string -> "Master detail"

    override func Build() Blob -> Cell.Mount[MasterDetailExample]("master-detail-example")
}
