package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Layout
import Goo.Widgets.Gallery

class ListRowPage : GalleryPage {
  public override func Title() string -> "ListRow"

  public override func Build() Blob {
    let defaultLeading = Container{
      Width: 32.0, Height: 32.0, BorderRadius: 6.0, BackgroundColor: Color.Parse("#27272a"),
      AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
      Children: { Text{ Content: "IN", FontSize: 11.0, FontWeight: 700, Color: "#a1a1aa" } },
    }
    let defaultTrailing = Container{
      PaddingLeft: 8.0, PaddingRight: 8.0, PaddingTop: 3.0, PaddingBottom: 3.0,
      BorderRadius: 10.0, BackgroundColor: Color.Parse("#27272a"),
      Children: { Text{ Content: "12", FontSize: 11.0, FontWeight: 600, Color: "#d4d4d8" } },
    }
    let defaultRow = ListRow{
      Title: "Inbox notifications", Caption: "Receive email summaries and digest alerts",
      AccessibilityName: "Inbox notifications", Leading: defaultLeading, Trailing: defaultTrailing,
    }

    let selectedLeading = Container{
      Width: 32.0, Height: 32.0, BorderRadius: 6.0, BackgroundColor: Color.Parse("#3f3f46"),
      AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
      Children: { Text{ Content: "SEC", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" } },
    }
    let selectedTrailing = Container{
      PaddingLeft: 8.0, PaddingRight: 8.0, PaddingTop: 3.0, PaddingBottom: 3.0,
      BorderRadius: 10.0, BackgroundColor: Color.Parse("#52525b"),
      Children: { Text{ Content: "Active", FontSize: 11.0, FontWeight: 600, Color: "#fafafa" } },
    }
    let selectedRow = ListRow{
      Title: "Security and authentication", Caption: "Passkeys, multi-factor, and session logs",
      Selected: true, AccessibilityName: "Security and authentication",
      Leading: selectedLeading, Trailing: selectedTrailing,
    }

    let compactLeading = Container{
      Width: 28.0, Height: 28.0, BorderRadius: 5.0, BackgroundColor: Color.Parse("#27272a"),
      AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
      Children: { Text{ Content: "KEY", FontSize: 9.0, FontWeight: 700, Color: "#a1a1aa" } },
    }
    let compactTrailing = Container{
      PaddingLeft: 6.0, PaddingRight: 6.0, PaddingTop: 2.0, PaddingBottom: 2.0,
      BorderRadius: 4.0, BackgroundColor: Color.Parse("#18181b"),
      BorderWidth: 1.0, BorderColor: Color.Parse("#3f3f46"),
      Children: { Text{ Content: "Ctrl+K", FontSize: 11.0, FontWeight: 500, Color: "#a1a1aa" } },
    }
    let compactRow = ListRow{
      Title: "Keyboard shortcuts", MinHeight: 48.0, PaddingVertical: 8.0,
      AccessibilityName: "Keyboard shortcuts", Leading: compactLeading, Trailing: compactTrailing,
    }

    let customLeading = Container{
      Width: 36.0, Height: 36.0, BorderRadius: 8.0, BackgroundColor: Color.Parse("#14532d"),
      AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
      Children: { Text{ Content: "DEV", FontSize: 11.0, FontWeight: 700, Color: "#bbf7d0" } },
    }
    let customTrailing = Container{
      PaddingLeft: 8.0, PaddingRight: 8.0, PaddingTop: 3.0, PaddingBottom: 3.0,
      BorderRadius: 10.0, BackgroundColor: Color.Parse("#14532d"),
      Children: { Text{ Content: "PRO", FontSize: 11.0, FontWeight: 700, Color: "#bbf7d0" } },
    }
    let customRow = ListRow{
      Title: "Developer workspace", Caption: "Emerald environment with relaxed padding",
      AccessibilityName: "Developer workspace",
      BackgroundColor: Color.Parse("#052e16"), TextColor: Color.Parse("#f0fdf4"),
      CaptionColor: Color.Parse("#86efac"), MinHeight: 68.0,
      PaddingHorizontal: 18.0, PaddingVertical: 12.0, Gap: 16.0, BorderRadius: 12.0,
      TitleFontSize: 15.0, TitleFontWeight: 700, CaptionFontSize: 12.5,
      Leading: customLeading, Trailing: customTrailing,
    }

    return Container{
      Width: 620.0,
      FlexDirection: FlexDirection.Column,
      Gap: 10.0,
      Children: {
        Container{
          Width: Length.Percent(100.0), FlexDirection: FlexDirection.Column, Gap: 3.0,
          Children: {
            Text{ Content: "DEFAULT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            defaultRow.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0), FlexDirection: FlexDirection.Column, Gap: 3.0,
          Children: {
            Text{ Content: "SELECTED", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" },
            selectedRow.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0), FlexDirection: FlexDirection.Column, Gap: 3.0,
          Children: {
            Text{ Content: "TITLE ONLY", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            compactRow.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0), FlexDirection: FlexDirection.Column, Gap: 3.0,
          Children: {
            Text{ Content: "CUSTOM", FontSize: 10.0, FontWeight: 700, Color: "#4ade80" },
            customRow.Build(),
          },
        },
      },
    }
  }
}
