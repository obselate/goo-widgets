package Goo.Widgets.Layout

import Goo
import System

/// Preferred anchor edge and alignment before viewport collision handling.
public enum PopoverPlacement {
    BottomStart;
    BottomEnd;
    TopStart;
    TopEnd;
    RightStart;
    LeftStart
}

/// The interaction or anchor lifecycle event requesting dismissal.
public enum PopoverDismissReason {
    Escape;
    OutsideClick;
    AnchorRemoved
}

/// Controlled popup state. Presentation uses the Window's automatic Portal overlay.
public data struct PopoverInput {
    var Open bool
    /// Supply exactly one anchor or window point when open.
    var Anchor ElementHandle?
    var WindowPoint Point?
    var Content Blob?
    /// Additional keyed overlays above this panel, used by nested menus.
    var Overlays[]?Blob
    var OnDismiss Action[PopoverDismissReason]?
    /// False allows pointer input outside this panel to reach an underlying menu level. Defaults to true.
    var DismissOnOutsideClick bool?
    /// Optional collision bounds in window logical coordinates; defaults to the overlay bounds.
    var Viewport ElementRect?
    var Placement PopoverPlacement
    /// Width defaults to 280 and maximum height to 360. Both shrink to the available viewport.
    var Width float64
    var MaxHeight float64
    var Gap float64?
    var ViewportMargin float64?
    /// Base layer defaults to 20; mounted scopes add their opening order.
    var ZIndex int32
    var InitialFocus ElementHandle?
    var AccessibilityName string?
    var Role AccessibilityRole
    var BackgroundColor Color?
    var BorderColor Color?
    var Padding float64?
    /// Creates the panel from resolved input, window bounds, and content. Placement and identity are rewired.
    var CreatePanel Func[PopoverInput, ElementRect, Blob, Container]?
    var CreateRoot Func[PopoverInput, Container, Container, Container]?
}

/// Anchors arbitrary content, flips/clamps placement, contains Tab, and restores prior focus on close.
public open class Popover : Cell[PopoverInput], IDisposable {
    private let rootHandle ElementHandle = ElementHandle()
    private let panelHandle ElementHandle = ElementHandle()
    private let measurementRootHandle ElementHandle = ElementHandle()
    private var anchor ElementHandle?
    private var activeScope FocusScope?
    private var current PopoverInput
    private var rootBox ElementRect
    private var anchorBox ElementRect
    private var panelHeight float64
    private var layoutWidth float64
    private var layoutMaxHeight float64
    private var measuredWidth float64
    private var measuredMaxHeight float64
    private var hasPanelMeasurement bool
    private var anchorWasMounted bool
    private var anchorDismissed bool
    private var presented bool
    private var rootKeyHandler Action[KeyEvent]?
    private var disposed bool

    public init() {
        rootHandle.MetricsChanged += RootMetrics
        panelHandle.MetricsChanged += PanelMetrics
        measurementRootHandle.MetricsChanged += MeasurementRootMetrics
    }

