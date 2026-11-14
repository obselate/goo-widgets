package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Globalization

/// Controlled time selector with independently editable hour, minute and period segments.
public data struct TimePickerInput {
    /// Selected local time. Nil displays empty segments. Edits have minute precision.
    var Value TimeOnly?
    /// Receives the requested time. Clearing emits nil. Nil ignores requests.
    var OnChange Action[TimeOnly?]?
    /// Culture for the clock format and period names. Nil uses the nearest theme locale.
    var Culture CultureInfo?
    /// Minute step from 1 through 59. Nil uses 1. Selection uses multiples of this step.
    var MinuteIncrement int32?
    /// Nil permits clearing. False removes the clear action.
    var AllowEmpty bool?
    /// Rejects input and removes the segments from Tab traversal.
    var Disabled bool
    /// Prevents edits while retaining segment focus, selection and copy.
    var ReadOnly bool
    /// Accessible group name. Nil uses the localized Time label.
    var AccessibilityName string?
    /// Root width. Nil uses 320 logical pixels.
    var Width Length?
    /// Optional base style applied after the theme layout.
    var RootStyle Style?
}

/// Inline time selector using the standard numeric editor and shared interaction paint.
public open class TimePicker : Cell[TimePickerInput] {
    private var current TimePickerInput
    private var culture CultureInfo = CultureInfo.InvariantCulture
    private var twelveHour bool
    private var increment int32
    private var requested bool

