package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Layout

class AppBarPage : GalleryPage {
    public override func Title() string -> "AppBar"

    public override func Build() Blob {
        let theme = Theme.Read()
        let minimalTitleBar = AppBar{Title: "Dashboard Overview"}
        let leadingNav = Container{
            Width: 28.0,
            Height: 28.0,
            BorderRadius: 6.0,
            BackgroundColor: theme.HoverColor,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            MaterialIcons.Create("menu", 20.0, theme.MutedTextColor),
        }
        let trailingActions = Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: 8.0,
            Container{
                Padding: Edges(4.0, 10.0),
                BorderRadius: 6.0,
                BackgroundColor: theme.TextColor,
                Text{Content: "Share", FontSize: 12.0, FontWeight: 600, Color: theme.CanvasColor},
            },
            Container{
                Width: 28.0,
                Height: 28.0,
                BorderRadius: 14.0,
                BackgroundColor: theme.HoverColor,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                Text{Content: "JD", FontSize: 11.0, FontWeight: 700},
            },
        }
        let slotsBar = AppBar{
            Title: "Project Workspace",
            Subtitle: "Shared workspace / Design team",
            Leading: leadingNav,
            Trailing: trailingActions,
        }
        let compactCustomBar = AppBar{
            Title: "Compact Header",
            Height: 40.0,
            PaddingHorizontal: 12.0,
            Gap: 8.0,
            TitleFontSize: 13.0,
            TitleFontWeight: 700,
            BackgroundColor: Color.Parse("#052e16"),
            TextColor: Color.Parse("#bbf7d0"),
            BorderWidth: 0.0,
            BoxShadow: BoxShadow{Color: Color.Parse("#000000"), OffsetX: 0.0, OffsetY: 0.0, Blur: 0.0, Spread: 0.0},
        }
        let badgeSlot = Container{
            Padding: Edges(2.0, 8.0),
            BorderRadius: 4.0,
            BackgroundColor: theme.HoverColor,
            Text{Content: "PROD", FontSize: 10.0, FontWeight: 700},
        }
        let actionSlot = Container{
            Padding: Edges(6.0, 12.0),
            BorderRadius: 6.0,
            BackgroundColor: theme.DangerFillColor,
            Text{Content: "Deploy", FontSize: 12.0, FontWeight: 700, Color: theme.OnAccentColor},
        }
        let distinctCustomBar = AppBar{
            Title: "Cluster Metrics",
            Subtitle: "Region ∶ us-east-1 • 99.99% uptime",
            HeadingLevel: 2,
            Height: 64.0,
            PaddingHorizontal: 20.0,
            Gap: 16.0,
            TitleGap: 4.0,
            TitleFontSize: 18.0,
            TitleFontWeight: 700,
            SubtitleFontSize: 11.0,
            SubtitleFontWeight: 500,
            BackgroundColor: theme.RaisedColor,
            BorderColor: theme.StrongBorderColor,
            BorderWidth: 2.0,
            Leading: badgeSlot,
            Trailing: actionSlot,
        }

        return Container{Width: 700.0, Gap: 16.0, minimalTitleBar.Build(), slotsBar.Build(), compactCustomBar.Build(), distinctCustomBar.Build()}
    }
}
