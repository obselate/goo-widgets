package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

class ToggleGroupPage : GalleryPage {
    public override func Title() string -> "Toggle group"

    public override func Build() Blob -> Cell.Mount[ToggleDemo]("toggle-demo")
}

class ToggleDemo : Cell {
    private var selected[]string = []string{"day"}
    private var formats[]string = []string{"bold"}
    public override func Build() Blob -> Container{
        Gap: 20,
        Cell.Mount[ToggleGroupInput, ToggleGroup](
            "segments",
            ToggleGroupInput{
                AccessibilityName: "Calendar range",
                SelectedIds: selected,
                Stretch: true,
                OnChange: (ids[]string) -> {
                    selected = ids
                    Rebuild()
                },
                Items: []ToggleOption{
                    ToggleOption{Id: "day", Label: "Day"},
                    ToggleOption{Id: "week", Label: "Week"},
                    ToggleOption{Id: "month", Label: "Month"},
                },
            }
        ),
        Cell.Mount[ToggleGroupInput, ToggleGroup](
            "toolbar",
            ToggleGroupInput{
                AccessibilityName: "Text formatting",
                Multiple: true,
                Look: ToggleGroupLook.Toolbar,
                SelectedIds: formats,
                OnChange: (ids[]string) -> {
                    formats = ids
                    Rebuild()
                },
                Items: []ToggleOption{
                    ToggleOption{Id: "bold", Label: "Bold", Leading: MaterialIcons.Create("format_bold", size: 18)},
                    ToggleOption{
                        Id: "italic",
                        Label: "Italic",
                        Leading: MaterialIcons.Create("format_italic", size: 18)
                    },
                    ToggleOption{Id: "underline", Label: "Underline", Disabled: true},
                },
            }
        ),
        Cell.Mount[ToggleGroupInput, ToggleGroup](
            "chips",
            ToggleGroupInput{
                AccessibilityName: "Calendar chips",
                SelectedIds: selected,
                Look: ToggleGroupLook.Chips,
                OnChange: (ids[]string) -> {
                    selected = ids
                    Rebuild()
                },
                Items: []ToggleOption{
                    ToggleOption{Id: "day", Label: "Day"},
                    ToggleOption{Id: "week", Label: "Week"},
                    ToggleOption{Id: "month", Label: "Month"},
                },
            }
        ),
    }
}
