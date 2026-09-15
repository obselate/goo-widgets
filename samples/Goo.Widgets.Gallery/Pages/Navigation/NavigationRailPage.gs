package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal open class NavigationRailExample : Cell {
    private var expanded bool = true
    private var selected string = "home"

    /// Builds the interactive navigation-rail example.
    public override func Build() Blob -> Container{
        Gap: 16.0,
        FlexDirection: FlexDirection.Row,
        NavigationRail{
            Expanded: expanded,
            SelectedId: selected,
            AccessibilityName: "Example sections",
            OnSelect: (id string) -> {
                selected = id
            },
            Items: []NavigationItem{
                NavigationItem{Id: "home", Label: "Home", Content: MaterialIcons.Create("home")},
                NavigationItem{Id: "jobs", Label: "Jobs", Content: MaterialIcons.Create("work")},
                NavigationItem{Id: "settings", Label: "Settings", Content: MaterialIcons.Create("settings")},
            },
        }.Build(),
        Container{
            Gap: 12.0,
            Text{Content: "Selected: " + selected, Color: "#fafafa"},
            ActionButton{
                Label: if expanded {
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
