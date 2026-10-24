package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Layout

internal class ListRowExample : Cell {
    private var message string = "none"

    public override func Build() Blob {
        let theme = Theme.Read()
        return Container{
            Width: Percent(100),
            MaxWidth: 620,
            MinWidth: 0,
            Gap: theme.ControlGap,
            ListRow{
                Title: "Inbox notifications",
                Caption: "Receive email summaries and digest alerts",
                Leading: MaterialIcons.Create("inbox", 24, theme.MutedTextColor),
                OnClick: () -> {
                    message = "Inbox selected"
                    Rebuild()
                },
                OnInvoke: () -> {
                    message = "Inbox opened"
                    Rebuild()
                },
                Actions: ActionButton{
                    Content: "Pin",
                    OnClick: () -> {
                        message = "Inbox pinned"
                        Rebuild()
                    },
                    AccessibilityName: "Pin inbox",
                }.Build()
            }.Build(),
            ListRow{
                Title: "Selected workspace",
                Caption: "Shared with 4 people",
                Selected: true,
                Leading: MaterialIcons.Create("folder", 24, theme.MutedTextColor),
                OnClick: () -> {
                    message = "Workspace selected"
                    Rebuild()
                },
                Actions: ActionButton{
                    Content: "Save",
                    OnClick: () -> {
                        message = "Workspace saved"
                        Rebuild()
                    },
                }.Build()
            }.Build(),
            ListRow{
                Title: "Unavailable archive",
                Caption: "Read only",
                Disabled: true,
                OnClick: () -> {
                    message = "Archive"
                    Rebuild()
                },
                Leading: MaterialIcons.Create("lock", 24, theme.MutedTextColor)
            }.Build(),
            ListRow{
                Title: "Plain information",
                Caption: "Updated today",
                Trailing: Text{Content: "12 items", Color: theme.MutedTextColor}
            }.Build(),
            Text{Content: "Last action " + message, Color: theme.MutedTextColor}
        }
    }
}

class ListRowPage : GalleryPage {
    public override func Title() string -> "ListRow"

    public override func Build() Blob -> Cell.Mount[ListRowExample]("row-example")
}
