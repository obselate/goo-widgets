package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Globalization

internal class TimePickerHost : Cell {
    internal var Value TimeOnly? = TimeOnly(23, 45)
    internal var Disabled bool
    internal var ReadOnly bool
    internal var Reject bool
    internal var Culture CultureInfo?
    internal var Changes int32

    public override func Build() Blob -> Container{
        Padding: Theme.Read().ControlPadding,
        Width: Percent(100),
        Cell.Mount[TimePickerInput, TimePicker]("time", TimePickerInput{
            Value: Value,
            Culture: Culture,
            MinuteIncrement: 15,
            Width: Percent(100),
            Disabled: Disabled,
            ReadOnly: ReadOnly,
            AccessibilityName: "Meeting",
            OnChange: value -> {
                Changes++
                if !Reject {
                    Value = value
                }
                Rebuild()
            }
        })
    }
}

func TimePickerInteractions() {
    let host = TimePickerHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: ApplicationRoot(host), Width: 420, Height: 180, AccessibilityAdapter: semantics}
    RunNativeWindow(window, () -> {
        window.Open()
        let id = OnlyNativeWindow()
        for palette in []Theme{Theme.Bone, Theme.Ink, Theme.Ink.WithHighContrast()} {
            Theme.Attach(window, palette with{Culture = CultureInfo.GetCultureInfo("en-GB")})
            host.Culture = nil
            host.Value = TimeOnly(23, 45)
            host.Rebuild()
            PumpFrames(window, 8)
            let hour = FindSemantics(semantics.Tree?.Root, "Meeting hour")!!
            Require(hour.Role == AccessibilityRole.SpinButton && hour.ValueMaximum == 23, "TimePicker did not inherit the theme clock culture")
            Require(FindSemantics(semantics.Tree?.Root, "Meeting period") == nil, "24-hour time exposed a period segment")
            Require(window.PerformAccessibilityAction(hour.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Time hour did not focus")
            SendKey(id, SDLScancode.Up)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly(0, 45), "Time hour did not wrap at midnight")
            let minute = FindSemantics(semantics.Tree?.Root, "Meeting minute")!!
            Require(window.PerformAccessibilityAction(minute.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Time minute did not focus")
            SendKey(id, SDLScancode.Up)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly(0, 0), "Time minute did not wrap using its increment")
            SendKey(id, SDLScancode.Down)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly(0, 45), "Time minute decrement ignored its increment")
            host.Culture = CultureInfo.GetCultureInfo("en-US")
            host.Rebuild()
            PumpFrames(window, 5)
            Require(FindSemantics(semantics.Tree?.Root, "Meeting hour")!!.ValueMaximum == 12, "Explicit time culture did not override the theme")
            let period = FindSemantics(semantics.Tree?.Root, "Meeting period")!!
            Require(period.Value == "AM", "Time period label ignored culture")
            Require(window.PerformAccessibilityAction(period.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Time period did not focus")
            SendKey(id, SDLScancode.Up)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly(12, 45), "Time period spin did not change half-day")
            host.Reject = true
            SendKey(id, SDLScancode.Down)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly(12, 45) && FindSemantics(semantics.Tree?.Root, "Meeting period")!!.Value == "PM", "TimePicker retained a rejected request")
            host.Reject = false
            host.ReadOnly = true
            host.Rebuild()
            PumpFrames(window, 5)
            let readOnly = FindSemantics(semantics.Tree?.Root, "Meeting minute")!!
            Require(readOnly.ReadOnly == true && window.PerformAccessibilityAction(readOnly.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Read-only time lost focus or semantics")
            let changes = host.Changes
            SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
            PumpFrames(window, 3)
            Require(window.Focus.Selection!!.Active.Offset != window.Focus.Selection!!.Anchor.Offset, "Read-only time lost selection")
            SendKey(id, SDLScancode.Up)
            SelectorType(window, id, "15")
            SendKey(id, SDLScancode.Return)
            PumpFrames(window, 5)
            Require(host.Changes == changes && host.Value == TimeOnly(12, 45), "Read-only time accepted edits")
            host.ReadOnly = false
            host.Disabled = true
            host.Rebuild()
            PumpFrames(window, 5)
            let disabled = FindSemantics(semantics.Tree?.Root, "Meeting hour")!!
            Require(FindSemantics(semantics.Tree?.Root, "Meeting")!!.Disabled, "Disabled time group omitted its semantic state")
            Require(!window.PerformAccessibilityAction(disabled.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Disabled time accepted focus")
            host.Disabled = false
            host.Rebuild()
            PumpFrames(window, 5)
            let clear = FindSemantics(semantics.Tree?.Root, "Meeting Clear")!!
            MouseMove(id, float32(clear.Bounds.X + clear.Bounds.Width / 2), float32(clear.Bounds.Y + clear.Bounds.Height / 2))
            MouseButton(id, float32(clear.Bounds.X + clear.Bounds.Width / 2), float32(clear.Bounds.Y + clear.Bounds.Height / 2), true)
            MouseButton(id, float32(clear.Bounds.X + clear.Bounds.Width / 2), float32(clear.Bounds.Y + clear.Bounds.Height / 2), false)
            PumpFrames(window, 5)
            Require(host.Value == nil && FindSemantics(semantics.Tree?.Root, "Meeting hour")!!.Value == "--", "Time clear did not emit nil or empty segments")
            let empty = FindSemantics(semantics.Tree?.Root, "Meeting minute")!!
            window.PerformAccessibilityAction(empty.Id, AccessibilityActionRequest(AccessibilityAction.Focus))
            SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
            SelectorType(window, id, "0")
            SendKey(id, SDLScancode.Return)
            PumpFrames(window, 5)
            Require(host.Value == TimeOnly.MinValue, "Empty time did not accept a zero-valued segment")
        }
        host.Value = TimeOnly(14, 30)
        host.Rebuild()
        window.UiScale = 1.5F
        for width in []int32{480, 1100, 2560} {
            window.Width = width
            window.Height = width == 2560 ? 1440: 300
            PumpFrames(window, 8)
            for name in []string{"Meeting hour", "Meeting minute", "Meeting period", "Meeting Clear"} {
                let box = FindSemantics(semantics.Tree?.Root, name)!!.Bounds
                Require(box.Width > 0 && box.X >= 0 && box.X + box.Width <= float64(width) / 1.5 + 1, "TimePicker segment did not fit at 150 percent scale")
            }
            CaptureIssueProof(window, "time-picker-150-" + width.ToString())
        }
        Console.WriteLine("PASS: TimePicker culture 12/24 hour segment spin minute increment clear controlled read-only disabled accessibility light dark high-contrast")
    })
}
