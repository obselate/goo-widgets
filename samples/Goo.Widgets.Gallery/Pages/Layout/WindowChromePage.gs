package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout

internal open class WindowChromeExample : Cell {
    private var maximized bool
    private var clicks int32
    private var status string = "none"

    public override func Build() Blob {
        let chrome = WindowChrome{
            IsMaximized: maximized,
            EnableDoubleClick: true,
            EnableContextMenu: true,
            LeadingContent: Text{Content: "Example window", MarginStart: 12.0, FontSize: 12.0,},
            TrailingContent: Button{
                Height: 24.0,
                MarginEnd: 8.0,
                BackgroundColor: "#373044",
                OnClick: () -> {
                    clicks++
                    status = "Embedded " + clicks.ToString()
                    Rebuild()
                },
                Text{Content: "Embedded control", FontSize: 11.0, Color: "#fafafa"}
            },
            OnMinimize: () -> {
                status = "Minimize"
                Rebuild()
            },
            OnMaximize: () -> {
                maximized = true
                status = "Maximize"
                Rebuild()
            },
            OnRestore: () -> {
                maximized = false
                status = "Restore"
                Rebuild()
            },
            OnClose: () -> {
                status = "Close"
                Rebuild()
            },
        }.Build()
        chrome.Key = "chrome"
        return Container{
            Width: 640.0,
            Height: 260.0,
            BorderWidth: 1.0,
            BorderColor: Color.Parse("#3f3f46"),
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
                    Content: "Last command " + status,
                    FontSize: 13.0,
                    Color: "#a5b4fc",
                    TextAlign: TextAlign.Center,
                    TextWrap: TextWrap.Wrap
                },
            }
        }
    }
}

internal class WindowChromePage : GalleryPage {
    override func Title() string -> "Window chrome"

    override func Build() Blob -> Cell.Mount[WindowChromeExample]("window-chrome-example")
}
