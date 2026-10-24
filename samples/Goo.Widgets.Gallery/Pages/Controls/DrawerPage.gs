package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

class DrawerPage : GalleryPage {
    public override func Title() string -> "Drawer"

    public override func Build() Blob {
        let leftNavContent = Container{
            Gap: 6.0,
            Text{Content: "Navigation", FontSize: 13.0, FontWeight: 700},
            Text{Content: "Dashboard", FontSize: 11.0},
            Text{Content: "Analytics", FontSize: 11.0},
        }
        let openLeftDrawer = Drawer{
            Open: true,
            Width: 150.0,
            Content: leftNavContent,
            AccessibilityName: "Open left navigation drawer",
        }

        let rightDetailContent = Container{
            Gap: 6.0,
            Text{Content: "Inspector", FontSize: 13.0, FontWeight: 700},
            Text{Content: "Node ∶ #root", FontSize: 11.0},
            Text{Content: "Status ∶ Mounted", FontSize: 11.0, Color: "#4ade80"},
        }
        let openRightDrawer = Drawer{
            Open: true,
            FromRight: true,
            Width: 150.0,
            Content: rightDetailContent,
            AccessibilityName: "Open right inspector drawer",
        }

        let customContent = Container{
            Gap: 6.0,
            Text{Content: "Custom Drawer", FontSize: 12.0, FontWeight: 800, Color: "#bbf7d0"},
            Text{Content: "Emerald theme", FontSize: 10.0, Color: "#4ade80"},
        }
        let customDrawer = Drawer{
            Open: true,
            FromRight: true,
            Width: 170.0,
            BackgroundColor: Color.Parse("#052e16"),
            BorderColor: Color.Parse("#166534"),
            BorderWidth: 1.5,
            BorderRadius: 10.0,
            PaddingHorizontal: 14.0,
            PaddingVertical: 14.0,
            OpenOpacity: 0.95,
            TransitionMs: 200.0,
            TransitionEasing: Easing.EaseInOut,
            BoxShadow: BoxShadow{Color: Color.Parse("#000000"), OffsetX: -4.0, OffsetY: 0.0, Blur: 16.0, Spread: 0.0},
            OpenTransform: PanelTransform{Scale: 1.0},
            ClosedTransform: PanelTransform{TranslateX: Percent(100.0), Scale: 0.9},
            Content: customContent,
            AccessibilityName: "Custom styled drawer",
        }

        let viewport1 = Container{
            Position: PositionType.Relative,
            Overflow: Overflow.Hidden,
            Width: 280.0,
            Height: 135.0,
            BorderRadius: 8.0,
            BorderWidth: 1.0,
            BorderColor: Color.Parse("#3f3f46"),
            BackgroundColor: Color.Parse("#09090b"),
            openLeftDrawer.Build(),
        }

        let viewport2 = Container{
            Position: PositionType.Relative,
            Overflow: Overflow.Hidden,
            Width: 280.0,
            Height: 135.0,
            BorderRadius: 8.0,
            BorderWidth: 1.0,
            BorderColor: Color.Parse("#3f3f46"),
            BackgroundColor: Color.Parse("#09090b"),
            openRightDrawer.Build(),
        }

        let viewport4 = Container{
            Position: PositionType.Relative,
            Overflow: Overflow.Hidden,
            Width: 280.0,
            Height: 135.0,
            BorderRadius: 8.0,
            BorderWidth: 1.0,
            BorderColor: Color.Parse("#3f3f46"),
            BackgroundColor: Color.Parse("#09090b"),
            customDrawer.Build(),
        }

        return Container{Width: 580.0, FlexDirection: FlexDirection.Row, FlexWrap: FlexWrap.Wrap, Gap: 16.0, viewport1, viewport2, viewport4}
    }
}
