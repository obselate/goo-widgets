package Goo.Widgets.Layout

import Goo
import System

/// Presents ModalDialog in the Window overlay with focus containment, modal input isolation,
/// and nested focus restoration.
public open class ModalDialogHost : Cell[ModalDialog], IDisposable {
    private let rootHandle ElementHandle = ElementHandle()
    private var activeScope FocusScope?
    private var current ModalDialog
    private var rootKeyHandler Action[KeyEvent]?
    private var disposed bool

    /// Subscribes to root geometry for focus containment. Dispose the host to release the subscription and focus scope.
    public init() {
        rootHandle.MetricsChanged += Metrics
    }

    /// Releases the geometry subscription and closes the mounted focus scope.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        rootHandle.MetricsChanged -= Metrics
        CloseScope()
    }

    protected override func Build(input ModalDialog) Blob {
        current = input
        if !input.Open {
            CloseScope()
            return Present(input.Build())
        }
        let visual = input with{
            ConfigureRoot = ConfigureMountedRoot,
            OnCancel = input.OnCancel == nil ? nil: () -> InvokeInputCallback(input.OnCancel),
            OnConfirm = input.OnConfirm == nil ? nil: () -> InvokeInputCallback(input.OnConfirm),
            OnOpenChange = value -> InvokeInputCallback(input.OnOpenChange, value),
        }
        return Present(visual.Build())
    }

    private func Present(content Blob) Portal -> Portal{
        Width: Percent(100),
        Height: Percent(100),
        ZIndex: (current.ZIndex == 0 ? 20: current.ZIndex) + (activeScope?.Order ?? 0),
        content,
    }

    private func ConfigureMountedRoot(resolved ModalDialog, backdrop Button, panel Container, result Container) {
        current.ConfigureRoot?.Invoke(resolved, backdrop, panel, result)
        backdrop.Key = "backdrop"
        backdrop.Focusable = false
        backdrop.OnClick = resolved.CanDismissBackdrop ? () -> resolved.OnOpenChange?.Invoke(false): nil
        panel.Key = "dialog"
        panel.Focusable = false
        panel.TabStop = false
        let panelAccessibility = if let configured = panel.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        panelAccessibility.Role = AccessibilityRole.None
        panel.Accessibility = panelAccessibility
        rootKeyHandler = result.OnKeyDown
        result.Handle = rootHandle
        result.Focusable = true
        result.TabStop = false
        result.Disabled = false
        result.ZIndex = resolved.ZIndex + (activeScope?.Order ?? 0)
        let resultAccessibility = if let configured = result.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        resultAccessibility.Role = AccessibilityRole.Dialog
        resultAccessibility.Name = resolved.AccessibilityName!!
        resultAccessibility.Modal = true
        result.Accessibility = resultAccessibility
        result.OnKeyDown = HandleKey
    }

    private func HandleKey(event KeyEvent) {
        if event.Key == Key.Escape {
            event.PreventDefault()
            event.StopPropagation()
            if !event.Repeat && current.CanEscape {
                if let cancel = current.OnCancel {
                    InvokeInputCallback(cancel)
                } else {
                    InvokeInputCallback(current.OnOpenChange, false)
                }
            }
            return
        }
        rootKeyHandler?.Invoke(event)
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !current.Open {
            return
        }
        if !metrics.IsMounted {
            CloseScope()
            return
        }
        if activeScope != nil {
            return
        }
        activeScope = rootHandle.BeginFocusScope(FocusScopeOptions{Modal: true, InitialFocus: current.InitialFocus})
        Rebuild()
    }

    private func CloseScope() {
        activeScope?.Dispose()
        activeScope = nil
    }
}
