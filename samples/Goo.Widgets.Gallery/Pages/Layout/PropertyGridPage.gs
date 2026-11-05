package Goo.Widgets.Gallery.Pages.Layout

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System.Collections.Generic

internal class PropertyGridExample : Cell {
    private var query string = ""
    private var name string = "Studio"
    private var enabled bool = true
    private var compact bool = true
    private var expanded[]string = []string{"Workspace", "Storage"}

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MinWidth: 0,
        Gap: 16,
        Checkbox{
            Label: "Compact labels",
            State: compact ? AccessibilityChecked.True: AccessibilityChecked.False,
            OnChange: state -> {
                compact = state == AccessibilityChecked.True
            }
        }.Build(),
        PropertyGrid{
            Layout: compact ? PropertyGridLayout.Compact: PropertyGridLayout.Stacked,
            Query: query,
            OnQueryChange: value -> {
                query = value
            },
            ExpandedSectionIds: expanded,
            OnSectionExpandedChange: (section string, isOpen bool) -> {
                let next = List[string]()
                for name in expanded {
                    if name != section {
                        next.Add(name)
                    }
                }
                if isOpen {
                    next.Add(section)
                }
                expanded = next.ToArray()
            },
            Items: []PropertyGridItem{
                PropertyGridItem{
                    Id: "name",
                    Label: "Name",
                    Key: "workspace.name",
                    Section: "Workspace",
                    Modified: name != "Workspace",
                    OnReset: () -> {
                        name = "Workspace"
                    },
                    Editor: TextField{
                        Value: name,
                        Controlled: true,
                        OnChange: value -> {
                            name = value
                        }
                    }.Build()
                },
                PropertyGridItem{
                    Id: "sync",
                    Label: "Sync",
                    Key: "workspace.sync",
                    Section: "Workspace",
                    Editor: Checkbox{
                        Label: "Keep devices up to date",
                        State: enabled ? AccessibilityChecked.True: AccessibilityChecked.False,
                        OnChange: state -> {
                            enabled = state == AccessibilityChecked.True
                        }
                    }.Build()
                },
                PropertyGridItem{
                    Id: "path",
                    Label: "Location",
                    Section: "Storage",
                    Disabled: true,
                    Editor: TextField{Value: "/home/studio", Disabled: true}.Build()
                }
            }
        }.Build()
    }
}

internal class PropertyGridPage : GalleryPage {
    override func Title() string -> "Property grid"

    override func Build() Blob -> Cell.Mount[PropertyGridExample]("property-grid-example")
}
