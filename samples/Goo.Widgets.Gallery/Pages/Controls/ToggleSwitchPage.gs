package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Inputs
import Goo.Widgets.Gallery

class ToggleSwitchPage : GalleryPage {
  public override func Title() string -> "ToggleSwitch"

  public override func Build() Blob {
    let baseSwitch = ToggleSwitch{
      Width: 64.0,
      Height: 34.0,
      Padding: 3.0,
      ThumbSize: 28.0,
      BorderRadius: 17.0,
      ThumbRadius: 14.0,
      OnClick: () -> {},
    }

    let offSwitch = baseSwitch with{
      Checked = false,
      AccessibilityName = "Off switch",
    }
    let onSwitch = baseSwitch with{
      Checked = true,
      AccessibilityName = "On switch",
    }
    let disabledOffSwitch = baseSwitch with{
      Checked = false,
      Disabled = true,
      AccessibilityName = "Disabled off switch",
    }
    let disabledOnSwitch = baseSwitch with{
      Checked = true,
      Disabled = true,
      AccessibilityName = "Disabled on switch",
    }

    return Container{
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Gap: 20,
      Children: {
        Container{
          Width: 100,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 8,
          Children: {
            offSwitch.Build(),
            Text{ Content: "Off", FontSize: 12, Color: "#a1a1aa" },
          },
        },
        Container{
          Width: 100,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 8,
          Children: {
            onSwitch.Build(),
            Text{ Content: "On", FontSize: 12, Color: "#a1a1aa" },
          },
        },
        Container{
          Width: 100,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 8,
          Children: {
            disabledOffSwitch.Build(),
            Text{ Content: "Disabled off", FontSize: 12, Color: "#a1a1aa" },
          },
        },
        Container{
          Width: 100,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 8,
          Children: {
            disabledOnSwitch.Build(),
            Text{ Content: "Disabled on", FontSize: 12, Color: "#a1a1aa" },
          },
        },
      },
    }
  }
}
