package Goo.Widgets.Layout

import System

import Goo
import Goo.Widgets

/// Selects the standard dialog action and focus policy.
public enum ModalDialogPreset {
    /// Uses caller-supplied dialog content and actions.
    Custom;
    /// Uses a confirmation dialog layout.
    Confirm;
    /// Uses a destructive-action dialog layout.
    Destructive;
    /// Uses a form dialog layout.
    Form
}

/// Controls user dismissal without confirming.
public enum DialogDismissPolicy {
    /// Uses the dismissal policy selected by the dialog preset.
    Default;
    /// Allows dismissal by Escape or a backdrop click.
    EscapeAndBackdrop;
    /// Allows dismissal by Escape but not a backdrop click.
    EscapeOnly;
    /// Requires an explicit dialog action to dismiss.
    Explicit
}

/// A composable in-parent modal overlay with host-owned close, cancel, and confirm actions.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
public data struct ModalDialog {
    /// Whether the overlay is rendered.
    var Open bool
    /// Selects standard action and focus defaults. Custom leaves composition to the caller.
    var Preset ModalDialogPreset
    /// Semantic color family resolved through the nearest theme. The default is Neutral.
    var Tone Tone
    /// Expands the dialog panel to fill its available overlay.
    var Fullscreen bool
    /// Selects allowed Escape and backdrop dismissal. Default resolves from Preset.
    var DismissPolicy DialogDismissPolicy
    /// Caller-owned element to focus on opening. Nil uses the default focus target.
    var InitialFocus ElementHandle?
    /// Dialog header content.
    var Header Blob?
    /// Dialog body content.
    var Content Blob?
    /// Optional action row. Replaces the default cancel and confirm buttons.
    var Footer Blob?
    /// Optional custom cancel-button content.
    var CancelContent Blob?
    /// Optional custom confirm-button content.
    var ConfirmContent Blob?
    /// Requests false on backdrop dismissal or Escape when OnCancel is nil. OnCancel and OnConfirm remain separate actions.
    var OnOpenChange Action[bool]?
    /// Called by the cancel button and Escape key.
    var OnCancel Action?
    /// Called by the confirm button.
    var OnConfirm Action?
    /// Whether confirmation is disabled.
    var ConfirmDisabled bool
    /// Accessible dialog name. Nil resolves to "Dialog".
    var AccessibilityName string?
    /// Cancel text used when no content is supplied. Nil resolves to "Cancel".
    var CancelText string?
    /// Confirm text used when no content is supplied. Nil resolves to "Confirm".
    var ConfirmText string?
    /// Base overlay layer. Zero resolves to 20; mounted hosts add their opening order.
    var ZIndex int32
    /// Dialog width. Nil resolves to 560.
    var Width Length?
    /// Maximum dialog height. Nil resolves to 90%.
    var MaxHeight Length?
    /// Dialog padding. Nil resolves to 20 and preserves explicit zero.
    var Padding float64?
    /// Dialog content gap. Nil resolves to 16 and preserves explicit zero.
    var Gap float64?
    /// Dialog background. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Dialog border color. Nil uses the nearest theme.
    var BorderColor Color?
    /// Backdrop color. Nil resolves to translucent black.
    var BackdropColor Color?
    /// Explicit bindings applied at the modal focus-scope root.
    var KeyBindings([]KeyBinding)?
    /// Dialog border width. Nil resolves to 1 and preserves explicit zero.
    var BorderWidth float64?
    /// Dialog corner radius. Nil resolves to 8 and preserves explicit zero.
    var BorderRadius float64?
    /// Configures the fresh cancel before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: AutoFocus, KeyBindings (required entries), OnClick.
    var ConfigureCancel Action[ModalDialog, Blob, Button]?
    /// Configures the fresh confirm before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Disabled, KeyBindings (required entries), OnClick.
    var ConfigureConfirm Action[ModalDialog, Blob, Button]?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Modal (mounted dialog), Accessibility.Name (mounted dialog), Accessibility.Role (mounted dialog), Disabled (mounted dialog), Focusable (mounted dialog), Handle (mounted dialog), KeyBindings (required entries), OnKeyDown (mounted dialog), TabStop (mounted dialog).
    var ConfigureRoot Action[ModalDialog, Button, Container, Container]?

    internal prop CanEscape bool {
        get -> DismissPolicy != DialogDismissPolicy.Explicit
    }

