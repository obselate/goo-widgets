package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
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
        let root = Container{
            Width: Width ?? Percent(100),
            MinWidth: 0,
            Gap: theme.ControlGap,
            Padding: theme.ControlPadding,
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
            }.Build(),
            Container{
                FlexDirection: FlexDirection.Row,
                FlexWrap: FlexWrap.Wrap,
                AlignItems: AlignItems.Center,
                Gap: theme.ControlGap,
                ActionButton{
                    Content: "Aa",
                    AccessibilityName: "Match case",
                    Pressed: Options.MatchCase,
                    Disabled: Disabled,
                    OnClick: () -> snapshot.OnOptionsChange?.Invoke(
                        snapshot.Options with{MatchCase = !snapshot.Options.MatchCase}
                    )
                }.Build(),
                ActionButton{
                    Content: "Word",
                    AccessibilityName: "Whole word",
                    Pressed: Options.WholeWord,
                    Disabled: Disabled,
                    OnClick: () -> snapshot.OnOptionsChange?.Invoke(
                        snapshot.Options with{WholeWord = !snapshot.Options.WholeWord}
                    )
                }.Build(),
                ActionButton{
                    Content: ".*",
                    AccessibilityName: "Regular expression",
                    Pressed: Options.Regex,
                    Disabled: Disabled,
                    OnClick: () -> snapshot.OnOptionsChange?.Invoke(
                        snapshot.Options with{Regex = !snapshot.Options.Regex}
                    )
                }.Build(),
                Text{
                    Content: status,
                    Color: theme.MutedTextColor,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Text,
                        Name: status,
                        Live: AccessibilityLive.Polite
                    }
                },
                ActionButton{Content: "Previous", Disabled: !ready, OnClick: previous}.Build(),
                ActionButton{Content: "Next", Disabled: !ready, OnClick: next}.Build(),
                ActionButton{Content: "Close", Disabled: Disabled, OnClick: OnClose}.Build(),
            },
        }
        if let replacement = Replacement {
            root.Children.Add(
                TextField{
                    Value: replacement,
                    Controlled: true,
                    Placeholder: "Replace",
                    AccessibilityName: "Replacement",
                    Width: Percent(100),
                    Disabled: Disabled,
                    OnChange: OnReplacementChange,
                }.Build()
            )
            root.Children.Add(
                Container{
                    FlexDirection: FlexDirection.Row,
                    FlexWrap: FlexWrap.Wrap,
                    Gap: theme.ControlGap,
                    ActionButton{Content: "Replace", Disabled: !ready, OnClick: OnReplace}.Build(),
                    ActionButton{Content: "Replace all", Disabled: !ready, OnClick: OnReplaceAll}.Build(),
                }
            )
        }
        return root
    }
}
