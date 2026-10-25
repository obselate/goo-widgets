package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Globalization

/// Selects slider layout and pointer direction.
public enum SliderOrientation {
    Horizontal;
    Vertical
}

/// Immutable input for a mounted Slider.
public data struct SliderInput {
    /// Current external value.
    var Value float64
    /// Inclusive minimum. Nil resolves to 0.0.
    var Minimum float64?
    /// Inclusive maximum. Nil resolves to 1.0.
    var Maximum float64?
    /// Keyboard and accessibility increment. Nil resolves to one percent of the range.
    var Step float64?
    /// Slider orientation.
    var Orientation SliderOrientation
    /// Accessible slider name. Nil uses Label, then Slider.
    var AccessibilityName string?
    /// Optional visible label. Also supplies the default accessible name.
    var Label string?
    /// Displays the current formatted value beside the label.
    var ShowValue bool
    /// Label color. Nil uses the nearest theme.
    var LabelColor Color?
    /// Displayed value color. Nil uses the nearest theme.
    var ValueColor Color?
    /// Visible label font size. Zero uses the nearest theme label font size.
    var LabelFontSize float64
    /// Displayed value font size. Zero uses the nearest theme caption font size.
    var ValueFontSize float64
    /// Formats the accessible range value and optional visible value.
    var FormatValue Func[float64, string]?
    /// Receives pointer and keyboard preview values.
    var OnValueChanged Action[float64]?
    /// Receives the final value after pointer, keyboard, or accessibility input.
    var OnValueCommitted Action[float64]?
    /// Whether the slider rejects input.
    var Disabled bool
    /// Horizontal slider width. Nil resolves to 100 percent.
    var Width Length?
    /// Slider height. Zero uses the nearest theme control height horizontally or 160.0 vertically.
    var Height float64
    /// Track thickness. Zero uses the nearest theme spacing.
    var TrackThickness float64
    /// Thumb diameter. Zero uses the nearest theme spacing.
    var ThumbSize float64
    /// Thumb corner radius. Nil resolves to half the thumb size.
    var ThumbRadius float64?
    /// Thumb border width. Nil uses the nearest theme border width and preserves explicit zero.
    var ThumbBorderWidth float64?
    /// Track corner radius. Nil resolves to half the track thickness.
    var TrackRadius float64?
    /// Unfilled track color. Nil uses the nearest theme.
    var TrackColor Color?
    /// Filled track color. Nil uses the nearest theme.
    var FillColor Color?
    /// Thumb color. Nil uses the nearest theme.
    var ThumbColor Color?
    /// Thumb border color. Nil uses the nearest theme.
    var ThumbBorderColor Color?
    /// Panel background color. Nil resolves to the theme panel color.
    var BackgroundColor Color?
    /// Focus outline color. Nil uses the nearest theme.
    var FocusOutlineColor Color?
    /// Disabled opacity. Nil resolves to 0.4.
    var DisabledOpacity float64?
    /// Optional base style for the interactive root.
    var RootStyle Style?
    /// Optional base style for the unfilled track.
    var TrackStyle Style?
    /// Optional base style for the filled track.
    var FillStyle Style?
    /// Optional base style for the thumb.
    var ThumbStyle Style?
    /// Wraps the composed interactive root. The returned tree must retain the supplied root to preserve interaction.
    var CreateRoot Func[SliderInput, Container, Blob]?
}

/// A controlled range input with pointer capture, keyboard input, and accessible value actions.
public open class Slider : Cell[SliderInput] {
    private let handle ElementHandle = ElementHandle{}
    private var current float64
    private var dragging bool
    private var pointerId int64 = -1L
    private var rightToLeft bool
    private var resolved SliderInput

