package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import Goo.Widgets.Gallery

class AppBarPage : GalleryPage {
  public override func Title() string -> "AppBar"

  public override func Build() Blob {
    let minimalTitleBar = AppBar{ Title: "Dashboard Overview" }
    let leadingNav = Container{
      Width: 28.0,
      Height: 28.0,
      BorderRadius: 6.0,
      BackgroundColor: "#27272a",
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Children: { MaterialIcons.Create("menu", 20.0, Color.Parse("#d4d4d8")) },
    }
    let trailingActions = Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: 8.0,
      Children: {
        Container{
          PaddingLeft: 10.0,
          PaddingRight: 10.0,
          PaddingTop: 4.0,
          PaddingBottom: 4.0,
          BorderRadius: 6.0,
          BackgroundColor: "#fafafa",
          Children: { Text{ Content: "Share", FontSize: 12.0, FontWeight: 600, Color: "#09090b" } },
        },
        Container{
          Width: 28.0,
          Height: 28.0,
          BorderRadius: 14.0,
          BackgroundColor: "#3f3f46",
          AlignItems: AlignItems.Center,
          JustifyContent: JustifyContent.Center,
          Children: { Text{ Content: "JD", FontSize: 11.0, FontWeight: 700, Color: "#fafafa" } },
        },
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
      PaddingLeft: 8.0,
      PaddingRight: 8.0,
      PaddingTop: 2.0,
      PaddingBottom: 2.0,
      BorderRadius: 4.0,
      BackgroundColor: "#27272a",
      Children: { Text{ Content: "PROD", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" } },
    }
    let actionSlot = Container{
      PaddingLeft: 12.0,
      PaddingRight: 12.0,
      PaddingTop: 6.0,
      PaddingBottom: 6.0,
      BorderRadius: 6.0,
      BackgroundColor: "#7f1d1d",
      Children: { Text{ Content: "Deploy", FontSize: 12.0, FontWeight: 700, Color: "#fafafa" } },
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
      BackgroundColor: Color.Parse("#18181b"),
      TextColor: Color.Parse("#fafafa"),
      SubtitleColor: Color.Parse("#a1a1aa"),
      BorderColor: Color.Parse("#3f3f46"),
      BorderWidth: 2.0,
      Leading: badgeSlot,
      Trailing: actionSlot,
    }

    return Container{
      Width: 700.0,
      FlexDirection: FlexDirection.Column,
      Gap: 10.0,
      Children: {
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "MINIMAL TITLE", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            minimalTitleBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "TITLE + SUBTITLE WITH SLOTS", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" },
            slotsBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "COMPACT CUSTOM (NO BORDER / SHADOW)", FontSize: 10.0, FontWeight: 700, Color: "#4ade80" },
            compactCustomBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "DISTINCT CUSTOM PALETTE & TYPOGRAPHY", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8" },
            distinctCustomBar.Build(),
          },
        },
      },
    }
  }
}
