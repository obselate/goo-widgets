package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import Goo.Widgets.Navigation
import System.Collections.Generic

internal class GlassShell : Cell {
    internal var Host Window?
    private let railWidth float64 = 56.0
    private var tab string = "documents"
    private var section string = "files"
    private var folder[]string = []string{"reports"}
    private var file[]string = []string{"budget"}
    private var recent[]string = []string{"budget"}

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            BasedOn: theme.GlassStyle,
            Width: Percent(100),
            Height: Percent(100),
            Overflow: Overflow.Hidden,
            Window.DragRegion(
                Container{
                    ZIndex: 1,
                    Padding: Edges{Top: theme.Spacing * 2.0},
                    WindowChrome{
                        Host: Host,
                        EnableDoubleClick: true,
                        Height: 36.0,
                        LeadingContent: Container{
                            PaddingStart: railWidth + theme.PanelRadius * 2.0,
                            Cell.Mount[TabBarInput, TabBar](
                                "tabs",
                                TabBarInput{
                                    Width: Length.Auto,
                                    ItemHeight: 36.0,
                                    SelectedId: tab,
                                    OnSelect: (id string) -> {
                                        tab = id
                                        Rebuild()
                                    },
                                    Items: []NavigationItem{
                                        NavigationItem{Id: "documents", Label: "Documents"},
                                        NavigationItem{Id: "pictures", Label: "Pictures"},
                                        NavigationItem{Id: "music", Label: "Music"},
                                        NavigationItem{Id: "recent", Label: "Recent"},
                                    },
                                }
                            ),
                        },
                    }.Build(),
                }
            ),
            Container{
                FlexGrow: 1,
                FlexBasis: 0,
                MinHeight: 0,
                Margin: Edges{Top: -theme.BorderWidth},
                FlexDirection: FlexDirection.Row,
                Container{
                    Padding: theme.Spacing * 2.0,
                    Cell.Mount[NavigationRailInput, NavigationRail](
                        "rail",
                        NavigationRailInput{
                            CollapsedWidth: railWidth - theme.Spacing * 4.0,
                            SelectedId: section,
                            AccessibilityName: "Sections",
                            OnSelect: (id string) -> {
                                section = id
                                Rebuild()
                            },
                            Items: []NavigationItem{
                                NavigationItem{
                                    Id: "files",
                                    Label: "Files",
                                    Content: MaterialIcons.Create("folder", 20.0)
                                },
                                NavigationItem{
                                    Id: "search",
                                    Label: "Search",
                                    Content: MaterialIcons.Create("search", 20.0)
                                },
                                NavigationItem{
                                    Id: "history",
                                    Label: "History",
                                    Content: MaterialIcons.Create("history", 20.0)
                                },
                            },
                            BottomItems: []NavigationItem{
                                NavigationItem{
                                    Id: "settings",
                                    Label: "Settings",
                                    Content: MaterialIcons.Create("settings", 20.0)
                                },
                            },
                        }
                    ),
                },
                Container{
                    BasedOn: theme.PanelStyle,
                    FlexGrow: 1,
                    MinWidth: 0,
                    Margin: Edges{Bottom: theme.Spacing * 2.0},
                    MarginEnd: theme.Spacing * 2.0,
                    Padding: theme.Spacing * 2.0,
                    Gap: theme.Spacing * 2.0,
                    FlexDirection: FlexDirection.Row,
                    tab == "recent" ? Recent(): Files(),
                },
            },
        }
    }

    private func Files() Blob -> Container{
        FlexGrow: 1,
        MinWidth: 0,
        FlexDirection: FlexDirection.Row,
        Gap: Theme.Read().Spacing * 2.0,
        Cell.Mount[TreeViewInput, TreeView](
            "folders",
            TreeViewInput{
                Width: 220,
                Height: Percent(100),
                AccessibilityName: "Folders",
                ExpandedIds: []string{"root"},
                SelectedIds: folder,
                OnSelectionChange: (ids[]string) -> {
                    folder = ids
                    Rebuild()
                },
                Nodes: []TreeNode{
                    TreeNode{
                        Id: "root",
                        Label: "Home",
                        Children: []TreeNode{
                            TreeNode{Id: "reports", Label: "Reports"},
                            TreeNode{Id: "invoices", Label: "Invoices"},
                            TreeNode{Id: "travel", Label: "Travel"},
                            TreeNode{Id: "archive", Label: "Archive"},
                        },
                    },
                },
            }
        ),
        Container{
            FlexGrow: 1,
            MinWidth: 0,
            Cell.Mount[DataGridInput, DataGrid](
                "files",
                DataGridInput{
                    Width: Percent(100),
                    Height: Percent(100),
                    RowHeight: 32,
                    HeaderHeight: 32,
                    AccessibilityName: "Files",
                    Selection: DataGridSelection.Single,
                    SelectedIds: file,
                    OnSelectionChange: (ids[]string) -> {
                        file = ids
                        Rebuild()
                    },
                    Columns: []DataGridColumn{
                        DataGridColumn{Id: "name", Label: "Name", Flex: 2, Minimum: 140},
                        DataGridColumn{Id: "size", Label: "Size", Width: 90, Alignment: TextAlign.Right},
                        DataGridColumn{Id: "modified", Label: "Modified", Width: 120},
                    },
                    Rows: []DataGridRow{
                        Row("budget", "Budget 2026.xlsx", "84 KB", "Today"),
                        Row("roadmap", "Roadmap.pdf", "1.2 MB", "Yesterday"),
                        Row("minutes", "Board minutes.docx", "36 KB", "Oct 21"),
                        Row("forecast", "Forecast.csv", "412 KB", "Oct 18"),
                        Row("summary", "Summary.md", "8 KB", "Oct 12"),
                    },
                }
            ),
        },
    }

    private func Recent() Blob -> Cell.Mount[ListViewInput, ListView](
        "recent",
        ListViewInput{
            Width: Percent(100),
            Height: Percent(100),
            AccessibilityName: "Recent",
            SelectedIds: recent,
            OnSelectionChange: (ids[]string) -> {
                recent = ids
                Rebuild()
            },
            Items: []ListViewItem{
                ListViewItem{Id: "budget", Label: "Budget 2026.xlsx", Caption: "Reports"},
                ListViewItem{Id: "boarding", Label: "Boarding pass.pdf", Caption: "Travel"},
                ListViewItem{Id: "beach", Label: "Beach.jpg", Caption: "Pictures"},
                ListViewItem{Id: "mix", Label: "Morning mix.m4a", Caption: "Music"},
            },
        }
    )

    private func Row(id string, name string, size string, modified string) DataGridRow {
        let values = Dictionary[string, string]()
        values.Add("name", name)
        values.Add("size", size)
        values.Add("modified", modified)
        return DataGridRow{Id: id, Label: name, Values: values}
    }
}

internal class GlassShellPage : GalleryPage {
    override func Title() string -> "Glass shell"

    override func Build() Blob -> ThemeScope{
        Value: Theme.Read().WithGlass(),
        Content: () -> Container{
            Width: Percent(100),
            MaxWidth: 900,
            Height: 520,
            BackgroundColor: Theme.Read().CanvasColor,
            BorderRadius: Theme.Read().PanelRadius,
            Cell.Mount[GlassShell]("glass-shell"),
        },
    }.Build()
}
