package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal open class WindowChromeExample : Cell {
  private var maximized bool
  private var status string = "No command"

  public override func Build() Blob -> Container {
    Width: 640.0,
    BorderWidth: 1.0,
    BorderColor: "#3f3f46",
    BackgroundColor: "#09090b",
    Children: {
      WindowChrome{
        IsMaximized: maximized,
        LeadingContent: Text{ Content: "Example window", MarginLeft: 12.0, FontSize: 12.0, Color: "#fafafa" },
        OnMinimize: () -> { status = "Minimize"
          Rebuild() },
        OnMaximize: () -> { maximized = true
          status = "Maximize"
          Rebuild() },
        OnRestore: () -> { maximized = false
          status = "Restore"
          Rebuild() },
        OnClose: () -> { status = "Close"
          Rebuild() },
      }.Build(),
      Container{
        Height: 180.0,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        Children: { Text{ Content: status, FontSize: 14.0, Color: "#a1a1aa" } },
      },
    },
  }
}

internal class WindowChromePage : GalleryPage {
  override func Title() string -> "Window chrome"
  override func Build() Blob -> Cell.Mount[WindowChromeExample]("window-chrome-example")
}
