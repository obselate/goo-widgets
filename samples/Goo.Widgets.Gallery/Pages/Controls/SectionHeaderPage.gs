package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Layout
import Goo.Widgets.Gallery

class SectionHeaderPage : GalleryPage {
  public override func Title() string -> "SectionHeader"

  public override func Build() Blob {
    let defaultHeader = SectionHeader{
      Label: "Overview",
    }

    let accentMetaHeader = SectionHeader{
      Label: "Repositories",
      MetaText: "12 active",
      ShowAccent: true,
      Expanded: true,
    }

    let collapsedHeader = SectionHeader{
      Label: "Archived Projects",
      MetaText: "3 hidden",
      ShowAccent: true,
      Expanded: false,
    }

    let customHeader = SectionHeader{
      Label: "System Diagnostics",
      MetaText: "v2.4.0",
      ShowAccent: true,
      Expanded: true,
      AccessibilityName: "System Diagnostics Header",
      HeadingLevel: 3,
      LabelColor: Color.Parse("#bbf7d0"),
      MetaColor: Color.Parse("#4ade80"),
      RuleColor: Color.Parse("#166534"),
      AccentColor: Color.Parse("#22c55e"),
      Gap: 14.0,
      AccentSize: 8.0,
      RuleHeight: 2.0,
      LabelFontSize: 13.0,
      LabelFontWeight: 800,
      MetaFontSize: 12.0,
      MetaFontWeight: 600,
    }

    return Container{
      Width: 620.0,
      FlexDirection: FlexDirection.Column,
      Gap: 24.0,
      Children: {
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 6.0,
          Children: {
            Text{ Content: "DEFAULT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            defaultHeader.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 6.0,
          Children: {
            Text{ Content: "ACCENT + META", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" },
            accentMetaHeader.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 6.0,
          Children: {
            Text{ Content: "COLLAPSED STATE", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            collapsedHeader.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 6.0,
          Children: {
            Text{ Content: "CUSTOM STYLE", FontSize: 10.0, FontWeight: 700, Color: "#4ade80" },
            customHeader.Build(),
          },
        },
      },
    }
  }
}
