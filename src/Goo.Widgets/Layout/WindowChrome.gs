package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import Goo.Widgets.Navigation
import System
import System.Collections.Generic

/// Identifies a standard window chrome command.
public enum WindowChromeAction {
    /// Requests minimization of the window.
    Minimize;
    /// Requests maximization of the window.
    Maximize;
    /// Requests restoration of the normal window size.
    Restore;
    /// Requests closure of the window.
    Close
}

/// A configurable drag region with optional standard window controls.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
public data struct WindowChrome {
    /// Window controlled by default actions. Callbacks can replace it. Native controls that overlap Host pad the chrome.
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
    /// Whether to show the minimize control. Nil shows it unless Host has native controls in the chrome.
    var ShowMinimize bool?
    /// Whether to show the maximize or restore control. Nil shows it unless Host has native controls in the chrome.
    var ShowMaximize bool?
    /// Whether to show the close control. Nil shows it unless Host has native controls in the chrome.
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
    /// Hosts must not change state in this callback.
    var CreateMenu Func[WindowChrome, MenuInput, MenuInput]?
    /// Chrome height. Nil uses the theme control height.
    var Height Length?
    /// Width of each control. Nil uses the larger of 46 and the theme control height.
    var ControlWidth float64?
    /// Chrome background. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Chrome bottom border. Nil uses the nearest theme.
    var BorderColor Color?
    /// Control foreground. Nil uses the nearest theme.
    var ControlColor Color?
    /// Control hover background. Nil uses the nearest theme.
    var HoverBackgroundColor Color?
    /// Close control hover background. Nil uses the nearest theme.
    var CloseHoverBackgroundColor Color?
    /// Optional base style for the drag region container.
    var RootStyle Style?
    /// Creates content for a standard control.
    /// Hosts must not change state in this callback.
    /// Return a fresh element or the supplied default.
    var CreateControlContent Func[WindowChrome, WindowChromeAction, Blob]?
    /// Configures the fresh control before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Role, Disabled, Focusable, KeyBindings (required entries), OnClick.
    var ConfigureControl Action[WindowChrome, WindowChromeAction, Blob, Action?, Button]?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Focusable, OnClick, OnPointerDown.
    var ConfigureRoot Action[WindowChrome, []Blob, Container]?

    shared {
        private let minimizeGlyph VectorPath = PathBuilder(0, 0, 10, 10)
            .MoveTo(0, 5).LineTo(10, 5).LineTo(10, 6).LineTo(0, 6).Close()
            .Build()
        private let maximizeGlyph VectorPath = PathBuilder(0, 0, 10, 10)
            .MoveTo(0, 0).LineTo(10, 0).LineTo(10, 10).LineTo(0, 10).Close()
            .MoveTo(1, 1).LineTo(1, 9).LineTo(9, 9).LineTo(9, 1).Close()
            .Build()
        private let restoreGlyph VectorPath = PathBuilder(0, 0, 10, 10)
            .MoveTo(0, 2).LineTo(8, 2).LineTo(8, 10).LineTo(0, 10).Close()
            .MoveTo(1, 3).LineTo(1, 9).LineTo(7, 9).LineTo(7, 3).Close()
            .MoveTo(2, 2).LineTo(2, 0).LineTo(10, 0).LineTo(10, 8).LineTo(8, 8).LineTo(8, 7).LineTo(9, 7).LineTo(9, 1).LineTo(3, 1).LineTo(3, 2).Close()
            .Build()
        private let closeGlyph VectorPath = PathBuilder(0, 0, 10, 10)
            .MoveTo(0, 0.7).LineTo(0.7, 0).LineTo(10, 9.3).LineTo(9.3, 10).Close()
            .MoveTo(9.3, 0).LineTo(10, 0.7).LineTo(0.7, 10).LineTo(0, 9.3).Close()
            .Build()

        /// Lets chrome replace the native title bar. Call before Open. macOS keeps its native window controls.
        public func ReplaceTitlebar(window Window) {
            if OperatingSystem.IsMacOS() {
                window.ContentUnderTitlebar = true
            } else {
                window.Decorated = false
            }
        }
    }

    /// Builds a fresh tree, retaining host-state and menu behavior when needed.
    public func Build() Blob {
        if Host != nil || EnableDoubleClick || EnableContextMenu {
            return Cell.Mount[WindowChrome, WindowChromeState](nil, this)
        }
        let theme = Theme.Read()
        return Resolve(theme).BuildResolved(theme)
    }

