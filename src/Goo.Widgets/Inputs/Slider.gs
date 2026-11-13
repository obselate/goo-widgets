package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Globalization

/// Selects slider layout and pointer direction.
public enum SliderOrientation {
    /// Increases values along the horizontal track.
    Horizontal;
    /// Increases values along the vertical track.
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
    /// Visible label font size. Nil uses the nearest theme label font size.
    var LabelFontSize float64?
    /// Displayed value font size. Nil uses the nearest theme caption font size.
    var ValueFontSize float64?
    /// Formats the accessible range value and optional visible value. Nil formats with the theme Culture.
    /// Hosts must not change state in this callback.
    var FormatValue Func[float64, string]?
    /// Receives pointer and keyboard preview values.
    var OnChange Action[float64]?
    /// Receives the final value after pointer, keyboard, or accessibility input.
    var OnCommit Action[float64]?
    /// Whether the slider rejects input.
    var Disabled bool
    /// Horizontal slider width. Nil resolves to 100 percent.
    var Width Length?
    /// Slider height. Nil uses the nearest theme control height horizontally or 160.0 vertically.
    var Height Length?
    /// Track thickness. Nil uses the nearest theme spacing.
    var TrackThickness float64?
    /// Thumb diameter. Nil uses the nearest theme spacing.
    var ThumbSize float64?
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
    /// Disabled opacity. Nil uses the theme.
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
    /// Hosts must not change state in this callback.
    var CreateRoot Func[SliderInput, Container, Blob]?
}

/// A controlled range input with pointer capture, keyboard input, and accessible value actions.
public open class Slider : Cell[SliderInput] {
    private let handle ElementHandle = ElementHandle{}
    private var current float64
    private var rightToLeft bool
    private var resolved SliderInput

