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
        },
        Kbd{
            Keys: []KeyBinding{KeyBinding{Key: Key.K, Modifiers: KeyModifiers{Super: true, Shift: true}}},
            Platform: KbdPlatform.MacOS
        }
    }
}
