package Goo.Widgets.Gallery.Pages.Actions

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery

internal open class ToggleButtonExample : Cell {
    private var pinned bool

    public override func Build() Blob -> Container{
        Gap: Theme.Read().ControlGap,
        ToggleButton{Content: "Pinned", Value: pinned, OnChange: (value bool) -> { pinned = value }},
        ToggleButton{Content: "Muted", Value: true},
        ToggleButton{Content: "Archived", Value: true, Disabled: true},
    }
}

internal class ToggleButtonPage : GalleryPage {
    override func Title() string -> "ToggleButton"

    override func Build() Blob -> Cell.Mount[ToggleButtonExample]("toggle-button-example")
}
