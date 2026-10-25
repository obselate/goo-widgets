package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Globalization

/// Numeric field configuration. Text is committed on Enter or blur.
public data struct NumberInputInput {
    var Value float64
    var Minimum float64?
    var Maximum float64?
    var Step float64?
    var PageStep float64?
    var Format Func[float64, string]?
    var Parse Func[string, float64?]?
    var Prefix Blob?
    var Suffix Blob?
    var Units[]?ComboBoxOption
    var Unit string?
    var OnUnitChange Action[string]?
    var ScrubLabel string?
    var ShowSpinButtons bool?
    var Label string?
    var Description string?
    var Issue string?
    var Disabled bool
    var AccessibilityName string?
    var Width Length?
    var OnChange Action[float64]?
    var OnCommit Action[float64]?
    var CreateEntry Func[NumberInputInput, TextEntry, TextEntry]?
    var CreateRoot Func[NumberInputInput, Container, Container]?
}

/// A culture-aware numeric editor with keyboard and pointer stepping.
public class NumberInput : Cell[NumberInputInput] {
    private var current NumberInputInput
    private var source float64 = Double.NaN
    private var value float64
    private var draft string = ""
    private var invalid bool
    private var editing bool
    private var scrubbing bool
    private var scrubX float64
    private var scrubValue float64
    private var rightToLeft bool
    private let handle ElementHandle = ElementHandle()

    protected override func Build(input NumberInputInput) Blob {
        current = input
        if !Double.IsFinite(input.Value) || (input.Minimum != nil && !Double.IsFinite(input.Minimum!!))
        || (input.Maximum != nil && !Double.IsFinite(input.Maximum!!))
        || (input.Minimum != nil && input.Maximum != nil && input.Minimum!!> input.Maximum!!)
        || !Double.IsFinite(input.Step ?? 1) || (input.Step ?? 1) <= 0
        || !Double.IsFinite(input.PageStep ?? ((input.Step ?? 1) * 10))
        || (input.PageStep ?? ((input.Step ?? 1) * 10)) <= 0 {
            throw ArgumentOutOfRangeException("NumberInput range and steps")
        }
        value = Clamp(input.Value)
        if source != input.Value || !editing {
            source = input.Value
            draft = Format(value)
            invalid = false
        }
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        let frame = Container{
            Direction: theme.Direction,
            Width: Percent(100),
            MinWidth: 0,
            Height: theme.ControlHeight,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: input.Disabled ? theme.PanelColor: theme.FieldColor,
            BorderWidth: theme.BorderWidth,
            BorderColor: invalid || input.Issue != nil ? theme.DangerColor: theme.InputBorderColor,
            BorderRadius: theme.ControlRadius
        }
        if let label = input.ScrubLabel {
            frame.Children.Add(
                Text{
                    Content: label,
                    Color: theme.MutedTextColor,
                    PaddingStart: theme.ControlPadding,
                    Cursor: Cursor.ResizeHorizontal,
                    OnPointerDown: ScrubStart,
                    OnPointerMove: ScrubMove,
                    OnPointerUp: ScrubEnd,
                    OnPointerCancel: ScrubEnd
                }
            )
        }
        if let prefix = input.Prefix {
            frame.Children.Add(prefix)
        }
        var entry = TextEntry{
            Handle: handle,
            Width: Length.Auto,
            MinWidth: 0,
            FlexGrow: 1,
            Height: Percent(100),
            Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
            Value: draft,
            Controlled: true,
            Color: theme.TextColor,
            FontSize: theme.FontSize,
            FontFamily: theme.FontFamily,
            Cursor: Cursor.Text,
            Focus: theme.FocusStyle,
            DisabledStyle: Style{Color: theme.DisabledTextColor},
            OnChange: Changed,
            OnSubmit: text -> Commit(),
            OnBlur: event -> Commit(),
            OnKeyDown: HandleKey
        }
        if let create = input.CreateEntry {
            entry = create(input, entry)
        }
        entry.Handle ??= handle
        entry.Key = "entry"
        entry.Disabled = input.Disabled
        entry.Focusable = !input.Disabled
        frame.Children.Add(entry)
        if let suffix = input.Suffix {
            frame.Children.Add(suffix)
        }
        if input.Units != nil {
            frame.Children.Add(
                Cell.Mount[ComboBoxInput, ComboBox](
                    "units",
                    ComboBoxInput{
                        Items: input.Units,
                        SelectedId: input.Unit,
                        OnSelect: input.OnUnitChange,
                        Disabled: input.Disabled,
                        AccessibilityName: "Unit",
                        Width: 90,
                        CreateTrigger: (props, button) -> {
                            button.Height = Percent(100)
                            button.BorderWidth = 0
                            button.BorderRadius = 0
                            button.BackgroundColor = theme.SunkenColor
                            return button
                        },
                        CreateRoot: (props, root) -> {
                            root.Height = Percent(100)
                            return root
                        },
                    }
                )
            )
        }
        if input.ShowSpinButtons ?? true {
            frame.Children.Add(
                Container{
                    Height: Percent(100),
                    FlexDirection: FlexDirection.Column,
                    SpinButton("Increase", "expand_less", 1),
                    SpinButton("Decrease", "expand_more", -1)
                }
            )
        }
        let content = input.CreateRoot?.Invoke(input, frame) ?? frame
        let defaultWidth Length = 160
        return FormField{
            Label: input.Label,
            Description: input.Description,
            Issue: input.Issue,
            LabelFor: entry.Handle,
            Width: input.Width ?? defaultWidth,
            CreateContent: (relations AccessibilityRelationships) -> {
                entry.Accessibility = Accessibility{
                    Role: AccessibilityRole.SpinButton,
                    Name: input.AccessibilityName ?? input.Label ?? "Number",
                    Value: draft,
                    Invalid: invalid || input.Issue != nil,
                    Relationships: relations,
                    Range: AccessibilityValue{Now: value, Minimum: input.Minimum, Maximum: input.Maximum, Text: draft},
                    Actions: []AccessibilityAction{
                        AccessibilityAction.Increment,
                        AccessibilityAction.Decrement,
                        AccessibilityAction.SetValue
                    },
                    OnAction: request -> {
                        if input.Disabled {
                            return false
                        }
                        if request.Action == AccessibilityAction.Increment {
                            Step(1)
                            return true
                        }
                        if request.Action == AccessibilityAction.Decrement {
                            Step(-1)
                            return true
                        }
                        if request.Action == AccessibilityAction.SetValue {
                            draft = request.Value
                            editing = true
                            Commit()
                            return !invalid
                        }
                        return false
                    }
                }
                return content
            }
        }.Build()
    }

