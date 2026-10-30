package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System

/// A semantic single-line text field with label, issue, and primitive factories.
public data struct TextField {
    /// Optional label.
    var Label string?
    /// Initial value. Nil resolves to an empty string.
    var Value string?
    /// Applies Value while the entry is focused. False lets focused edits win until blur.
    var Controlled bool
    /// Empty-value hint. Nil resolves to an empty string.
    var Placeholder string?
    /// Optional validation issue text.
    var IssueText string?
    /// Whether the field uses invalid styling.
    var Invalid bool
    /// Whether the field rejects input.
    var Disabled bool
    /// Nil enables long-press selection and touch editing controls.
    var TouchEditing bool?
    /// Accessible name. Nil falls back to label, placeholder, then empty.
    var AccessibilityName string?
    /// Callback for edited values.
    var OnChange Action[string]?
    /// Callback for submitted values.
    var OnSubmit Action[string]?
    /// Callback on Enter or when the entry loses focus.
    var OnCommit Action[string]?
    /// Content inside the entry frame before and after the editor.
    var Leading Blob?
    var Trailing Blob?
    /// Content in separate attached sections of the entry frame.
    var PrefixAddon Blob?
    var SuffixAddon Blob?
    /// Shows a named clear action while the field is nonempty.
    var Clearable bool
    /// Masks text until the optional reveal action is pressed.
    var Password bool
    var RevealButton bool
    /// Direction of the value and its addons. Nil inherits. Use LeftToRight for emails, URLs and passwords.
    var ContentDirection Direction?
    /// Soft character limit. Input is retained when the count exceeds it.
    var MaxLength int32?
    var CounterText string?
    /// Entry background. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Entry text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Label text color. Nil uses the nearest theme.
    var MutedTextColor Color?
    /// Entry border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Focus color. Nil uses the nearest theme.
    var FocusColor Color?
    /// Invalid color. Nil uses the nearest theme.
    var InvalidColor Color?
    /// Disabled entry background. Nil uses the nearest theme.
    var DisabledBackgroundColor Color?
    /// Disabled entry text color. Nil uses the nearest theme.
    var DisabledTextColor Color?
    /// Root width, including Percent and Auto. Nil resolves to 280. Explicit zero is preserved.
    var Width Length?
    /// Entry height, including Percent and Auto. Nil uses the theme control height.
    var EntryHeight Length?
    /// Root child gap. Explicit zero is preserved.
    var Gap float64?
    /// Entry horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Entry text size. Zero uses the nearest theme font size.
    var FontSize float64
    /// Label text size. Zero uses the nearest theme label font size.
    var LabelFontSize float64
    /// Label font weight. Zero uses the nearest theme label font weight.
    var LabelFontWeight int32
    /// Label transform. Nil uses sentence case.
    var LabelTextTransform TextTransform?
    /// Issue text size. Zero uses the nearest theme caption font size.
    var IssueFontSize float64
    /// Entry border width. Nil uses the nearest theme border width.
    var BorderWidth float64?
    /// Entry border radius. Nil uses the nearest theme radius.
    var BorderRadius float64?
    /// Focus ring spread. Nil uses the nearest theme focus width.
    var FocusRingWidth float64?
    /// Entry transition duration. Nil uses theme motion. Explicit zero is preserved.
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
        if Clearable || RevealButton || OnCommit != nil || MaxLength != nil {
            return Cell.Mount[TextField, TextFieldState](nil, this)
        }
        return BuildContent()
    }

    internal func BuildContent(state TextFieldState? = nil) Blob {
        let theme = Theme.Read()
        let createEntry = CreateEntry
        let createRoot = CreateRoot
        let value = Value ?? ""
        let placeholder = Placeholder ?? ""
        let labelName = Label ?? placeholder
        let defaultWidth Length = 280
        let controlHeight Length = theme.ControlHeight
        let resolved = this with{
            Value = value,
            Placeholder = placeholder,
            AccessibilityName = AccessibilityName ?? labelName,
            BackgroundColor = BackgroundColor ?? theme.FieldColor,
            TextColor = TextColor ?? theme.TextColor,
            MutedTextColor = MutedTextColor ?? theme.MutedTextColor,
            BorderColor = BorderColor ?? theme.InputBorderColor,
            FocusColor = FocusColor ?? theme.FocusColor,
            InvalidColor = InvalidColor ?? theme.DangerColor,
            DisabledBackgroundColor = DisabledBackgroundColor ?? theme.SunkenColor,
            DisabledTextColor = DisabledTextColor ?? theme.DisabledTextColor,
            FontFamily = FontFamily ?? theme.FontFamily,
            Width = Width ?? defaultWidth,
            EntryHeight = EntryHeight ?? controlHeight,
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
            FocusRingWidth = FocusRingWidth ?? theme.FocusRingWidth,
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
                FontWeight: theme.FontWeight,
                Value: resolved.Value!!,
                Controlled: resolved.Controlled,
                Placeholder: resolved.Placeholder!!,
                PlaceholderColor: theme.PlaceholderColor,
                OnChange: resolved.OnChange,
                OnSubmit: resolved.OnSubmit,
                Password: resolved.Password,
                TransitionMs: resolved.TransitionMs!!,
                TransitionEasing: resolved.TransitionEasing!!,
                Focus: Style{OutlineColor: accent, OutlineWidth: resolved.FocusRingWidth!!, OutlineOffset: theme.FocusRingOffset},
                DisabledStyle: Style{
                    BackgroundColor: resolved.DisabledBackgroundColor!!,
                    Color: resolved.DisabledTextColor!!
                },
            }
            if resolved.FontFamily != nil {
                entry.FontFamily = resolved.FontFamily!!
            }
        }

        if let direction = resolved.ContentDirection {
            entry!!.Direction = direction
            entry!!.TextAlign = theme.RightToLeft ? TextAlign.Right: TextAlign.Left
        }
        var issue Text? = nil
        if resolved.IssueText != nil {
            issue = Text{
                Key: "issue",
                Handle: issueHandle,
                Content: resolved.IssueText!!,
                Color: resolved.InvalidColor!!,
                FontSize: resolved.IssueFontSize,
                FontWeight: theme.CaptionFontWeight,
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
        let readOnly = entry!!.Accessibility?.ReadOnly ?? false
        entry!!.Key = "entry"
        entry!!.Disabled = resolved.Disabled
        entry!!.Focusable = !resolved.Disabled
        entry!!.Accessibility = Accessibility{
            Role: AccessibilityRole.TextInput,
            Name: resolved.AccessibilityName!!,
            Invalid: resolved.Invalid,
            ReadOnly: readOnly,
            Relationships: AccessibilityRelationships{
                LabelledBy: label != nil ? []ElementHandle{labelHandle}: []ElementHandle{},
                DescribedBy: issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
                ErrorMessage: resolved.Invalid && issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{}
            }
        }
        if state != nil {
            entry!!.OnFocus = state.Focused
            entry!!.OnBlur = state.Blurred
        }
        if let createRoot = createRoot {
            let content = createRoot(resolved, label, entry!!, issue)
            return Cell.Mount[TouchTextEditingInput, TouchTextEditing](
                content.Key,
                TouchTextEditingInput{Content: content, Editor: entry!!, Enabled: resolved.TouchEditing}
            )
        }
        let root = Container{
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            FlexDirection: FlexDirection.Column,
            Gap: resolved.Gap!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!
        }
        if let label = label {
            root.Children.Add(label)
        }
        if resolved.Leading != nil || resolved.Trailing != nil || resolved.PrefixAddon != nil
        || resolved.SuffixAddon != nil || resolved.Clearable || resolved.RevealButton {
            let frame = Container{
                Width: Percent(100),
                Height: resolved.EntryHeight!!,
                FlexDirection: FlexDirection.Column,
                BackgroundColor: resolved.Disabled ? resolved.DisabledBackgroundColor!!: resolved.BackgroundColor!!,
                BorderColor: resolved.Invalid ? resolved.InvalidColor!!: resolved.BorderColor!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
            }
            let content = Container{
                FlexGrow: 1,
                MinHeight: 0,
                MinWidth: 0,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                BorderRadius: Math.Max(0, resolved.BorderRadius!!- resolved.BorderWidth!!),
                Overflow: Overflow.Hidden,
            }
            frame.Children.Add(content)
            if let direction = resolved.ContentDirection {
                content.Direction = direction
            }
            entry!!.Width = Length.Auto
            entry!!.Height = Percent(100)
            entry!!.FlexGrow = 1
            entry!!.MinWidth = 0
            entry!!.BorderWidth = 0
            entry!!.BorderRadius = 0
            entry!!.BackgroundColor = Color.Transparent
            entry!!.DisabledStyle = Style{Color: resolved.DisabledTextColor!!}
            entry!!.Focus = Style{
                OutlineColor: accent,
                OutlineWidth: resolved.FocusRingWidth!!,
                OutlineOffset: -resolved.FocusRingWidth!!
            }
            if let addon = resolved.PrefixAddon {
                content.Children.Add(Addon(addon, resolved))
            }
            if let leading = resolved.Leading {
                content.Children.Add(
                    Container{
                        Height: Percent(100),
                        PaddingStart: resolved.PaddingHorizontal!!,
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.Center,
                        FlexShrink: 0,
                        leading,
                    }
                )
            }
            content.Children.Add(entry!!)
            if let trailing = resolved.Trailing {
                content.Children.Add(
                    Container{
                        Height: Percent(100),
                        PaddingEnd: resolved.PaddingHorizontal!!,
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.Center,
                        FlexShrink: 0,
                        trailing,
                    }
                )
            }
            if resolved.Clearable && !resolved.Disabled && !readOnly && value.Length > 0 && state != nil {
                content.Children.Add(state.ActionButton(theme.Text("Clear {0}", resolved.AccessibilityName!!), "close", state.Clear))
            }
            if (resolved.Password || state?.Revealed == true) && resolved.RevealButton && state != nil {
                content.Children.Add(
                    state.ActionButton(
                        theme.Text(state.Revealed ? "Hide password": "Show password"),
                        state.Revealed ? "visibility_off": "visibility",
                        state.Reveal
                    )
                )
            }
            if let addon = resolved.SuffixAddon {
                content.Children.Add(Addon(addon, resolved))
            }
            root.Children.Add(frame)
        } else {
            root.Children.Add(entry!!)
        }
        var counter = resolved.CounterText
        if counter == nil && resolved.MaxLength != nil {
            counter = value.Length.ToString() + " / " + resolved.MaxLength!!.ToString()
        }
        if let counter = counter {
            root.Children.Add(
                Text{
                    Key: "counter",
                    Content: counter,
                    FontSize: resolved.IssueFontSize,
                    Color: resolved.MaxLength != nil && value.Length > resolved.MaxLength!!
                    ? resolved.InvalidColor!!: resolved.MutedTextColor!!
                }
            )
        }
        if let issue = issue {
            root.Children.Add(issue)
        }
        return Cell.Mount[TouchTextEditingInput, TouchTextEditing](
            root.Key,
            TouchTextEditingInput{Content: root, Editor: entry!!, Enabled: resolved.TouchEditing}
        )
    }

    private func Addon(content Blob, input TextField) Blob -> Container{
        Height: Percent(100),
        Padding: Edges{Left: input.PaddingHorizontal!!, Right: input.PaddingHorizontal!!},
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        BackgroundColor: Theme.Read().SunkenColor,
        content,
    }
}

