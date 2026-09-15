package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class CalendarProbe : Calendar {
    internal func Render(input CalendarInput) Blob -> base.Build(input)
}

internal class DatePickerProbe : DatePicker {
    internal func Render(input DatePickerInput) Blob -> base.Build(input)
}

func CalendarContracts() {
    using let calendar = CalendarProbe()
    var rejected bool
    try {
        calendar.Render(CalendarInput{Minimum: DateOnly(2024, 3, 1), Maximum: DateOnly(2024, 2, 29)})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Calendar accepted inverted date bounds")
    rejected = false
    try {
        calendar.Render(CalendarInput{DayHeight: Double.NaN})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Calendar accepted a nonfinite day height")
    for date in[]DateOnly{DateOnly.MinValue, DateOnly.MaxValue, DateOnly(2024, 2, 29)} {
        let root = calendar.Render(
            CalendarInput{Value: date, Today: date, Culture: System.Globalization.CultureInfo.InvariantCulture}
        )
        Require(root.Accessibility?.Role == AccessibilityRole.Group, "Boundary calendar failed to build")
    }
    using let picker = DatePickerProbe()
    rejected = false
    try {
        picker.Render(DatePickerInput{Width: 30.0})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "DatePicker accepted an unusable field width")
    let root = (
        picker.Render(DatePickerInput{Value: DateOnly(2024, 2, 29), Minimum: DateOnly(2024, 3, 1)}) as Container
    )!!
    let field = (root.Children[0] as Container)!!
    Require(
        field.Children[0].Accessibility?.Invalid == true,
        "Out-of-range controlled date did not expose invalid state"
    )
}

internal class CalendarHost : Cell {
    internal let Overlay ElementHandle = ElementHandle()
    internal let CalendarHandle ElementHandle = ElementHandle()
    internal let OpenButton ElementHandle = ElementHandle()
    internal let Before ElementHandle = ElementHandle()
    internal let Days Dictionary[int32, Button] = Dictionary[int32, Button]()
    internal let PickerDays Dictionary[int32, Button] = Dictionary[int32, Button]()
    internal let Navigation Dictionary[int32, Button] = Dictionary[int32, Button]()
    internal var Selected DateOnly = DateOnly(2024, 2, 28)
    internal var PickerValue DateOnly? = DateOnly(2026, 9, 14)
    internal var MonthChanges int32
    internal var SelectionChanges int32
    internal var DateChanges int32
    internal var InvalidSubmissions int32
    internal var IsOpen bool
    internal var Limits bool
    internal var Sunday bool
    internal var EmptyAllowed bool = true
    internal var Iso bool
    internal var PickerDisabled bool
    internal var Show bool = true
    internal var Entry TextEntry?
    internal var Popup Container?
    private func Weekend(value DateOnly) bool -> value.DayOfWeek == DayOfWeek.Saturday ||
        value.DayOfWeek == DayOfWeek.Sunday

    private func Select(value DateOnly) {
        Selected = value
        SelectionChanges++
        Rebuild()
    }

    private func Month(value DateOnly) {
        Require(value.Day == 1, "Month callback did not normalize its date")
        MonthChanges++
    }

    private func Changed(value DateOnly?) {
        PickerValue = value
        DateChanges++
        Rebuild()
    }

    private func Open(value bool) {
        IsOpen = value
        Rebuild()
    }

    private func Invalid(value string) {
        InvalidSubmissions++
    }

    private func Day(input CalendarInput, day CalendarDay, prepared Button) Button {
        Days[day.Date.DayNumber] = prepared
        return prepared
    }

    private func PickerDay(input CalendarInput, day CalendarDay, prepared Button) Button {
        PickerDays[day.Date.DayNumber] = prepared
        return prepared
    }

    private func Nav(input CalendarInput, delta int32, prepared Button) Button {
        Navigation[delta] = prepared
        return prepared
    }

    private func Input(input DatePickerInput, prepared TextEntry) TextEntry {
        Entry = prepared
        return prepared
    }

    private func Button(input DatePickerInput, prepared Button) Button {
        prepared.Handle = OpenButton
        return prepared
    }

    private func PopupFactory(input DatePickerInput, prepared Container) Container {
        Popup = prepared
        return prepared
    }

    private func CalendarFactory(input DatePickerInput, prepared CalendarInput) CalendarInput -> prepared with{
        CreateDay = PickerDay
    }

    private func Format(value DateOnly) string -> value.ToString(
        "yyyy-MM-dd",
        System.Globalization.CultureInfo.InvariantCulture
    )

    private func Parse(value string) DateOnly? {
        if DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None,
            out var date
        ) {
            return date
        }
        return nil
    }

    public override func Build() Blob {
        var calendar = CalendarInput{
            Value: Selected,
            OnChange: Select,
            Today: DateOnly(2024, 2, 29),
            Handle: CalendarHandle,
            FirstDayOfWeek: Sunday ? DayOfWeek.Sunday: DayOfWeek.Monday,
            Culture: System.Globalization.CultureInfo.GetCultureInfo("fr-FR"),
            CreateDay: Day,
            CreateNavigation: Nav,
            OnMonthChange: Month,
            IsDateDisabled: Weekend
        }
        if Limits {
            calendar.Minimum = DateOnly(2024, 2, 10)
            calendar.Maximum = DateOnly(2024, 2, 29)
        }
        var picker = DatePickerInput{
            OverlayHost: Overlay,
            OnChange: Changed,
            OnInvalid: Invalid,
            Width: 300.0,
            Open: IsOpen,
            OnOpenChange: Open,
            AllowEmpty: EmptyAllowed,
            Disabled: PickerDisabled,
            Today: DateOnly(2026, 9, 14),
            Minimum: DateOnly(2026, 9, 1),
            Maximum: DateOnly(2026, 9, 30),
            IsDateDisabled: Weekend,
            Culture: System.Globalization.CultureInfo.GetCultureInfo("en-US"),
            FirstDayOfWeek: DayOfWeek.Monday,
            AccessibilityName: "Deployment date",
            CreateInput: Input,
            CreateButton: Button,
            CreateCalendar: CalendarFactory,
            CreatePopup: PopupFactory
        }
        if PickerValue != nil {
            picker.Value = PickerValue!!
        }
        if Iso {
            picker.Format = Format
            picker.Parse = Parse
        }
        let row = Container{
            Key: "controls",
            FlexDirection: FlexDirection.Row,
            Gap: 50.0,
            Cell.Mount[CalendarInput, Calendar]("calendar", calendar)
        }
        if Show {
            row.Children.Add(Cell.Mount[DatePickerInput, DatePicker]("picker", picker))
        }
        return Container{
            Handle: Overlay,
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 24.0,
            Gap: 18.0,
            BackgroundColor: "#111318",
            Color: "#fafafa",
            Text{Key: "title", Content: "Calendar and DatePicker", FontSize: 25.0, FontWeight: 700},
            Text{
                Key: "hint",
                Content: "Localized dates, bounded navigation, and controlled text validation.",
                Color: "#a1a1aa"
            },
            Goo
                .Button{
                Key: "before",
                Handle: Before,
                Width: 150.0,
                Height: 34.0,
                BackgroundColor: "#27272a",
                Text{Content: "Background action"}
            },
            row
        }
    }
}

func CalendarFocused(adapter SearchListSemantics, date DateOnly, culture string) bool ->
OverlayFocus(adapter, date.ToString("D", System.Globalization.CultureInfo.GetCultureInfo(culture)))

func SelectorKey(id uint32, key SDLScancode, modifiers SDLKeymod) {
    var down = SDLEvent{
        Key: SDLKeyboardEvent{
            Type: SDLEventType.KeyDown,
            WindowID: id,
            Scancode: key,
            Mod: uint16(modifiers),
            Down: uint8(1)
        }
    }
    var up = SDLEvent{
        Key: SDLKeyboardEvent{Type: SDLEventType.KeyUp, WindowID: id, Scancode: key, Mod: uint16(modifiers)}
    }
    Require(SDL.PushEvent(ref down) && SDL.PushEvent(ref up), "SDL rejected modified keys")
}

func PickerDraft(window Window, id uint32, host CalendarHost, value string) {
    Require(host.Entry!!.Handle!!.Focus(), "Date field did not accept focus")
    SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
    PumpFrames(window, 3)
    if value.Length == 0 {
        SendKey(id, SDLScancode.Backspace)
        PumpFrames(window, 4)
    } else {
        SelectorType(window, id, value)
    }
}

func CalendarInteractions() {
    CalendarContracts()
    let host = CalendarHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Calendar verification",
        Width: 850,
        Height: 620,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 15)
        let id = OnlyNativeWindow()
        host.CalendarHandle.Focus()
        PumpFrames(window, 6)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 2, 28), "fr-FR"),
            "Calendar root did not enter the selected date"
        )
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 7)
        Require(CalendarFocused(semantics, DateOnly(2024, 2, 29), "fr-FR"), "Calendar skipped the leap day")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.Selected == DateOnly(2024, 2, 29) && host.SelectionChanges == 1,
            "Calendar Enter did not select leap day"
        )
        CaptureIssueProof(window, "calendar-leap-day")
        host.Sunday = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 2, 29), "fr-FR"),
            "Changing the first weekday lost date focus"
        )
        host.Sunday = false
        host.Rebuild()
        PumpFrames(window, 8)
        SendKey(id, SDLScancode.Pagedown)
        PumpFrames(window, 10)
        Require(CalendarFocused(semantics, DateOnly(2024, 3, 29), "fr-FR"), "Calendar PageDown lost its day of month")
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 10)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 4, 1), "fr-FR") && host.SelectionChanges == 1,
            "Calendar did not skip a disabled weekend across months without selecting"
        )
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 10)
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 7)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 3, 25), "fr-FR"),
            "Calendar Home ignored Monday as the first weekday"
        )
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 7)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 3, 29), "fr-FR"),
            "Calendar End did not skip disabled weekend dates"
        )
        SendKey(id, SDLScancode.Pageup)
        PumpFrames(window, 10)
        SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Shift)
        PumpFrames(window, 10)
        Require(
            CalendarFocused(semantics, DateOnly(2025, 2, 28), "fr-FR"),
            "Calendar year navigation failed leap-day clamping"
        )
        host.Limits = true
        host.Rebuild()
        PumpFrames(window, 9)
        Require(
            host.Navigation[-1].Disabled && host.Navigation[1].Disabled,
            "Calendar month controls ignored date bounds"
        )
        host.CalendarHandle.Focus()
        PumpFrames(window, 5)
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 7)
        Require(
            CalendarFocused(semantics, DateOnly(2024, 2, 29), "fr-FR"),
            "Calendar keyboard escaped its maximum date"
        )
        Require(
            !host.Days[DateOnly(2024, 2, 24).DayNumber].Handle!!.Focus(),
            "Disabled calendar day remained focusable"
        )
        CompositeClick(window, host.OpenButton)
        PumpFrames(window, 18)
        Require(
            host.IsOpen && CalendarFocused(semantics, DateOnly(2026, 9, 14), "en-US"),
            "DatePicker popup failed initial date focus"
        )
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 7)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 11)
        Require(
            host.PickerValue == DateOnly(2026, 9, 15) &&
                !host.IsOpen &&
                OverlayFocus(semantics, "Deployment date calendar"),
            "DatePicker date activation failed commit/dismiss/restore"
        )
        PickerDraft(window, id, host, "not a date")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 9)
        Require(
            host.PickerValue == DateOnly(2026, 9, 15) &&
                host.InvalidSubmissions > 0 &&
                FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Invalid == true,
            "Invalid draft changed the committed date or lost invalid semantics"
        )
        CaptureIssueProof(window, "date-picker-invalid")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Value == "9/15/2026"
            && FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Invalid == false,
            "Escape failed to revert the displayed draft"
        )
        PickerDraft(window, id, host, "")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(host.PickerValue == nil, "Optional empty input did not clear the date")
        host.EmptyAllowed = false
        host.PickerValue = DateOnly(2026, 9, 15)
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Value == "9/15/2026",
            "External date did not replace the focused buffer"
        )
        PickerDraft(window, id, host, "")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.PickerValue == DateOnly(2026, 9, 15) &&
                FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Invalid == true,
            "Required empty input cleared the committed date"
        )
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 6)
        host.Iso = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Value == "2026-09-15",
            "Changed formatter did not refresh the displayed field"
        )
        PickerDraft(window, id, host, "2026-09-18")
        host.Before.Focus()
        PumpFrames(window, 10)
        Require(host.PickerValue == DateOnly(2026, 9, 18), "Custom parser did not commit on blur")
        PickerDraft(window, id, host, "2026-09-19")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(
            host.PickerValue == DateOnly(2026, 9, 18) &&
                FindSemantics(semantics.Tree?.Root, "Deployment date")!!.Invalid == true,
            "Typed input bypassed the disabled-date predicate"
        )
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 5)
        SelectorKey(id, SDLScancode.Down, SDLKeymod.Alt)
        PumpFrames(window, 14)
        Require(
            host.IsOpen && CalendarFocused(semantics, DateOnly(2026, 9, 18), "en-US"),
            "Alt+Down failed to open at the committed date"
        )
        CaptureIssueProof(window, "date-picker-calendar")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 9)
        Require(
            !host.IsOpen && OverlayFocus(semantics, "Deployment date"),
            "Calendar Escape did not restore entry focus"
        )
        host.PickerDisabled = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            !host.Entry!!.Handle!!.Focus() && !host.OpenButton.Focus(),
            "Disabled date field or trigger accepted focus"
        )
        host.PickerDisabled = false
        host.Rebuild()
        PumpFrames(window, 6)
        CompositeClick(window, host.OpenButton)
        PumpFrames(window, 13)
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(host.Before.Focus(), "Removing DatePicker left focus trapped")
        Require(host.MonthChanges >= 4, "Calendar did not report visible-month changes")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: native Calendar leap/year/bounds/locale/disabled navigation and DatePicker commit/cancel/empty/invalid/parser/formatter/blur/focus/unmount"
    )
}
