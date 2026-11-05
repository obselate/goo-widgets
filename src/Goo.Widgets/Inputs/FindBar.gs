package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import System

/// Host-owned search options. Matching stays with the host document.
public data struct FindOptions {
    /// Requests case-sensitive matching in the host search operation.
    var MatchCase bool
    /// Requests whole-word matching in the host search operation.
    var WholeWord bool
    /// Requests regular-expression matching in the host search operation.
    var Regex bool
}

/// Controlled find and replace surface. ActiveMatch is one-based, or zero for no match.
public data struct FindBar {
    /// Filter text. Nil uses an empty query.
    var Query string?
    /// Controlled matching flags. The host performs the actual search.
    var Options FindOptions
    /// Number of matches. Negative values display as zero.
    var MatchCount int32
    /// One-based current match index. Zero means no active match. Display is clamped to MatchCount.
    var ActiveMatch int32
    /// Validation text shown with invalid presentation. Nil means no validation message.
    var Error string?
    /// Receives the new query string after a user edit. Nil ignores the notification.
    var OnQueryChange Action[string]?
    /// Receives the new matching flags after a user toggle. Nil ignores the request.
    var OnOptionsChange Action[FindOptions]?
    /// Requests the next match when activated. Nil supplies no action.
    var OnNext Action?
    /// Requests the previous match when activated. Nil supplies no action.
    var OnPrevious Action?
    /// Requests closure when the close action is activated. Nil supplies no action.
    var OnClose Action?
    /// Nil hides the replace row.
    var Replacement string?
    /// Receives the new replacement string after a user edit. Nil ignores the notification.
    var OnReplacementChange Action[string]?
    /// Requests replacement of the active match. Nil supplies no action.
    var OnReplace Action?
    /// Requests replacement of all matches. Nil supplies no action.
    var OnReplaceAll Action?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Root layout width. Nil fills the available width.
    var Width Length?
    /// Receives the owning find bar and field, and returns the replacement entry. Nil uses the default composition.
    var CreateEntry Func[FindBar, TextField, TextEntry]?

    /// Builds the controlled search fields, match status and actions.
    public func Build() Blob -> Cell.Mount[FindBar, FindBarState](nil, this)

    internal func BuildContent(state FindBarState) Blob {
        let theme = Theme.Read()
        let ready = !Disabled && Error == nil && !String.IsNullOrEmpty(Query) && MatchCount > 0
        let count = Math.Max(0, MatchCount)
        let status = theme.Text("{0} of {1}", Math.Clamp(ActiveMatch, 0, count), count)
        let size = theme.ControlHeight
        let root = Container{
            Width: Width ?? Percent(100),
            MinWidth: 0,
            Gap: theme.ControlGap / 2.0,
            Padding: theme.ControlGap / 2.0,
            BackgroundColor: theme.PanelColor,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.ControlRadius!!,
            KeyBindings: state.Bindings,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Find and replace")},
            Row(
                state.QueryField!!,
                Container{
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Height: size,
                    Text{
                        Content: status,
                        MinWidth: size * 2.0,
                        TextAlign: TextAlign.Center,
                        TextWrap: TextWrap.NoWrap,
                        Color: !String.IsNullOrEmpty(Query) && count == 0 ? theme.DangerColor: theme.MutedTextColor,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.Text,
                            Name: status,
                            Live: AccessibilityLive.Polite
                        }
                    },
                    state.PreviousButton!!,
                    state.NextButton!!,
                    state.CloseButton!!,
                }
            ),
        }
        if let replacement = Replacement {
            root.Children.Add(
                Row(
                    TextField{
                        Value: replacement,
                        Controlled: true,
                        Placeholder: theme.Text("Replace"),
                        AccessibilityName: theme.Text("Replacement"),
                        Width: Percent(100),
                        Disabled: Disabled,
                        OnChange: OnReplacementChange,
                        EntryKeyBindings: state.Bindings,
                    }.Build(),
                    Container{
                        FlexDirection: FlexDirection.Row,
                        MinWidth: size * 5.0,
                        Icon("Replace", ControlIcon.FindReplace, size, !ready, OnReplace),
                        Icon("Replace all", ControlIcon.DoneAll, size, !ready, OnReplaceAll),
                    }
                )
            )
        }
        return root
    }

    private func Row(field Blob, actions Container) Container -> Container{
        FlexDirection: FlexDirection.Row,
        FlexWrap: FlexWrap.Wrap,
        AlignItems: AlignItems.FlexStart,
        Gap: Theme.Read().ControlGap / 2.0,
        Container{FlexGrow: 1, FlexBasis: Theme.Read().ControlHeight * 6.0, MinWidth: 0, field},
        actions,
    }

    internal func Icon(name string, icon ControlIcon, size float64, disabled bool, action Action?, on bool? = nil) Blob ->
    Cell.Mount[FindBarIconInput, FindBarIcon](
        name,
        FindBarIconInput{Name: name, Icon: icon, Size: size, Disabled: disabled, Action: action, On: on,}
    )
}

internal class FindBarState : Cell[FindBar] {
    private var current FindBar
    internal let Next Action
    internal let Previous Action
    internal let Close Action
    internal let Bindings[]KeyBinding
    internal var QueryField Blob?
    internal var PreviousButton Blob?
    internal var NextButton Blob?
    internal var CloseButton Blob?
    private var size float64

