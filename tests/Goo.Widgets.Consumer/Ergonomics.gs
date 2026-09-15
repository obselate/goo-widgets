package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import System

internal class ColorPickerProbe : ColorPicker {
    internal func Render(input ColorPickerInput) Blob -> base.Build(input)
}

func ColorPickerErgonomics() {
    let fullPicker = ColorPickerProbe{}
    let full = (fullPicker.Render(ColorPickerInput{Value: 0x336699}) as Container)!!
    Require(full.Children.Count == 4, "ColorPicker did not build its full default composition.")
    let defaultModes = (full.Children[0] as Container)!!
    Require(
        defaultModes.Children.Count == 3 && defaultModes.Children[2].Accessibility?.Selected == true,
        "ColorPicker did not default to the OKLCH model."
    )
    fullPicker.Dispose()

    let compactPicker = ColorPickerProbe{}
    let compact = (compactPicker.Render(ColorPickerInput{Value: 0x336699, Compact: true}) as Container)!!
    Require(compact.Children.Count == 2, "Compact ColorPicker did not omit its selector and preview.")
    compactPicker.Dispose()

    let disabledPicker = ColorPickerProbe{}
    var disabledChanges int32 = 0
    let disabled = (
        disabledPicker.Render(
            ColorPickerInput{
                Value: 0x336699,
                Mode: ColorMode.Hsv,
                Disabled: true,
                OnModeChanged: (mode ColorMode) -> {
                    disabledChanges++
                },
            }
        ) as Container
    )!!
    let disabledModes = (disabled.Children[0] as Container)!!
    let disabledHsl = (disabledModes.Children[0] as Button)!!
    Require(disabledHsl.Disabled && disabledHsl.Focusable == false, "Disabled ColorPicker left a mode control enabled.")
    disabledHsl.OnClick?.Invoke()
    Require(
        disabledChanges == 0 && disabledModes.Children[1].Accessibility?.Selected == true,
        "Disabled ColorPicker changed its color model."
    )
    disabledPicker.Dispose()

    let customPicker = ColorPickerProbe{}
    var changedRgb int32 = -1
    var rootRgb int32 = -1
    var rootMode = ColorMode.Oklch
    var customWheel Blob? = nil
    let customInput = ColorPickerInput{
        Value: 0x808080,
        Mode: ColorMode.Hsv,
        OnValueChanged: (rgb int32) -> {
            changedRgb = rgb
        },
        CreateRoot: (resolved ColorPickerInput, wheel Blob, slider Blob) -> {
            rootRgb = resolved.Value
            rootMode = resolved.Mode!!
            customWheel = wheel
            return Container(){wheel, slider}
        },
    }
    customPicker.Render(customInput)
    customWheel!!.OnKeyDown?.Invoke(KeyEvent{Key: Key.End})
    Require(changedRgb >= 0, "Custom ColorPicker wheel did not update its local color.")
    customPicker.Render(customInput)
    Require(
        rootRgb == changedRgb && rootMode == ColorMode.Hsv,
        "ColorPicker root factory did not receive the live color and mode."
    )
    customPicker.Dispose()
}

func CheckboxErgonomics() {
    var next = AccessibilityChecked.False
    let input = Checkbox{
        State: AccessibilityChecked.False,
        Label: "Enable alerts",
        OnChange: (state AccessibilityChecked) -> {
            next = state
        },
    }
    let before = (input.Build() as Button)!!
    Require(
        before.Children.Count == 2 && (before.Children[1] as Text)!!.Content == "Enable alerts",
        "Labeled Checkbox did not build one interactive row."
    )
    before.OnClick?.Invoke()
    Require(next == AccessibilityChecked.True, "Labeled Checkbox did not activate from its row.")
    let after = ((input with{State = next}).Build() as Button)!!
    Require(
        after.Accessibility?.Checked == AccessibilityChecked.True,
        "Labeled Checkbox did not reflect its controlled state."
    )
}

func SliderErgonomics() {
    let slider = SliderProbe{}
    var changed float64 = -1.0
    let input = SliderInput{
        Value: 0.25,
        Label: "Volume",
        ShowValue: true,
        FormatValue: (value float64) -> Math.Round(value * 100.0).ToString() + "%",
        OnValueChanged: (value float64) -> {
            changed = value
        },
    }
    let before = (slider.Render(input) as Container)!!
    let beforeHeader = (before.Children[0] as Container)!!
    Require(
        beforeHeader.Children.Count == 2 && (beforeHeader.Children[0] as Text)!!.Content == "Volume"
        && (beforeHeader.Children[1] as Text)!!.Content == "25%",
        "Slider did not build its labeled formatted value header."
    )
    let interactive = (before.Children[1] as Container)!!
    interactive.OnKeyDown?.Invoke(KeyEvent{Key: Key.End})
    Require(changed == 1.0, "Decorated Slider did not preserve its interactive root.")
    let after = (slider.Render(input) as Container)!!
    let afterHeader = (after.Children[0] as Container)!!
    Require((afterHeader.Children[1] as Text)!!.Content == "100%", "Slider did not update its visible formatted value.")
}

func GraphNodeCardErgonomics() {
    let node = GraphNode{Id: "node", Label: "Node", Position: Point{X: 80.0, Y: 60.0},}
    let fromNode = GraphNodeCard{Node: node}.Build()
    Require(fromNode.Key == "graph-node-node", "GraphNodeCard did not build with Node.Position as its default center.")
    let invalidPosition = node with{Position = Point{X: Double.NaN, Y: Double.NaN}}
    var defaultRejected bool = false
    try {
        GraphNodeCard{Node: invalidPosition}.Build()
    } catch (error ArgumentOutOfRangeException) {
        defaultRejected = true
    }
    Require(defaultRejected, "GraphNodeCard did not validate Node.Position as its default center.")
    let explicit = GraphNodeCard{Node: invalidPosition, Center: Point{X: 200.0, Y: 100.0}}.Build()
    Require(
        explicit.Key == "graph-node-node",
        "GraphNodeCard did not use its explicit center in place of Node.Position."
    )
}

func WidgetErgonomics() {
    ColorPickerErgonomics()
    CheckboxErgonomics()
    SliderErgonomics()
    GraphNodeCardErgonomics()
}
