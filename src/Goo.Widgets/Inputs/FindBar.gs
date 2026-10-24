package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import System

/// Host-owned search options. Matching stays with the host document.
public data struct FindOptions {
    var MatchCase bool
    var WholeWord bool
    var Regex bool
}

/// Controlled find and replace surface. ActiveMatch is one-based, or zero for no match.
public data struct FindBar {
    var Query string?
    var Options FindOptions
    var MatchCount int32
    var ActiveMatch int32
    var Issue string?
    var OnQueryChange Action[string]?
    var OnOptionsChange Action[FindOptions]?
    var OnNext Action?
    var OnPrevious Action?
    var OnClose Action?
    /// Nil hides the replace row.
    var Replacement string?
    var OnReplacementChange Action[string]?
    var OnReplace Action?
    var OnReplaceAll Action?
    var Disabled bool
    var Width Length?
    var CreateEntry Func[TextField, TextEntry]?

    /// Builds the controlled search fields, match status and actions.
    public func Build() Blob {
        let theme = Theme.Read()
        let snapshot = this
        let ready = !Disabled && Issue == nil && !String.IsNullOrEmpty(Query) && MatchCount > 0
        let next Action = () -> {
            if ready {
                snapshot.OnNext?.Invoke()
            }
        }
        let previous Action = () -> {
            if ready {
                snapshot.OnPrevious?.Invoke()
            }
        }
        let count = Math.Max(0, MatchCount)
        let status = Math.Clamp(ActiveMatch, 0, count).ToString() + " of " + count.ToString()
        let size = theme.ControlHeight
        let root = Container{
            Width: Width ?? Percent(100),
            MinWidth: 0,
            Gap: theme.ControlGap / 2.0,
            Padding: theme.ControlGap / 2.0,
            BackgroundColor: theme.PanelColor,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.ControlRadius,
            KeyBindings: []KeyBinding{
                KeyBinding{Key: Key.Enter, Action: next},
                KeyBinding{Key: Key.Enter, Modifiers: KeyModifiers{Shift: true}, Action: previous},
                KeyBinding{Key: Key.KeypadEnter, Action: next},
                KeyBinding{Key: Key.KeypadEnter, Modifiers: KeyModifiers{Shift: true}, Action: previous},
                KeyBinding{
                    Key: Key.Escape,
                    Action: () -> {
                        if !snapshot.Disabled {
                            snapshot.OnClose?.Invoke()
                        }
                    }
                },
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: "Find and replace"},
            Row(
                TextField{
                    Value: Query,
                    Controlled: true,
                    Placeholder: "Find",
                    AccessibilityName: "Find",
                    Width: Percent(100),
                    Disabled: Disabled,
                    Invalid: Issue != nil,
                    IssueText: Issue,
                    OnChange: OnQueryChange,
                    CreateEntry: CreateEntry,
                    Trailing: Container{
                        FlexDirection: FlexDirection.Row,
                        Gap: 2,
                        Icon(
                            "Match case",
                            "match_case",
                            size - 8.0,
                            Disabled,
                            () -> snapshot.OnOptionsChange?.Invoke(
                                snapshot.Options with{MatchCase = !snapshot.Options.MatchCase}
                            ),
                            Options.MatchCase
                        ),
                        Icon(
                            "Whole word",
                            "match_word",
                            size - 8.0,
                            Disabled,
                            () -> snapshot.OnOptionsChange?.Invoke(
                                snapshot.Options with{WholeWord = !snapshot.Options.WholeWord}
                            ),
                            Options.WholeWord
                        ),
                        Icon(
                            "Regular expression",
                            "regular_expression",
                            size - 8.0,
                            Disabled,
                            () -> snapshot.OnOptionsChange?.Invoke(
                                snapshot.Options with{Regex = !snapshot.Options.Regex}
                            ),
                            Options.Regex
                        ),
                    },
                }.Build(),
                Container{
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Height: size,
                    Text{
                        Content: status,
                        MinWidth: size * 2.0,
                        TextAlign: TextAlign.Center,
                        Color: !String.IsNullOrEmpty(Query) && count == 0 ? theme.DangerColor: theme.MutedTextColor,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.Text,
                            Name: status,
                            Live: AccessibilityLive.Polite
                        }
                    },
                    Icon("Previous", "arrow_upward", size, !ready, previous),
                    Icon("Next", "arrow_downward", size, !ready, next),
                    Icon("Close", "close", size, Disabled, OnClose),
                }
            ),
        }
        if let replacement = Replacement {
            root.Children.Add(
                Row(
                    TextField{
                        Value: replacement,
                        Controlled: true,
                        Placeholder: "Replace",
                        AccessibilityName: "Replacement",
                        Width: Percent(100),
                        Disabled: Disabled,
                        OnChange: OnReplacementChange,
                    }.Build(),
                    Container{
                        FlexDirection: FlexDirection.Row,
                        MinWidth: size * 5.0,
                        Icon("Replace", "find_replace", size, !ready, OnReplace),
                        Icon("Replace all", "done_all", size, !ready, OnReplaceAll),
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

    private func Icon(name string, icon string, size float64, disabled bool, action Action?, on bool? = nil) Blob {
        let theme = Theme.Read()
        let button = Button{
            Width: size,
            Height: size,
            Padding: 0,
            BorderRadius: theme.ControlRadius,
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
                Name: name,
                Checked: on == nil ? AccessibilityChecked.Unspecified:
                on == true ? AccessibilityChecked.True: AccessibilityChecked.False,
            },
            OnClick: action,
            MaterialIcons.Create(icon, 16, on == true ? theme.OnAccentColor: theme.MutedTextColor),
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}
