package Goo.Widgets.Gallery.Pages.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class KbdPage : GalleryPage {
    override func Title() string -> "Keyboard shortcuts"

    override func Build() Blob -> Container{
        Width: Percent(100),
        Gap: 20,
        Kbd{
            Keys: []KeyBinding{KeyBinding{Key: Key.K, Modifiers: KeyModifiers{Ctrl: true, Shift: true}}},
            Platform: KbdPlatform.Linux
        }.Build(),
        Kbd{
            Keys: []KeyBinding{KeyBinding{Key: Key.K, Modifiers: KeyModifiers{Super: true, Shift: true}}},
            Platform: KbdPlatform.MacOS
        }.Build(),
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
