package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Navigation
import System.Collections.Generic

internal open class NavigationRailExample : Cell {
    private var expanded bool = true
    private var selected string = "home"
    private var collapsed bool

    /// Builds the interactive navigation-rail example.
    public override func Build() Blob -> Container{
        Gap: 16.0,
        FlexDirection: FlexDirection.Row,
        Cell.Mount[NavigationRailInput, NavigationRail](
            "rail",
            NavigationRailInput{
                Height: 300,
                Groups: []NavigationGroup{
                    NavigationGroup{
                        Id: "workspace",
                        Label: "Workspace",
                        Items: []NavigationItem{
                            NavigationItem{Id: "files", Label: "Files", Content: MaterialIcons.Create("folder")},
                            NavigationItem{Id: "search", Label: "Search", Content: MaterialIcons.Create("search")},
                            NavigationItem{Id: "locked", Label: "Unavailable", Disabled: true},
                        },
                    }
                },
                Counts: Dictionary[string, int32](){["files"] = 12, ["jobs"] = 3},
                CollapsedGroups: collapsed ? []string{"workspace"}: []string{},
                OnGroupToggle: (id string) -> {
                    collapsed = !collapsed
                    Rebuild()
                },
                BottomItems: []NavigationItem{
                    NavigationItem{Id: "settings", Label: "Settings", Content: MaterialIcons.Create("settings")},
                },
                Expanded: expanded,
                SelectedId: selected,
                AccessibilityName: "Example sections",
                OnSelect: (id string) -> {
                    selected = id
                },
                Items: []NavigationItem{
                    NavigationItem{Id: "home", Label: "Home", Content: MaterialIcons.Create("home")},
                    NavigationItem{Id: "jobs", Label: "Jobs", Content: MaterialIcons.Create("work")},
                },
            }
        ),
        Container{
            Gap: 12.0,
            Text{Content: "Selected: " + selected},
            ActionButton{
                Content: if expanded {
                    "Collapse"
                } else {
                    "Expand"
                },
                OnClick: () -> {
                    expanded = !expanded
                },
            }.Build(),
        },
    }
}

internal class NavigationRailPage : GalleryPage {
    override func Title() string -> "Navigation rail"

    override func Build() Blob -> Cell.Mount[NavigationRailExample]("navigation-rail-example")
}
