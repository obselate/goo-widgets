package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class BadgePage : GalleryPage {
  public override func Title() string -> "Badge"

  public override func Build() Blob {
    let defaultBadge = Badge{
      Content: "12",
    }
    let errorBadge = Badge{
      Content: "Error",
      BackgroundColor: Color.Parse("#7f1d1d"),
    }
    let successBadge = Badge{
      Content: "Ready",
      BackgroundColor: Color.Parse("#166534"),
    }
    let warningBadge = Badge{
      Content: "Paused",
      BackgroundColor: Color.Parse("#854d0e"),
    }
    let dotBadge = Badge{
      AccessibilityName: "Unread notifications",
    }

    return Container{
      FlexDirection: FlexDirection.Column,
      AlignItems: AlignItems.Center,
      Gap: 24,
      Children: {
        Container{
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.Center,
          Gap: 32,
          Children: {
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8,
              Children: {
                defaultBadge.Build(),
                Text{ Content: "Count", FontSize: 12, Color: "#a1a1aa" },
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8,
              Children: {
                errorBadge.Build(),
                Text{ Content: "Error", FontSize: 12, Color: "#a1a1aa" },
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8,
              Children: {
                successBadge.Build(),
                Text{ Content: "Success", FontSize: 12, Color: "#a1a1aa" },
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8,
              Children: {
                warningBadge.Build(),
                Text{ Content: "Warning", FontSize: 12, Color: "#a1a1aa" },
              },
            },
            Container{
              FlexDirection: FlexDirection.Column,
              AlignItems: AlignItems.Center,
              Gap: 8,
              Children: {
                dotBadge.Build(),
                Text{ Content: "Dot", FontSize: 12, Color: "#a1a1aa" },
              },
            },
          },
        },
      },
    }
  }
}
