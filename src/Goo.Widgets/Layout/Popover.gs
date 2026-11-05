package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import System

/// Preferred anchor edge and alignment before viewport collision handling. Start and End follow the theme direction.
public enum PopoverPlacement {
    /// Opens below the anchor, aligned to its start edge.
    BottomStart;
    /// Opens below the anchor, aligned to its end edge.
    BottomEnd;
    /// Opens above the anchor, aligned to its start edge.
    TopStart;
    /// Opens above the anchor, aligned to its end edge.
    TopEnd;
    /// Opens to the right, aligned to the anchor top.
    RightStart;
    /// Opens to the left, aligned to the anchor top.
    LeftStart
}

/// The interaction or anchor lifecycle event requesting dismissal.
public enum PopoverDismissReason {
    /// The user pressed Escape.
    Escape;
    /// The user clicked outside the popup.
    OutsideClick;
    /// The mounted anchor became unavailable.
    AnchorRemoved
}

/// Controlled popup state. Presentation uses the Window's automatic Portal overlay.
public data struct PopoverInput {
    /// Controlled visibility. False hides the popup.
    var Open bool
    /// Supply exactly one anchor or window point when open.
    var Anchor ElementHandle?
    /// Anchor point in window logical pixels. Nil requires Anchor when open. Supply only one anchor source.
    var WindowPoint Point?
    /// Part of Anchor to place against, in Anchor border-box coordinates. Placement follows Anchor scroll and layout.
    var AnchorRect ElementRect?
    /// Main display content. Nil leaves this slot empty.
    var Content Blob?
    /// Additional keyed overlays above this panel, used by nested menus.
    var Overlays[]?Blob
    /// Receives the dismissal reason after Escape, an outside click, or loss of the anchor. Nil ignores the request.
    var OnDismiss Action[PopoverDismissReason]?
    /// Requests false before OnDismiss for outside click, Escape, or anchor removal. Nil ignores the state request.
    var OnOpenChange Action[bool]?
    /// False allows pointer input outside this panel to reach an underlying menu level. Defaults to true.
    var DismissOnOutsideClick bool?
    /// Optional collision bounds in window logical coordinates; defaults to the Window bounds.
    var Viewport ElementRect?
    /// Preferred anchor-relative placement. Collision handling can move the popup into view.
    var Placement PopoverPlacement
    /// Width defaults to 280. Auto fits the content and Percent uses the viewport width.
    /// Maximum height defaults to 360. Both shrink to the available viewport.
    var Width Length?
    /// Lower width bound. Nil keeps the panel's own MinWidth.
    var MinWidth Length?
    /// Upper width bound. Nil uses the available viewport and keeps the panel's own MaxWidth unless Width is Auto.
    var MaxWidth Length?
    /// Panel height limit. Nil uses 360. The viewport can reduce it.
    var MaxHeight Length?
    /// Nonnegative anchor-to-panel gap in logical pixels. Nil uses the theme spacing.
    var Gap float64?
    /// Nonnegative collision-bound inset in logical pixels. Nil uses the theme control gap.
    var ViewportMargin float64?
    /// Base layer defaults to 20; mounted scopes add their opening order.
    var ZIndex int32
    /// Caller-owned element to focus on opening. Nil uses the default focus target.
    var InitialFocus ElementHandle?
    /// False keeps focus where it is and starts no focus scope. Escape still dismisses. Defaults to true.
    var TakeFocus bool?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Popup accessibility role. Auto resolves to Group.
    var Role AccessibilityRole
    /// Panel fill. Nil uses the theme overlay color.
    var BackgroundColor Color?
    /// Panel border color. Nil uses the theme border color.
    var BorderColor Color?
    /// Panel content inset in logical pixels. Nil uses the theme control padding.
    var Padding float64?
    /// Vertical scrollbar. Nil uses the theme overlay parts.
    var ScrollbarY Scrollbar?
    /// Vertical visibility. Nil uses Auto.
    var ScrollbarVisibilityY ScrollbarVisibility?
    /// Creates the panel from resolved input, window bounds, and content. Placement and identity are rewired.
    var CreatePanel Func[PopoverInput, ElementRect, Blob, Container]?
    /// Receives the resolved input, prepared backdrop, and prepared panel, and returns their root container. Children, geometry, input routing, and popup semantics are reapplied. Nil uses the default root.
    var CreateRoot Func[PopoverInput, Container, Container, Container]?
}

