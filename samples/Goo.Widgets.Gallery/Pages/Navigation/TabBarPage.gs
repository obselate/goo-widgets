package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation
import System.Collections.Generic

internal class TabBarExample : Cell {
    private var selected string = "overview"
    private let items List[NavigationItem] = List[NavigationItem](
        []NavigationItem{
            NavigationItem{Id: "overview", Label: "Overview"},
            NavigationItem{Id: "activity", Label: "Activity.gs"},
            NavigationItem{Id: "locked", Label: "Unavailable", Disabled: true},
            NavigationItem{Id: "files", Label: "Documents.gs"},
            NavigationItem{Id: "settings", Label: "Preferences.gs"},
            NavigationItem{Id: "connections", Label: "Connections.gs"},
        }
    )
    private var added int32

    public override func Build() Blob {
        let theme = Theme.Read()
        var label = selected
        for item in items {
            if item.Id == selected {
                label = item.Label!!
            }
        }
        return Container{
            Width: Percent(100),
            MaxWidth: 600,
            Gap: 20,
            Cell.Mount[TabBarInput, TabBar](
                "display",
                TabBarInput{SelectedId: selected, OnSelect: Select, Items: items.ToArray(), OverflowMenu: true,}
            ),
            Cell.Mount[TabBarInput, TabBar](
                "editor",
                TabBarInput{
                    SelectedId: selected,
                    OnSelect: Select,
                    Items: items.ToArray(),
                    OverflowMenu: true,
                    PinnedIds: []string{"overview"},
                    DirtyIds: []string{"activity"},
                    PreviewId: "files",
                    Badges: Dictionary[string, string](){["overview"] = "3"},
                    OnClose: (id string) -> {
                        for index in 0 ... items.Count {
                            if items[index].Id == id {
                                items.RemoveAt(index)
                                break
                            }
                        }
                        if selected == id {
                            selected = items.Count == 0 ? "": items[0].Id!!
                        }
                        Rebuild()
                    },
                    OnAdd: () -> {
                        added++
                        let id = "new-" + added.ToString()
                        items.Add(NavigationItem{Id: id, Label: "Untitled " + added.ToString()})
                        Select(id)
                    },
                    OnReorder: (id string, target int32) -> {
                        for index in 0 ... items.Count {
                            if items[index].Id == id {
                                let item = items[index]
                                items.RemoveAt(index)
                                items.Insert(target, item)
                                break
                            }
                        }
                        Rebuild()
                    },
                }
            ),
            Container{
                Padding: 24,
                MinHeight: 100,
                BackgroundColor: theme.SunkenColor,
                BorderRadius: theme.PanelRadius,
                FlexDirection: FlexDirection.Row,
                Gap: 20,
                Cell.Mount[TabBarInput, TabBar](
                    "vertical",
                    TabBarInput{
                        Placement: TabPlacement.Left,
                        Width: 180,
                        Height: 136,
                        Items: items.ToArray(),
                        SelectedId: selected,
                        OnSelect: Select,
                    }
                ),
                Text{Content: "Selected " + label, FlexGrow: 1, MinWidth: 0},
            },
        }
    }

    private func Select(id string) {
        selected = id
        Rebuild()
    }
}

internal class TabBarPage : GalleryPage {
    override func Title() string -> "Tab bar"

    override func Build() Blob -> Cell.Mount[TabBarExample]("tabs-example")
}
