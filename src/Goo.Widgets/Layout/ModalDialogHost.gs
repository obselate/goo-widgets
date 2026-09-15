package Goo.Widgets.Layout

import System
import Goo

/// Mounts ModalDialog with focus containment, modal input isolation, and nested focus restoration.
/// Place hosts under the same full-window overlay parent so their opening order also orders painting.
public open class ModalDialogHost : Cell[ModalDialog], IDisposable {
  private let rootHandle ElementHandle = ElementHandle()
  private var activeScope FocusScope?
  private var current ModalDialog
  private var rootKeyHandler Action[KeyEvent]?
  private var disposed bool

  public init() { rootHandle.MetricsChanged += Metrics }

  /// Releases the geometry subscription and closes the mounted focus scope.
  public func Dispose() {
    if disposed { return }
    disposed = true
    rootHandle.MetricsChanged -= Metrics
    CloseScope()
  }

  protected override func Build(input ModalDialog) Blob {
    current = input
    if !input.Open {
      CloseScope()
      return input.Build()
    }
    let visual = input with{ CreateRoot = CreateMountedRoot }
    return visual.Build()
  }

  private func CreateMountedRoot(resolved ModalDialog, backdrop Button, panel Container) Container {
    let result = if let create = current.CreateRoot { create(resolved, backdrop, panel) }
    else { Container{
      Position: PositionType.Absolute, Left: 0.0, Right: 0.0, Top: 0.0, Bottom: 0.0,
      AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
    } }
    backdrop.Key = "backdrop"
    backdrop.Focusable = false
    backdrop.OnClick = current.OnClose
    panel.Key = "dialog"
    panel.Focusable = false
    panel.TabStop = false
    panel.Accessibility = Accessibility{Role: AccessibilityRole.None}
    rootKeyHandler = result.OnKeyDown
    result.Handle = rootHandle
    result.Focusable = true
    result.TabStop = false
    result.Disabled = false
    result.ZIndex = resolved.ZIndex + (activeScope?.Order ?? 0)
    result.Accessibility = Accessibility{
      Role: AccessibilityRole.Dialog, Name: resolved.AccessibilityName!!, Modal: true,
    }
    result.OnKeyDown = HandleKey
    result.Children.Clear()
    result.Children.Add(backdrop)
    result.Children.Add(panel)
    return result
  }

  private func HandleKey(event KeyEvent) {
    if event.Key == Key.Escape {
      event.PreventDefault()
      event.StopPropagation()
      let callback = current.OnCancel ?? current.OnClose
      if !event.Repeat { callback?.Invoke() }
      return
    }
    rootKeyHandler?.Invoke(event)
  }

  private func Metrics(metrics ElementMetrics) {
    if disposed || !current.Open { return }
    if !metrics.IsMounted { CloseScope()
      return }
    if activeScope != nil { return }
    activeScope = rootHandle.BeginFocusScope(FocusScopeOptions{Modal: true})
    Rebuild()
  }

  private func CloseScope() { activeScope?.Dispose()
    activeScope = nil }
}
