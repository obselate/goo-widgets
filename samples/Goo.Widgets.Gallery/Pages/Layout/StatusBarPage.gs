package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Layout
import Goo.Widgets.Navigation

internal class StatusBarExample(HostWindow Window?) : Cell {
    private var last string = "Ready"

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MinWidth: 0,
        Gap: 24,
        Cell.Mount[StatusBarInput, StatusBar](
            "full",
            StatusBarInput{
                Window: HostWindow,
                Start: []StatusBarItem{
                    StatusBarItem{
                        Id: "branch",
                        Text: "main",
                        Priority: 10,
                        Tooltip: "Current branch",
                        OnActivate: () -> {
                            last = "Branch selected"
                        }
                    },
                    StatusBarItem{Id: "busy", Text: "Indexing", Busy: true, Priority: 20},
                    StatusBarItem{Id: "sync", Text: "Up to date", Priority: 0}
                },
                End: []StatusBarItem{
                    StatusBarItem{Id: "position", Text: "Ln 12, Col 8", Priority: 2},
                    StatusBarItem{
                        Id: "language",
                        Text: "G#",
                        Priority: 5,
                        MenuItems: []MenuItem{
                            MenuItem{Id: "gsharp", Label: "G#"},
                            MenuItem{Id: "plain", Label: "Plain text"}
                        },
                        OnMenuActivate: id -> {
                            last = id
                        }
                    },
                    StatusBarItem{Id: "disabled", Text: "Offline", Disabled: true, OnActivate: () -> { }}
                }
            }
        ),
        Container{
            Width: 180,
            Cell.Mount[StatusBarInput, StatusBar](
                "narrow",
                StatusBarInput{
                    Start: []StatusBarItem{
                        StatusBarItem{Id: "ready", Text: "Ready", Priority: 10},
                        StatusBarItem{Id: "detail", Text: "All files saved", Priority: 0}
                    },
                    End: []StatusBarItem{StatusBarItem{Id: "encoding", Text: "UTF-8", Priority: 2}}
                }
            )
        },
        Text{Content: last, Color: Theme.Read().TextColor}
    }
}

internal class StatusBarPage : GalleryPage {
    override func Title() string -> "Status bar"

    override func Build() Blob -> Cell.Mount[StatusBarExample](
        () -> StatusBarExample(OwningWindow),
        "status-bar-example"
    )
}
