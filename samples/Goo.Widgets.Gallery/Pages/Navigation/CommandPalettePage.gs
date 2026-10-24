package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Navigation

internal class CommandPaletteExample : Cell {
    private var isOpen bool = true
    private var query string = ""
    private var result string = "None"

    public override func Build() Blob -> Container{
        Width: Percent(100),
        MaxWidth: 560,
        Gap: 20,
        ActionButton{
            Content: "Open command palette",
            OnClick: () -> {
                isOpen = true
                query = ""
                Rebuild()
            }
        }.Build(),
        Text{Content: "Last action " + result},
        Cell.Mount[CommandPaletteInput, CommandPalette](
            "palette",
            CommandPaletteInput{
                Open: isOpen,
                Query: query,
                OnQueryChange: (value string) -> {
                    query = value
                    Rebuild()
                },
                OnDismiss: () -> {
                    isOpen = false
                    Rebuild()
                },
                OnActivate: (id string) -> {
                    result = id
                    Rebuild()
                },
                Items: []CommandItem{
                    CommandItem{
                        Id: "Open file",
                        Label: "Open file",
                        Shortcut: KeyBinding{Key: Key.O, Modifiers: KeyModifiers{Ctrl: true}}
                    },
                    CommandItem{
                        Id: "Save file",
                        Label: "Save file",
                        Shortcut: KeyBinding{Key: Key.S, Modifiers: KeyModifiers{Ctrl: true}}
                    },
                    CommandItem{Id: "Format document", Label: "Format document"},
                    CommandItem{Id: "Open settings", Label: "Open settings"},
                    CommandItem{Id: "Change color theme", Label: "Change color theme"},
                    CommandItem{Id: "Restricted command", Label: "Restricted command", Disabled: true},
                },
            }
        ),
    }
}

internal class CommandPalettePage : GalleryPage {
    override func Title() string -> "Command palette"

    override func Build() Blob -> Cell.Mount[CommandPaletteExample]("command-palette-example")
}
