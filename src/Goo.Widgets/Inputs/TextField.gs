package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System

/// A semantic single-line text field with label, error, and primitive factories.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
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
    /// Configures the fresh entry before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Invalid, Accessibility.Name, Accessibility.ReadOnly, Accessibility.Relationships.DescribedBy, Accessibility.Relationships.ErrorMessage, Accessibility.Relationships.LabelledBy, Accessibility.Role, Controlled, Disabled, Focusable, Handle, Key, KeyBindings (required entries), OnBlur, OnChange, OnFocus, OnSubmit, Password, ReadOnly, Value.
    var ConfigureEntry Action[TextField, TextEntry]?
    internal var EntryKeyBindings([]KeyBinding)?
    internal var MountKey string?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Root is the returned outermost layout element, including the touch wrapper.
    /// Other supplied parts are read-only. Use their Configure hook to style them.
    /// The widget does not replace configured metadata or children.
    var ConfigureRoot Action[TextField, Text?, TextEntry, Text?, Container]?
    /// Builds a fresh Goo text field tree after resolving props and factories.
    public func Build() Blob {
        if Clearable || RevealButton || OnCommit != nil || MaxLength != nil
        || Leading != nil || Trailing != nil || PrefixAddon != nil || SuffixAddon != nil {
            return Cell.Mount[TextField, TextFieldState](nil, this)
        }
        return BuildContent()
    }

    internal func BuildContent(state TextFieldState? = nil) Blob {
        let theme = Theme.Read()
        let configureEntry = ConfigureEntry
        let configureRoot = ConfigureRoot
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
            ConfigureEntry = nil,
            ConfigureRoot = nil,
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
        let framed = resolved.Leading != nil || resolved.Trailing != nil || resolved.PrefixAddon != nil
        || resolved.SuffixAddon != nil || resolved.Clearable || resolved.RevealButton
        var entry TextEntry? = nil
        {
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
                FocusStyle: FocusColor == nil ? nil: Style{OutlineColor: FocusColor!!},
                DisabledStyle: Style{BackgroundColor: resolved.DisabledBackgroundColor!!, Color: resolved.DisabledTextColor!!},
            }
            if resolved.FontFamily != nil {
                entry.FontFamily = resolved.FontFamily!!
            }
        }
        if !framed { entry!!.BoxShadows = resolved.Disabled ? []BoxShadow{}: theme.FieldShadows }
        if let configure = configureEntry {
            let originalAccessibilityInvalid = entry!!.Accessibility?.Invalid
            let originalAccessibilityName = (entry!!.Accessibility?.Name ?? "")
            let originalAccessibilityReadOnly = entry!!.Accessibility?.ReadOnly
            let originalAccessibilityRole = (entry!!.Accessibility?.Role ?? AccessibilityRole(0))
            let originalControlled = entry!!.Controlled
            let originalDisabled = entry!!.Disabled
            let originalFocusable = entry!!.Focusable
            let originalKey = entry!!.Key
            let originalOnChange = entry!!.OnChange
            let originalOnSubmit = entry!!.OnSubmit
            let originalPassword = entry!!.Password
            let originalReadOnly = entry!!.ReadOnly
            let originalValue = entry!!.Value
            configure.Invoke(resolved, entry!!)
            if entry!!.Accessibility?.Invalid != originalAccessibilityInvalid {
                throw InvalidOperationException("TextField owns Accessibility.Invalid; set TextField.Invalid instead of changing it in ConfigureEntry")
            }
            if (entry!!.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("TextField owns Accessibility.Name; set TextField.AccessibilityName instead of changing it in ConfigureEntry")
            }
            if entry!!.Accessibility?.ReadOnly != originalAccessibilityReadOnly {
                throw InvalidOperationException("TextField owns Accessibility.ReadOnly; set TextField.ReadOnly instead of changing it in ConfigureEntry")
            }
            if (entry!!.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("TextField owns Accessibility.Role; configure TextField instead of changing it in ConfigureEntry")
            }
            if entry!!.Controlled != originalControlled {
                throw InvalidOperationException("TextField owns Controlled; set TextField.Controlled instead of changing it in ConfigureEntry")
            }
            if entry!!.Disabled != originalDisabled {
                throw InvalidOperationException("TextField owns Disabled; set TextField.Disabled instead of changing it in ConfigureEntry")
            }
            if entry!!.Focusable != originalFocusable {
                throw InvalidOperationException("TextField owns Focusable; configure TextField instead of changing it in ConfigureEntry")
            }
            if entry!!.Key != originalKey {
                throw InvalidOperationException("TextField owns Key; configure TextField instead of changing it in ConfigureEntry")
            }
            if entry!!.OnChange != originalOnChange {
                throw InvalidOperationException("TextField owns OnChange; set TextField.OnChange instead of changing it in ConfigureEntry")
            }
            if entry!!.OnSubmit != originalOnSubmit {
                throw InvalidOperationException("TextField owns OnSubmit; set TextField.OnSubmit instead of changing it in ConfigureEntry")
            }
            if entry!!.Password != originalPassword {
                throw InvalidOperationException("TextField owns Password; set TextField.Password instead of changing it in ConfigureEntry")
            }
            if entry!!.ReadOnly != originalReadOnly {
                throw InvalidOperationException("TextField owns ReadOnly; set TextField.ReadOnly instead of changing it in ConfigureEntry")
            }
            if entry!!.Value != originalValue {
                throw InvalidOperationException("TextField owns Value; set TextField.Value instead of changing it in ConfigureEntry")
            }
        }
        if resolved.Invalid {
            entry!!.HoverStyle = Style{BasedOn: entry!!.HoverStyle, BorderColor: resolved.InvalidColor!!}
            entry!!.ActiveStyle = Style{BasedOn: entry!!.ActiveStyle, BorderColor: resolved.InvalidColor!!}
        }
        if let bindings = EntryKeyBindings { WidgetKeyBindings.AppendBindings(entry!!, bindings) }

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
        entry!!.Value = resolved.Value!!
        entry!!.Controlled = resolved.Controlled
        entry!!.Password = resolved.Password
        entry!!.OnChange = resolved.OnChange
        entry!!.OnSubmit = resolved.OnSubmit
        entry!!.Key = "entry"
        entry!!.Handle = entry!!.Handle ?? Handle ?? ElementHandle()
        entry!!.Disabled = resolved.Disabled
        entry!!.ReadOnly = readOnly
        entry!!.Focusable = !resolved.Disabled
        let entryAccessibility = if let configured = entry!!.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        entryAccessibility.Role = AccessibilityRole.TextInput
        entryAccessibility.Name = resolved.AccessibilityName!!
        entryAccessibility.Invalid = resolved.Invalid
        entryAccessibility.ReadOnly = readOnly
        let entryRelationships = if let configured = entryAccessibility.Relationships { AccessibilityRelationships{...configured} } else { AccessibilityRelationships{} }
        entryRelationships.LabelledBy = label != nil ? []ElementHandle{labelHandle}: []ElementHandle{}
        entryRelationships.DescribedBy = resolved.Description != nil
                    ? (issue != nil ? []ElementHandle{descriptionHandle, issueHandle}: []ElementHandle{descriptionHandle})
                    : (issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{})
        entryRelationships.ErrorMessage = resolved.Invalid && issue != nil ? []ElementHandle{issueHandle}: []ElementHandle{}
        entryAccessibility.Relationships = entryRelationships
        entry!!.Accessibility = entryAccessibility
        if state != nil {
            let priorFocus = entry!!.OnFocus
            let priorBlur = entry!!.OnBlur
            entry!!.OnFocus = (event FocusEvent) -> {
                state.Focused(event)
                priorFocus?.Invoke(event)
            }
            entry!!.OnBlur = (event FocusEvent) -> {
                state.Blurred(event)
                priorBlur?.Invoke(event)
            }
            state.FocusTarget = entry!!.Handle
        }
        let interactionTheme = theme with{FocusRingWidth = resolved.FocusRingWidth!!}
        let root = Container{
            LineHeight: theme.LineHeight,
            Width: Percent(100),
            FlexDirection: FlexDirection.Column,
            Gap: resolved.Gap!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!
        }
        if let label = label {
            root.Children.Add(label)
        }

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
            entry!!.DisabledStyle = Style{BasedOn: entry!!.DisabledStyle, Color: resolved.DisabledTextColor!!, BackgroundColor: Color.Transparent}
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
            root.Children.Add(entry!!)
        }
        interactionTheme.ApplyInteraction(entry!!, InteractionFamily.Field)
        if framed { entry!!.FocusStyle = Style{BasedOn: entry!!.FocusStyle, OutlineWidth: 0} }
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
            MountKey ?? root.Key,
            TouchTextEditingInput{Content: root, Editor: entry!!.Handle!!, RootStyle: Style{Width: resolved.Width!!, MinWidth: 0}, ConfigureRoot: configureRoot == nil ? nil : (outer Container) -> configureRoot?.Invoke(resolved, label, entry!!, issue, outer), Enabled: resolved.TouchEditing}
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
