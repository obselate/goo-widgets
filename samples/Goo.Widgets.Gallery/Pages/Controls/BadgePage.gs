package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class BadgePage : GalleryPage {
  public override func Title() string -> "Badge"

  public override func Build() Blob {
    let baseBadge = Badge{
      FontSize: 12.0,
      FontWeight: 600,
    }

    let defaultBadge = baseBadge with{
      Content = "12",
    }
    let errorBadge = baseBadge with{
      Content = "Error",
      BackgroundColor = Color.Parse("#7f1d1d"),
    }
    let successBadge = baseBadge with{
      Content = "Ready",
      BackgroundColor = Color.Parse("#166534"),
    }
    let warningBadge = baseBadge with{
      Content = "Paused",
      BackgroundColor = Color.Parse("#854d0e"),
    }
    let dotBadge = baseBadge with{
      AccessibilityName = "Unread notifications",
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
