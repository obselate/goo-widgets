package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TouchTextEditingExample : Cell {
    private var value string = "Long-press a word to select it.\nDrag either handle to adjust the selection.\nUse the toolbar to copy, cut, paste or select all."

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
