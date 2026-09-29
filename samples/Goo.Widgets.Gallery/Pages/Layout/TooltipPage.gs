package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal class TooltipPage : GalleryPage {
    override func Title() string -> "Tooltip"

    override func Build() Blob -> Container{
        Width: 720,
        Height: 400,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        Gap: 18,
        Text{Content: "Tooltips", FontSize: 24, FontWeight: 700, Color: "#fafafa"},
        Text{
            Content: "Hover or focus a button. The label follows its anchor without taking focus.",
            FontSize: 14,
            Color: "#a1a1aa",
        },
        Text{
            Content: "Escape dismisses a label. Move away and return to show it again.",
            FontSize: 13,
            Color: "#a1a1aa",
        },
        Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: 18,
            Cell.Mount[TooltipInput, Tooltip](
                "enabled-tooltip",
                TooltipInput{
                    Window: OwningWindow,
                    Text: "Open details",
                    Placement: PortalPlacement.Bottom,
                    Target: Button{
                        Width: 158,
                        Height: 42,
                        BorderRadius: 7,
                        BackgroundColor: "#4f46e5",
                        AutoFocus: true,
                        Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Open details"},
                        Text{Content: "Enabled button", Color: "#fafafa"},
                    },
                }
            ),
            Cell.Mount[TooltipInput, Tooltip](
                "disabled-tooltip",
                TooltipInput{
                    Window: OwningWindow,
                    Text: "Unavailable right now",
                    Placement: PortalPlacement.Bottom,
                    Target: Button{
                        Width: 158,
                        Height: 42,
                        BorderRadius: 7,
                        BackgroundColor: "#3f3f46",
                        Disabled: true,
                        Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Unavailable action"},
                        Text{Content: "Disabled button", Color: "#d4d4d8"},
                    },
                }
            ),
        },
    }
}
