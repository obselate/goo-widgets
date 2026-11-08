package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal open class RadioButtonExample : Cell {
    private var selected bool

    public override func Build() Blob -> Container{
        Gap: Theme.Read().ControlGap,
        RadioButton{
            Label: "Priority",
            Value: selected,
            OnChange: (value bool) -> {
                selected = value
            }
        },
        RadioButton{Label: "Standard", Value: true, Card: true},
        RadioButton{Label: "Archived", Value: true, Disabled: true},
    }
}

internal class RadioButtonPage : GalleryPage {
    override func Title() string -> "RadioButton"

    override func Build() Blob -> Cell.Mount[RadioButtonExample]("radio-button-example")
}
