package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Layout
import Goo.Widgets.Media

internal class HoverCardExample : Cell {
    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: 560,
            Height: 110,
            Cell.Mount[HoverCardInput, HoverCard](
                "profile",
                HoverCardInput{
                    AccessibilityName: "Grace Hopper",
                    Width: 300,
                    Target: Button{
                        AutoFocus: true,
                        AlignSelf: AlignSelf.Center,
                        Padding: Edges(2, 4),
                        BorderRadius: theme.ControlRadius,
                        Focus: theme.FocusStyle,
                        Accessibility: Accessibility{Role: AccessibilityRole.Link, Name: "@grace"},
                        Text{Content: "@grace", Color: theme.LinkColor, FontWeight: theme.HeadingFontWeight},
                    },
                    Content: Container{
                        FlexDirection: FlexDirection.Row,
                        AlignItems: AlignItems.Center,
                        Gap: 12,
                        Avatar{FallbackText: "GH", AccessibilityName: "Grace Hopper", Presence: StatusState.Done, Size: 44}.Build(),
                        Text{
                            Content: "Grace Hopper",
                            FontSize: theme.FontSize,
                            FontWeight: theme.HeadingFontWeight,
                            Color: theme.TextColor,
                            FlexGrow: 1,
                        },
                        ActionButton{Content: "Message"}.Build(),
                    },
                }
            ),
        }
    }
}

internal class HoverCardPage : GalleryPage {
    override func Title() string -> "Hover card"

    override func Build() Blob -> Cell.Mount[HoverCardExample]("hover-card-example")
}