    protected override func Build(input TimePickerInput) Blob {
        let theme = Theme.Read()
        current = input
        requested = false
        culture = input.Culture ?? theme.Locale
        increment = input.MinuteIncrement ?? 1
        if increment < 1 || increment > 59 {
            throw ArgumentOutOfRangeException("MinuteIncrement")
        }
        let pattern = culture.DateTimeFormat.ShortTimePattern
        twelveHour = pattern.Contains("h")
        let value = input.Value ?? TimeOnly.MinValue
        let hour = twelveHour ? (value.Hour % 12 == 0 ? 12: value.Hour % 12): value.Hour
        let width Length = 320.0
        let root = Container{
            Width: input.Width ?? width,
            MinWidth: 0,
            Disabled: input.Disabled,
            Direction: theme.Direction,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            BasedOn: input.RootStyle,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Group,
                Name: input.AccessibilityName ?? theme.Text("Time"),
                ReadOnly: input.ReadOnly,
                Value: input.Value == nil ? "": value.ToString("t", culture)
            }
        }
        let periodFirst = twelveHour && pattern.IndexOf("tt", StringComparison.Ordinal) >= 0
            && pattern.IndexOf("tt", StringComparison.Ordinal) < pattern.IndexOf("h", StringComparison.Ordinal)
        if periodFirst {
            root.Children.Add(Segment("period", value.Hour / 12, 0, 1, 1, PeriodFormat, PeriodParse, PeriodChange))
        }
        root.Children.Add(Segment("hour", hour, twelveHour ? 1: 0, twelveHour ? 12: 23, 1, NumberFormat, NumberParse, HourChange))
        root.Children.Add(Text{Content: culture.DateTimeFormat.TimeSeparator, Color: theme.TextColor, FontFamily: theme.FontFamily, FontSize: theme.FontSize})
        root.Children.Add(Segment("minute", value.Minute, 0, 59, increment, NumberFormat, NumberParse, MinuteChange))
        if twelveHour && !periodFirst {
            root.Children.Add(Segment("period", value.Hour / 12, 0, 1, 1, PeriodFormat, PeriodParse, PeriodChange))
        }
        if input.AllowEmpty ?? true {
            let clear = Button{
                Width: theme.ControlHeight,
                Height: theme.ControlHeight,
                Padding: 0,
                Disabled: input.Disabled || input.ReadOnly || input.Value == nil,
                Focusable: !input.Disabled && !input.ReadOnly && input.Value != nil,
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: (input.AccessibilityName ?? theme.Text("Time")) + " " + theme.Text("Clear")},
                OnClick: () -> Apply(nil),
                ControlIcons.Create(ControlIcon.Close, theme.FontSize, theme.MutedTextColor)
            }
            theme.ApplyInteraction(clear, InteractionFamily.Button)
            WidgetKeyBindings.BindOwnedActivation(clear)
            root.Children.Add(clear)
        }
        return root
    }

    private func Segment(key string, value float64, minimum float64, maximum float64, step float64, format Func[float64, string], parse Func[string, float64?], change Action[float64]) Blob -> Container{
        FlexGrow: 1,
        FlexBasis: 0,
        MinWidth: 0,
        Cell.Mount[NumberInputInput, NumberInput](key, NumberInputInput{
            Value: value,
            Minimum: minimum,
            Maximum: maximum,
            Step: step,
            Width: Percent(100),
            Disabled: current.Disabled,
            ReadOnly: current.ReadOnly,
            AccessibilityName: (current.AccessibilityName ?? Theme.Read().Text("Time")) + " " + Theme.Read().Text(key),
            Format: format,
            Parse: parse,
            OnChange: change,
            OnCommit: number -> {
                if current.Value == nil && !requested {
                    change(number)
                }
            },
            ConfigureEntry: (input, entry) -> {
                entry.OnKeyDown = event -> Spin(event, key)
                }})
    }

    private func NumberFormat(value float64) string -> current.Value == nil ? "--": value.ToString("00", culture)

    private func NumberParse(text string) float64? -> Double.TryParse(text, NumberStyles.Integer, culture, out var number) && Double.IsFinite(number) && number == Math.Truncate(number) ? number: nil

    private func PeriodFormat(value float64) string -> current.Value == nil ? "--": value < 1 ? culture.DateTimeFormat.AMDesignator: culture.DateTimeFormat.PMDesignator

    private func PeriodParse(text string) float64? {
        if String.Equals(text, culture.DateTimeFormat.AMDesignator, StringComparison.CurrentCultureIgnoreCase) {
            return 0
        }
        return String.Equals(text, culture.DateTimeFormat.PMDesignator, StringComparison.CurrentCultureIgnoreCase) ? 1.0: nil
    }

    private func HourChange(hour float64) {
        let value = current.Value ?? TimeOnly.MinValue
        Apply(TimeOnly(twelveHour ? int32(hour) % 12 + value.Hour / 12 * 12: int32(hour), value.Minute))
    }

    private func MinuteChange(minute float64) {
        let value = current.Value ?? TimeOnly.MinValue
        Apply(TimeOnly(value.Hour, int32(minute) / increment * increment))
    }

    private func PeriodChange(period float64) {
        let value = current.Value ?? TimeOnly.MinValue
        Apply(TimeOnly(value.Hour % 12 + int32(period) * 12, value.Minute))
    }

    private func Spin(event KeyEvent, segment string) {
        if current.Disabled || current.ReadOnly || event.Modifiers.Ctrl || event.Modifiers.Alt || event.Modifiers.Super {
            return
        }
        if event.Key != Key.Up && event.Key != Key.Down {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        let direction = event.Key == Key.Up ? 1: -1
        let value = current.Value ?? TimeOnly.MinValue
        if segment == "hour" {
            Apply(TimeOnly((value.Hour + direction + 24) % 24, value.Minute))
        } else if segment == "minute" {
            let count = (59 / increment) + 1
            Apply(TimeOnly(value.Hour, ((value.Minute / increment + direction + count) % count) * increment))
        } else {
            Apply(TimeOnly((value.Hour + 12) % 24, value.Minute))
        }
    }

    private func Apply(value TimeOnly?) {
        if !current.Disabled && !current.ReadOnly && value != current.Value {
            requested = true
            InvokeInputCallback(current.OnChange, value)
        }
    }
}