/// Anchors content, flips/clamps placement, contains Tab, and restores prior focus except on outside clicks.
/// With TakeFocus false, focus stays outside the panel.
public open class Popover : Cell[PopoverInput], IDisposable {
    private let rootHandle ElementHandle = ElementHandle()
    private let panelHandle ElementHandle = ElementHandle()
    private let measurementRootHandle ElementHandle = ElementHandle()
    private var anchor ElementHandle?
    private var activeScope FocusScope?
    private var current PopoverInput
    private var rootBox ElementRect
    private var panelHeight float64
    private var panelWidth float64
    private var layoutWidth float64
    private var measuredWidth float64
    private var hasPanelMeasurement bool
    private var anchorWasMounted bool
    private var anchorDismissed bool
    private var presented bool
    private var rootKeyHandler Action[KeyEvent]?
    private var previewWindow Window?
    private let previewKey Func[Key, KeyModifiers, bool]
    private var disposed bool

    /// Subscribes to viewport and focus lifecycle events. Dispose the popup to release subscriptions and its focus scope.
    public init() {
        rootHandle.MetricsChanged += RootMetrics
        measurementRootHandle.MetricsChanged += MeasurementRootMetrics
        previewKey = (key Key, modifiers KeyModifiers) -> {
            if key != Key.Escape {
                return false
            }
            Dismiss(PopoverDismissReason.Escape)
            return true
        }
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
        BindPreview(nil)
        CloseScope()
    }