    protected override func Build(input SliderInput) Blob {
        let createRoot = input.CreateRoot
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        resolved = Resolve(input, theme)
        if resolved.Disabled && dragging {
            dragging = false
            pointerId = -1L
        }
        current = Quantize(input.Value)
        resolved.Value = current
        resolved.CreateRoot = nil
        let fraction = (current - resolved.Minimum!!) / (resolved.Maximum!!- resolved.Minimum!!)
        let horizontal = resolved.Orientation == SliderOrientation.Horizontal
        let hasHeader = resolved.Label != nil || resolved.ShowValue
        let formattedValue = Format(current)
        let track = Container{
            Position: PositionType.Absolute,
            Start: if horizontal {
                0.0
            } else {
                (resolved.ThumbSize - resolved.TrackThickness) / 2.0
            },
            Top: if horizontal {
                (resolved.Height - resolved.TrackThickness) / 2.0
            } else {
                0.0
            },
            Width: if horizontal {
                Percent(100.0)
            } else {
                resolved.TrackThickness
            },
            Height: if horizontal {
                resolved.TrackThickness
            } else {
                Percent(100.0)
            },
            BorderRadius: resolved.TrackRadius!!,
            BackgroundColor: resolved.TrackColor!!,
            BasedOn: resolved.TrackStyle,
            HitTestSelf: false,
        }
        let fill = Container{
            Position: PositionType.Absolute,
            Start: if horizontal {
                0.0
            } else {
                (resolved.ThumbSize - resolved.TrackThickness) / 2.0
            },
            Top: if horizontal {
                (resolved.Height - resolved.TrackThickness) / 2.0
            } else {
                Percent((1.0 - fraction) * 100.0)
            },
            Width: if horizontal {
                Percent(fraction * 100.0)
            } else {
                resolved.TrackThickness
            },
            Height: if horizontal {
                resolved.TrackThickness
            } else {
                Percent(fraction * 100.0)
            },
            BorderRadius: resolved.TrackRadius!!,
            BackgroundColor: resolved.FillColor!!,
            BasedOn: resolved.FillStyle,
            HitTestSelf: false,
        }
        let thumb = Container{
            Position: PositionType.Absolute,
            Start: if horizontal {
                Percent(fraction * 100.0)
            } else {
                0.0
            },
            Top: if horizontal {
                (resolved.Height - resolved.ThumbSize) / 2.0
            } else {
                Percent((1.0 - fraction) * 100.0)
            },
            Margin: Edges{Top: horizontal ? 0.0: -resolved.ThumbSize / 2.0},
            MarginStart: horizontal ? -resolved.ThumbSize / 2.0: 0.0,
            Width: resolved.ThumbSize,
            Height: resolved.ThumbSize,
            BorderRadius: resolved.ThumbRadius!!,
            BorderWidth: resolved.ThumbBorderWidth!!,
            BorderColor: resolved.ThumbBorderColor!!,
            BackgroundColor: resolved.ThumbColor!!,
            BasedOn: resolved.ThumbStyle,
            HitTestSelf: false,
        }
        var accessibility Accessibility? = nil
        if resolved.Disabled {
            accessibility = Accessibility{
                Role: AccessibilityRole.Slider,
                Name: resolved.AccessibilityName!!,
                Orientation: if horizontal {
                    AccessibilityOrientation.Horizontal
                } else {
                    AccessibilityOrientation.Vertical
                },
                ReadOnly: true,
                Range: AccessibilityValue{
                    Minimum: resolved.Minimum!!,
                    Maximum: resolved.Maximum!!,
                    Now: current,
                    Text: formattedValue,
                },
            }
        } else {
            accessibility = Accessibility{
                Role: AccessibilityRole.Slider,
                Name: resolved.AccessibilityName!!,
                Orientation: if horizontal {
                    AccessibilityOrientation.Horizontal
                } else {
                    AccessibilityOrientation.Vertical
                },
                ReadOnly: false,
                Actions: []AccessibilityAction{
                    AccessibilityAction.SetValue,
                    AccessibilityAction.Increment,
                    AccessibilityAction.Decrement,
                },
                OnAction: (request AccessibilityActionRequest) -> AccessibilityAction(request),
                Range: AccessibilityValue{
                    Minimum: resolved.Minimum!!,
                    Maximum: resolved.Maximum!!,
                    Now: current,
                    Text: formattedValue,
                },
            }
        }
        let root = Container{
            Handle: handle,
            Direction: theme.Direction,
            BackgroundColor: resolved.BackgroundColor!!,
            Width: if horizontal {
                if hasHeader {
                    Percent(100.0)
                } else {
                    resolved.Width!!
                }
            } else {
                resolved.ThumbSize
            },
            Height: resolved.Height,
            FlexShrink: 0.0,
            Position: PositionType.Relative,
            Cursor: if horizontal {
                Cursor.ResizeHorizontal
            } else {
                Cursor.ResizeVertical
            },
            Disabled: resolved.Disabled,
            Focusable: !resolved.Disabled,
            HitTestSelf: !resolved.Disabled,
            Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
            Focus: Style{OutlineWidth: 2.0, OutlineColor: resolved.FocusOutlineColor!!, OutlineOffset: 2.0},
            BasedOn: resolved.RootStyle,
            Accessibility: accessibility,
            OnPointerDown: (e PointerEvent) -> BeginPointer(e),
            OnPointerMove: (e PointerEvent) -> MovePointer(e),
            OnPointerUp: (e PointerEvent) -> EndPointer(e),
            OnPointerCancel: (e PointerEvent) -> EndPointer(e, false),
            KeyBindings: []KeyBinding{
                KeyBinding{Key: Key.Home, Action: () -> KeyAction(Key.Home)},
                KeyBinding{Key: Key.End, Action: () -> KeyAction(Key.End)},
                KeyBinding{Key: Key.Left, Repeat: true, Action: () -> KeyAction(Key.Left)},
                KeyBinding{Key: Key.Right, Repeat: true, Action: () -> KeyAction(Key.Right)},
                KeyBinding{Key: Key.Up, Repeat: true, Action: () -> KeyAction(Key.Up)},
                KeyBinding{Key: Key.Down, Repeat: true, Action: () -> KeyAction(Key.Down)},
            },
            track,
            fill,
            thumb,
        }
        let content Blob = if let createRoot = createRoot {
            createRoot(resolved, root)
        } else {
            root
        }
        if !hasHeader {
            return content
        }
        let header = Container{
            Key: "slider-header",
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
        }
        if let label = resolved.Label {
            header.Children.Add(
                Text{
                    Key: "slider-label",
                    Content: label,
                    FontSize: resolved.LabelFontSize,
                    FontWeight: theme.LabelFontWeight,
                    Color: resolved.LabelColor!!,
                    FlexGrow: 1.0,
                }
            )
        }
        if resolved.ShowValue {
            header.Children.Add(
                Text{
                    Key: "slider-value",
                    Content: formattedValue,
                    FontSize: resolved.ValueFontSize,
                    FontWeight: theme.CaptionFontWeight,
                    Color: resolved.ValueColor!!,
                }
            )
        }
        content.Key ??= "slider-control"
        return Container{
            Direction: theme.Direction,
            LineHeight: theme.LineHeight,
            FontFamily: theme.FontFamily,
            FontWeight: theme.FontWeight,
            Width: if horizontal {
                resolved.Width!!
            } else {
                Length.Auto
            },
            AlignItems: if horizontal {
                AlignItems.Stretch
            } else {
                AlignItems.Center
            },
            Gap: theme.ControlGap,
            header,
            content,
        }
    }

