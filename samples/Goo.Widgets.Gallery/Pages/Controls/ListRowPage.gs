package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Layout

internal class ListRowExample : Cell {
    private var message string = "Hover or focus a row to show its actions."

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
                Actions: Button{
                    Padding: theme.Spacing,
                    OnClick: () -> {
                        message = "Inbox pinned"
                        Rebuild()
                    },
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Pin inbox"},
                    Text{Content: "Pin", Color: theme.TextColor}
                }
            }.Build(),
            ListRow{
                Title: "Selected workspace",
                Caption: "Actions stay visible on a selected row",
                Selected: true,
                Leading: MaterialIcons.Create("folder", 24, theme.MutedTextColor),
                OnClick: () -> {
                    message = "Workspace selected"
                    Rebuild()
                },
                Actions: Button{
                    Padding: theme.Spacing,
                    OnClick: () -> {
                        message = "Workspace saved"
                        Rebuild()
                    },
                    Text{Content: "Save", Color: theme.TextColor}
                }
            }.Build(),
            ListRow{
                Title: "Unavailable archive",
                Caption: "Disabled rows do not accept input",
                Disabled: true,
                OnClick: () -> {
                    message = "Archive"
                    Rebuild()
                },
                Leading: MaterialIcons.Create("lock", 24, theme.MutedTextColor)
            }.Build(),
            ListRow{
                Title: "Plain information",
                Caption: "A row without callbacks is not a focus stop",
                Trailing: Text{Content: "12 items", Color: theme.MutedTextColor}
            }.Build(),
            Text{Content: message, Color: theme.MutedTextColor}
        }
    }
}

class ListRowPage : GalleryPage {
    public override func Title() string -> "ListRow"

    public override func Build() Blob -> Cell.Mount[ListRowExample]("row-example")
}
