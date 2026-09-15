package Goo.Widgets.Inputs

import Goo
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
    /// Label color. Nil resolves to #fafafa.
    var LabelColor Color?
    /// Displayed value color. Nil resolves to #a1a1aa.
    var ValueColor Color?
    /// Visible label font size. Zero resolves to 12.0.
    var LabelFontSize float64
    /// Displayed value font size. Zero resolves to 12.0.
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
    /// Slider height. Zero resolves to 28.0 horizontally or 160.0 vertically.
    var Height float64
    /// Track thickness. Zero resolves to 8.0.
    var TrackThickness float64
    /// Thumb diameter. Zero resolves to 20.0.
    var ThumbSize float64
    /// Thumb corner radius. Nil resolves to half the thumb size.
    var ThumbRadius float64?
    /// Thumb border width. Nil resolves to 2.0 and preserves explicit zero.
    var ThumbBorderWidth float64?
    /// Track corner radius. Nil resolves to half the track thickness.
    var TrackRadius float64?
    /// Unfilled track color. Nil resolves to #3f3f46.
    var TrackColor Color?
    /// Filled track color. Nil resolves to #fafafa.
    var FillColor Color?
    /// Thumb color. Nil resolves to #fafafa.
    var ThumbColor Color?
    /// Thumb border color. Nil resolves to #18181b.
    var ThumbBorderColor Color?
    /// Enables the visible focus outline. Disabled by default.
    var ShowFocusHighlight bool
    /// Focus outline color. Nil resolves to #a1a1aa.
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
    private var lastExternal float64
    private var initialized bool
    private var dragging bool
    private var pointerId int64 = -1L
    private var resolved SliderInput

    protected override func Build(input SliderInput) Blob {
        let createRoot = input.CreateRoot
        resolved = Resolve(input)
        if resolved.Disabled && dragging {
            dragging = false
            pointerId = -1L
        }
        if !initialized || input.Value != lastExternal {
            current = Quantize(input.Value)
            lastExternal = input.Value
            initialized = true
        } else {
            current = Quantize(current)
        }
        resolved.Value = current
        resolved.CreateRoot = nil
        let fraction = (current - resolved.Minimum!!) / (resolved.Maximum!!- resolved.Minimum!!)
        let horizontal = resolved.Orientation == SliderOrientation.Horizontal
        let hasHeader = resolved.Label != nil || resolved.ShowValue
        let formattedValue = Format(current)
        let track = Container{
            BasedOn: resolved.TrackStyle,
            Position: PositionType.Absolute,
            Left: if horizontal {
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
                Length.Percent(100.0)
            } else {
                resolved.TrackThickness
            },
            Height: if horizontal {
                resolved.TrackThickness
            } else {
                Length.Percent(100.0)
            },
            BorderRadius: resolved.TrackRadius!!,
            BackgroundColor: resolved.TrackColor!!,
            HitTestSelf: false,
        }
        let fill = Container{
            BasedOn: resolved.FillStyle,
            Position: PositionType.Absolute,
            Left: if horizontal {
                0.0
            } else {
                (resolved.ThumbSize - resolved.TrackThickness) / 2.0
            },
            Top: if horizontal {
                (resolved.Height - resolved.TrackThickness) / 2.0
            } else {
                Length.Percent((1.0 - fraction) * 100.0)
            },
            Width: if horizontal {
                Length.Percent(fraction * 100.0)
            } else {
                resolved.TrackThickness
            },
            Height: if horizontal {
                resolved.TrackThickness
            } else {
                Length.Percent(fraction * 100.0)
            },
            BorderRadius: resolved.TrackRadius!!,
            BackgroundColor: resolved.FillColor!!,
            HitTestSelf: false,
        }
        let thumb = Container{
            BasedOn: resolved.ThumbStyle,
            Position: PositionType.Absolute,
            Left: if horizontal {
                Length.Percent(fraction * 100.0)
            } else {
                0.0
            },
            Top: if horizontal {
                (resolved.Height - resolved.ThumbSize) / 2.0
            } else {
                Length.Percent((1.0 - fraction) * 100.0)
            },
            MarginLeft: if horizontal {
                -resolved.ThumbSize / 2.0
            } else {
                0.0
            },
            MarginTop: if horizontal {
                0.0
            } else {
                -resolved.ThumbSize / 2.0
            },
            Width: resolved.ThumbSize,
            Height: resolved.ThumbSize,
            BorderRadius: resolved.ThumbRadius!!,
            BorderWidth: resolved.ThumbBorderWidth!!,
            BorderColor: resolved.ThumbBorderColor!!,
            BackgroundColor: resolved.ThumbColor!!,
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
            BasedOn: resolved.RootStyle,
            Handle: handle,
            Width: if horizontal {
                if hasHeader {
                    Length.Percent(100.0)
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
            Focus: if resolved.ShowFocusHighlight {
                Style{OutlineWidth: 2.0, OutlineColor: resolved.FocusOutlineColor!!, OutlineOffset: 3.0}
            } else {
                Style{}
            },
            Accessibility: accessibility,
            OnPointerDown: (e PointerEvent) -> BeginPointer(e),
            OnPointerMove: (e PointerEvent) -> MovePointer(e),
            OnPointerUp: (e PointerEvent) -> EndPointer(e),
            OnPointerCancel: (e PointerEvent) -> EndPointer(e),
            OnKeyDown: (e KeyEvent) -> KeyDown(e),
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
            Gap: 12.0,
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
                    Color: resolved.ValueColor!!,
                }
            )
        }
        content.Key ??= "slider-control"
        return Container{
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
            Gap: 6.0,
            header,
            content,
        }
    }

    private func Resolve(input SliderInput) SliderInput {
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
            20.0
        } else {
            input.ThumbSize
        }
        let trackThickness = if input.TrackThickness == 0.0 {
            8.0
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
            LabelColor = input.LabelColor ?? Color.Parse("#fafafa"),
            ValueColor = input.ValueColor ?? Color.Parse("#a1a1aa"),
            Width = input.Width ?? Length.Percent(100.0),
            Height = if input.Height == 0.0 {
                if input.Orientation == SliderOrientation.Horizontal {
                    28.0
                } else {
                    160.0
                }
            } else {
                input.Height
            },
            TrackThickness = trackThickness,
            LabelFontSize = if input.LabelFontSize == 0.0 {
                12.0
            } else {
                input.LabelFontSize
            },
            ValueFontSize = if input.ValueFontSize == 0.0 {
                12.0
            } else {
                input.ValueFontSize
            },
            ThumbSize = thumbSize,
            ThumbRadius = input.ThumbRadius ?? thumbSize / 2.0,
            ThumbBorderWidth = input.ThumbBorderWidth ?? 2.0,
            TrackRadius = input.TrackRadius ?? trackThickness / 2.0,
            TrackColor = input.TrackColor ?? Color.Parse("#3f3f46"),
            FillColor = input.FillColor ?? Color.Parse("#fafafa"),
            ThumbColor = input.ThumbColor ?? Color.Parse("#fafafa"),
            ThumbBorderColor = input.ThumbBorderColor ?? Color.Parse("#18181b"),
            FocusOutlineColor = input.FocusOutlineColor ?? Color.Parse("#a1a1aa"),
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
            return resolved.Minimum!!+ Math.Clamp((e.WindowPosition.X - box.X) / box.Width, 0.0, 1.0) * (
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

    private func EndPointer(e PointerEvent) {
        if resolved.Disabled || !dragging || e.PointerId != pointerId {
            return
        }
        e.ReleaseCapture()
        dragging = false
        pointerId = -1L
        Commit()
    }

    private func KeyDown(e KeyEvent) {
        if resolved.Disabled {
            return
        }
        var next = current
        var handled = true
        if e.Key == Key.Home {
            next = resolved.Minimum!!
        } else if e.Key == Key.End {
            next = resolved.Maximum!!
        } else if e.Key == Key.Right || e.Key == Key.Up {
            next += resolved.Step!!
        } else if e.Key == Key.Left || e.Key == Key.Down {
            next -= resolved.Step!!
        } else {
            handled = false
        }
        if !handled {
            return
        }
        e.PreventDefault()
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
