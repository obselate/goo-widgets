package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class DismissibleContextBarPage : GalleryPage {
  public override func Title() string -> "DismissibleContextBar"

  public override func Build() Blob {
    let baseContent = Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: 8.0,
      Children: {
        Text{ Content: "3 items selected in current query", FontSize: 13.0, FontWeight: 600 },
      },
    }

    let baseBar = DismissibleContextBar{
      Content: baseContent,
      AccessibilityName: "Selection context",
    }

    let defaultBar = baseBar

    let customActionContent = Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: 8.0,
      Children: {
        Text{ Content: "Filters applied ∶ Status = Active, Priority = High", FontSize: 13.0, FontWeight: 600 },
      },
    }
    let customActionBar = baseBar with{
      Content = customActionContent,
      AccessibilityName = "Active filter context",
      DismissText = "Clear all",
      DismissAccessibilityName = "Clear all filters",
    }

    let disabledContent = Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: 8.0,
      Children: {
        Text{ Content: "Applying batch operation (cannot dismiss)", FontSize: 13.0, FontWeight: 600 },
      },
    }
    let disabledBar = baseBar with{
      Content = disabledContent,
      AccessibilityName = "Locked batch operation context",
      DismissText = "Locked",
      Disabled = true,
    }

    let customStyleContent = Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: 8.0,
      Children: {
        Text{ Content: "Production workspace connected ∶ 12 nodes online", FontSize: 13.0, FontWeight: 700 },
      },
    }
    let customStyleBar = baseBar with{
      Content = customStyleContent,
      AccessibilityName = "Workspace status context",
      DismissText = "Close",
      DismissAccessibilityName = "Close workspace banner",
      BackgroundColor = Color.Parse("#18181b"),
      BorderColor = Color.Parse("#52525b"),
      TextColor = Color.Parse("#fafafa"),
      DismissTextColor = Color.Parse("#d4d4d8"),
      DismissHoverBackgroundColor = Color.Parse("#27272a"),
      DismissActiveBackgroundColor = Color.Parse("#3f3f46"),
      DismissFocusBorderColor = Color.Parse("#fafafa"),
      PaddingHorizontal = 16.0,
      PaddingVertical = 10.0,
      BorderRadius = 10.0,
      DismissBorderRadius = 6.0,
      Gap = 16.0,
    }

    return Container{
      Width: 620.0,
      FlexDirection: FlexDirection.Column,
      Gap: 14.0,
      Children: {
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "DEFAULT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            defaultBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "CUSTOM ACTION", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            customActionBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "DISABLED", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
            disabledBar.Build(),
          },
        },
        Container{
          Width: Length.Percent(100.0),
          FlexDirection: FlexDirection.Column,
          Gap: 4.0,
          Children: {
            Text{ Content: "CUSTOM STYLE", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8" },
            customStyleBar.Build(),
          },
        },
      },
    }
  }
}
