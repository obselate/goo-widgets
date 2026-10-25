package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import System
import System.Collections.Generic

/// Controlled token values. Invalid values remain visible and removable.
public data struct TokenInputInput {
    var Tokens[]?string
    var OnTokensChange Action[[]string]?
    var Validate Func[string, bool]?
    var Suggestions[]?string
    var Separators string?
    var Placeholder string?
    var AccessibilityName string?
    var Disabled bool
    var Width Length?
    var CreateEntry Func[TokenInputInput, TextEntry, TextEntry]?
    var CreateRoot Func[TokenInputInput, Container, Container]?
}

/// A wrapping token field with separator commits and two-step Backspace removal.
public open class TokenInput : Cell[TokenInputInput] {
    private var current TokenInputInput
    private var draft string = ""
    private var selected int32 = -1
    private let editor ElementHandle = ElementHandle()

    protected override func Build(input TokenInputInput) Blob {
        current = input
        let theme = Theme.Read()
        let defaultWidth Length = 360
        let values = input.Tokens ?? []string{}
        if selected >= values.Length {
            selected = -1
        }
        var root = Container{Width: input.Width ?? defaultWidth, MinWidth: 0, Gap: 4,}
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        let frame = Container{
            Key: "frame",
            MinWidth: 0,
            Padding: 4,
            Gap: 4,
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            AlignItems: AlignItems.Center,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.ControlRadius,
            BorderColor: theme.InputBorderColor,
            BackgroundColor: input.Disabled ? theme.SunkenColor: theme.FieldColor,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: input.AccessibilityName ?? theme.Text("Tokens")},
        }
        for index in 0 ... values.Length {
            frame.Children.Add(
                Cell.Mount[TokenChipInput, TokenChip](
                    "token-" + index.ToString(),
                    TokenChipInput{
                        Owner: this,
                        Position: index,
                        Label: values[index],
                        Selected: selected == index,
                        Invalid: !(input.Validate?.Invoke(values[index]) ?? true),
                        Disabled: input.Disabled,
                    }
                )
            )
        }
        frame.Children.Add(
            TextField{
                Value: draft,
                Controlled: true,
                Placeholder: input.Placeholder ?? theme.Text("Add a token"),
                AccessibilityName: input.AccessibilityName ?? theme.Text("Tokens"),
                Disabled: input.Disabled,
                Width: Length.Auto,
                BorderWidth: 0,
                BackgroundColor: Color.Transparent,
                EntryHeight: theme.ControlHeight - 8,
                OnChange: Changed,
                OnSubmit: value -> Commit(value),
                CreateEntry: props -> {
                    var entry = TextEntry{
                        Value: props.Value!!,
                        Controlled: true,
                        Placeholder: props.Placeholder!!,
                        PlaceholderColor: theme.PlaceholderColor,
                        Height: props.EntryHeight!!,
                        Padding: 4,
                        BackgroundColor: Color.Transparent,
                        Color: theme.TextColor,
                        FontFamily: theme.FontFamily,
                        FontSize: theme.FontSize,
                        Focus: theme.FocusStyle,
                        OnChange: props.OnChange,
                        OnSubmit: props.OnSubmit,
                    }
                    if let create = input.CreateEntry {
                        entry = create(input, entry)
                    }
                    entry.Handle = editor
                    entry.OnKeyDown = KeyDown
                    return entry
                },
                CreateRoot: (props, label, entry, issue) -> Container{
                    Key: "editor",
                    FlexGrow: 1,
                    MinWidth: 100,
                    entry,
                },
            }.Build()
        )
        root.Children.Add(frame)
        if !input.Disabled && draft.Length > 0 {
            let suggestions = Container{Key: "suggestions", Gap: 2}
            for suggestion in input.Suggestions ?? []string{} {
                if suggestion.IndexOf(draft, StringComparison.OrdinalIgnoreCase) < 0 {
                    continue
                }
                let value = suggestion
                let action = Button{
                    Padding: 6,
                    Focus: theme.FocusStyle,
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text("Add {0}", value)},
                    OnClick: () -> {
                        Commit(value)
                        editor.Focus()
                    },
                    Text{Content: value, Color: theme.TextColor},
                }
                WidgetKeyBindings.BindActivation(action)
                suggestions.Children.Add(action)
            }
            root.Children.Add(suggestions)
        }
        return root
    }

    private func Changed(value string) {
        if current.Disabled {
            return
        }
        selected = -1
        let separators = (current.Separators ?? ",;\n").ToCharArray()
        if value.IndexOfAny(separators) >= 0 {
            Commit(value)
        } else {
            draft = value
            Rebuild()
        }
    }

    private func Commit(value string) {
        if current.Disabled {
            return
        }
        let tokens = List[string](current.Tokens ?? []string{})
        for part in value.Split((current.Separators ?? ",;\n").ToCharArray(), StringSplitOptions.RemoveEmptyEntries) {
            let token = part.Trim()
            if token.Length > 0 {
                tokens.Add(token)
            }
        }
        draft = ""
        selected = -1
        if tokens.Count != (current.Tokens?.Length ?? 0) {
            current.OnTokensChange?.Invoke(tokens.ToArray())
        }
        Rebuild()
    }

    internal func Select(index int32) {
        selected = index
        editor.Focus()
        Rebuild()
    }

    internal func Remove(index int32) {
        if current.Disabled {
            return
        }
        let tokens = List[string](current.Tokens ?? []string{})
        if index < 0 || index >= tokens.Count {
            return
        }
        tokens.RemoveAt(index)
        selected = -1
        current.OnTokensChange?.Invoke(tokens.ToArray())
        editor.Focus()
        Rebuild()
    }

    private func KeyDown(event KeyEvent) {
        if current.Disabled {
            return
        }
        if event.Key == Key.Backspace && draft.Length == 0 && (current.Tokens?.Length ?? 0) > 0 {
            event.PreventDefault()
            event.StopPropagation()
            if selected >= 0 {
                Remove(selected)
            } else {
                selected = current.Tokens!!.Length - 1
                Rebuild()
            }
        } else if event.Key == Key.Escape || event.Key == Key.Left || event.Key == Key.Right {
            selected = -1
            Rebuild()
        }
    }
}

internal data struct TokenChipInput {
    internal var Owner TokenInput
    internal var Position int32
    internal var Label string
    internal var Selected bool
    internal var Invalid bool
    internal var Disabled bool
}

internal class TokenChip : Cell[TokenChipInput] {
    private var current TokenChipInput
    private let activate Action
    private let remove Action

    public init() {
        activate = () -> current.Owner.Select(current.Position)
        remove = () -> current.Owner.Remove(current.Position)
    }

    protected override func Build(input TokenChipInput) Blob {
        current = input
        return Chip{
            Label: input.Label,
            Selected: input.Selected,
            Invalid: input.Invalid,
            Disabled: input.Disabled,
            Height: Theme.Read().ControlHeight - 8,
            PaddingHorizontal: 8,
            OnClick: activate,
            OnRemove: remove,
        }.Build()
    }
}
