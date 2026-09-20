package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal open class WindowChromeExample : Cell {
    private var maximized bool
    private var clicks int32
    private var status string = "Double-click the blank titlebar, or right-click for window commands."

    public override func Build() Blob {
        let chrome = WindowChrome{
            IsMaximized: maximized,
            EnableDoubleClick: true,
            EnableContextMenu: true,
            LeadingContent: Text{Content: "Example window", MarginLeft: 12.0, FontSize: 12.0, Color: "#fafafa"},
            TrailingContent: Button{
                Height: 24.0,
                MarginRight: 8.0,
                BackgroundColor: "#373044",
                OnClick: () -> {
                    clicks++
                    status = "Embedded control: " + clicks.ToString()
                    Rebuild()
                },
                Text{Content: "Embedded control", FontSize: 11.0, Color: "#fafafa"}
            },
            OnMinimize: () -> {
                status = "Minimize callback"
                Rebuild()
            },
            OnMaximize: () -> {
                maximized = true
                status = "Maximize callback"
                Rebuild()
            },
            OnRestore: () -> {
                maximized = false
                status = "Restore callback"
                Rebuild()
            },
            OnClose: () -> {
                status = "Close callback"
                Rebuild()
            },
        }.Build()
        chrome.Key = "chrome"
        return Container{
            Width: 640.0,
            Height: 260.0,
            BorderWidth: 1.0,
            BorderColor: "#3f3f46",
            BackgroundColor: "#09090b",
            chrome,
            Container{
                Key: "body",
                FlexGrow: 1.0,
                Padding: 24.0,
                Gap: 16.0,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                Text{Content: maximized ? "Maximized": "Normal", FontSize: 28.0, FontWeight: 700.0, Color: "#fafafa"},
                Text{
                    Content: status,
                    FontSize: 13.0,
                    Color: "#a5b4fc",
                    TextAlign: TextAlign.Center,
                    TextWrap: TextWrap.Wrap
                },
                Text{Content: "Focus a titlebar control and press Menu or Shift+F10.", FontSize: 12.0, Color: "#a1a1aa"}
            }
        }
    }
}

internal class WindowChromePage : GalleryPage {
    override func Title() string -> "Window chrome"

    override func Build() Blob -> Cell.Mount[WindowChromeExample]("window-chrome-example")
}
