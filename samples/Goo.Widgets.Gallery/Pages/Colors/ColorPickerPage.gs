package Goo.Widgets.Gallery.Pages.Colors

import Goo
import Goo.Widgets.Colors
import Goo.Widgets.Gallery

internal open class ColorPickerExample : Cell {
  private var rgb int32 = 0x4F8FEA
  private var mode ColorMode = ColorMode.Oklch
  private var committed int32 = 0x4F8FEA

  public override func Build() Blob -> Container {
    Width: 420.0,
    FlexDirection: FlexDirection.Row,
    AlignItems: AlignItems.Center,
    Gap: 28.0,
    Children: {
      Cell.Mount[ColorPickerInput, ColorPicker]("color-picker", ColorPickerInput{
        Value: rgb,
        Mode: mode,
        WheelSize: 260.0,
        OnValueChanged: (value int32) -> { rgb = value
          Rebuild() },
        OnValueCommitted: (value int32) -> { rgb = value
          committed = value
          Rebuild() },
      }),
      Container{
        Key: "color-details",
        Width: 132.0,
        Gap: 10.0,
        Children: {
          ModeButton(ColorMode.Hsl, "HSL"),
          ModeButton(ColorMode.Hsv, "HSV"),
          ModeButton(ColorMode.Oklch, "OKLCH"),
          Container{ Width: 132.0, Height: 64.0, BorderRadius: 8.0, BackgroundColor: ColorMath.GooColor(rgb) },
          Text{ Content: "#" + ColorMath.Hex(rgb), FontSize: 13.0, FontWeight: 700, Color: "#fafafa" },
          Text{ Content: "Committed #" + ColorMath.Hex(committed), FontSize: 10.0, Color: "#a1a1aa", TextWrap: TextWrap.Wrap },
        },
      },
    },
  }

  private func ModeButton(value ColorMode, label string) Blob -> Button {
    Height: 34.0,
    PaddingLeft: 12.0,
    PaddingRight: 12.0,
    BorderRadius: 7.0,
    BackgroundColor: if mode == value { "#3f3f46" } else { "#27272a" },
    Cursor: Cursor.Pointer,
    Accessibility: Accessibility{ Role: AccessibilityRole.Button, Name: "Use " + label + " color model", Selected: mode == value },
    OnClick: () -> { mode = value
      Rebuild() },
    Children: { Text{ Content: label, FontSize: 12.0, Color: "#fafafa" } },
  }
}

internal class ColorPickerPage : GalleryPage {
  override func Title() string -> "Color picker"
  override func Build() Blob -> Cell.Mount[ColorPickerExample]("color-picker-example")
}
