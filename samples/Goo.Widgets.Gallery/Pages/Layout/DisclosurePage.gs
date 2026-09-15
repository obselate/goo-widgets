package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class DisclosureCounter : Cell {
    private var count int32
    public override func Build() Blob -> ActionButton{
        Label: "Retained counter: " + count.ToString(),
        OnClick: () -> {
            count++
        },
    }.Build()
}

internal class DisclosureExample : Cell {
    private var expanded bool = true
    private var customExpanded bool = true

    public override func Build() Blob {
        let section = Disclosure{
            Label: "Connection details",
            Expanded: expanded,
            OnExpandedChange: (value bool) -> {
                expanded = value
            },
            ShowFocusHighlight: true,
            Content: Container{
                Gap: 12,
                Text{
                    Key: "hint",
                    Content: "Increment, collapse, and reopen. The count stays with this section.",
                    Color: "#a1a1aa"
                },
                Cell.Mount[DisclosureCounter]("counter")
            },
        }
        let custom = section with{
            Label = "Custom appearance",
            Expanded = customExpanded,
            OnExpandedChange = (value bool) -> {
                customExpanded = value
            },
            BackgroundColor = Color.Parse("#102822"),
            HoverColor = Color.Parse("#174438"),
            TextColor = Color.Parse("#a7f3d0"),
            BorderColor = Color.Parse("#28765c"),
            BorderRadius = 12.0,
            HeaderPadding = 16.0,
            Content = Text{
                Content: "Derived with overrides; the same pointer and keyboard behavior.",
                Color: "#d1fae5"
            },
        }
        return Container{
            Width: 580,
            Gap: 16,
            Text{Content: "Enter or Space toggles the focused header.", Color: "#a1a1aa"},
            section.Build(),
            custom.Build(),
            (
                section with{Label = "Unavailable details", Expanded = false, Disabled = true, Content = Container{}}
            ).Build()
        }
    }
}

internal class DisclosurePage : GalleryPage {
    override func Title() string -> "Disclosure"

    override func Build() Blob -> Cell.Mount[DisclosureExample]("disclosure-example")
}
