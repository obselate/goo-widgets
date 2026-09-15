package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

class DrawerPage : GalleryPage {
    public override func Title() string -> "Drawer"

    public override func Build() Blob {
        let leftNavContent = Container(){
            .Gap: 6.0,
            Text{Content: "Navigation", FontSize: 13.0, FontWeight: 700, Color: "#fafafa"},
            Text{Content: "Dashboard", FontSize: 11.0, Color: "#a1a1aa"},
            Text{Content: "Analytics", FontSize: 11.0, Color: "#a1a1aa"},
        }
        let openLeftDrawer = Drawer{
            Open: true,
            Width: 150.0,
            Content: leftNavContent,
            AccessibilityName: "Open left navigation drawer",
        }

        let rightDetailContent = Container(){
            .Gap: 6.0,
            Text{Content: "Inspector", FontSize: 13.0, FontWeight: 700, Color: "#fafafa"},
            Text{Content: "Node ∶ #root", FontSize: 11.0, Color: "#a1a1aa"},
            Text{Content: "Status ∶ Mounted", FontSize: 11.0, Color: "#4ade80"},
        }
        let openRightDrawer = Drawer{
            Open: true,
            FromRight: true,
            Width: 150.0,
            Content: rightDetailContent,
            AccessibilityName: "Open right inspector drawer",
        }

        let closedDrawer = Drawer{Open: false, Width: 150.0, AccessibilityName: "Closed drawer off-canvas",}

        let customContent = Container(){
            .Gap: 6.0,
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
            ClosedTransform: PanelTransform{TranslateX: Length.Percent(100.0), Scale: 0.9},
            Content: customContent,
            AccessibilityName: "Custom styled drawer",
        }

        let viewport1 = Container(){
            .Position: PositionType.Relative,
            .Overflow: Overflow.Hidden,
            .Width: 280.0,
            .Height: 135.0,
            .BorderRadius: 8.0,
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#3f3f46"),
            .BackgroundColor: Color.Parse("#09090b"),
            openLeftDrawer.Build(),
        }

        let viewport2 = Container(){
            .Position: PositionType.Relative,
            .Overflow: Overflow.Hidden,
            .Width: 280.0,
            .Height: 135.0,
            .BorderRadius: 8.0,
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#3f3f46"),
            .BackgroundColor: Color.Parse("#09090b"),
            openRightDrawer.Build(),
        }

        let viewport3 = Container(){
            .Position: PositionType.Relative,
            .Overflow: Overflow.Hidden,
            .Width: 280.0,
            .Height: 135.0,
            .BorderRadius: 8.0,
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#3f3f46"),
            .BackgroundColor: Color.Parse("#09090b"),
            .AlignItems: AlignItems.Center,
            .JustifyContent: JustifyContent.Center,
            Text{Content: "Canvas view (drawer slid off-canvas)", FontSize: 11.0, Color: "#a1a1aa"},
            closedDrawer.Build(),
        }

        let viewport4 = Container(){
            .Position: PositionType.Relative,
            .Overflow: Overflow.Hidden,
            .Width: 280.0,
            .Height: 135.0,
            .BorderRadius: 8.0,
            .BorderWidth: 1.0,
            .BorderColor: Color.Parse("#3f3f46"),
            .BackgroundColor: Color.Parse("#09090b"),
            customDrawer.Build(),
        }

        return Container(){
            .Width: 580.0,
            .FlexDirection: FlexDirection.Column,
            .Gap: 16.0,
            Container(){
                .Width: Length.Percent(100.0),
                .FlexDirection: FlexDirection.Row,
                .JustifyContent: JustifyContent.SpaceBetween,
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 4.0,
                    Text{Content: "OPEN LEFT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                    viewport1,
                },
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 4.0,
                    Text{Content: "OPEN RIGHT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                    viewport2,
                },
            },
            Container(){
                .Width: Length.Percent(100.0),
                .FlexDirection: FlexDirection.Row,
                .JustifyContent: JustifyContent.SpaceBetween,
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 4.0,
                    Text{Content: "CLOSED OFF-CANVAS", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa"},
                    viewport3,
                },
                Container(){
                    .FlexDirection: FlexDirection.Column,
                    .Gap: 4.0,
                    Text{Content: "CUSTOM STYLED RIGHT", FontSize: 10.0, FontWeight: 700, Color: "#4ade80"},
                    viewport4,
                },
            },
        }
    }
}