    protected override func Build(input SliderInput) Blob {
        let createRoot = input.CreateRoot
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        resolved = Resolve(input, theme)
        current = Quantize(input.Value)
        resolved.Value = current
        resolved.CreateRoot = nil
        let fraction = (current - resolved.Minimum!!) / (resolved.Maximum!!- resolved.Minimum!!)
        let horizontal = resolved.Orientation == SliderOrientation.Horizontal
        let hasHeader = resolved.Label != nil || resolved.ShowValue
        let formattedValue = resolved.FormatValue?.Invoke(current) ?? current.ToString("G", theme.Locale)
        let track = Container{
            Position: PositionType.Absolute,
            Start: if horizontal {
                0.0
            } else {
                (resolved.ThumbSize!! - resolved.TrackThickness!!) / 2.0
            },
            Top: if horizontal {
                Percent(50.0)
            } else {
                0.0
            },
            Width: if horizontal {
                Percent(100.0)
            } else {
                resolved.TrackThickness!!
            },
            Height: if horizontal {
                resolved.TrackThickness!!
            } else {
                Percent(100.0)
            },
            Margin: Edges{Top: horizontal ? -resolved.TrackThickness!! / 2.0: 0.0},
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
                (resolved.ThumbSize!! - resolved.TrackThickness!!) / 2.0
            },
            Top: if horizontal {
                Percent(50.0)
            } else {
                Percent((1.0 - fraction) * 100.0)
            },
            Width: if horizontal {
                Percent(fraction * 100.0)
            } else {
                resolved.TrackThickness!!
            },
            Height: if horizontal {
                resolved.TrackThickness!!
            } else {
                Percent(fraction * 100.0)
            },
            Margin: Edges{Top: horizontal ? -resolved.TrackThickness!! / 2.0: 0.0},
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
                Percent(50.0)
            } else {
                Percent((1.0 - fraction) * 100.0)
            },
            Margin: Edges{Top: -resolved.ThumbSize!! / 2.0},
            MarginStart: horizontal ? -resolved.ThumbSize!! / 2.0: 0.0,
            Width: resolved.ThumbSize!!,
            Height: resolved.ThumbSize!!,
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
                resolved.ThumbSize!!
            },
            Height: resolved.Height!!,
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
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            FocusStyle: input.FocusOutlineColor == nil ? nil: Style{OutlineColor: input.FocusOutlineColor!!},
            DisabledStyle: Style{BackgroundColor: Color.Transparent, Opacity: hasHeader ? 1.0: resolved.DisabledOpacity!!},
            BasedOn: resolved.RootStyle,
            Accessibility: accessibility,
            OnPointerDrag: Drag,
            KeyBindings: []KeyBinding{
                KeyBinding{Key: Key.Home, OnPress: () -> KeyAction(Key.Home)},
                KeyBinding{Key: Key.End, OnPress: () -> KeyAction(Key.End)},
                KeyBinding{Key: Key.Left, Repeat: true, OnPress: () -> KeyAction(Key.Left)},
                KeyBinding{Key: Key.Right, Repeat: true, OnPress: () -> KeyAction(Key.Right)},
                KeyBinding{Key: Key.Up, Repeat: true, OnPress: () -> KeyAction(Key.Up)},
                KeyBinding{Key: Key.Down, Repeat: true, OnPress: () -> KeyAction(Key.Down)},
            },
            track,
            fill,
            thumb,
        }
        theme.ApplyInteraction(root, InteractionFamily.Field)
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
        }
        if let label = resolved.Label {
            header.Children.Add(
                Text{
                    Key: "slider-label",
                    Content: label,
                    FontSize: resolved.LabelFontSize!!,
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
                    FontSize: resolved.ValueFontSize!!,
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
            Disabled: resolved.Disabled,
            DisabledStyle: Style{Opacity: resolved.DisabledOpacity!!},
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
        let thumbSize = input.ThumbSize ?? theme.Spacing * 5.0
        let fluent = theme.Controls == ControlStyle.Fluent
        let trackThickness = input.TrackThickness ?? (fluent ? 4.0: theme.Spacing * 2.0)
        if !Double.IsFinite(thumbSize) || thumbSize <= 0.0 {
            throw ArgumentOutOfRangeException("ThumbSize")
        }
        if !Double.IsFinite(trackThickness) || trackThickness <= 0.0 {
            throw ArgumentOutOfRangeException("TrackThickness")
        }
        let defaultHeight Length = input.Orientation == SliderOrientation.Horizontal ? theme.ControlHeight: 160.0
        return input with{
            Minimum = minimum,
            Maximum = maximum,
            Step = step,
            AccessibilityName = input.AccessibilityName ?? input.Label ?? theme.Text("Slider"),
            LabelColor = input.LabelColor ?? theme.TextColor,
            ValueColor = input.ValueColor ?? theme.MutedTextColor,
            Width = input.Width ?? Percent(100.0),
            Height = input.Height ?? defaultHeight,
            TrackThickness = trackThickness,
            LabelFontSize = input.LabelFontSize ?? theme.LabelFontSize,
            ValueFontSize = input.ValueFontSize ?? theme.CaptionFontSize,
            ThumbSize = thumbSize,
            ThumbRadius = input.ThumbRadius ?? thumbSize / 2.0,
            ThumbBorderWidth = input.ThumbBorderWidth ?? (fluent ? 4.0: theme.BorderWidth),
            TrackRadius = input.TrackRadius ?? trackThickness / 2.0,
            TrackColor = input.TrackColor ?? (fluent ? theme.StrongBorderColor: theme.BorderColor),
            FillColor = input.FillColor ?? theme.AccentColor,
            ThumbColor = input.ThumbColor ?? theme.AccentColor,
            ThumbBorderColor = input.ThumbBorderColor ?? (fluent ? theme.Mix(theme.RaisedColor, Color.White, 0.1F): theme.OnAccentColor),
            BackgroundColor = input.BackgroundColor ?? theme.PanelColor,
            FocusOutlineColor = input.FocusOutlineColor ?? theme.FocusColor,
            DisabledOpacity = input.DisabledOpacity ?? theme.DisabledOpacity,
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
        InvokeInputCallback(resolved.OnChange, next)
    }

    private func Commit() {
        InvokeInputCallback(resolved.OnCommit, current)
    }

    private func ValueFromPointer(e PointerDragEvent) float64 {
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

    private func Drag(e PointerDragEvent) {
        if resolved.Disabled {
            return
        }
        e.PreventDefault()
        if e.Phase == PointerDragPhase.Started || e.Phase == PointerDragPhase.Moved {
            Preview(ValueFromPointer(e))
        } else if e.Phase == PointerDragPhase.Ended {
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
}