    internal prop CanDismissBackdrop bool {
        get -> DismissPolicy == DialogDismissPolicy.EscapeAndBackdrop ||
            (DismissPolicy == DialogDismissPolicy.Default && Preset == ModalDialogPreset.Custom)
    }
    /// Builds a fresh in-parent overlay tree.
    public func Build() Blob {
        if !Open {
            return Container{
                HitTestSelf: false,
                Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
            }
        }

        let theme = Theme.Read()
        let configureCancel = ConfigureCancel
        let configureConfirm = ConfigureConfirm
        let configureRoot = ConfigureRoot
        let cancelText = CancelText ?? theme.Text("Cancel")
        let confirmText = ConfirmText ??
            theme.Text(Preset == ModalDialogPreset.Destructive ? "Delete": Preset == ModalDialogPreset.Form ? "Save": "Confirm")
        let defaultWidth Length = 560.0
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? theme.Text("Dialog"),
            CancelText = cancelText,
            ConfirmText = confirmText,
            Tone = Preset == ModalDialogPreset.Destructive ? Tone.Danger: Tone,
            Width = Width ?? defaultWidth,
            ZIndex = if ZIndex == 0 {
                20
            } else {
                ZIndex
            },
            MaxHeight = MaxHeight ?? Percent(90.0),
            Padding = Padding ?? theme.PanelPadding,
            Gap = Gap ?? theme.ControlGap,
            BackgroundColor = BackgroundColor ?? theme.OverlayColor,
            BorderColor = BorderColor ?? theme.BorderColor,
            BackdropColor = BackdropColor ?? theme.BackdropColor,
            BorderWidth = BorderWidth ?? theme.BorderWidth,
            BorderRadius = BorderRadius ?? theme.PanelRadius!!,
            ConfigureCancel = nil,
            ConfigureConfirm = nil,
            ConfigureRoot = nil,
        }

        let backdrop = Button{
            Position: PositionType.Absolute,
            Left: 0.0,
            Right: 0.0,
            Top: 0.0,
            Bottom: 0.0,
            BackgroundColor: resolved.BackdropColor!!,
            Cursor: Cursor.Pointer,
            Focusable: false,
            OnClick: resolved.CanDismissBackdrop ? () -> resolved.OnOpenChange?.Invoke(false): nil,
            Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
        }

