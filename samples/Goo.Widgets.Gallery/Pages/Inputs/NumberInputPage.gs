package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class NumberInputExample : Cell {
    private var quantity float64 = 4
    private var price float64 = 12.5
    private var width float64 = 80
    private var unit string = "px"
    private var committed string = "none"

    public override func Build() Blob -> Container{
        Width: 360,
        FlexDirection: FlexDirection.Column,
        Gap: 24,
        Cell.Mount[NumberInputInput, NumberInput](
            "quantity",
            NumberInputInput{
                Label: "Quantity",
                Value: quantity,
                Minimum: 0,
                Maximum: 100,
                Step: 1,
                Width: Percent(100),
                ScrubLabel: "↔",
                OnChange: value -> {
                    quantity = value
                    Rebuild()
                },
                OnCommit: value -> {
                    committed = value.ToString()
                    Rebuild()
                }
            }
        ),
        Cell.Mount[NumberInputInput, NumberInput](
            "price",
            NumberInputInput{
                Label: "Price",
                Value: price,
                Minimum: 0,
                Step: 0.25,
                Width: Percent(100),
                Prefix: Text{Content: "$", Padding: Edges{Left: 12}},
                Format: value -> value.ToString("F2"),
                OnChange: value -> {
                    price = value
                    Rebuild()
                }
            }
        ),
        Cell.Mount[NumberInputInput, NumberInput](
            "units",
            NumberInputInput{
                Label: "Width",
                Value: width,
                Width: Percent(100),
                OnChange: value -> {
                    width = value
                    Rebuild()
                },
                Units: []ComboBoxOption{ComboBoxOption{Id: "px", Label: "px"}, ComboBoxOption{Id: "rem", Label: "rem"}},
                Unit: unit,
                OnUnitChange: value -> {
                    unit = value
                    Rebuild()
                }
            }
        ),
        Text{Content: "Committed " + committed, Color: Theme.Read().MutedTextColor},
    }
}

internal class NumberInputPage : GalleryPage {
    override func Title() string -> "Number input"

    override func Build() Blob -> Cell.Mount[NumberInputExample]("number-input-example")
}
