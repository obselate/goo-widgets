package Goo.Widgets.Inputs

import Goo
import Goo.Widgets

/// A semantic single-line text field with label, issue, and primitive factories.
public data struct TextField {
    /// Optional label.
    var Label string?
    /// Initial value. Nil resolves to an empty string.
    var Value string?
    /// Empty-value hint. Nil resolves to an empty string.
    var Placeholder string?
    /// Optional validation issue text.
    var IssueText string?
    /// Whether the field uses invalid styling.
    var Invalid bool
    /// Whether the field rejects input.
    var Disabled bool
    /// Accessible name. Nil falls back to label, placeholder, then empty.
    var AccessibilityName string?
    /// Callback for edited values.
    var OnChange Action[string]?
    /// Callback for submitted values.
    var OnSubmit Action[string]?
    /// Entry background. Nil resolves to #09090b.
    var BackgroundColor Color?
    /// Entry text color. Nil resolves to #fafafa.
    var TextColor Color?
    /// Label text color. Nil resolves to #a1a1aa.
    var MutedTextColor Color?
    /// Entry border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Focus color. Nil resolves to #d4d4d8.
    var FocusColor Color?
    /// Invalid color. Nil resolves to #ef4444.
    var InvalidColor Color?
    /// Disabled entry background. Nil resolves to #18181b.
    var DisabledBackgroundColor Color?
    /// Disabled entry text color. Nil resolves to #71717a.
    var DisabledTextColor Color?
    /// Root width. Zero resolves to 280.0.
    var Width float64
    /// Entry height. Nil uses the theme control height.
    var EntryHeight float64?
    /// Root child gap. Explicit zero is preserved.
    var Gap float64?
    /// Entry horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Entry text size. Zero resolves to 14.0.
    var FontSize float64
    /// Label text size. Zero resolves to 11.0.
    var LabelFontSize float64
    /// Label font weight. Zero resolves to 600.
    var LabelFontWeight int32
    /// Label transform. Nil uses sentence case.
    var LabelTextTransform TextTransform?
    /// Issue text size. Zero resolves to 12.0.
    var IssueFontSize float64
    /// Entry border width. Nil resolves to 1.0.
    var BorderWidth float64?
    /// Entry border radius. Nil resolves to 6.0.
    var BorderRadius float64?
    /// Focus ring spread. Nil resolves to 2.0.
    var FocusRingWidth float64?
    /// Entry transition duration. Nil resolves to 150.0.
    var TransitionMs float64?
    /// Entry transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Root opacity. Nil resolves to 1.0.
    var Opacity float64?
    /// Optional text font family.
    var FontFamily string?
    /// Root transform. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Creates the entry from resolved props.
    var CreateEntry Func[TextField, TextEntry]?
    /// Creates the root from resolved props and selected primitives.
    var CreateRoot Func[TextField, Text?, TextEntry, Text?, Container]?
    /// Builds a fresh Goo text field tree after resolving props and factories.
    public func Build() Blob {
        let theme = Theme.Read()
        let createEntry = CreateEntry
        let createRoot = CreateRoot
        let value = Value ?? ""
        let placeholder = Placeholder ?? ""
        let labelName = Label ?? placeholder
        let resolved = this with{
            Value = value,
            Placeholder = placeholder,
            AccessibilityName = AccessibilityName ?? labelName,
            BackgroundColor = BackgroundColor ?? theme.FieldColor,
            TextColor = TextColor ?? theme.TextColor,
            MutedTextColor = MutedTextColor ?? theme.MutedTextColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            FocusColor = FocusColor ?? theme.AccentColor,
            InvalidColor = InvalidColor ?? theme.DangerColor,
            DisabledBackgroundColor = DisabledBackgroundColor ?? theme.PanelColor,
            DisabledTextColor = DisabledTextColor ?? theme.FaintTextColor,
            FontFamily = FontFamily ?? theme.FontFamily,
            Width = if Width == 0.0 {
                280.0
            } else {
                Width
            },
            EntryHeight = EntryHeight ?? theme.ControlHeight,
            Gap = Gap ?? theme.ControlGap,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            FontSize = if FontSize == 0.0 {
                theme.FontSize
            } else {
                FontSize
            },
            LabelFontSize = if LabelFontSize == 0.0 {
                theme.LabelFontSize
            } else {
                LabelFontSize
            },
            IssueFontSize = if IssueFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                IssueFontSize
            },
            LabelFontWeight = if LabelFontWeight == 0 {
                theme.LabelFontWeight
            } else {
                LabelFontWeight
            },
            LabelTextTransform = LabelTextTransform ?? TextTransform.None,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius,
            FocusRingWidth = FocusRingWidth ?? 2.0,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateEntry = nil,
            CreateRoot = nil,
        }
        let labelHandle = ElementHandle()
        let issueHandle = ElementHandle()
        var label Text? = nil
        if resolved.Label != nil {
            label = Text{
                Key: "label",
                Handle: labelHandle,
                Content: resolved.Label!!,
                Color: resolved.MutedTextColor!!,
                FontSize: resolved.LabelFontSize,
                FontWeight: resolved.LabelFontWeight,
                TextTransform: resolved.LabelTextTransform!!
            }
            if resolved.FontFamily != nil {
                label.FontFamily = resolved.FontFamily!!
            }
        }
        let accent = if resolved.Invalid {
            resolved.InvalidColor!!
        } else {
            resolved.FocusColor!!
        }
        var entry TextEntry? = nil
        if let createEntry = createEntry {
            entry = createEntry(resolved)
        } else {
            entry = TextEntry{
                Width: Percent(100.0),
                Height: resolved.EntryHeight!!,
                Padding: Edges{Right: resolved.PaddingHorizontal!!, Left: resolved.PaddingHorizontal!!},
                BackgroundColor: resolved.BackgroundColor!!,
                Color: resolved.TextColor!!,
                SelectionColor: theme.AccentColor.WithAlpha(0.35),
                Cursor: Cursor.Text,
                BorderColor: if resolved.Invalid {
                    resolved.InvalidColor!!
                } else {
                    resolved.BorderColor!!
                },
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                FontSize: resolved.FontSize,
                Value: resolved.Value!!,
                Placeholder: resolved.Placeholder!!,
                OnChange: resolved.OnChange,
                OnSubmit: resolved.OnSubmit,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Focus: Style{OutlineColor: accent, OutlineWidth: resolved.FocusRingWidth!!, OutlineOffset: 2.0},
                DisabledStyle: Style{
                    BackgroundColor: resolved.DisabledBackgroundColor!!,
                    Color: resolved.DisabledTextColor!!
                },
            }
            if resolved.FontFamily != nil {
                entry.FontFamily = resolved.FontFamily!!
            }
        }

