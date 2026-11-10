package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System

/// A semantic single-line text field with label, error, and primitive factories.
public data struct TextField {
    /// Optional label.
    var Label string?
    /// Supporting text linked to the editor. Nil omits it.
    var Description string?
    /// Initial value. Nil resolves to an empty string.
    var Value string?
    /// Applies Value while the entry is focused. False lets focused edits win until blur.
    var Controlled bool
    /// Empty-value hint. Nil resolves to an empty string.
    var Placeholder string?
    /// Optional validation error text.
    var Error string?
    /// Whether the field uses invalid styling.
    var Invalid bool
    /// Whether the field rejects input.
    var Disabled bool
    /// Preserves focus, selection and copy while preventing edits.
    var ReadOnly bool
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
    /// Content after the editor or label. Nil leaves this slot empty.
    var Trailing Blob?
    /// Content in separate attached sections of the entry frame.
    var PrefixAddon Blob?
    /// Content in an attached section after the entry frame. Nil omits the section.
    var SuffixAddon Blob?
    /// Shows a named clear action while the field is nonempty.
    var Clearable bool
    /// Handle for the text entry, for example to focus the field from a shortcut. Nil uses an internal handle.
    var Handle ElementHandle?
    /// Masks text until the optional reveal action is pressed.
    var Password bool
    /// Shows a password-visibility action when Password is true.
    var RevealButton bool
    /// Direction of the value and its addons. Nil inherits. Use LeftToRight for emails, URLs and passwords.
    var ContentDirection Direction?
    /// Soft character limit. Input is retained when the count exceeds it.
    var MaxLength int32?
    /// Character-count label override. Nil uses the generated count when MaxLength is set.
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
    /// Entry text size. Nil uses the nearest theme font size.
    var FontSize float64?
    /// Label text size. Nil uses the nearest theme label font size.
    var LabelFontSize float64?
    /// Label font weight. Nil uses the nearest theme label font weight.
    var LabelFontWeight int32?
    /// Label transform. Nil uses sentence case.
    var LabelTextTransform TextTransform?
    /// Error text size. Nil uses the nearest theme caption font size.
    var ErrorFontSize float64?
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
    /// Hosts must not change state in this callback.
    var CreateEntry Func[TextField, TextEntry]?
    internal var EntryKeyBindings([]KeyBinding)?
    /// Creates the root from resolved props and selected primitives.
    /// Hosts must not change state in this callback.
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
            Invalid = Invalid || Error != nil,
            Placeholder = placeholder,
            AccessibilityName = AccessibilityName ?? labelName,
            BackgroundColor = BackgroundColor ?? theme.FieldColor,
            TextColor = TextColor ?? theme.TextColor,
            MutedTextColor = MutedTextColor ?? theme.MutedTextColor,
            BorderColor = BorderColor ?? theme.ControlStroke,
            FocusColor = FocusColor ?? theme.FocusColor,
            InvalidColor = InvalidColor ?? theme.DangerColor,
            DisabledBackgroundColor = DisabledBackgroundColor ?? theme.SunkenColor,
            DisabledTextColor = DisabledTextColor ?? theme.DisabledTextColor,
            FontFamily = FontFamily ?? theme.FontFamily,
            Width = Width ?? defaultWidth,
            EntryHeight = EntryHeight ?? controlHeight,
            Gap = Gap ?? theme.ControlGap,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            FontSize = FontSize ?? theme.FontSize,
            LabelFontSize = LabelFontSize ?? theme.LabelFontSize,
            ErrorFontSize = ErrorFontSize ?? theme.CaptionFontSize,
            LabelFontWeight = LabelFontWeight ?? theme.LabelFontWeight,
            LabelTextTransform = LabelTextTransform ?? TextTransform.None,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.ControlRadius!!,
            FocusRingWidth = Math.Max(1.0, FocusRingWidth ?? theme.FocusRingWidth),
            TransitionMs = theme.ReducedMotion ? 0.0: TransitionMs ?? theme.TransitionMs,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateEntry = nil,
            CreateRoot = nil,
        }
        let labelHandle = ElementHandle()
        let issueHandle = ElementHandle()
        let descriptionHandle = ElementHandle()
        var label Text? = nil
        if resolved.Label != nil {
            label = Text{
                Key: "label",
                Handle: labelHandle,
                Content: resolved.Label!!,
                Color: resolved.MutedTextColor!!,
                FontSize: resolved.LabelFontSize!!,
                FontWeight: resolved.LabelFontWeight!!,
                TextTransform: resolved.LabelTextTransform!!
            }
            if resolved.FontFamily != nil {
                label.FontFamily = resolved.FontFamily!!
            }
        }
        let description Text? = resolved.Description == nil ? nil: Text{
            Key: "description",
            Handle: descriptionHandle,
            Content: resolved.Description!!,
            Accessibility: Accessibility{Role: AccessibilityRole.Text, Name: resolved.Description!!},
            Color: resolved.MutedTextColor!!,
            FontSize: theme.CaptionFontSize,
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
                    theme.FieldBorder(resolved.InvalidColor!!, resolved.InvalidColor!!)
                } else {
                    theme.FieldBorder(resolved.BorderColor!!)
                },
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                FontSize: resolved.FontSize!!,
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
                TransitionProperties: theme.InteractionTransitions,
                Focus: FocusColor == nil ? nil: Style{OutlineColor: FocusColor!!},
                DisabledStyle: Style{BackgroundColor: resolved.DisabledBackgroundColor!!, Color: resolved.DisabledTextColor!!},
            }
            if resolved.FontFamily != nil {
                entry.FontFamily = resolved.FontFamily!!
            }
        }
        if resolved.Invalid {
            entry!!.Hover = Style{BasedOn: entry!!.Hover, BorderColor: resolved.InvalidColor!!}
            entry!!.Active = Style{BasedOn: entry!!.Active, BorderColor: resolved.InvalidColor!!}
        }
        if let bindings = EntryKeyBindings {
            let existing = entry!!.KeyBindings
            if existing == nil || existing.Length == 0 {
                entry!!.KeyBindings = bindings
            } else {
                let combined = [existing.Length + bindings.Length]KeyBinding
                Array.Copy(existing, combined, existing.Length)
                Array.Copy(bindings, 0, combined, existing.Length, bindings.Length)
                entry!!.KeyBindings = combined
            }
        }

        if let direction = resolved.ContentDirection {
            entry!!.Direction = direction
            entry!!.TextAlign = theme.RightToLeft ? TextAlign.Right: TextAlign.Left
        }
        var issue Text? = nil
        if resolved.Error != nil {
            issue = Text{
                Key: "issue",
                Handle: issueHandle,
                Content: resolved.Error!!,
                Color: resolved.InvalidColor!!,
                FontSize: resolved.ErrorFontSize!!,
                FontWeight: theme.CaptionFontWeight,
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Alert,
                    Live: AccessibilityLive.Polite,
                    Name: resolved.Error!!
                }
            }
            if resolved.FontFamily != nil {
                issue.FontFamily = resolved.FontFamily!!
            }
        }
        let readOnly = resolved.ReadOnly || entry!!.ReadOnly || (entry!!.Accessibility?.ReadOnly ?? false)
        entry!!.Key = "entry"
        entry!!.Handle = entry!!.Handle ?? Handle
        entry!!.Disabled = resolved.Disabled
        entry!!.ReadOnly = readOnly
        entry!!.Focusable = !resolved.Disabled
        entry!!.Accessibility = Accessibility{
            Role: AccessibilityRole.TextInput,
            Name: resolved.AccessibilityName!!,
            Invalid: resolved.Invalid,
            ReadOnly: readOnly,
            Relationships: AccessibilityRelationships{
                LabelledBy: label != nil ? []ElementHandle{labelHandle}: []ElementHandle{},
                DescribedBy: resolved.Description != nil
                    ? (issue != nil ? []ElementHandle{descriptionHandle, issueHandle}: []ElementHandle{descriptionHandle})
                    : (issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{}),
                ErrorMessage: resolved.Invalid && issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{}
            }
        }
        if state != nil {
            entry!!.OnFocus = state.Focused
            entry!!.OnBlur = state.Blurred
            state.FocusTarget = entry!!.Handle
        }
        let interactionTheme = theme with{FocusRingWidth = resolved.FocusRingWidth!!}
        if let createRoot = createRoot {
            let content = createRoot(resolved, label, entry!!, issue)
            interactionTheme.ApplyInteraction(entry!!, InteractionFamily.Field)
            if let description = description {
                content.Children.Add(description)
            }
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
        let framed = resolved.Leading != nil || resolved.Trailing != nil || resolved.PrefixAddon != nil
        || resolved.SuffixAddon != nil || resolved.Clearable || resolved.RevealButton
        if framed {
            let frame = Container{
                BasedOn: state?.HasFocus == true ? theme.FieldFocusStyle: nil,
                Width: Percent(100),
                Height: resolved.EntryHeight!!,
                FlexDirection: FlexDirection.Column,
                BackgroundColor: resolved.Disabled ? resolved.DisabledBackgroundColor!!: resolved.BackgroundColor!!,
                BorderColor: resolved.Invalid ? theme.FieldBorder(resolved.InvalidColor!!, resolved.InvalidColor!!): theme.FieldBorder(resolved.BorderColor!!),
                BorderWidth: resolved.BorderWidth!!,
                BorderRadius: resolved.BorderRadius!!,
                BoxShadows: resolved.Disabled ? []BoxShadow{}: theme.FieldShadows,
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
            entry!!.DisabledStyle = Style{Color: resolved.DisabledTextColor!!, BackgroundColor: Color.Transparent}
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
                content.Children.Add(state.ActionButton(theme.Text("Clear {0}", resolved.AccessibilityName!!), ControlIcon.Close, state.Clear))
            }
            if (resolved.Password || state?.Revealed == true) && resolved.RevealButton && state != nil {
                content.Children.Add(
                    state.ActionButton(
                        theme.Text(state.Revealed ? "Hide password": "Show password"),
                        state.Revealed ? ControlIcon.VisibilityOff: ControlIcon.Visibility,
                        state.Reveal
                    )
                )
            }
            if let addon = resolved.SuffixAddon {
                content.Children.Add(Addon(addon, resolved))
            }
            interactionTheme.ApplyInteraction(frame, InteractionFamily.Field)
            root.Children.Add(frame)
        } else {
            entry!!.BoxShadows = resolved.Disabled ? []BoxShadow{}: theme.FieldShadows
            root.Children.Add(entry!!)
        }
        interactionTheme.ApplyInteraction(entry!!, InteractionFamily.Field)
        if framed { entry!!.Focus = Style{BasedOn: entry!!.Focus, OutlineWidth: 0} }
        var counter = resolved.CounterText
        if counter == nil && resolved.MaxLength != nil {
            counter = value.Length.ToString() + " / " + resolved.MaxLength!!.ToString()
        }
        if let counter = counter {
            root.Children.Add(
                Text{
                    Key: "counter",
                    Content: counter,
                    FontSize: resolved.ErrorFontSize!!,
                    Color: resolved.MaxLength != nil && value.Length > resolved.MaxLength!!
                    ? resolved.InvalidColor!!: resolved.MutedTextColor!!
                }
            )
        }
        if let description = description {
            root.Children.Add(description)
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
    internal var HasFocus bool
    internal var Revealed bool
    private let entryHandle ElementHandle = ElementHandle()
    internal var FocusTarget ElementHandle?

    protected override func Build(input TextField) Blob {
        if source != input.Value || input.Controlled {
            source = input.Value
            if !HasFocus || input.Controlled {
                value = input.Value ?? ""
            }
        }
        current = input with{Handle = input.Handle ?? entryHandle}
        return (
            current with{
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
        InvokeInputCallback(current.OnChange, text)
        Rebuild()
    }

    private func Submitted(text string) {
        InvokeInputCallback(current.OnSubmit, text)
        InvokeInputCallback(current.OnCommit, text)
    }

    internal func Focused(event FocusEvent) {
        HasFocus = true
        Rebuild()
    }

    internal func Blurred(event FocusEvent) {
        HasFocus = false
        InvokeInputCallback(current.OnCommit, value)
        if !current.Controlled {
            value = current.Value ?? ""
        }
        Rebuild()
    }

    internal func Clear() {
        Changed("")
        FocusTarget?.Focus()
    }

    internal func Reveal() {
        Revealed = !Revealed
        Rebuild()
    }

    internal func ActionButton(name string, icon ControlIcon, action Action) Blob {
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
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            ControlIcons.Create(icon, 16, theme.MutedTextColor),
        }
        theme.ApplyInteraction(button, InteractionFamily.Button)
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w TextField) Blob -> w.Build()
