package Goo.Widgets.QuickStart

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Colors

class ColorPickerHost : Cell {
    private let initialColor int32 = 0x4F8FEA
    private var liveColor int32 = 0x4F8FEA
    private var committedColor int32 = 0x4F8FEA

    override func Build() Blob {
        let reset = ActionButton{Label: "Reset", OnClick: () -> ResetColor()}.Build()
        reset.Key = "reset"
        return Container{
            Width: Length.Percent(100.0),
            Height: Length.Percent(100.0),
            Padding: 28.0,
            Gap: 14.0,
            FlexDirection: FlexDirection.Column,
            BackgroundColor: Color.Parse("#18181b"),
            Cell.Mount[ColorPickerInput, ColorPicker](
                "color-picker",
                ColorPickerInput{
                    Value: liveColor,
                    WheelSize: 260.0,
                    AccessibilityName: "Theme color",
                    OnValueChanged: (value int32) -> SetLiveColor(value),
                    OnValueCommitted: (value int32) -> CommitColor(value),
                }
            ),
            Text{
                Content: "Committed #${ColorMath.Hex(committedColor)}",
                Key: "committed-value",
                Color: "#a1a1aa",
                FontSize: 13.0,
            },
            reset,
        }
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
    }
}

func Main() {
    Window.ConfigureApplication("Color picker usage", "1.0.0", "com.example.colorpicker-usage")
    Window{Title: "Color picker usage", Width: 420, Height: 560, Root: ColorPickerHost{}}.Run()
}