        var actions = Footer
        if actions == nil {
            let cancelContent = CancelContent ??
                Text{
                Content: cancelText,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
            }
            let confirmContent = ConfirmContent ??
                Text{
                Content: confirmText,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
            }
            let cancel = Button{
                    Height: theme.ControlHeight,
                    Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                    BorderWidth: theme.BorderWidth,
                    BorderRadius: theme.ControlRadius!!,
                    BorderColor: resolved.BorderColor!!,
                    BackgroundColor: Color.Transparent,
                    Color: theme.TextColor,
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Cursor: Cursor.Pointer,
                    Focusable: true,
                    OnClick: resolved.OnCancel,
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: cancelText},
                    cancelContent,
                }
            if let configure = configureCancel {
                let originalAutoFocus = cancel.AutoFocus
                let originalOnClick = cancel.OnClick
                configure.Invoke(resolved, cancelContent, cancel)
                if cancel.AutoFocus != originalAutoFocus {
                    throw InvalidOperationException("ModalDialog owns AutoFocus; configure ModalDialog instead of changing it in ConfigureCancel")
                }
                if cancel.OnClick != originalOnClick {
                    throw InvalidOperationException("ModalDialog owns OnClick; configure ModalDialog instead of changing it in ConfigureCancel")
                }
            }
            let confirm = Button{
                    Height: theme.ControlHeight,
                    Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                    BorderRadius: theme.ControlRadius!!,
                    BackgroundColor: resolved.Tone == Tone.Danger ? theme.DangerFillColor: theme.AccentColor,
                    Color: theme.OnAccentColor,
                    HoverStyle: Style{BackgroundColor: resolved.Tone == Tone.Danger ? theme.DangerHoverColor: theme.AccentHoverColor},
                    ActiveStyle: Style{BackgroundColor: resolved.Tone == Tone.Danger ? theme.DangerFillColor: theme.AccentPressedColor},
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Cursor: if resolved.ConfirmDisabled {
                        Cursor.Default
                    } else {
                        Cursor.Pointer
                    },
                    Focusable: true,
                    Disabled: resolved.ConfirmDisabled,
                    OnClick: resolved.OnConfirm,
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: confirmText},
                    confirmContent,
                }
            if let configure = configureConfirm {
                let originalDisabled = confirm.Disabled
                let originalOnClick = confirm.OnClick
                configure.Invoke(resolved, confirmContent, confirm)
                if confirm.Disabled != originalDisabled {
                    throw InvalidOperationException("ModalDialog owns Disabled; configure ModalDialog instead of changing it in ConfigureConfirm")
                }
                if confirm.OnClick != originalOnClick {
                    throw InvalidOperationException("ModalDialog owns OnClick; configure ModalDialog instead of changing it in ConfigureConfirm")
                }
            }
            theme.ApplyInteraction(cancel, InteractionFamily.Button)
            theme.ApplyInteraction(confirm, InteractionFamily.Button)
            cancel.OnClick = resolved.OnCancel
            cancel.AutoFocus = InitialFocus == nil &&
                (Preset == ModalDialogPreset.Confirm || Preset == ModalDialogPreset.Destructive)
            WidgetKeyBindings.BindActivation(cancel)
            confirm.OnClick = resolved.OnConfirm
            WidgetKeyBindings.BindActivation(confirm)
            confirm.Disabled = resolved.ConfirmDisabled

            actions = Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.FlexEnd,
                Gap: theme.ControlGap,
                cancel,
                confirm,
            }
        }
        let dialog = Container{
            LineHeight: theme.LineHeight,
            Position: PositionType.Relative,
            Width: resolved.Fullscreen ? Percent(100): resolved.Width!!,
            MaxWidth: Percent(100),
            Height: resolved.Fullscreen ? Percent(100): Length.Auto,
            MaxHeight: resolved.Fullscreen ? Percent(100): resolved.MaxHeight!!,
            MinHeight: 0.0,
            Padding: resolved.Padding!!,
            Gap: resolved.Gap!!,
            BasedOn: theme.OverlayStyle,
            BackgroundColor: resolved.BackgroundColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderColor: resolved.BorderColor!!,
            BorderRadius: resolved.BorderRadius!!,
            Focusable: true,
            Overflow: Overflow.Hidden,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Dialog,
                Name: resolved.AccessibilityName!!,
                Modal: true,
            },
        }
        if resolved.OnCancel != nil || resolved.OnOpenChange != nil {
            dialog.OnKeyDown = (event KeyEvent) -> {
                if event.Key == Key.Escape && resolved.CanEscape {
                    event.PreventDefault()
                    event.StopPropagation()
                    if !event.Repeat {
                        if let cancel = resolved.OnCancel {
                            cancel()
                        } else {
                            resolved.OnOpenChange?.Invoke(false)
                        }
                    }
                }
            }
        }
        if let header = Header {
            dialog.Children.Add(header)
        }
        if let content = Content {
            dialog.Children.Add(content)
        }
        dialog.Children.Add(actions)

        let root = Container{
                Position: PositionType.Absolute,
                Left: 0.0,
                Right: 0.0,
                Top: 0.0,
                Bottom: 0.0,
                ZIndex: resolved.ZIndex,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                backdrop,
                dialog,
            }
        if let configure = configureRoot {
            let originalAccessibilityModal = root.Accessibility?.Modal
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            let originalDisabled = root.Disabled
            let originalFocusable = root.Focusable
            let originalHandle = root.Handle
            let originalOnKeyDown = root.OnKeyDown
            let originalTabStop = root.TabStop
            configure.Invoke(resolved, backdrop, dialog, root)
            if root.Accessibility?.Modal != originalAccessibilityModal {
                throw InvalidOperationException("ModalDialog owns Accessibility.Modal; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("ModalDialog owns Accessibility.Name; set ModalDialog.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("ModalDialog owns Accessibility.Role; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if root.Disabled != originalDisabled {
                throw InvalidOperationException("ModalDialog owns Disabled; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if root.Focusable != originalFocusable {
                throw InvalidOperationException("ModalDialog owns Focusable; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if root.Handle != originalHandle {
                throw InvalidOperationException("ModalDialog owns Handle; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if root.OnKeyDown != originalOnKeyDown {
                throw InvalidOperationException("ModalDialog owns OnKeyDown; configure ModalDialog instead of changing it in ConfigureRoot")
            }
            if root.TabStop != originalTabStop {
                throw InvalidOperationException("ModalDialog owns TabStop; configure ModalDialog instead of changing it in ConfigureRoot")
            }
        }
        if resolved.KeyBindings != nil {
            WidgetKeyBindings.AppendBindings(root, resolved.KeyBindings!!)
        }
        return root
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w ModalDialog) Blob -> w.Build()
