package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class ShortcutListPage : GalleryPage {
    override func Title() string -> "Shortcut list"

    override func Build() Blob -> Container{
        Width: Percent(100),
        Cell.Mount[ShortcutListInput, ShortcutList](
            "shortcuts",
            ShortcutListInput{
                Entries: []ShortcutEntry{
                    ShortcutEntry{
                        Id: "open",
                        Group: "Files",
                        Label: "Open file",
                        Keys: []KeyBinding{KeyBinding{Key: Key.O, Modifiers: KeyModifiers{Ctrl: true}}}
                    },
                    ShortcutEntry{
                        Id: "save",
                        Group: "Files",
                        Label: "Save file",
                        Keys: []KeyBinding{KeyBinding{Key: Key.S, Modifiers: KeyModifiers{Ctrl: true}}}
                    },
                    ShortcutEntry{
                        Id: "search",
                        Group: "Navigation",
                        Label: "Find in project",
                        Keys: []KeyBinding{KeyBinding{Key: Key.F, Modifiers: KeyModifiers{Ctrl: true, Shift: true}}}
                    }
                }
            }
        )
    }
}
