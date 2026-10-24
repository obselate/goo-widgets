package Goo.Widgets.Gallery.Pages.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import System

internal class ListViewExample : Cell {
    private var selected[]string = []string{"inbox"}
    private var invoked string = "none"

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: Percent(100),
            MaxWidth: 620,
            MinHeight: 0,
            Gap: theme.ControlGap,
            Cell.Mount[ListViewInput, ListView](
                "folders",
                ListViewInput{
                    Height: 336,
                    Multiple: true,
                    SelectedIds: selected,
                    OnSelectionChange: (ids[]string) -> {
                        selected = ids
                        Rebuild()
                    },
                    OnInvoke: (id string) -> {
                        invoked = id
                        Rebuild()
                    },
                    Sections: []ListViewSection{
                        ListViewSection{
                            Id: "mail",
                            Label: "Mail",
                            Items: []ListViewItem{
                                ListViewItem{Id: "inbox", Label: "Inbox", Count: 12, Unread: true},
                                ListViewItem{Id: "drafts", Label: "Drafts", Count: 3},
                                ListViewItem{Id: "sent", Label: "Sent"}
                            }
                        },
                        ListViewSection{
                            Id: "shared",
                            Label: "Workspace",
                            Items: []ListViewItem{
                                ListViewItem{Id: "design", Label: "Design", Caption: "Shared with the team"},
                                ListViewItem{Id: "archive", Label: "Archive", Muted: true},
                                ListViewItem{Id: "locked", Label: "Private", Disabled: true}
                            }
                        }
                    }
                }
            ),
            Text{Content: "Opened " + invoked, Color: theme.MutedTextColor}
        }
    }
}

internal class ListViewPage : GalleryPage {
    override func Title() string -> "List view"

    override func Build() Blob -> Cell.Mount[ListViewExample]("list-example")
}
