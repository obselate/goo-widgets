package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Colors
import Goo.Widgets.Inputs
import Hexa.NET.SDL3

internal open class NativePickerProbe : Cell[ColorPickerInput], IDisposable {
    private let picker ColorPickerProbe = ColorPickerProbe{}
    shared {
        internal var LastRoot Container?
    }

    public func Dispose() {
        picker.Dispose()
    }

    protected override func Build(input ColorPickerInput) Blob {
        let root = (picker.Render(input) as Container)!!
        if !input.Compact {
            let modes = (root.Children[0] as Container)!!
            for mode in modes.Children {
                mode.Handle = ElementHandle{}
            }
        }
        LastRoot = root
        return root
    }
}

internal class ErgonomicHost : Cell {
    internal var Checked AccessibilityChecked
    internal var CheckboxRoot Button?
    internal var SliderRoot Container?
    internal var Value float64 = 0.35
    internal var Rgb int32 = 0x4F8FEA
    internal var Compact bool
    internal var Disabled bool
    internal var Mode ColorMode?
    internal var ModeChanges int32

    public override func Build() Blob {
        let checkbox = (
            Checkbox{
                Label: "Enable preview",
                State: Checked,
                Disabled: Disabled,
                OnChange: (value AccessibilityChecked) -> {
                    Checked = value
                },
            }.Build() as Button
        )!!
        checkbox.Key = "checkbox"
        checkbox.Handle = ElementHandle{}
        checkbox.Children[1].Handle = ElementHandle{}
        CheckboxRoot = checkbox
        return Container{
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 24.0,
            Gap: 16.0,
            BackgroundColor: "#18181b",
            checkbox,
            Cell.Mount[SliderInput, Slider](
                "labeled-slider",
                SliderInput{
                    Label: "Opacity",
                    ShowValue: true,
                    Value: Value,
                    Width: Length.Percent(50),
                    FormatValue: (value float64) -> (value * 100.0).ToString("0") + "%",
                    OnValueChanged: (value float64) -> {
                        Value = value
                        Rebuild()
                    },
                    CreateRoot: (input SliderInput, root Container) -> {
                        SliderRoot = root
                        return root
                    },
                }
            ),
            Cell.Mount[ColorPickerInput, NativePickerProbe](
                "full-picker",
                ColorPickerInput{
                    Value: Rgb,
                    Mode: Mode,
                    WheelSize: 200.0,
                    Compact: Compact,
                    Disabled: Disabled,
                    OnValueChanged: (value int32) -> {
                        Rgb = value
                        Rebuild()
                    },
                    OnModeChanged: (mode ColorMode) -> {
                        ModeChanges++
                    },
                }
            ),
        }
    }
}

func NativeModeButton(index int32) Button ->
((NativePickerProbe.LastRoot!!.Children[0] as Container)!!.Children[index] as Button)!!

func ClickNativeButton(window Window, windowId uint32, target Blob) {
    let box = target.Handle!!.BorderBox
    let x = float32(box.X + box.Width / 2.0)
    let y = float32(box.Y + box.Height / 2.0)
    MouseButton(windowId, x, y, true)
    PumpFrames(window, 2)
    MouseButton(windowId, x, y, false)
    PumpFrames(window, 4)
}

func ErgonomicWindowInteractions() {
    let host = ErgonomicHost{}
    let window = Window{Title: "Goo Widgets ergonomic input verification", Width: 600, Height: 600, Root: host}
    window.Open()
    try {
        PumpFrames(window, 20)
        let windowId = OnlyNativeWindow()
        ClickNativeButton(window, windowId, host.CheckboxRoot!!.Children[1])
        Require(host.Checked == AccessibilityChecked.True, "Clicking the checkbox label did not change host state.")
        Require(
            host.CheckboxRoot!!.Accessibility?.Checked == AccessibilityChecked.True,
            "Checkbox label click did not rebuild its checked state."
        )
        let slider = host.SliderRoot!!
        Require(
            Math.Abs(slider.Handle!!.BorderBox.Width - (float64(window.Width) - 48.0) * 0.5) < 1.0,
            "A decorated slider applied its percentage width twice."
        )
        Require(slider.Handle!!.Focus(), "Labeled slider lost its focus target.")
        SendKey(windowId, SDLScancode.End)
        PumpFrames(window, 4)
        Require(
            host.Value == 1.0 && host.SliderRoot!!.Accessibility?.Range?.Text == "100%",
            "Labeled slider lost keyboard input or formatted state."
        )
        Require(NativeModeButton(2).Accessibility?.Selected == true, "Full picker did not start in OKLCH.")
        ClickNativeButton(window, windowId, NativeModeButton(1))
        Require(
            host.ModeChanges == 1 && NativeModeButton(1).Accessibility?.Selected == true,
            "Native color mode button did not select HSV."
        )
        Require(host.Rgb == 0x4F8FEA, "Changing the color model changed the selected RGB value.")
        host.Rgb = 0xCC8844
        host.Rebuild()
        PumpFrames(window, 4)
        Require(
            NativeModeButton(1).Accessibility?.Selected == true,
            "External RGB update reset the selected color mode."
        )
        let preview = (NativePickerProbe.LastRoot!!.Children[3] as Container)!!
        Require(
            (preview.Children[1] as Text)!!.Content == "#CC8844",
            "Full picker preview did not follow the host color."
        )
        host.Mode = ColorMode.Hsl
        host.Rebuild()
        PumpFrames(window, 4)
        Require(
            NativeModeButton(0).Accessibility?.Selected == true,
            "External mode update did not reach the full picker."
        )
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 4)
        ClickNativeButton(window, windowId, NativeModeButton(2))
        ClickNativeButton(window, windowId, host.CheckboxRoot!!.Children[1])
        Require(
            host.ModeChanges == 1 && host.Checked == AccessibilityChecked.True,
            "Disabled labeled controls accepted native input."
        )
        host.Disabled = false
        host.Compact = true
        host.Rebuild()
        PumpFrames(window, 4)
        let compactWheel = NativePickerProbe.LastRoot!!.Children[0]
        Require(
            compactWheel.Handle!!.IsMounted && compactWheel.Handle!!.Focus(),
            "Compact picker lost the mounted wheel."
        )
        SendKey(windowId, SDLScancode.Right)
        PumpFrames(window, 4)
        Require(host.Rgb != 0xCC8844, "Compact picker lost keyboard interaction after switching composition.")
        host.Compact = false
        host.Rebuild()
        PumpFrames(window, 4)
        Require(
            NativeModeButton(0).Accessibility?.Selected == true,
            "Returning to full composition lost the color mode."
        )
        Console.WriteLine(
            "PASS: native label click, slider width/focus/value, color modes/preview, disabled input, compact/full transition."
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    Require(!window.IsOpen, "Ergonomic input window did not close.")
}