    protected override func Build(input PopoverInput) Blob {
        let theme = Theme.Read()
        let previous = current
        current = Resolve(input, theme)
        if input.Open && input.WindowPoint != nil && (!previous.Open || previous.WindowPoint == nil) {
            panelHandle.MetricsChanged += PanelMetrics
        }
        if previous.Open && previous.WindowPoint != nil && (!input.Open || input.WindowPoint == nil) {
            panelHandle.MetricsChanged -= PanelMetrics
        }
        BindAnchor(input.Open ? input.Anchor: nil)
        let preview Window? = input.Open && input.TakeFocus == false ? Theme.Key.Window: nil
        BindPreview(preview)
        if !input.Open {
            anchorWasMounted = false
            anchorDismissed = false
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
                anchorWasMounted = true
            }
        }
        let viewport = current.Viewport ?? rootBox
        let margin = current.ViewportMargin!!
        let available = Math.Max(1.0, viewport.Width - 2.0 * margin)
        let maximum = current.MaxWidth ?? Length.Auto
        let minimum = current.MinWidth ?? Length.Auto
        let maxWidth = Math.Min(
            !maximum.HasMagnitude ? available: maximum.IsPercent ? viewport.Width * maximum.Magnitude / 100.0: maximum.Magnitude,
            available
        )
        let minWidth = Math.Min(
            !minimum.HasMagnitude ? 0.0: minimum.IsPercent ? viewport.Width * minimum.Magnitude / 100.0: minimum.Magnitude,
            maxWidth
        )
        let requested = current.Width!!
        let fit = !requested.HasMagnitude
        let width = Math.Clamp(
            fit ? panelWidth: requested.IsPercent ? viewport.Width * requested.Magnitude / 100.0: requested.Magnitude,
            minWidth,
            maxWidth
        )
        let requestedHeight = current.MaxHeight!!
        let maxHeight = !requestedHeight.HasMagnitude ? Double.PositiveInfinity: requestedHeight.IsPercent ? viewport.Height * requestedHeight.Magnitude / 100.0: requestedHeight.Magnitude
        let heightLimit = Math.Min(maxHeight, Math.Max(1.0, viewport.Height - 2.0 * margin))
        if !presented && rootBox.Width > 0.0 && rootBox.Height > 0.0
        && (current.WindowPoint != nil || anchorWasMounted)
        && (anchor != nil || MeasurementValid(fit ? maxWidth: width)) {
            presented = true
        }
        layoutWidth = fit ? maxWidth: width
        let height = Math.Min(heightLimit, panelHeight > 0.0 ? panelHeight: heightLimit)
        let origin = anchor == nil ? Place(viewport, width, height): Point{}
        let bounds = ElementRect{X: origin.X, Y: origin.Y, Width: width, Height: height}
        let content = current.Content ?? Container{HitTestSelf: false}
        let panel = if let create = current.CreatePanel {
            create(current, bounds, content)
        } else {
            Container{
                BasedOn: theme.OverlayStyle,
                Padding: current.Padding!!,
                BackgroundColor: current.BackgroundColor!!,
                BorderColor: current.BorderColor!!,
                BorderWidth: theme.BorderWidth,
                BorderRadius: theme.PanelRadius!!,
                ScrollbarY: current.ScrollbarY,
                ScrollbarVisibilityY: current.ScrollbarVisibilityY!!,
            }
        }
        panel.Key = "panel"
        panel.Handle = panelHandle
        panel.Position = anchor == nil ? PositionType.Absolute: PositionType.Relative
        if anchor == nil {
            panel.Left = origin.X - rootBox.X
            panel.Top = origin.Y - rootBox.Y
        }
        panel.Width = fit ? Length.Auto: width
        if current.MinWidth != nil {
            panel.MinWidth = minWidth
        }
        if fit || current.MaxWidth != nil {
            panel.MaxWidth = maxWidth
        }
        panel.MaxHeight = presented ? heightLimit: current.MaxHeight!!
        panel.MinHeight = 0.0
        panel.FlexShrink = anchor == nil ? 0.0: 1.0
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
        root.Focusable = current.TakeFocus != false
        root.HitTestSelf = false
        root.TabStop = false
        root.Disabled = false
        root.ZIndex = current.ZIndex + (activeScope?.Order ?? 0)
        root.Accessibility = Accessibility{Role: current.Role, Name: current.AccessibilityName!!}
        root.OnKeyDown = HandleKey
        root.Children.Clear()
        root.Children.Add(backdrop)
        if anchor != nil {
            let left = viewport.X + Math.Min(margin, viewport.Width * 0.5)
            let top = viewport.Y + Math.Min(margin, viewport.Height * 0.5)
            let right = Math.Max(left, viewport.X + viewport.Width - margin)
            let bottom = Math.Max(top, viewport.Y + viewport.Height - margin)
            root.Children.Add(Portal{
                Anchor: current.Anchor,
                AnchorRect: current.AnchorRect,
                HideWhenAnchorClipped: true,
                Placement: switch current.Placement {
                    case PopoverPlacement.BottomStart: PortalPlacement.BottomStart
                    case PopoverPlacement.BottomEnd: PortalPlacement.BottomEnd
                    case PopoverPlacement.TopStart: PortalPlacement.TopStart
                    case PopoverPlacement.TopEnd: PortalPlacement.TopEnd
                    case PopoverPlacement.RightStart: PortalPlacement.RightStart
                    case _: PortalPlacement.LeftStart
                },
                CollisionBounds: ElementRect{X: left, Y: top, Width: right - left, Height: bottom - top},
                Padding: current.Placement == PopoverPlacement.RightStart || current.Placement == PopoverPlacement.LeftStart
                    ? Edges{Left: current.Gap!!, Right: current.Gap!!}
                    : Edges{Top: current.Gap!!, Bottom: current.Gap!!},
                BackgroundColor: Color.Transparent,
                ZIndex: current.ZIndex + (activeScope?.Order ?? 0),
                panel,
            })
        } else {
            root.Children.Add(panel)
        }
        for overlay in current.Overlays ?? []Blob{} {
            root.Children.Add(overlay)
        }
        return Present(root)
    }

    private func Present(content Blob) Portal -> Portal{
        Width: Percent(100),
        Height: Percent(100),
        ZIndex: current.ZIndex + (activeScope?.Order ?? 0),
        content,
    }

    private func Resolve(input PopoverInput, theme Theme) PopoverInput {
        let defaultWidth Length = 280
        let defaultHeight Length = 360.0
        let result = input with{
            Width = input.Width ?? defaultWidth,
            MaxHeight = input.MaxHeight ?? defaultHeight,
            Gap = input.Gap ?? theme.Spacing,
            ViewportMargin = input.ViewportMargin ?? theme.ControlGap,
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex,
            Role = input.Role == AccessibilityRole.Auto ? AccessibilityRole.Group: input.Role,
            AccessibilityName = input.AccessibilityName ?? theme.Text("Popup"),
            BackgroundColor = input.BackgroundColor ?? theme.OverlayColor,
            BorderColor = input.BorderColor ?? theme.BorderColor,
            Padding = input.Padding ?? theme.ControlPadding,
            ScrollbarY = input.ScrollbarY ?? theme.Scrollbar,
            ScrollbarVisibilityY = input.ScrollbarVisibilityY ?? Goo.ScrollbarVisibility.Auto,
        }
        let width = result.Width!!
        if width.HasMagnitude && (!Double.IsFinite(width.Magnitude) || width.Magnitude <= 0.0)
        || result.MinWidth != nil && result.MinWidth!!.HasMagnitude && (!Double.IsFinite(result.MinWidth!!.Magnitude) || result.MinWidth!!.Magnitude < 0.0)
        || result.MaxWidth != nil && result.MaxWidth!!.HasMagnitude && (!Double.IsFinite(result.MaxWidth!!.Magnitude) || result.MaxWidth!!.Magnitude <= 0.0)
        || result.MaxHeight!!.HasMagnitude && (!Double.IsFinite(result.MaxHeight!!.Magnitude) || result.MaxHeight!!.Magnitude <= 0.0)
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
        if let rect = result.AnchorRect {
            if !Double.IsFinite(rect.X) || !Double.IsFinite(rect.Y)
            || !Double.IsFinite(rect.Width) || !Double.IsFinite(rect.Height)
            || rect.Width < 0.0 || rect.Height < 0.0 {
                throw ArgumentOutOfRangeException("AnchorRect")
            }
        }
        if !Enum.IsDefined(result.Placement) {
            throw ArgumentOutOfRangeException("Placement")
        }
        return result
    }

    private func MeasurementValid(width float64) bool ->
    hasPanelMeasurement && Math.Abs(measuredWidth - width) <= 0.01

    private func Place(viewport ElementRect, width float64, height float64) Point {
        let margin = current.ViewportMargin!!
        let left = viewport.X + Math.Min(margin, viewport.Width * 0.5)
        let top = viewport.Y + Math.Min(margin, viewport.Height * 0.5)
        let right = Math.Max(left, viewport.X + viewport.Width - margin)
        let bottom = Math.Max(top, viewport.Y + viewport.Height - margin)
        let point = current.WindowPoint ?? Point{}
        return Point{
            X: Math.Clamp(point.X, left, Math.Max(left, right - width)),
            Y: Math.Clamp(point.Y, top, Math.Max(top, bottom - height))
        }
    }

    private func BindPreview(next Window?) {
        if previewWindow == next {
            return
        }
        if let previous = previewWindow {
            previous.PreviewKeyPressed -= previewKey
        }
        previewWindow = next
        if let window = next {
            window.PreviewKeyPressed += previewKey
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
        if activeScope == nil && !anchorDismissed && current.TakeFocus != false {
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
        if disposed || !current.Open || !metrics.IsMounted || current.Anchor != nil {
            return
        }
        let heightChanged = Math.Abs(metrics.BorderBox.Height - panelHeight) > 0.01
        let widthChanged = Math.Abs(metrics.BorderBox.Width - panelWidth) > 0.01
        let measurementChanged = !hasPanelMeasurement
        || Math.Abs(measuredWidth - layoutWidth) > 0.01
        panelHeight = metrics.BorderBox.Height
        panelWidth = metrics.BorderBox.Width
        measuredWidth = layoutWidth
        hasPanelMeasurement = true
        if heightChanged || widthChanged || measurementChanged {
            Rebuild()
        }
    }

    private func ResetPresentation() {
        CloseScope()
        presented = false
        rootBox = ElementRect{}
        panelHeight = 0.0
        panelWidth = 0.0
        measuredWidth = 0.0
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
        if reason == PopoverDismissReason.OutsideClick {
            CloseScope(false)
        }
        current.OnOpenChange?.Invoke(false)
        current.OnDismiss?.Invoke(reason)
    }

    private func CloseScope(restoreFocus bool = true) {
        activeScope?.Dispose(restoreFocus)
        activeScope = nil
    }
}
