package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Navigation
import System
import System.Collections.Generic

/// Identifies a standard window chrome command.
public enum WindowChromeAction {
    Minimize;
    Maximize;
    Restore;
    Close
}

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
    /// Handles a blank titlebar double-click with the resolved maximize/restore action.
    /// Supply Host to intercept native drag-region clicks in an undecorated window.
    /// False leaves the operating system's default titlebar behavior in place.
    var EnableDoubleClick bool
    /// Enables the standard window command menu on right-click, Menu, and Shift+F10.
    var EnableContextMenu bool
    /// Optional mounted collision viewport for the context menu.
    var OverlayHost ElementHandle?
    /// Customizes menu presentation. Open state, actions, anchor, and dismissal are rewired.
    var CreateMenu Func[WindowChrome, MenuInput, MenuInput]?
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
    /// Creates the final container; required children and drag/input wiring are reapplied.
    var CreateRoot Func[WindowChrome, []Blob, Container]?

    /// Builds a fresh tree, retaining host-state and menu behavior when needed.
    public func Build() Blob {
        if Host != nil || EnableDoubleClick || EnableContextMenu {
            return Cell.Mount[WindowChrome, WindowChromeState](nil, this)
        }
        return Resolve().BuildResolved()
    }

    internal func Resolve() WindowChrome {
        let host = Host
        let maximized = IsMaximized ?? (host?.State == WindowState.Maximized || host?.State == WindowState.Fullscreen)
        var resolved = this with{
            IsMaximized = maximized,
            ShowMinimize = ShowMinimize ?? true,
            ShowMaximize = ShowMaximize ?? true,
            ShowClose = ShowClose ?? true,
            Height = if Height == 0.0 {
                32.0
            } else {
                Height
            },
            ControlWidth = if ControlWidth == 0.0 {
                46.0
            } else {
                ControlWidth
            },
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            BorderColor = BorderColor ?? Color.Parse("#27272a"),
            ControlColor = ControlColor ?? Color.Parse("#a1a1aa"),
            HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
            CloseHoverBackgroundColor = CloseHoverBackgroundColor ?? Color.Parse("#a62e3a"),
        }
        if !Double.IsFinite(resolved.Height) || resolved.Height <= 0.0
        || !Double.IsFinite(resolved.ControlWidth) || resolved.ControlWidth <= 0.0 {
            throw ArgumentOutOfRangeException("WindowChrome dimensions")
        }
        if let host = host {
            resolved.OnMinimize ??= () -> {
                host.State = WindowState.Minimized
            }
            if host.Resizable {
                resolved.OnMaximize ??= () -> {
                    host.State = WindowState.Maximized
                }
            }
            resolved.OnRestore ??= () -> {
                host.State = WindowState.Normal
            }
            resolved.OnClose ??= () -> host.RequestClose()
        }
        return resolved
    }

    internal func BuildResolved(blankPointer Action[PointerEvent]? = nil) Container {
        let createContent = CreateControlContent
        let createControl = CreateControl
        let createRoot = CreateRoot
        let resolved = this with{CreateControlContent = nil, CreateControl = nil, CreateRoot = nil, CreateMenu = nil}
        let maximized = resolved.IsMaximized!!
        let children = List[Blob]()
        if let leading = resolved.LeadingContent {
            children.Add(Container(){leading})
        }
        children.Add(Container{FlexGrow: 1.0, Height: Length.Percent(100)})
        if let trailing = resolved.TrailingContent {
            children.Add(Container(){trailing})
        }
        if resolved.ShowMinimize!! {
            children.Add(
                BuildControl(resolved, WindowChromeAction.Minimize, resolved.OnMinimize, createContent, createControl)
            )
        }
        if resolved.ShowMaximize!! {
            let command = if maximized {
                WindowChromeAction.Restore
            } else {
                WindowChromeAction.Maximize
            }
            children.Add(
                BuildControl(
                    resolved,
                    command,
                    if maximized {
                        resolved.OnRestore
                    } else {
                        resolved.OnMaximize
                    },
                    createContent,
                    createControl
                )
            )
        }
        if resolved.ShowClose!! {
            children.Add(
                BuildControl(resolved, WindowChromeAction.Close, resolved.OnClose, createContent, createControl)
            )
        }
        let ordered = children.ToArray()
        let prepared = Container{
            BasedOn: resolved.RootStyle,
            Height: resolved.Height,
            FlexShrink: 0.0,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: resolved.BackgroundColor!!,
            BorderBottomWidth: 1.0,
            BorderBottomColor: resolved.BorderColor!!,
            Children: children,
        }
        let root = if let create = createRoot {
            create(resolved, ordered)
        } else {
            prepared
        }
        root.Children.Clear()
        for child in ordered {
            root.Children.Add(child)
        }
        root.Focusable = false
        root.OnClick = nil
        if let handler = blankPointer {
            root.OnPointerDown = handler
        }
        return Window.DragRegion(root)
    }

    private func BuildControl(
        resolved WindowChrome,
        command WindowChromeAction,
        action Action?,
        createContent Func[WindowChrome, WindowChromeAction, Blob]?,
        createControl Func[WindowChrome, WindowChromeAction, Blob, Action?, Button]?
    ) Blob {
        let content = if let createContent = createContent {
            createContent(resolved, command)
        } else {
            MaterialIcons.Create(IconName(command), 18.0, resolved.ControlColor)
        }
        let prepared = Button{
            Width: resolved.ControlWidth,
            Height: resolved.Height,
            Padding: 0.0,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Cursor: Cursor.Pointer,
            Hover: Style{
                BackgroundColor: if command == WindowChromeAction.Close {
                    resolved.CloseHoverBackgroundColor!!
                } else {
                    resolved.HoverBackgroundColor!!
                },
            },
        }
        let control = if let create = createControl {
            create(resolved, command, content, action)
        } else {
            prepared
        }
        control.Disabled = action == nil
        control.Focusable = action != nil
        control.Accessibility = Accessibility{Role: AccessibilityRole.Button, Name: Name(command)}
        control.OnClick = action
        WidgetKeyBindings.BindActivation(control)
        control.Children.Clear()
        control.Children.Add(content)
        return control
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
