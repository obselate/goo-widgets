package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Gallery

class ChipPage : GalleryPage {
  public override func Title() string -> "Chip"

  public override func Build() Blob {
    let defaultChip = Chip{
      Label: "Documentation",
    }

    let selectedLeadingChip = Chip{
      Label: "Filter ∶ Active",
      Selected: true,
      Leading: Container{
        Width: 8.0,
        Height: 8.0,
        BorderRadius: 4.0,
        BackgroundColor: "#09090b",
      },
    }

    let disabledSelectedChip = Chip{
      Label: "Locked Tag",
      Selected: true,
      Disabled: true,
    }

    let customStyledChip = Chip{
      Label: "Custom Style",
      Selected: true,
      Leading: Container{
        Width: 8.0,
        Height: 8.0,
        BorderRadius: 2.0,
        BackgroundColor: "#27272a",
      },
      Height: 32.0,
      PaddingHorizontal: 14.0,
      Gap: 8.0,
      FontSize: 13.0,
      FontWeight: 700,
      BorderRadius: 8.0,
    }

    return Container{
      FlexDirection: FlexDirection.Column,
      AlignItems: AlignItems.Center,
      Gap: 24.0,
      Children: {
        Container{
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.Center,
          Gap: 24.0,
          Children: {
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8.0,
              Children: {
                Text{ Content: "DEFAULT", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
                defaultChip.Build(),
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8.0,
              Children: {
                Text{ Content: "SELECTED + LEADING", FontSize: 10.0, FontWeight: 700, Color: "#d4d4d8" },
                selectedLeadingChip.Build(),
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8.0,
              Children: {
                Text{ Content: "DISABLED SELECTED", FontSize: 10.0, FontWeight: 700, Color: "#a1a1aa" },
                disabledSelectedChip.Build(),
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8.0,
              Children: {
                Text{ Content: "CUSTOM STYLE", FontSize: 10.0, FontWeight: 700, Color: "#fafafa" },
                customStyledChip.Build(),
              },
            },
          },
        },
      },
    }
  }
}