    private func Format(number float64) string -> current.Format?.Invoke(number)
    ?? number.ToString(CultureInfo.CurrentCulture)

    private func Parsed() float64? {
        if let parse = current.Parse {
            return parse(draft)
        }
        return Double.TryParse(
            draft,
            NumberStyles.Float | NumberStyles.AllowThousands,
            CultureInfo.CurrentCulture,
            out var result
        ) ? result: nil
    }

    private func Clamp(number float64) float64 -> Math.Clamp(
        number,
        current.Minimum ?? Double.MinValue,
        current.Maximum ?? Double.MaxValue
    )

    private func Changed(text string) {
        draft = text
        invalid = false
        editing = true
        Rebuild()
    }

    private func Commit() {
        if current.Disabled {
            return
        }
        let parsed = Parsed()
        if parsed == nil || !Double.IsFinite(parsed!!) {
            invalid = true
            Rebuild()
            return
        }
        SetValue(parsed)
        current.OnCommit?.Invoke(value)
    }

    private func SetValue(number float64) {
        let next = Clamp(number)
        let changed = next != value
        value = next
        draft = Format(value)
        invalid = false
        editing = false
        if changed {
            current.OnChange?.Invoke(value)
        }
        Rebuild()
    }

    private func Step(direction float64, page bool = false) {
        if current.Disabled {
            return
        }
        let parsed = Parsed()
        let start = parsed != nil && Double.IsFinite(parsed!!) ? parsed!!: value
        SetValue(start + direction * (page ? current.PageStep ?? ((current.Step ?? 1) * 10): current.Step ?? 1))
    }

    private func HandleKey(event KeyEvent) {
        if current.Disabled || event.Modifiers.Ctrl || event.Modifiers.Alt || event.Modifiers.Super {
            return
        }
        if event.Key == Key.Up {
            Step(1)
        } else if event.Key == Key.Down {
            Step(-1)
        } else if event.Key == Key.PageUp {
            Step(1, true)
        } else if event.Key == Key.PageDown {
            Step(-1, true)
        } else {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
    }

    private func SpinButton(name string, icon string, direction float64) Blob {
        let theme = Theme.Read()
        let button = Button{
            Width: 26,
            Height: Percent(50),
            Padding: 0,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Disabled: current.Disabled,
            Focusable: !current.Disabled,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: name},
            OnClick: () -> {
                Step(direction)
            },
            Focus: theme.FocusStyle,
            MaterialIcons.Create(icon, 14, theme.MutedTextColor)
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }

    private func ScrubStart(event PointerEvent) {
        if current.Disabled || event.Button != PointerButton.Primary {
            return
        }
        scrubbing = true
        scrubX = event.WindowPosition.X
        scrubValue = value
        event.Capture()
    }

    private func ScrubMove(event PointerEvent) {
        if scrubbing && !current.Disabled {
            let moved = (event.WindowPosition.X - scrubX) * (rightToLeft ? -1.0: 1.0)
            SetValue(scrubValue + Math.Truncate(moved / 8) * (current.Step ?? 1))
        }
    }

    private func ScrubEnd(event PointerEvent) {
        if !scrubbing {
            return
        }
        scrubbing = false
        event.ReleaseCapture()
        if !current.Disabled {
            current.OnCommit?.Invoke(value)
        }
    }
}
