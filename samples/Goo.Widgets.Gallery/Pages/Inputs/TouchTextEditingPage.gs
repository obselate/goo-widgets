package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TouchTextEditingExample : Cell {
    private var value string = "Meet at the north entrance at nine.\nBring the signed forms and a laptop.\nLunch is served after the session."

    public override func Build() Blob -> Container{
        Width: 560,
        Cell.Mount[TextAreaInput, TextArea](
            "editor",
            TextAreaInput{
                Label: "Touch selection",
                Value: value,
                OnChange: (next string) -> { value = next },
                Width: Percent(100),
                MinimumRows: 6,
            }
        )
    }
}

internal class TouchTextEditingPage : GalleryPage {
    override func Title() string -> "Touch text editing"

    override func Build() Blob -> Cell.Mount[TouchTextEditingExample]("touch-text-editing-example")
}
