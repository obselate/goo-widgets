package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Globalization

/// Controlled star rating and its interaction settings.
public data struct RatingControlInput {
    /// Finite rating. Presentation clamps the value from zero through Maximum.
    var Value float64
    /// Receives the requested rating after pointer, keyboard or accessibility input. Nil ignores requests.
    var OnChange Action[float64]?
    /// Positive number of stars. Nil uses 5.
    var Maximum int32?
    /// Rating increment, either 1 or 0.5. Nil uses 1.
    var Step float64?
    /// Prevents changes and hover preview while retaining keyboard focus.
    var ReadOnly bool
    /// Rejects input and removes the control from Tab traversal.
    var Disabled bool
    /// Accessible name. Nil uses the localized Rating label.
    var AccessibilityName string?
    /// Formats the accessible rating text. Nil uses the localized value and maximum.
    /// Hosts must not change state in this callback.
    var FormatValue Func[float64, string]?
    /// Root width. Nil uses one theme control height per star.
    var Width Length?
    /// Optional base style applied after the theme layout.
    var RootStyle Style?
}

/// Star rating with half-step selection and a noncommitting pointer preview.
public open class RatingControl : Cell[RatingControlInput] {
    shared {
        private let starPath VectorPath = PathBuilder()
            .MoveTo(0.5, 0.083).LineTo(0.617, 0.359).LineTo(0.917, 0.385)
            .LineTo(0.69, 0.582).LineTo(0.757, 0.875).LineTo(0.5, 0.72)
            .LineTo(0.243, 0.875).LineTo(0.31, 0.582).LineTo(0.083, 0.385)
            .LineTo(0.383, 0.359).Close().Build()
    }

    private var current RatingControlInput
    private var maximum int32
    private var step float64
    private var value float64
    private var preview float64?
    private var rightToLeft bool
    private var pointer int64 = -1L
    private let handle ElementHandle = ElementHandle()

