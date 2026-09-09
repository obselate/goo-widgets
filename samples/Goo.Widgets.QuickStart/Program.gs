package Goo.Widgets.QuickStart

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Colors

open class ColorPickerHost : Cell {
  private let initialColor int32 = 0x4F8FEA
  private var liveColor int32 = 0x4F8FEA
  private var committedColor int32 = 0x4F8FEA

  override func Build() Blob -> Container {
    Width: Length.Percent(100.0),
    Height: Length.Percent(100.0),
    Padding: 28.0,
    Gap: 20.0,
    FlexDirection: FlexDirection.Column,
    BackgroundColor: Color.Parse("#18181b"),
    Children: {
      Container{
        Key: "color-picker-row",
        FlexDirection: FlexDirection.Row,
        AlignItems: AlignItems.Center,
        Gap: 28.0,
        Children: {
          Cell.Mount[ColorPickerInput, ColorPicker]("color-picker", ColorPickerInput{
            Value: liveColor,
            Mode: ColorMode.Oklch,
            WheelSize: 260.0,
            AccessibilityName: "Theme color",
            OnValueChanged: (value int32) -> SetLiveColor(value),
            OnValueCommitted: (value int32) -> CommitColor(value),
          }),
          Container{
            Key: "color-preview",
            Width: 260.0,
            Gap: 10.0,
            Children: {
              Container{
                Key: "live-preview",
                Width: 260.0,
                Height: 96.0,
                BorderRadius: 10.0,
                BackgroundColor: ColorMath.GooColor(liveColor),
                Accessibility: Accessibility{ Role: AccessibilityRole.Image, Name: "Live color preview" },
              },
              Text{ Key: "live-value", Content: "Live #" + ColorMath.Hex(liveColor), Color: "#fafafa", FontSize: 15.0, FontWeight: 700 },
              Text{ Key: "committed-value", Content: "Committed #" + ColorMath.Hex(committedColor), Color: "#a1a1aa", FontSize: 13.0 },
            },
          },
        },
      },
      Container{
        Key: "actions",
        Children: {
          ActionButton{
            Label: "Reset",
            OnClick: () -> ResetColor(),
          }.Build(),
        },
      },
    },
  }

  private func SetLiveColor(value int32) {
    liveColor = value
    Rebuild()
  }

  private func CommitColor(value int32) {
    liveColor = value
    committedColor = value
    Rebuild()
  }

  private func ResetColor() {
    liveColor = initialColor
    committedColor = initialColor
    Rebuild()
  }
}

func Main() {
  Window.ConfigureApplication("Color picker usage", "1.0.0", "com.example.colorpicker-usage")
  let window = Window{ Title: "Color picker usage", Width: 720, Height: 520, Root: ColorPickerHost{} }
  window.Run()
}
