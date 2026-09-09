package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal open class SliderExample : Cell {
  private var horizontal float64 = 35.0
  private var vertical float64 = 0.65
  private var status string = "Ready"

  public override func Build() Blob -> Container {
    Width: 520.0,
    Gap: 20.0,
    Children: {
      Text{ Key: "horizontal-value", Content: "Horizontal: " + Math.Round(horizontal).ToString(), FontSize: 12.0, Color: "#fafafa" },
      Cell.Mount[SliderInput, Slider]("horizontal-slider", SliderInput{
        Value: horizontal,
        Minimum: 0.0,
        Maximum: 100.0,
        Step: 5.0,
        AccessibilityName: "Horizontal example",
        OnValueChanged: (value float64) -> { horizontal = value
          status = "Preview " + value.ToString("0")
          Rebuild() },
        OnValueCommitted: (value float64) -> { horizontal = value
          status = "Committed " + value.ToString("0")
          Rebuild() },
      }),
      Container{
        Key: "vertical-row",
        Height: 180.0,
        FlexDirection: FlexDirection.Row,
        AlignItems: AlignItems.Center,
        Gap: 18.0,
        Children: {
          Cell.Mount[SliderInput, Slider]("vertical-slider", SliderInput{
            Value: vertical,
            Minimum: 0.0,
            Maximum: 1.0,
            Step: 0.05,
            Orientation: SliderOrientation.Vertical,
            AccessibilityName: "Vertical example",
            OnValueChanged: (value float64) -> { vertical = value
              Rebuild() },
            OnValueCommitted: (value float64) -> { vertical = value
              status = "Vertical committed"
              Rebuild() },
          }),
          Text{ Key: "vertical-value", Content: Math.Round(vertical * 100.0).ToString() + "%", FontSize: 12.0, Color: "#a1a1aa" },
        },
      },
      Text{ Key: "slider-status", Content: status, FontSize: 12.0, Color: "#a1a1aa" },
    },
  }
}

internal class SliderPage : GalleryPage {
  override func Title() string -> "Slider"
  override func Build() Blob -> Cell.Mount[SliderExample]("slider-example")
}
