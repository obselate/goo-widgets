package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import System.Collections.Generic

internal class TreeViewExample : Cell {
    private var selected[]string = []string{"guide"}
    private var editing string = "none"
    private var expanded[]string = []string{"docs", "groups"}
    private var workstations bool = true
    private var servers bool
    private func Expand(id string, value bool) {
        let next = List[string]()
        for current in expanded {
            if current != id {
                next.Add(current)
            }
        }
        if value {
            next.Add(id)
        }
        expanded = next.ToArray()
        Rebuild()
    }

    private func Select(ids[]string) {
        selected = ids
        Rebuild()
    }

    private func Check(id string, state AccessibilityChecked) {
        let checked = state == AccessibilityChecked.True
        if id == "groups" || id == "workstations" {
            workstations = checked
        }
        if id == "groups" || id == "servers" {
            servers = checked
        }
        Rebuild()
    }

    private func GroupState() AccessibilityChecked -> workstations == servers ? (
        workstations ? AccessibilityChecked.True: AccessibilityChecked.False
    ): AccessibilityChecked.Mixed

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 720,
        FlexDirection: FlexDirection.Row,
        Gap: 24,
        Container{
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            Gap: 12,
            Cell.Mount[TreeViewInput, TreeView](
                "simple",
                TreeViewInput{
                    Height: 245,
                    ExpandOnActivate: true,
                    SelectedIds: selected,
                    Multiple: true,
                    OnRename: (id string) -> {
                        editing = id
                        Rebuild()
                    },
                    ExpandedIds: expanded,
                    OnExpandedChange: Expand,
                    OnSelectionChange: Select,
                    Nodes: []TreeNode{
                        TreeNode{
                            Id: "docs",
                            Label: "Documents",
                            Children: []TreeNode{
                                TreeNode{Id: "guide", Label: "Getting started"},
                                TreeNode{Id: "notes", Label: "Field notes"},
                                TreeNode{Id: "private", Label: "Private archive", Disabled: true},
                            }
                        },
                        TreeNode{
                            Id: "media",
                            Label: "Media",
                            Children: []TreeNode{TreeNode{Id: "photos", Label: "Photos"}}
                        }
                    },
                }
            ),
            Text{Content: "Rename " + editing, FontSize: 12}
        },
        Container{
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            Gap: 12,
            Cell.Mount[TreeViewInput, TreeView](
                "checks",
                TreeViewInput{
                    Height: 245,
                    ExpandOnActivate: true,
                    ExpandedIds: expanded,
                    OnExpandedChange: Expand,
                    MultiSelectable: true,
                    OnCheckChange: Check,
                    Nodes: []TreeNode{
                        TreeNode{
                            Id: "groups",
                            Label: "All hosts",
                            CheckState: GroupState(),
                            Children: []TreeNode{
                                TreeNode{
                                    Id: "workstations",
                                    Label: "Workstations",
                                    CheckState: workstations ? AccessibilityChecked.True: AccessibilityChecked.False
                                },
                                TreeNode{
                                    Id: "servers",
                                    Label: "Servers",
                                    CheckState: servers ? AccessibilityChecked.True: AccessibilityChecked.False
                                },
                                TreeNode{
                                    Id: "offline",
                                    Label: "Offline hosts",
                                    CheckState: AccessibilityChecked.Mixed,
                                    Disabled: true
                                },
                            }
                        }
                    },
                }
            )
        }
    }
}

internal class TreeViewPage : GalleryPage {
    override func Title() string -> "Tree view"

    override func Build() Blob -> Cell.Mount[TreeViewExample]("tree-example")
}
