package Goo.Widgets.Layout

import Goo
import Goo.Widgets

/// A composable in-parent modal overlay with host-owned close, cancel, and confirm actions.
public data struct ModalDialog {
    /// Whether the overlay is rendered.
    var Open bool
    /// Dialog header content.
    var Header Blob?
    /// Dialog body content.
    var Content Blob?
    /// Optional custom cancel-button content.
    var CancelContent Blob?
    /// Optional custom confirm-button content.
    var ConfirmContent Blob?
    /// Called when the backdrop is activated.
    var OnClose Action?
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
    /// Dialog width. Zero resolves to 560.
    var Width float64
    /// Maximum dialog height. Nil resolves to 90%.
    var MaxHeight Length?
    /// Dialog padding. Nil resolves to 20 and preserves explicit zero.
    var Padding float64?
    /// Dialog content gap. Nil resolves to 16 and preserves explicit zero.
    var Gap float64?
    /// Dialog background. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Dialog border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Backdrop color. Nil resolves to translucent black.
    var BackdropColor Color?
    /// Explicit bindings applied at the modal focus-scope root.
    var KeyBindings([]KeyBinding)?
    /// Dialog border width. Nil resolves to 1 and preserves explicit zero.
    var BorderWidth float64?
    /// Dialog corner radius. Nil resolves to 8 and preserves explicit zero.
    var BorderRadius float64?
    /// Creates the cancel button from resolved values and final content.
    var CreateCancel Func[ModalDialog, Blob, Button]?
    /// Creates the confirm button from resolved values and final content.
    var CreateConfirm Func[ModalDialog, Blob, Button]?
    /// Creates the final overlay from resolved values, backdrop, and dialog panel.
    var CreateRoot Func[ModalDialog, Button, Container, Container]?

    /// Builds a fresh in-parent overlay tree.
    public func Build() Blob {
        if !Open {
            return Container{
                HitTestSelf: false,
                Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
            }
        }

        let createCancel = CreateCancel
        let createConfirm = CreateConfirm
        let createRoot = CreateRoot
        let cancelText = CancelText ?? "Cancel"
        let confirmText = ConfirmText ?? "Confirm"
        let resolved = this with{
            AccessibilityName = AccessibilityName ?? "Dialog",
            CancelText = cancelText,
            ConfirmText = confirmText,
            Width = if Width == 0.0 {
                560.0
            } else {
                Width
            },
            ZIndex = if ZIndex == 0 {
                20
            } else {
                ZIndex
            },
            MaxHeight = MaxHeight ?? Length.Percent(90.0),
            Padding = Padding ?? 20.0,
            Gap = Gap ?? 16.0,
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            BackdropColor = BackdropColor ?? Color.Rgba(0, 0, 0, 204),
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 8.0,
            CreateCancel = nil,
            CreateConfirm = nil,
            CreateRoot = nil,
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
            OnClick: resolved.OnClose,
            Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
        }

        let cancelContent = CancelContent ?? Text{Content: cancelText}
        let confirmContent = ConfirmContent ?? Text{Content: confirmText}
        let cancel = if let createCancel = createCancel {
            createCancel(resolved, cancelContent)
        } else {
            Button{
                Height: 36.0,
                PaddingLeft: 14.0,
                PaddingRight: 14.0,
                BorderWidth: 1.0,
                BorderRadius: 6.0,
                BorderColor: resolved.BorderColor!!,
                BackgroundColor: Color.Transparent,
                Cursor: Cursor.Pointer,
                Focusable: true,
                OnClick: resolved.OnCancel,
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: cancelText},
                cancelContent,
            }
        }
        let confirm = if let createConfirm = createConfirm {
            createConfirm(resolved, confirmContent)
        } else {
            Button{
                Height: 36.0,
                PaddingLeft: 14.0,
                PaddingRight: 14.0,
                BorderRadius: 6.0,
                BackgroundColor: Color.Parse("#fafafa"),
                Color: Color.Parse("#09090b"),
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
        }

        cancel.OnClick = resolved.OnCancel
        WidgetKeyBindings.BindActivation(cancel)
        confirm.OnClick = resolved.OnConfirm
        WidgetKeyBindings.BindActivation(confirm)
        confirm.Disabled = resolved.ConfirmDisabled

        let actions = Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.FlexEnd,
            Gap: 8.0,
            cancel,
            confirm,
        }
        let dialog = Container{
            Position: PositionType.Relative,
            Width: resolved.Width,
            MaxHeight: resolved.MaxHeight!!,
            MinHeight: 0.0,
            PaddingLeft: resolved.Padding!!,
            PaddingRight: resolved.Padding!!,
            PaddingTop: resolved.Padding!!,
            PaddingBottom: resolved.Padding!!,
            Gap: resolved.Gap!!,
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
        if let onCancel = resolved.OnCancel {
            dialog.OnKeyDown = (event KeyEvent) -> {
                if event.Key == Key.Escape {
                    event.PreventDefault()
                    event.StopPropagation()
                    if !event.Repeat {
                        onCancel()
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

        let root = if let createRoot = createRoot {
            createRoot(resolved, backdrop, dialog)
        } else {
            Container{
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
        }
        if resolved.KeyBindings != nil {
            root.KeyBindings = resolved.KeyBindings
        }
        return root
    }
}