    /// Releases geometry subscriptions and the mounted focus scope.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        rootHandle.MetricsChanged -= RootMetrics
        panelHandle.MetricsChanged -= PanelMetrics
        measurementRootHandle.MetricsChanged -= MeasurementRootMetrics
        BindAnchor(nil)
        CloseScope()
    }

    protected override func Build(input PopoverInput) Blob {
        let previous = current
        current = Resolve(input)
        BindAnchor(input.Open ? input.Anchor: nil)
        if !input.Open {
            anchorWasMounted = false
            anchorDismissed = false
            anchorBox = ElementRect{}
            ResetPresentation()
            return Present(
                Container{HitTestSelf: false, Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true}}
            )
        }
        if !previous.Open {
            ResetPresentation()
        }
        if (input.Anchor == nil) == (input.WindowPoint == nil) {
            throw ArgumentException("An open popover requires exactly one Anchor or WindowPoint")
        }
        if let handle = anchor {
            if handle.IsMounted {
                anchorBox = handle.BorderBox
                anchorWasMounted = true
            }
        }
        let viewport = current.Viewport ?? rootBox
        let margin = current.ViewportMargin!!
        let width = Math.Min(current.Width, Math.Max(1.0, viewport.Width - 2.0 * margin))
        let heightLimit = if current.Viewport == nil && rootBox.Height <= 0.0 {
            current.MaxHeight
        } else {
            Math.Min(current.MaxHeight, Math.Max(1.0, viewport.Height - 2.0 * margin))
        }
        if !presented && rootBox.Width > 0.0 && rootBox.Height > 0.0
        && (current.WindowPoint != nil || anchorWasMounted)
        && MeasurementValid(width, heightLimit) {
            presented = true
        }
        layoutWidth = width
        layoutMaxHeight = heightLimit
        let height = Math.Min(heightLimit, panelHeight > 0.0 ? panelHeight: heightLimit)
        let origin = Place(viewport, width, height)
        let bounds = ElementRect{X: origin.X, Y: origin.Y, Width: width, Height: height}
        let content = current.Content ?? Container{HitTestSelf: false}
        let panel = if let create = current.CreatePanel {
            create(current, bounds, content)
        } else {
            Container{
                Padding: current.Padding!!,
                BackgroundColor: current.BackgroundColor!!,
                BorderColor: current.BorderColor!!,
                BorderWidth: 1.0,
                BorderRadius: 8.0,
            }
        }
        panel.Key = "panel"
        panel.Handle = panelHandle
        panel.Position = PositionType.Absolute
        panel.Left = origin.X - rootBox.X
        panel.Top = origin.Y - rootBox.Y
        panel.Width = width
        panel.MaxHeight = heightLimit
        panel.MinHeight = 0.0
        panel.FlexShrink = 0.0
        panel.OverflowY = Overflow.Scroll
        panel.Children.Clear()
        panel.Children.Add(content)
        let backdrop = Container{
            Key: "backdrop",
            Position: PositionType.Absolute,
            Left: 0.0,
            Right: 0.0,
            Top: 0.0,
            Bottom: 0.0,
            BackgroundColor: Color.Transparent,
            Focusable: false,
            Cursor: Cursor.Default,
            HitTestSelf: current.DismissOnOutsideClick ?? true,
            Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
            OnClick: () -> Dismiss(PopoverDismissReason.OutsideClick),
        }
        let root = if let create = current.CreateRoot {
            create(current, backdrop, panel)
        } else {
            Container{Position: PositionType.Absolute, Left: 0.0, Right: 0.0, Top: 0.0, Bottom: 0.0,}
        }
        rootKeyHandler = root.OnKeyDown
        root.Handle = presented ? rootHandle: measurementRootHandle
        root.Visibility = presented ? Visibility.Visible: Visibility.Hidden
        root.Focusable = true
        root.HitTestSelf = false
        root.TabStop = false
        root.Disabled = false
        root.ZIndex = current.ZIndex + (activeScope?.Order ?? 0)
        root.Accessibility = Accessibility{Role: current.Role, Name: current.AccessibilityName!!}
        root.OnKeyDown = HandleKey
        root.Children.Clear()
        root.Children.Add(backdrop)
        root.Children.Add(panel)
        for overlay in current.Overlays ?? []Blob{} {
            root.Children.Add(overlay)
        }
        return Present(root)
    }

    private func Present(content Blob) Portal -> Portal{
        Width: Length.Percent(100),
        Height: Length.Percent(100),
        ZIndex: current.ZIndex + (activeScope?.Order ?? 0),
        content,
    }

    private func Resolve(input PopoverInput) PopoverInput {
        let result = input with{
            Width = input.Width == 0.0 ? 280.0: input.Width,
            MaxHeight = input.MaxHeight == 0.0 ? 360.0: input.MaxHeight,
            Gap = input.Gap ?? 4.0,
            ViewportMargin = input.ViewportMargin ?? 8.0,
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex,
            Role = input.Role == AccessibilityRole.Auto ? AccessibilityRole.Group: input.Role,
            AccessibilityName = input.AccessibilityName ?? "Popup",
            BackgroundColor = input.BackgroundColor ?? Color.Parse("#18181b"),
            BorderColor = input.BorderColor ?? Color.Parse("#3f3f46"),
            Padding = input.Padding ?? 8.0,
        }
        if !Double.IsFinite(result.Width) || result.Width <= 0.0
        || !Double.IsFinite(result.MaxHeight) || result.MaxHeight <= 0.0
        || !Double.IsFinite(result.Gap!!) || result.Gap!!< 0.0
        || !Double.IsFinite(result.ViewportMargin!!) || result.ViewportMargin!!< 0.0
        || !Double.IsFinite(result.Padding!!) || result.Padding!!< 0.0 {
            throw ArgumentOutOfRangeException("input", "Popover dimensions must be finite and nonnegative")
        }
        if let viewport = result.Viewport {
            if !Double.IsFinite(viewport.X) || !Double.IsFinite(viewport.Y)
            || !Double.IsFinite(viewport.Width) || !Double.IsFinite(viewport.Height)
            || viewport.Width <= 0.0 || viewport.Height <= 0.0 {
                throw ArgumentOutOfRangeException("Viewport")
            }
        }
        if let point = result.WindowPoint {
            if !Double.IsFinite(point.X) || !Double.IsFinite(point.Y) {
                throw ArgumentOutOfRangeException("WindowPoint")
            }
        }
        if !Enum.IsDefined(result.Placement) {
            throw ArgumentOutOfRangeException("Placement")
        }
        return result
    }

    private func MeasurementValid(width float64, maxHeight float64) bool {
        if !hasPanelMeasurement || Math.Abs(measuredWidth - width) > 0.01 {
            return false
        }
        return maxHeight <= measuredMaxHeight
        || panelHeight < measuredMaxHeight - 0.01
    }

    private func Place(viewport ElementRect, width float64, height float64) Point {
        let margin = current.ViewportMargin!!
        let left = viewport.X + Math.Min(margin, viewport.Width * 0.5)
        let top = viewport.Y + Math.Min(margin, viewport.Height * 0.5)
        let right = Math.Max(left, viewport.X + viewport.Width - margin)
        let bottom = Math.Max(top, viewport.Y + viewport.Height - margin)
        if let point = current.WindowPoint {
            return Point{
                X: Math.Clamp(point.X, left, Math.Max(left, right - width)),
                Y: Math.Clamp(point.Y, top, Math.Max(top, bottom - height))
            }
        }
        let gap = current.Gap!!
        var x = anchorBox.X
        var y = anchorBox.Y + anchorBox.Height + gap
        if current.Placement == PopoverPlacement.BottomEnd || current.Placement == PopoverPlacement.TopEnd {
            x = anchorBox.X + anchorBox.Width - width
        }
        if current.Placement == PopoverPlacement.TopStart || current.Placement == PopoverPlacement.TopEnd {
            y = anchorBox.Y - height - gap
            if y < top && anchorBox.Y + anchorBox.Height + gap + height <= bottom {
                y = anchorBox.Y + anchorBox.Height + gap
            }
        } else if current.Placement == PopoverPlacement.RightStart || current.Placement == PopoverPlacement.LeftStart {
            y = anchorBox.Y
            if current.Placement == PopoverPlacement.RightStart {
                x = anchorBox.X + anchorBox.Width + gap
                if x + width > right && anchorBox.X - gap - width >= left {
                    x = anchorBox.X - gap - width
                }
            } else {
                x = anchorBox.X - width - gap
                if x < left && anchorBox.X + anchorBox.Width + gap + width <= right {
                    x = anchorBox.X + anchorBox.Width + gap
                }
            }
        } else if y + height > bottom && anchorBox.Y - height - gap >= top {
            y = anchorBox.Y - height - gap
        }
        return Point{
            X: Math.Clamp(x, left, Math.Max(left, right - width)),
            Y: Math.Clamp(y, top, Math.Max(top, bottom - height))
        }
    }

    private func BindAnchor(next ElementHandle?) {
        if anchor == next {
            return
        }
        if let previous = anchor {
            previous.MetricsChanged -= AnchorMetrics
        }
        anchor = next
        anchorWasMounted = false
        anchorDismissed = false
        if let handle = anchor {
            handle.MetricsChanged += AnchorMetrics
        }
    }

    private func AnchorMetrics(metrics ElementMetrics) {
        if disposed || !current.Open {
            return
        }
        if !metrics.IsMounted {
            if anchorWasMounted && !anchorDismissed {
                anchorDismissed = true
                CloseScope()
                Dismiss(PopoverDismissReason.AnchorRemoved)
            }
            return
        }
        anchorWasMounted = true
        if metrics.BorderBox != anchorBox {
            anchorBox = metrics.BorderBox
            Rebuild()
        }
    }

    private func RootMetrics(metrics ElementMetrics) {
        if disposed || !current.Open {
            return
        }
        if !metrics.IsMounted {
            CloseScope()
            return
        }
        if metrics.BorderBox != rootBox {
            rootBox = metrics.BorderBox
            Rebuild()
        }
        if activeScope == nil && !anchorDismissed {
            activeScope = rootHandle.BeginFocusScope(FocusScopeOptions{InitialFocus: current.InitialFocus})
            Rebuild()
        }
    }

    private func MeasurementRootMetrics(metrics ElementMetrics) {
        if disposed || !current.Open || !metrics.IsMounted {
            return
        }
        if metrics.BorderBox != rootBox {
            rootBox = metrics.BorderBox
            Rebuild()
        }
    }

    private func PanelMetrics(metrics ElementMetrics) {
        if disposed || !current.Open || !metrics.IsMounted {
            return
        }
        let heightChanged = Math.Abs(metrics.BorderBox.Height - panelHeight) > 0.01
        let measurementChanged = !hasPanelMeasurement
        || Math.Abs(measuredWidth - layoutWidth) > 0.01
        || Math.Abs(measuredMaxHeight - layoutMaxHeight) > 0.01
        panelHeight = metrics.BorderBox.Height
        measuredWidth = layoutWidth
        measuredMaxHeight = layoutMaxHeight
        hasPanelMeasurement = true
        if heightChanged || measurementChanged {
            Rebuild()
        }
    }

    private func ResetPresentation() {
        CloseScope()
        presented = false
        rootBox = ElementRect{}
        panelHeight = 0.0
        measuredWidth = 0.0
        measuredMaxHeight = 0.0
        hasPanelMeasurement = false
    }

    private func HandleKey(event KeyEvent) {
        if event.Key == Key.Escape {
            event.PreventDefault()
            event.StopPropagation()
            if !event.Repeat {
                Dismiss(PopoverDismissReason.Escape)
            }
            return
        }
        rootKeyHandler?.Invoke(event)
    }

    private func Dismiss(reason PopoverDismissReason) {
        current.OnDismiss?.Invoke(reason)
    }

    private func CloseScope() {
        activeScope?.Dispose()
        activeScope = nil
    }
}
