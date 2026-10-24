package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class CommandPaletteExample : Cell {
    private var isOpen bool = true
    private var query string = ""
    private var result string = "No command selected"
    private var recent[]string = []string{"save"}

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 560,
        Gap: 20,
        Text{Content: "Search uses ranked fuzzy matches. Arrows select. Enter runs. Escape closes."},
        ActionButton{
            Content: "Open command palette",
            OnClick: () -> {
                isOpen = true
                query = ""
                Rebuild()
            }
        }.Build(),
        Text{Content: result},
        Cell.Mount[CommandPaletteInput, CommandPalette](
            "palette",
            CommandPaletteInput{
                Open: isOpen,
                Query: query,
                RecentIds: recent,
                OnQueryChange: (value string) -> {
                    query = value
                    Rebuild()
                },
                OnDismiss: () -> {
                    isOpen = false
                    Rebuild()
                },
                OnActivate: (id string) -> {
                    result = "Selected: " + id
                    recent = []string{id}
                    Rebuild()
                },
                Groups: []CommandGroup{
                    CommandGroup{Id: "file", Label: "File"},
                    CommandGroup{Id: "view", Label: "View"}
                },
                Items: []CommandItem{
                    CommandItem{
                        Id: "open",
                        Label: "Open file",
                        GroupId: "file",
                        Shortcut: KeyBinding{Key: Key.O, Modifiers: KeyModifiers{Ctrl: true}}
                    },
                    CommandItem{
                        Id: "save",
                        Label: "Save file",
                        GroupId: "file",
                        Shortcut: KeyBinding{Key: Key.S, Modifiers: KeyModifiers{Ctrl: true}}
                    },
                    CommandItem{Id: "format", Label: "Format document", GroupId: "file"},
                    CommandItem{Id: "settings", Label: "Open settings", GroupId: "view"},
                    CommandItem{Id: "theme", Label: "Change color theme", GroupId: "view"},
                    CommandItem{Id: "locked", Label: "Restricted command", GroupId: "view", Disabled: true},
                },
            }
        ),
    }
}

internal class CommandPalettePage : GalleryPage {
    override func Title() string -> "Command palette"

    override func Build() Blob -> Cell.Mount[CommandPaletteExample]("command-palette-example")
}