    public init() {
        Next = () -> {
            if Ready() {
                current.OnNext?.Invoke()
            }
        }
        Previous = () -> {
            if Ready() {
                current.OnPrevious?.Invoke()
            }
        }
        Close = () -> {
            if !current.Disabled {
                current.OnClose?.Invoke()
            }
        }
        Bindings = []KeyBinding{
            KeyBinding{Key: Key.Enter, Action: Next},
            KeyBinding{Key: Key.Enter, Modifiers: KeyModifiers{Shift: true}, Action: Previous},
            KeyBinding{Key: Key.KeypadEnter, Action: Next},
            KeyBinding{Key: Key.KeypadEnter, Modifiers: KeyModifiers{Shift: true}, Action: Previous},
            KeyBinding{Key: Key.Escape, Action: Close},
        }
    }

    private func Ready() bool ->
    !current.Disabled && current.Error == nil && !String.IsNullOrEmpty(current.Query) && current.MatchCount > 0

    protected override func Build(input FindBar) Blob {
        let previousReady = Ready()
        let previous = current
        current = input
        let nextSize = Theme.Read().ControlHeight
        if QueryField == nil || previous.Query != input.Query || previous.Options != input.Options
        || previous.Error != input.Error || previous.Disabled != input.Disabled
        || previous.OnQueryChange != input.OnQueryChange || previous.OnOptionsChange != input.OnOptionsChange
        || previous.CreateEntry != input.CreateEntry {
            QueryField = Cell.Mount[FindBarFieldInput, FindBarField]("query", FindBarFieldInput{Value: input, Bindings: Bindings})
        }
        if NextButton == nil || previousReady != Ready() || size != nextSize {
            PreviousButton = input.Icon("Previous", ControlIcon.ArrowUpward, nextSize, !Ready(), Previous)
            NextButton = input.Icon("Next", ControlIcon.ArrowDownward, nextSize, !Ready(), Next)
        }
        if CloseButton == nil ||
            previous.Disabled != input.Disabled ||
            previous.OnClose != input.OnClose ||
            size != nextSize {
            CloseButton = input.Icon("Close", ControlIcon.Close, nextSize, input.Disabled, input.OnClose)
        }
        size = nextSize
        return input.BuildContent(this)
    }
}

internal data struct FindBarFieldInput {
    internal var Value FindBar
    internal var Bindings[]KeyBinding
}

internal class FindBarField : Cell[FindBarFieldInput] {
    private var current FindBar
    private let matchCase Action
    private let wholeWord Action
    private let regex Action
    private let createEntry Func[TextField, TextEntry]

    public init() {
        createEntry = props -> current.CreateEntry!!(current, props)
        matchCase = () -> current.OnOptionsChange?.Invoke(current.Options with{MatchCase = !current.Options.MatchCase})
        wholeWord = () -> current.OnOptionsChange?.Invoke(current.Options with{WholeWord = !current.Options.WholeWord})
        regex = () -> current.OnOptionsChange?.Invoke(current.Options with{Regex = !current.Options.Regex})
    }

    protected override func Build(field FindBarFieldInput) Blob {
        let input = field.Value
        current = input
        let theme = Theme.Read()
        let size = theme.ControlHeight - 8.0
        return TextField{
            Value: input.Query,
            Controlled: true,
            Placeholder: theme.Text("Find"),
            AccessibilityName: theme.Text("Find"),
            Width: Percent(100),
            Disabled: input.Disabled,
            Invalid: input.Error != nil,
            Error: input.Error,
            OnChange: input.OnQueryChange,
            CreateEntry: input.CreateEntry == nil ? nil: createEntry,
            EntryKeyBindings: field.Bindings,
            Trailing: Container{
                FlexDirection: FlexDirection.Row,
                Gap: 2,
                input.Icon("Match case", ControlIcon.MatchCase, size, input.Disabled, matchCase, input.Options.MatchCase),
                input.Icon("Whole word", ControlIcon.MatchWord, size, input.Disabled, wholeWord, input.Options.WholeWord),
                input.Icon(
                    "Regular expression",
                    ControlIcon.RegularExpression,
                    size,
                    input.Disabled,
                    regex,
                    input.Options.Regex
                ),
            },
        }.Build()
    }
}

internal data struct FindBarIconInput {
    internal var Name string
    internal var Icon ControlIcon
    internal var Size float64
    internal var Disabled bool
    internal var Action Action?
    internal var On bool?
}

internal class FindBarIcon : Cell[FindBarIconInput] {
    protected override func Build(input FindBarIconInput) Blob {
        let name = input.Name
        let icon = input.Icon
        let size = input.Size
        let disabled = input.Disabled
        let action = input.Action
        let on = input.On
        let theme = Theme.Read()
        let button = Button{
            Width: size,
            Height: size,
            Padding: 0,
            BorderRadius: theme.ControlRadius!!,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Cursor: Cursor.Pointer,
            Disabled: disabled,
            Opacity: disabled ? 0.4: 1.0,
            BackgroundColor: on == true ? theme.AccentColor: Color.Transparent,
            Hover: Style{BackgroundColor: on == true ? theme.AccentHoverColor: theme.HoverColor},
            Focus: theme.FocusStyle,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: theme.Text(name),
                Checked: on == nil ? AccessibilityChecked.Unspecified:
                on == true ? AccessibilityChecked.True: AccessibilityChecked.False,
            },
            OnClick: action,
            ControlIcons.Create(icon, 16, on == true ? theme.OnAccentColor: theme.MutedTextColor),
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}