    internal func Resolve(theme Theme) WindowChrome {
        let host = Host
        let maximized = IsMaximized ?? (host?.State == WindowState.Maximized || host?.State == WindowState.Fullscreen)
        let controls = host?.TitlebarControlsRect
        var resolved = this with{
            IsMaximized = maximized,
            ShowMinimize = ShowMinimize ?? controls == nil,
            ShowMaximize = ShowMaximize ?? controls == nil,
            ShowClose = ShowClose ?? controls == nil,
            Height = if let height = Height {
                height.HasMagnitude && !height.IsPercent ? Math.Max(height.Magnitude, controls?.Height ?? 0.0): height
            } else {
                Math.Max(theme.ControlHeight, controls?.Height ?? 0.0)
            },
            ControlWidth = ControlWidth ?? Math.Max(46.0, theme.ControlHeight),
            BackgroundColor = BackgroundColor ?? theme.ChromeColor,
            BorderColor = BorderColor ?? (theme.GlassColor == nil ? theme.BorderColor: Color.Transparent),
            ControlColor = ControlColor ?? theme.ChromeTextColor,
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            CloseHoverBackgroundColor = CloseHoverBackgroundColor ?? theme.DangerHoverColor,
        }
        if resolved.Height!!.HasMagnitude && (!Double.IsFinite(resolved.Height!!.Magnitude) || resolved.Height!!.Magnitude <= 0.0)
        || !Double.IsFinite(resolved.ControlWidth!!) || resolved.ControlWidth!! <= 0.0 {
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

    internal func BuildResolved(theme Theme, blankPointer Action[PointerEvent]? = nil) Container {
        let createContent = CreateControlContent
        let configureControl = ConfigureControl
        let configureRoot = ConfigureRoot
        let resolved = this with{CreateControlContent = nil, ConfigureControl = nil, ConfigureRoot = nil, CreateMenu = nil}
        let maximized = resolved.IsMaximized!!
        let children = List[Blob]()
        if let leading = resolved.LeadingContent {
            children.Add(Container(){leading})
        }
        children.Add(Container{FlexGrow: 1.0, Height: Percent(100)})
        if let trailing = resolved.TrailingContent {
            children.Add(Container(){trailing})
        }
        if resolved.ShowMinimize!! {
            children.Add(
                BuildControl(
                    theme,
                    resolved,
                    WindowChromeAction.Minimize,
                    resolved.OnMinimize,
                    createContent,
                    configureControl
                )
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
                    theme,
                    resolved,
                    command,
                    if maximized {
                        resolved.OnRestore
                    } else {
                        resolved.OnMaximize
                    },
                    createContent,
                    configureControl
                )
            )
        }
        if resolved.ShowClose!! {
            children.Add(
                BuildControl(theme, resolved, WindowChromeAction.Close, resolved.OnClose, createContent, configureControl)
            )
        }
        let ordered = children.ToArray()
        let prepared = Container{
            Height: resolved.Height!!,
            FlexShrink: 0.0,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: resolved.BackgroundColor!!,
            BorderWidth: Edges{Bottom: 1.0},
            BorderColor: Edges[Color]{Bottom: resolved.BorderColor!!},
            BasedOn: resolved.RootStyle,
            Children: children,
        }
        let root = prepared
        root.Children.Clear()
        if let controls = resolved.Host?.TitlebarControlsRect {
            root.PaddingStart = controls.X + controls.Width
        }
        for child in ordered {
            root.Children.Add(child)
        }
        configureRoot?.Invoke(resolved, ordered, root)
        root.Focusable = false
        root.OnClick = nil
        if let handler = blankPointer {
            root.OnPointerDown = handler
        }
        return Window.DragRegion(root)
    }

    private func BuildControl(
        theme Theme,
        resolved WindowChrome,
        command WindowChromeAction,
        action Action?,
        createContent Func[WindowChrome, WindowChromeAction, Blob]?,
        configureControl Action[WindowChrome, WindowChromeAction, Blob, Action?, Button]?
    ) Blob {
        let content = if let createContent = createContent {
            createContent(resolved, command)
        } else {
            Shape{
                Path: Glyph(command),
                Width: 10.0,
                Height: 10.0,
                Fill: VectorPaint(resolved.ControlColor!!),
                UseCurrentColor: true,
                Accessibility: Accessibility{Hidden: true},
            }
        }
        let prepared = Button{
            Width: resolved.ControlWidth!!,
            Height: Percent(100),
            Padding: 0.0,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Cursor: Cursor.Pointer,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            Color: resolved.ControlColor!!,
            HoverStyle: Style{
                BackgroundColor: if command == WindowChromeAction.Close {
                    resolved.CloseHoverBackgroundColor!!
                } else {
                    resolved.HoverBackgroundColor!!
                },
                Color: if command == WindowChromeAction.Close {
                    theme.OnAccentColor
                } else {
                    resolved.ControlColor!!
                },
            },
            ActiveStyle: command == WindowChromeAction.Close ? Style{BackgroundColor: theme.DangerFillColor, Color: theme.OnAccentColor}: nil,
        }
        let control = prepared
        control.Children.Clear()
        control.Children.Add(content)
        configureControl?.Invoke(resolved, command, content, action, control)
        theme.ApplyInteraction(control, InteractionFamily.Button)
        control.Disabled = action == nil
        control.Focusable = action != nil
        let controlAccessibility = if let configured = control.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        controlAccessibility.Role = AccessibilityRole.Button
        controlAccessibility.Name = theme.Text(Name(command))
        control.Accessibility = controlAccessibility
        control.OnClick = action
        WidgetKeyBindings.BindActivation(control)
        return control
    }

    private func Name(command WindowChromeAction) string -> switch command {
        case WindowChromeAction.Minimize: "Minimize"
        case WindowChromeAction.Maximize: "Maximize"
        case WindowChromeAction.Restore: "Restore"
        case WindowChromeAction.Close: "Close"
        default: "Window control"
    }

    private func Glyph(command WindowChromeAction) VectorPath -> switch command {
        case WindowChromeAction.Minimize: minimizeGlyph
        case WindowChromeAction.Maximize: maximizeGlyph
        case WindowChromeAction.Restore: restoreGlyph
        default: closeGlyph
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w WindowChrome) Blob -> w.Build()
