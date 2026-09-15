package Goo.Widgets.Gallery.Pages.Colors

import Goo
import Goo.Widgets.Colors
import Goo.Widgets.Gallery

internal open class ColorPickerExample : Cell {
    private var rgb int32 = 0x4F8FEA
    private var committed int32 = 0x4F8FEA

    public override func Build() Blob -> Container(){
        .Width: 420.0,
        .AlignItems: AlignItems.Center,
        .Gap: 12.0,
        Cell.Mount[ColorPickerInput, ColorPicker](
            "color-picker",
            ColorPickerInput{
                Value: rgb,
                WheelSize: 260.0,
                OnValueChanged: (value int32) -> {
                    rgb = value
                    Rebuild()
                },
                OnValueCommitted: (value int32) -> {
                    rgb = value
                    committed = value
                    Rebuild()
                },
            }
        ),
        Text{
            Key: "committed-color",
            Content: "Committed #" + ColorMath.Hex(committed),
            FontSize: 11.0,
            Color: "#a1a1aa",
        },
    }
}

internal class ColorPickerPage : GalleryPage {
    override func Title() string -> "Color picker"

    override func Build() Blob -> Cell.Mount[ColorPickerExample]("color-picker-example")
}