        var issue Text? = nil
        if resolved.IssueText != nil {
            issue = Text{
                Key: "issue",
                Handle: issueHandle,
                Content: resolved.IssueText!!,
                Color: resolved.InvalidColor!!,
                FontSize: resolved.IssueFontSize,
                FontWeight: 500,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Alert,
                    Live: AccessibilityLive.Polite,
                    Name: resolved.IssueText!!
                }
            }
            if resolved.FontFamily != nil {
                issue.FontFamily = resolved.FontFamily!!
            }
        }
        entry!!.Key = "entry"
        entry!!.Disabled = resolved.Disabled
        entry!!.Focusable = !resolved.Disabled
        entry!!.Accessibility = Accessibility{
            Role: AccessibilityRole.TextInput,
            Name: resolved.AccessibilityName!!,
            Invalid: resolved.Invalid,
            Relationships: AccessibilityRelationships{
                LabelledBy: label != nil ? []ElementHandle{labelHandle}: []ElementHandle{},
                DescribedBy: issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
                ErrorMessage: resolved.Invalid && issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{}
            }
        }
        if let createRoot = createRoot {
            return createRoot(resolved, label, entry!!, issue)
        }
        let root = Container{
            Width: resolved.Width,
            FlexDirection: FlexDirection.Column,
            Gap: resolved.Gap!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!
        }
        if let label = label {
            root.Children.Add(label)
        }
        root.Children.Add(entry!!)
        if let issue = issue {
            root.Children.Add(issue)
        }
        return root
    }
}