    private func Resolve(input SliderInput, theme Theme) SliderInput {
        let minimum = input.Minimum ?? 0.0
        let maximum = input.Maximum ?? 1.0
        if !Double.IsFinite(minimum) {
            throw ArgumentOutOfRangeException("Minimum")
        }
        if !Double.IsFinite(maximum) || maximum <= minimum {
            throw ArgumentOutOfRangeException("Maximum")
        }
        if !Double.IsFinite(maximum - minimum) {
            throw ArgumentOutOfRangeException("Maximum")
        }
        if !Double.IsFinite(input.Value) {
            throw ArgumentOutOfRangeException("Value")
        }
        let step = input.Step ?? (maximum - minimum) / 100.0
        if !Double.IsFinite(step) || step <= 0.0 {
            throw ArgumentOutOfRangeException("Step")
        }
        let thumbSize = if input.ThumbSize == 0.0 {
            theme.Spacing * 5.0
        } else {
            input.ThumbSize
        }
        let trackThickness = if input.TrackThickness == 0.0 {
            theme.Spacing * 2.0
        } else {
            input.TrackThickness
        }
        if !Double.IsFinite(thumbSize) || thumbSize <= 0.0 {
            throw ArgumentOutOfRangeException("ThumbSize")
        }
        if !Double.IsFinite(trackThickness) || trackThickness <= 0.0 {
            throw ArgumentOutOfRangeException("TrackThickness")
        }
        return input with{
            Minimum = minimum,
            Maximum = maximum,
            Step = step,
            AccessibilityName = input.AccessibilityName ?? input.Label ?? "Slider",
            LabelColor = input.LabelColor ?? theme.TextColor,
            ValueColor = input.ValueColor ?? theme.MutedTextColor,
            Width = input.Width ?? Percent(100.0),
            Height = if input.Height == 0.0 {
                if input.Orientation == SliderOrientation.Horizontal {
                    theme.ControlHeight
                } else {
                    160.0
                }
            } else {
                input.Height
            },
            TrackThickness = trackThickness,
            LabelFontSize = if input.LabelFontSize == 0.0 {
                theme.LabelFontSize
            } else {
                input.LabelFontSize
            },
            ValueFontSize = if input.ValueFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                input.ValueFontSize
            },
            ThumbSize = thumbSize,
            ThumbRadius = input.ThumbRadius ?? thumbSize / 2.0,
            ThumbBorderWidth = input.ThumbBorderWidth ?? theme.BorderWidth,
            TrackRadius = input.TrackRadius ?? trackThickness / 2.0,
            TrackColor = input.TrackColor ?? theme.BorderColor,
            FillColor = input.FillColor ?? theme.AccentColor,
            ThumbColor = input.ThumbColor ?? theme.AccentColor,
            ThumbBorderColor = input.ThumbBorderColor ?? theme.OnAccentColor,
            BackgroundColor = input.BackgroundColor ?? theme.PanelColor,
            FocusOutlineColor = input.FocusOutlineColor ?? theme.AccentColor,
            DisabledOpacity = input.DisabledOpacity ?? 0.4,
        }
    }

    private func Quantize(value float64) float64 {
        let minimum = resolved.Minimum!!
        let maximum = resolved.Maximum!!
        let step = resolved.Step!!
        let clamped = Math.Clamp(value, minimum, maximum)
        if clamped == minimum || clamped == maximum {
            return clamped
        }
        return Math.Clamp(minimum + Math.Round((clamped - minimum) / step) * step, minimum, maximum)
    }

    private func Preview(value float64) {
        let next = Quantize(value)
        if next == current {
            return
        }
        current = next
        resolved.OnValueChanged?.Invoke(next)
    }

    private func Commit() {
        resolved.OnValueCommitted?.Invoke(current)
    }

    private func ValueFromPointer(e PointerEvent) float64 {
        let box = handle.BorderBox
        if resolved.Orientation == SliderOrientation.Horizontal {
            if box.Width <= 0.0 {
                return current
            }
            let fraction = Math.Clamp((e.WindowPosition.X - box.X) / box.Width, 0.0, 1.0)
            return resolved.Minimum!!+ (rightToLeft ? 1.0 - fraction: fraction) * (
                resolved.Maximum!!- resolved.Minimum!!
            )
        }
        if box.Height <= 0.0 {
            return current
        }
        return resolved.Minimum!!+
            (1.0 - Math.Clamp((e.WindowPosition.Y - box.Y) / box.Height, 0.0, 1.0)) * (
            resolved.Maximum!!- resolved.Minimum!!
        )
    }

    private func BeginPointer(e PointerEvent) {
        if resolved.Disabled || e.Button != PointerButton.Primary || dragging {
            return
        }
        dragging = true
        pointerId = e.PointerId
        e.Capture()
        e.PreventDefault()
        Preview(ValueFromPointer(e))
    }

    private func MovePointer(e PointerEvent) {
        if resolved.Disabled {
            return
        }
        if dragging && e.PointerId == pointerId {
            Preview(ValueFromPointer(e))
        }
    }

    private func EndPointer(e PointerEvent, commit bool = true) {
        if resolved.Disabled || !dragging || e.PointerId != pointerId {
            return
        }
        e.ReleaseCapture()
        dragging = false
        pointerId = -1L
        if commit {
            Commit()
        }
    }

    private func KeyAction(key Key) {
        if resolved.Disabled {
            return
        }
        var next = current
        if key == Key.Home {
            next = resolved.Minimum!!
        } else if key == Key.End {
            next = resolved.Maximum!!
        } else if key == Key.Up || key == (rightToLeft ? Key.Left: Key.Right) {
            next += resolved.Step!!
        } else {
            next -= resolved.Step!!
        }
        Preview(next)
        Commit()
    }

    private func AccessibilityAction(request AccessibilityActionRequest) bool {
        if resolved.Disabled {
            return false
        }
        var next = current
        if request.Action == Goo.AccessibilityAction.SetValue {
            if !Double.TryParse(request.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) ||
                !Double.IsFinite(parsed) {
                return false
            }
            next = parsed
        } else if request.Action == Goo.AccessibilityAction.Increment {
            next += resolved.Step!!
        } else if request.Action == Goo.AccessibilityAction.Decrement {
            next -= resolved.Step!!
        } else {
            return false
        }
        Preview(next)
        Commit()
        Rebuild()
        return true
    }

    private func Format(value float64) string {
        if let formatValue = resolved.FormatValue {
            return formatValue(value)
        }
        return value.ToString("G", CultureInfo.InvariantCulture)
    }
}
