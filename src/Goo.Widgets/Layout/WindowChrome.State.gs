package Goo.Widgets.Layout

import Goo
import Goo.Widgets.Navigation
import System

internal open class WindowChromeState : Cell[WindowChrome], IDisposable {
    private var current WindowChrome
    private var source WindowChrome
    private var menuRootFactory Func[MenuInput, Container, Container]?
    private var host Window?
    private var overlay ElementHandle?
    private let rootHandle ElementHandle = ElementHandle()
    private var rootBox ElementRect
    private var overlayBox ElementRect
    private var menuOpen bool
    private var menuPoint Point?
    private var disposed bool

    public init() {
        rootHandle.MetricsChanged += RootMetrics
    }

    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        rootHandle.MetricsChanged -= RootMetrics
        BindHost(nil)
        BindOverlay(nil)
    }

    protected override func Build(input WindowChrome) Blob {
        source = input
        current = input.Resolve()
        BindHost(input.Host)
        BindOverlay(input.OverlayHost)
        if !current.EnableContextMenu {
            menuOpen = false
        }
        let row = current.BuildResolved(BlankPointer)
        row.Key = "bar"
        let root = Container(){
            .Handle: rootHandle,
            .FlexShrink: 0.0,
            .OnPointerDown: PointerDown,
            .OnKeyDown: KeyDown,
            row
        }
        if current.EnableContextMenu {
            let maximized = current.IsMaximized!!
            let items = []MenuItem{
                MenuItem{
                    Id: "restore",
                    Label: "Restore",
                    Disabled: !maximized || current.OnRestore == nil,
                    OnActivate: current.OnRestore
                },
                MenuItem{
                    Id: "minimize",
                    Label: "Minimize",
                    Disabled: current.OnMinimize == nil || host?.State == WindowState.Minimized,
                    OnActivate: current.OnMinimize
                },
                MenuItem{
                    Id: "maximize",
                    Label: "Maximize",
                    Disabled: maximized || current.OnMaximize == nil,
                    OnActivate: current.OnMaximize
                },
                MenuItem{Id: "separator", Separator: true},
                MenuItem{Id: "close", Label: "Close", Disabled: current.OnClose == nil, OnActivate: current.OnClose},
            }
            var prepared = MenuInput{
                Open: menuOpen,
                Items: items,
                OnDismiss: Dismiss,
                WindowPoint: menuPoint,
                Width: 200.0,
                MaxHeight: 240.0,
                AccessibilityName: "Window commands"
            }
            if menuOpen {
                prepared.Viewport = Viewport()
            }
            if menuPoint == nil {
                prepared.Anchor = rootHandle
            }
            var menu = if let create = current.CreateMenu {
                create(current, prepared)
            } else {
                prepared
            }
            menu.Open = menuOpen
            menu.Items = items
            menu.Anchor = prepared.Anchor
            menu.WindowPoint = menuPoint
            menu.Viewport = prepared.Viewport
            menu.OnDismiss = Dismiss
            menu.DismissOnActivate = true
            root.ZIndex = menuOpen ? (menu.ZIndex == 0 ? 20: menu.ZIndex): 0
            menuRootFactory = menu.CreateRoot
            menu.CreateRoot = MenuRoot
            root.Children.Add(Cell.Mount[MenuInput, Menu]("menu", menu))
        }
        return root
    }

    private func BlankPointer(event PointerEvent) {
        if !current.EnableDoubleClick || event.IsFromInteractiveChild
        || event.Button != PointerButton.Primary || event.ClickCount != 2 {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        Toggle()
    }

    private func Toggle() {
        let resolved = source.Resolve()
        if resolved.IsMaximized!! {
            resolved.OnRestore?.Invoke()
        } else {
            resolved.OnMaximize?.Invoke()
        }
    }

    private func NativeDoubleClick(event WindowTitlebarEvent) {
        if event.Handled || !current.EnableDoubleClick || !rootHandle.IsMounted || !Contains(rootBox, event.Position) {
            return
        }
        event.Handled = true
        Toggle()
    }

    private func PointerDown(event PointerEvent) {
        if !current.EnableContextMenu || menuOpen || event.Button != PointerButton.Secondary {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        Open(event.WindowPosition)
    }

    private func KeyDown(event KeyEvent) {
        if !current.EnableContextMenu || menuOpen {
            return
        }
        if event.Key != Key.Menu && !(event.Key == Key.F10 && event.Modifiers.Shift) {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        Open(nil)
    }

    private func Open(point Point?) {
        let viewport = Viewport()
        if viewport.Width <= 0.0 || viewport.Height <= 0.0 {
            throw InvalidOperationException("WindowChrome command menus require a mounted OverlayHost or native Host")
        }
        menuPoint = point
        menuOpen = true
        Rebuild()
    }

    private func Dismiss() {
        menuOpen = false
        menuPoint = nil
        Rebuild()
    }

    private func Viewport() ElementRect -> host != nil
    ? ElementRect{Width: float64(host!!.Width), Height: float64(host!!.Height)}: overlayBox

    private func MenuRoot(input MenuInput, prepared Container) Container {
        let root = if let create = menuRootFactory {
            create(input, prepared)
        } else {
            prepared
        }
        let viewport = Viewport()
        root.Left = viewport.X - rootBox.X
        root.Top = viewport.Y - rootBox.Y
        root.Right = Length{}
        root.Bottom = Length{}
        root.Width = viewport.Width
        root.Height = viewport.Height
        return root
    }

    private func BindHost(next Window?) {
        if host == next {
            return
        }
        if let previous = host {
            previous.StateChanged -= StateChanged
            previous.MetricsChanged -= WindowMetricsChanged
            previous.TitlebarDoubleClicked -= NativeDoubleClick
        }
        host = next
        if let window = next {
            window.StateChanged += StateChanged
            window.MetricsChanged += WindowMetricsChanged
            window.TitlebarDoubleClicked += NativeDoubleClick
        }
    }

    private func StateChanged(state WindowState) {
        if !disposed {
            Rebuild()
        }
    }

    private func WindowMetricsChanged(metrics WindowMetrics) {
        if !disposed && menuOpen {
            Rebuild()
        }
    }

    private func BindOverlay(next ElementHandle?) {
        if overlay == next {
            return
        }
        if let previous = overlay {
            previous.MetricsChanged -= OverlayMetrics
        }
        overlay = next
        if let handle = next {
            overlayBox = handle.BorderBox
            handle.MetricsChanged += OverlayMetrics
        }
    }

    private func OverlayMetrics(metrics ElementMetrics) {
        if disposed {
            return
        }
        if !metrics.IsMounted {
            if menuOpen {
                Dismiss()
            }
            return
        }
        if overlayBox != metrics.BorderBox {
            overlayBox = metrics.BorderBox
            if menuOpen {
                Rebuild()
            }
        }
    }

    private func RootMetrics(metrics ElementMetrics) {
        if disposed {
            return
        }
        if rootBox != metrics.BorderBox {
            rootBox = metrics.BorderBox
            if menuOpen {
                Rebuild()
            }
        }
    }

    private func Contains(bounds ElementRect, point Point) bool -> point.X >= bounds.X && point.Y >= bounds.Y
    && point.X < bounds.X + bounds.Width && point.Y < bounds.Y + bounds.Height
}
