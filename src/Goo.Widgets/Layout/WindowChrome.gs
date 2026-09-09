package Goo.Widgets.Layout

import System
import System.Collections.Generic
import Goo
import Goo.Widgets.Icons

/// Identifies a standard window chrome command.
public enum WindowChromeAction { Minimize; Maximize; Restore; Close }

/// A configurable drag region with optional standard window controls.
public data struct WindowChrome {
  /// Window controlled by default actions. Callbacks can replace it.
  var Host Window?
  /// Optional content placed before the flexible drag region.
  var LeadingContent Blob?
  /// Optional content placed before the window controls.
  var TrailingContent Blob?
  /// Overrides the minimize action.
  var OnMinimize Action?
  /// Overrides the maximize action.
  var OnMaximize Action?
  /// Overrides the restore action.
  var OnRestore Action?
  /// Overrides the close action.
  var OnClose Action?
  /// Explicit maximized state. Nil reads the host state.
  var IsMaximized bool?
  /// Whether to show the minimize control. Nil resolves to true.
  var ShowMinimize bool?
  /// Whether to show the maximize or restore control. Nil resolves to true.
  var ShowMaximize bool?
  /// Whether to show the close control. Nil resolves to true.
  var ShowClose bool?
  /// Chrome height. Zero resolves to 32.0.
  var Height float64
  /// Width of each control. Zero resolves to 46.0.
  var ControlWidth float64
  /// Chrome background. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Chrome bottom border. Nil resolves to #27272a.
  var BorderColor Color?
  /// Control foreground. Nil resolves to #a1a1aa.
  var ControlColor Color?
  /// Control hover background. Nil resolves to #27272a.
  var HoverBackgroundColor Color?
  /// Close control hover background. Nil resolves to #a62e3a.
  var CloseHoverBackgroundColor Color?
  /// Optional base style for the drag region container.
  var RootStyle Style?
  /// Creates content for a standard control.
  var CreateControlContent Func[WindowChrome, WindowChromeAction, Blob]?
  /// Creates a standard control from resolved props, command, content, and action.
  var CreateControl Func[WindowChrome, WindowChromeAction, Blob, Action?, Button]?
  /// Creates the final non-drag-region container from resolved props and ordered children.
  var CreateRoot Func[WindowChrome, []Blob, Container]?

  /// Builds a fresh Goo window chrome tree.
  public func Build() Blob {
    let createContent = CreateControlContent
    let createControl = CreateControl
    let createRoot = CreateRoot
    let host = Host
    let maximized = IsMaximized ?? (host?.State == WindowState.Maximized || host?.State == WindowState.Fullscreen)
    let resolved = this with{
      IsMaximized = maximized,
      ShowMinimize = ShowMinimize ?? true,
      ShowMaximize = ShowMaximize ?? true,
      ShowClose = ShowClose ?? true,
      Height = if Height == 0.0 { 32.0 } else { Height },
      ControlWidth = if ControlWidth == 0.0 { 46.0 } else { ControlWidth },
      BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
      BorderColor = BorderColor ?? Color.Parse("#27272a"),
      ControlColor = ControlColor ?? Color.Parse("#a1a1aa"),
      HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
      CloseHoverBackgroundColor = CloseHoverBackgroundColor ?? Color.Parse("#a62e3a"),
      CreateControlContent = nil,
      CreateControl = nil,
      CreateRoot = nil,
    }
    var minimize = resolved.OnMinimize
    var maximize = resolved.OnMaximize
    var restore = resolved.OnRestore
    var close = resolved.OnClose
    if let host = host {
      minimize ??= () -> { host.State = WindowState.Minimized }
      maximize ??= () -> { host.State = WindowState.Maximized }
      restore ??= () -> { host.State = WindowState.Normal }
      close ??= () -> host.RequestClose()
    }
    let children = List[Blob]()
    if let leading = resolved.LeadingContent { children.Add(Container{ Children: { leading } }) }
    children.Add(Container{ FlexGrow: 1.0 })
    if let trailing = resolved.TrailingContent { children.Add(Container{ Children: { trailing } }) }
    if resolved.ShowMinimize!! {
      children.Add(BuildControl(resolved, WindowChromeAction.Minimize, minimize, createContent, createControl))
    }
    if resolved.ShowMaximize!! {
      let command = if maximized { WindowChromeAction.Restore } else { WindowChromeAction.Maximize }
      children.Add(BuildControl(resolved, command, if maximized { restore } else { maximize }, createContent, createControl))
    }
    if resolved.ShowClose!! {
      children.Add(BuildControl(resolved, WindowChromeAction.Close, close, createContent, createControl))
    }
    let ordered = children.ToArray()
    if let createRoot = createRoot {
      return Window.DragRegion(createRoot(resolved, ordered))
    }
    return Window.DragRegion(Container{
      BasedOn: resolved.RootStyle,
      Height: resolved.Height,
      FlexShrink: 0.0,
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      BackgroundColor: resolved.BackgroundColor!!,
      BorderBottomWidth: 1.0,
      BorderBottomColor: resolved.BorderColor!!,
      Children: ordered,
    })
  }

  private func BuildControl(resolved WindowChrome, command WindowChromeAction, action Action?,
    createContent Func[WindowChrome, WindowChromeAction, Blob]?,
    createControl Func[WindowChrome, WindowChromeAction, Blob, Action?, Button]?) Blob{
      let content = if let createContent = createContent {
        createContent(resolved, command)
      } else {
        MaterialIcons.Create(IconName(command), 18.0, resolved.ControlColor)
      }
      if let createControl = createControl {
        return createControl(resolved, command, content, action)
      }
      return Button{
        Width: resolved.ControlWidth,
        Height: resolved.Height,
        Padding: 0.0,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        Cursor: Cursor.Pointer,
        Disabled: action == nil,
        Hover: Style{
          BackgroundColor: if command == WindowChromeAction.Close { resolved.CloseHoverBackgroundColor!! } else { resolved.HoverBackgroundColor!! },
        },
        Accessibility: Accessibility{ Role: AccessibilityRole.Button, Name: Name(command) },
        OnClick: action,
        Children: { content },
      }
    }

  private func Name(command WindowChromeAction) string -> switch command {
    case WindowChromeAction.Minimize: "Minimize"
    case WindowChromeAction.Maximize: "Maximize"
    case WindowChromeAction.Restore: "Restore"
    case WindowChromeAction.Close: "Close"
    default: "Window control"
  }

  private func IconName(command WindowChromeAction) string -> switch command {
    case WindowChromeAction.Minimize: "remove"
    case WindowChromeAction.Maximize: "crop_square"
    case WindowChromeAction.Restore: "filter_none"
    default: "close"
  }
}
