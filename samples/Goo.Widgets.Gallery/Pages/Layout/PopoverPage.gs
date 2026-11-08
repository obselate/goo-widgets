package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class PopoverExample : Cell {
    private let anchor ElementHandle = ElementHandle()
    private var isOpen bool = true
    private func Dismiss(reason PopoverDismissReason) {
        isOpen = false
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: 720.0,
        Height: 280.0,
        Gap: 14.0,
        Button{
            Key: "trigger",
            Handle: anchor,
            Position: PositionType.Absolute,
            Left: 265.0,
            Top: 0.0,
            Width: 190.0,
            Height: 38.0,
            BackgroundColor: Theme.Read().AccentColor,
            BorderRadius: 6.0,
            OnClick: () -> {
                isOpen = true
                Rebuild()
            },
            Text{Content: "Show release details", Color: Theme.Read().OnAccentColor}
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
                    Text{Content: "Three services are ready to deploy. Review their health before continuing.",},
                    Text{Content: "All checks passed", Color: Theme.Read().SuccessColor, FontSize: 13.0},
                    Button{
                        Height: 34.0,
                        BackgroundColor: Theme.Read().AccentColor,
                        BorderRadius: 5.0,
                        OnClick: () -> Dismiss(PopoverDismissReason.OutsideClick),
                        Text{Content: "Done", Color: Theme.Read().OnAccentColor}
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
