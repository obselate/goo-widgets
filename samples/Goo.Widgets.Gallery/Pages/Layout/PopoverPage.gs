package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class PopoverExample : Cell {
    private let anchor ElementHandle = ElementHandle()
    private var isOpen bool = true
    private func Dismiss(reason PopoverDismissReason) {
        isOpen = false
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 400.0,
        Gap: 14.0,
        Color: "#fafafa",
        Text{Key: "title", Content: "Anchored details", FontSize: 22.0, FontWeight: 700},
        Text{
            Key: "hint",
            Content: "The popup flips above an anchor near the bottom edge.",
            FontSize: 14.0,
            Color: "#a1a1aa"
        },
        Button{
            Key: "trigger",
            Handle: anchor,
            Position: PositionType.Absolute,
            Left: 450.0,
            Top: 300.0,
            Width: 190.0,
            Height: 38.0,
            BackgroundColor: "#4f46e5",
            BorderRadius: 6.0,
            OnClick: () -> {
                isOpen = true
                Rebuild()
            },
            Text{Content: "Show release details"}
        },
        Cell.Mount[PopoverInput, Popover](
            "popover",
            PopoverInput{
                Open: isOpen,
                Anchor: anchor,
                Width: 300.0,
                AccessibilityName: "Release details",
                Padding: 16.0,
                OnDismiss: Dismiss,
                Content: Container{
                    Gap: 13.0,
                    Text{Content: "Release 24.9", FontSize: 20.0, FontWeight: 700},
                    Text{
                        Content: "Three services are ready to deploy. Review their health before continuing.",
                        Color: "#a1a1aa"
                    },
                    Text{Content: "● All checks passed", Color: "#86efac", FontSize: 13.0},
                    Button{
                        Height: 34.0,
                        BackgroundColor: "#4f46e5",
                        BorderRadius: 5.0,
                        OnClick: () -> Dismiss(PopoverDismissReason.OutsideClick),
                        Text{Content: "Done"}
                    }
                }
            }
        ),
    }
}

internal class PopoverPage : GalleryPage {
    override func Title() string -> "Popover"

    override func Build() Blob -> Cell.Mount[PopoverExample]("popover-example")
}