    protected override func Build(input RatingControlInput) Blob {
        let theme = Theme.Read()
        current = input
        maximum = input.Maximum ?? 5
        step = input.Step ?? 1
        if maximum < 1 || !Double.IsFinite(input.Value) || (step != 1 && step != 0.5) {
            throw ArgumentOutOfRangeException("RatingControl value, maximum or step")
        }
        value = Math.Clamp(input.Value, 0, float64(maximum))
        rightToLeft = theme.RightToLeft
        if input.Disabled || input.ReadOnly {
            preview = nil
        }
        let width Length = float64(maximum) * theme.ControlHeight
        let root = Container{
            Handle: handle,
            Width: input.Width ?? width,
            MinWidth: 0,
            Height: theme.ControlHeight,
            Direction: theme.Direction,
            FlexDirection: FlexDirection.Row,
            Disabled: input.Disabled,
            Focusable: !input.Disabled,
            Cursor: input.Disabled || input.ReadOnly ? Cursor.Default: Cursor.Pointer,
            BasedOn: input.RootStyle,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Slider,
                Name: input.AccessibilityName ?? theme.Text("Rating"),
                ReadOnly: input.ReadOnly,
                Orientation: AccessibilityOrientation.Horizontal,
                Range: AccessibilityValue{
                    Minimum: 0,
                    Maximum: maximum,
                    Now: value,
                    Text: input.FormatValue?.Invoke(value) ?? theme.Text("{0} of {1}", value.ToString("G", theme.Locale), maximum)
                },
                Actions: input.Disabled || input.ReadOnly ? []AccessibilityAction{}: []AccessibilityAction{AccessibilityAction.SetValue, AccessibilityAction.Increment, AccessibilityAction.Decrement},
                OnAction: input.Disabled || input.ReadOnly ? nil: (request AccessibilityActionRequest) -> AccessibleAction(request)
            },
            OnKeyDown: KeyDown,
            OnPointerDown: PointerDown,
            OnPointerMove: PointerMove,
            OnPointerUp: PointerUp,
            OnPointerCancel: PointerCancel,
            OnPointerLeave: event -> SetPreview(nil)
        }
        theme.ApplyInteraction(root, InteractionFamily.Field)
        let displayed = preview ?? value
        let size = theme.ControlHeight * 0.75
        for index in 0 ... maximum {
            let fraction = Math.Clamp(displayed - float64(index), 0, 1)
            let glyph = Container{
                Position: PositionType.Relative,
                Width: size,
                Height: size,
                HitTestSelf: false,
                Star(theme.MutedTextColor, size)
            }
            if fraction > 0 {
                glyph.Children.Add(Container{
                    Position: PositionType.Absolute,
                    Start: 0,
                    Top: 0,
                    Bottom: 0,
                    Width: Percent(fraction * 100),
                    Overflow: Overflow.Hidden,
                    HitTestSelf: false,
                    Container{
                        Width: size,
                        Height: size,
                        FlexShrink: 0,
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.Center,
                        HitTestSelf: false,
                        Star(theme.AccentColor, size)
                    }
                })
            }
            root.Children.Add(Container{
                FlexGrow: 1,
                FlexBasis: 0,
                MinWidth: 0,
                Height: Percent(100),
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                HitTestSelf: false,
                Accessibility: Accessibility{Hidden: true},
                glyph
            })
        }
        return root
    }

    private func Star(color Color, size float64) Shape -> Shape{
        Path: starPath,
        Width: size,
        Height: size,
        Fit: ShapeFit.Contain,
        BackgroundColor: color,
        Accessibility: Accessibility{Hidden: true}
    }

    private func Change(next float64) {
        if current.Disabled || current.ReadOnly {
            return
        }
        let selected = Math.Clamp(next, 0, float64(maximum))
        if selected != value {
            InvokeInputCallback(current.OnChange, selected)
        }
    }

    private func SetPreview(next float64?) {
        if preview != next {
            preview = next
            Rebuild()
        }
    }

    private func PointerValue(event PointerEvent) float64 {
        let box = handle.BorderBox
        if box.Width <= 0 {
            return value
        }
        let fraction = Math.Clamp((event.WindowPosition.X - box.X) / box.Width, 0, 1)
        return Math.Clamp(Math.Ceiling((rightToLeft ? 1 - fraction: fraction) * maximum / step) * step, 0, float64(maximum))
    }

    private func PointerMove(event PointerEvent) {
        if !current.Disabled && !current.ReadOnly {
            SetPreview(PointerValue(event))
        }
    }

    private func PointerDown(event PointerEvent) {
        if current.Disabled || current.ReadOnly || event.Button != PointerButton.Primary || pointer != -1L {
            return
        }
        pointer = event.PointerId
        event.Capture()
        SetPreview(PointerValue(event))
    }

    private func PointerUp(event PointerEvent) {
        if event.PointerId != pointer || event.Button != PointerButton.Primary {
            return
        }
        pointer = -1L
        event.ReleaseCapture()
        SetPreview(nil)
        Change(PointerValue(event))
    }

    private func PointerCancel(event PointerEvent) {
        if event.PointerId == pointer {
            pointer = -1L
            event.ReleaseCapture()
        }
        SetPreview(nil)
    }

    private func KeyDown(event KeyEvent) {
        if current.Disabled || current.ReadOnly || event.Modifiers.Ctrl || event.Modifiers.Alt || event.Modifiers.Super {
            return
        }
        var next = value
        if event.Key == Key.Home {
            next = 0
        } else if event.Key == Key.End {
            next = maximum
        } else if event.Key == Key.Up || event.Key == (rightToLeft ? Key.Left: Key.Right) {
            next += step
        } else if event.Key == Key.Down || event.Key == (rightToLeft ? Key.Right: Key.Left) {
            next -= step
        } else {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        SetPreview(nil)
        Change(next)
    }

    private func AccessibleAction(request AccessibilityActionRequest) bool {
        if current.Disabled || current.ReadOnly {
            return false
        }
        if request.Action == AccessibilityAction.Increment {
            Change(value + step)
        } else if request.Action == AccessibilityAction.Decrement {
            Change(value - step)
        } else if request.Action == AccessibilityAction.SetValue && Double.TryParse(request.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) && Double.IsFinite(number) {
            Change(number)
        } else {
            return false
        }
        return true
    }
}
