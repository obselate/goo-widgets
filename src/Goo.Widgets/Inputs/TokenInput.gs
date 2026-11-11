package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import System
import System.Collections.Generic

/// Controlled token values. Invalid values remain visible and removable.
public data struct TokenInputInput {
    /// Controlled token strings in display order. Nil supplies an empty array.
    var Value[]?string
    /// Receives a new token array after addition or removal. Nil ignores the request.
    var OnChange Action[[]string]?
    /// Tests each token for valid presentation. Nil accepts all tokens. Invalid tokens remain visible and removable.
    /// Hosts must not change state in this callback.
    var Validate Func[string, bool]?
    /// Suggested token strings. Nil supplies no suggestions.
    var Suggestions[]?string
    /// Characters that split and commit the draft. Nil uses comma, semicolon, and newline.
    var Separators string?
    /// Hint shown while the entry is empty. Nil uses the widget default text.
    var Placeholder string?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Preserves focus, selection and copy while preventing token edits and suggestions.
    var ReadOnly bool
    /// Root layout width. Nil uses 360 logical pixels.
    var Width Length?
    /// Receives the widget input and the prepared entry, and returns the replacement entry. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateEntry Func[TokenInputInput, TextEntry, TextEntry]?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    /// Hosts must not change state in this callback.
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
        let values = input.Value ?? []string{}
        if selected >= values.Length {
            selected = -1
        }
        var root = Container{Width: input.Width ?? defaultWidth, MinWidth: 0, Gap: theme.ControlGap / 2,}
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        let frame = Container{
            Key: "frame",
            MinWidth: 0,
            Padding: theme.ControlPadding / 3,
            Gap: theme.ControlGap / 2,
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            AlignItems: AlignItems.Center,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.ControlRadius!!,
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
                        ReadOnly: input.ReadOnly,
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
                ReadOnly: input.ReadOnly,
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
                        BorderRadius: theme.ControlRadius!!,
                        PlaceholderColor: theme.PlaceholderColor,
                        Height: props.EntryHeight!!,
                        Padding: 4,
                        BackgroundColor: Color.Transparent,
                        Color: theme.TextColor,
                        FontFamily: theme.FontFamily,
                        FontSize: theme.FontSize,
                        Focus: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                        OnChange: props.OnChange,
                        OnSubmit: props.OnSubmit,
                    }
                    if let create = input.CreateEntry {
                        entry = create(input, entry)
                    }
                    entry.Handle = editor
                    entry.ReadOnly = input.ReadOnly
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
        if !input.Disabled && !input.ReadOnly && draft.Length > 0 {
            let items = input.Suggestions ?? []string{}
            let matches = List[int32]()
            for index in 0 ... items.Length {
                if items[index].IndexOf(draft, StringComparison.OrdinalIgnoreCase) >= 0 {
                    matches.Add(index)
                }
            }
            let key((int32) -> string) = (index int32) -> items[index] + "\0" + index.ToString()
            let build((int32) -> Blob) = (index int32) -> {
                let value = items[index]
                let action = Button{
                    Height: theme.ControlHeight,
                    Padding: 6,
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text("Add {0}", value)},
                    OnClick: () -> {
                        Commit(value)
                        editor.Focus()
                    },
                    Text{Content: value, Color: theme.TextColor},
                }
                theme.ApplyInteraction(action, InteractionFamily.Button)
                WidgetKeyBindings.BindActivation(action)
                return action
            }
            let suggestions = VirtualRows[int32](
                matches, theme.ControlHeight, key, build, followEnd: false, version: nil, state: nil
            )
            suggestions.Key = "suggestions"
            suggestions.Gap = 2
            suggestions.Height = Math.Min(240.0, matches.Count * (theme.ControlHeight + 2))
            root.Children.Add(suggestions)
        }
        return root
    }

    private func Changed(value string) {
        if current.Disabled || current.ReadOnly {
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
        if current.Disabled || current.ReadOnly {
            return
        }
        let tokens = List[string](current.Value ?? []string{})
        for part in value.Split((current.Separators ?? ",;\n").ToCharArray(), StringSplitOptions.RemoveEmptyEntries) {
            let token = part.Trim()
            if token.Length > 0 {
                tokens.Add(token)
            }
        }
        draft = ""
        selected = -1
        if tokens.Count != (current.Value?.Length ?? 0) {
            if let callback = current.OnChange {
                InvokeInputCallback(callback, tokens.ToArray())
            }
        }
        Rebuild()
    }

    internal func Select(index int32) {
        selected = index
        editor.Focus()
        Rebuild()
    }

    internal func Remove(index int32) {
        if current.Disabled || current.ReadOnly {
            return
        }
        let tokens = List[string](current.Value ?? []string{})
        if index < 0 || index >= tokens.Count {
            return
        }
        tokens.RemoveAt(index)
        selected = -1
        if let callback = current.OnChange {
            InvokeInputCallback(callback, tokens.ToArray())
        }
        editor.Focus()
        Rebuild()
    }

    private func KeyDown(event KeyEvent) {
        if current.Disabled || current.ReadOnly {
            return
        }
        if event.Key == Key.Backspace && draft.Length == 0 && (current.Value?.Length ?? 0) > 0 {
            event.PreventDefault()
            event.StopPropagation()
            if selected >= 0 {
                Remove(selected)
            } else {
                selected = current.Value!!.Length - 1
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
    internal var ReadOnly bool
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
            OnRemove: input.ReadOnly ? nil: remove,
        }.Build()
    }
}
