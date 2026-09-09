package Goo.Widgets.Gallery.Pages.Media

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Media

internal open class MediaCardExample : Cell {
  private var selected string = "None"

  public override func Build() Blob -> Container {
    Gap: 16.0,
    AlignItems: AlignItems.Center,
    Children: {
      Container{
        FlexDirection: FlexDirection.Row,
        Gap: 20.0,
        Children: {
          Card("Field recording", "Forest study", "12 min", "#14532d"),
          Card("Design review", "Workspace team", "Yesterday", "#312e81"),
        },
      },
      Text{ Content: "Selected: " + selected, FontSize: 12.0, Color: "#a1a1aa" },
    },
  }

  private func Card(title string, subtitle string, detail string, color string) Blob -> MediaCard {
    Width: 180.0,
    ThumbnailHeight: 132.0,
    Title: title,
    Subtitle: subtitle,
    Detail: detail,
    AccessibilityName: "Open " + title,
    Thumbnail: Container{
      Width: 180.0,
      Height: 132.0,
      BackgroundColor: color,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Children: { Text{ Content: title.Substring(0, 1), FontSize: 42.0, FontWeight: 700, Color: "#fafafa" } },
    },
    OnClick: () -> { selected = title
      Rebuild() },
  }.Build()
}

internal class MediaCardPage : GalleryPage {
  override func Title() string -> "Media card"
  override func Build() Blob -> Cell.Mount[MediaCardExample]("media-card-example")
}