internal class TextFieldState : Cell[TextField] {
    private var current TextField
    private var source string?
    private var value string = ""
    private var focused bool
    internal var Revealed bool

    protected override func Build(input TextField) Blob {
        if source != input.Value || input.Controlled {
            source = input.Value
            if !focused || input.Controlled {
                value = input.Value ?? ""
            }
        }
        current = input
        return (
            input with{
                Value = value,
                Controlled = true,
                Password = input.Password && !Revealed,
                RevealButton = input.Password && input.RevealButton,
                OnChange = Changed,
                OnSubmit = Submitted,
            }
        ).BuildContent(this)
    }

    private func Changed(text string) {
        value = text
        current.OnChange?.Invoke(text)
        Rebuild()
    }

    private func Submitted(text string) {
        current.OnSubmit?.Invoke(text)
        current.OnCommit?.Invoke(text)
    }

    internal func Focused(event FocusEvent) {
        focused = true
    }

    internal func Blurred(event FocusEvent) {
        focused = false
        current.OnCommit?.Invoke(value)
        if !current.Controlled {
            value = current.Value ?? ""
        }
        Rebuild()
    }

    internal func Clear() {
        Changed("")
    }

    internal func Reveal() {
        Revealed = !Revealed
        Rebuild()
    }

    internal func ActionButton(name string, icon string, action Action) Blob {
        let theme = Theme.Read()
        let button = Button{
            Width: theme.ControlHeight,
            Height: Percent(100),
            Padding: 0,
            Disabled: current.Disabled,
            Focusable: !current.Disabled,
            TabStop: false,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: name},
            OnClick: action,
            Focus: theme.FocusStyle,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            MaterialIcons.Create(icon, 16, theme.MutedTextColor),
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}
