package Goo.Widgets.Gallery.Pages.Actions

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Icons

internal open class IconButtonExample : Cell {
    private var active bool
    private var count int32

    public override func Build() Blob -> Container(){
        .Gap: 16.0,
        .AlignItems: AlignItems.Center,
        Container(){
            .FlexDirection: FlexDirection.Row,
            .AlignItems: AlignItems.Center,
            .Gap: 12.0,
            IconButton{
                AccessibilityName: "Add item",
                Icon: MaterialIcons.Create("add"),
                OnClick: () -> {
                    count++
                    Rebuild()
                },
            }.Build(),
            IconButton{
                AccessibilityName: "Pin item",
                Active: active,
                Icon: MaterialIcons.Create("push_pin"),
                OnClick: () -> {
                    active = !active
                    Rebuild()
                },
            }.Build(),
            IconButton{
                AccessibilityName: "Unavailable action",
                Disabled: true,
                Icon: MaterialIcons.Create("close"),
            }.Build(),
        },
        Text{Content: "Add pressed " + count.ToString() + " times", FontSize: 12.0, Color: "#a1a1aa"},
    }
}

internal class IconButtonPage : GalleryPage {
    override func Title() string -> "Icon button"

    override func Build() Blob -> Cell.Mount[IconButtonExample]("icon-button-example")
}
