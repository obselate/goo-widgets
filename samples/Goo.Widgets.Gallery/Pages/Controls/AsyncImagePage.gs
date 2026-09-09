package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets.Media
import Goo.Widgets.Gallery

class AsyncImagePage : GalleryPage {
  public override func Title() string -> "AsyncImage"

  public override func Build() Blob {
    let createImage Func[AsyncImage, Image] = (resolved) -> {
      return Image{
        Width: Length.Percent(100.0),
        Height: Length.Percent(100.0),
        BackgroundColor: Color.Parse("#3f3f46"),
        BorderRadius: resolved.BorderRadius!!,
        BorderWidth: 1.0,
        BorderColor: resolved.BorderColor!!,
      }
    }
    let customPlaceholder Func[AsyncImage, Blob] = (resolved) -> {
      return Container{
        Width: Length.Percent(100.0),
        Height: Length.Percent(100.0),
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        BackgroundColor: Color.Parse("#27272a"),
        Children: {
          Text{
            Content: "Custom",
            Color: resolved.PlaceholderTextColor!!,
            FontSize: resolved.FontSize,
            FontWeight: resolved.FontWeight,
          },
        },
      }
    }

    let baseImage = AsyncImage{
      Width: 150.0,
      Height: 100.0,
      BackgroundColor: Color.Parse("#18181b"),
      BorderColor: Color.Parse("#3f3f46"),
      BorderWidth: 1.0,
      BorderRadius: 8.0,
      CreateImage: createImage,
    }

    let readyImage = baseImage with{
      AccessibilityName = "Ready",
    }
    let loadingImage = baseImage with{
      AccessibilityName = "Loading",
      Loading = true,
    }
    let failedImage = baseImage with{
      AccessibilityName = "Failed",
      Failed = true,
    }
    let customImage = baseImage with{
      AccessibilityName = "Custom",
      Loading = true,
      CreatePlaceholder = customPlaceholder,
    }

    return Container{
      Width: Length.Percent(100.0),
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Gap: 12.0,
      Children: {
        Container{
          Width: 150.0,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 6.0,
          Children: {
            readyImage.Build(),
            Text{ Content: "Ready", FontSize: 12.0, Color: "#a1a1aa" },
          },
        },
        Container{
          Width: 150.0,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 6.0,
          Children: {
            loadingImage.Build(),
            Text{ Content: "Loading", FontSize: 12.0, Color: "#a1a1aa" },
          },
        },
        Container{
          Width: 150.0,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 6.0,
          Children: {
            failedImage.Build(),
            Text{ Content: "Failed", FontSize: 12.0, Color: "#fca5a5" },
          },
        },
        Container{
          Width: 150.0,
          FlexDirection: FlexDirection.Column,
          AlignItems: AlignItems.Center,
          Gap: 6.0,
          Children: {
            customImage.Build(),
            Text{ Content: "Custom", FontSize: 12.0, Color: "#a1a1aa" },
          },
        },
      },
    }
  }
}
