package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal open class SliderExample : Cell {
    private var horizontal float64 = 35.0
    private var vertical float64 = 0.65
    private var status string = "Ready"

    public override func Build() Blob -> Container{
        Width: 520.0,
        Gap: 20.0,
        Cell.Mount[SliderInput, Slider](
            "horizontal-slider",
            SliderInput{
                Label: "Horizontal",
                ShowValue: true,
                Value: horizontal,
                Minimum: 0.0,
                Maximum: 100.0,
                Step: 5.0,
                OnValueChanged: (value float64) -> {
                    horizontal = value
                    status = "Preview " + value.ToString("0")
                    Rebuild()
                },
                OnValueCommitted: (value float64) -> {
                    horizontal = value
                    status = "Committed " + value.ToString("0")
                    Rebuild()
                },
            }
        ),
        Container{
            Key: "vertical-row",
            Height: 180.0,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: 18.0,
            Cell.Mount[SliderInput, Slider](
                "vertical-slider",
                SliderInput{
                    Label: "Vertical",
                    ShowValue: true,
                    FormatValue: (value float64) -> Math.Round(value * 100.0).ToString() + "%",
                    Value: vertical,
                    Minimum: 0.0,
                    Maximum: 1.0,
                    Step: 0.05,
                    Orientation: SliderOrientation.Vertical,
                    OnValueChanged: (value float64) -> {
                        vertical = value
                        Rebuild()
                    },
                    OnValueCommitted: (value float64) -> {
                        vertical = value
                        status = "Vertical committed"
                        Rebuild()
                    },
                }
            ),
        },
        Text{Key: "slider-status", Content: status, FontSize: 12.0, Color: "#a1a1aa"},
    }
}

internal class SliderPage : GalleryPage {
    override func Title() string -> "Slider"

    override func Build() Blob -> Cell.Mount[SliderExample]("slider-example")
}
