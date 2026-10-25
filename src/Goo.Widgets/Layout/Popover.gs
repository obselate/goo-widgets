package Goo.Widgets.Layout

import Goo
import Goo.Widgets
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
    /// Part of Anchor to place against, in Anchor border-box coordinates. Placement follows Anchor scroll and layout.
    var AnchorRect ElementRect?
    var Content Blob?
    /// Additional keyed overlays above this panel, used by nested menus.
    var Overlays[]?Blob
    var OnDismiss Action[PopoverDismissReason]?
    /// False allows pointer input outside this panel to reach an underlying menu level. Defaults to true.
    var DismissOnOutsideClick bool?
    /// Optional collision bounds in window logical coordinates; defaults to the Window bounds.
    var Viewport ElementRect?
    var Placement PopoverPlacement
    /// Width defaults to 280. Auto fits the content and Percent uses the viewport width.
    /// Maximum height defaults to 360. Both shrink to the available viewport.
    var Width Length?
    /// Lower width bound. Nil keeps the panel's own MinWidth.
    var MinWidth float64?
    /// Upper width bound. Nil uses the available viewport and keeps the panel's own MaxWidth unless Width is Auto.
    var MaxWidth float64?
    var MaxHeight float64
    var Gap float64?
    var ViewportMargin float64?
    /// Base layer defaults to 20; mounted scopes add their opening order.
    var ZIndex int32
    var InitialFocus ElementHandle?
    /// False keeps focus where it is and starts no focus scope. Escape still dismisses. Defaults to true.
    var TakeFocus bool?
    var AccessibilityName string?
    var Role AccessibilityRole
    var BackgroundColor Color?
    var BorderColor Color?
    var Padding float64?
    /// Vertical scrollbar. Nil uses the theme overlay parts.
    var ScrollbarY Scrollbar?
    /// Vertical visibility. Nil uses Auto.
    var ScrollbarVisibilityY ScrollbarVisibility?
    /// Creates the panel from resolved input, window bounds, and content. Placement and identity are rewired.
    var CreatePanel Func[PopoverInput, ElementRect, Blob, Container]?
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
    private var anchorBox ElementRect
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

    public init() {
        rootHandle.MetricsChanged += RootMetrics
        panelHandle.MetricsChanged += PanelMetrics
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
        BindAnchor(input.Open ? input.Anchor: nil)
        let preview Window? = input.Open && input.TakeFocus == false ? Theme.Key.Window: nil
        BindPreview(preview)
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
        let target = if let rect = current.AnchorRect {
            ElementRect{X: anchorBox.X + rect.X, Y: anchorBox.Y + rect.Y, Width: rect.Width, Height: rect.Height}
        } else {
            anchorBox
        }
        let viewport = current.Viewport ?? rootBox
        let margin = current.ViewportMargin!!
        let available = Math.Max(1.0, viewport.Width - 2.0 * margin)
        let maxWidth = Math.Min(current.MaxWidth ?? available, available)
        let minWidth = Math.Min(current.MinWidth ?? 0.0, maxWidth)
        let requested = current.Width!!
        let fit = !requested.HasMagnitude
        let width = Math.Clamp(
            fit ? panelWidth: requested.IsPercent ? viewport.Width * requested.Magnitude / 100.0: requested.Magnitude,
            minWidth,
            maxWidth
        )
        var heightLimit = Math.Min(current.MaxHeight, Math.Max(1.0, viewport.Height - 2.0 * margin))
        if !presented && rootBox.Width > 0.0 && rootBox.Height > 0.0
        && (current.WindowPoint != nil || anchorWasMounted)
        && MeasurementValid(fit ? maxWidth: width) {
            presented = true
        }
        layoutWidth = fit ? maxWidth: width
        var height = Math.Min(heightLimit, panelHeight > 0.0 ? panelHeight: heightLimit)
        if anchor != nil &&
            (
            current.Placement == PopoverPlacement.BottomStart
            || current.Placement == PopoverPlacement.BottomEnd
            || current.Placement == PopoverPlacement.TopStart
            || current.Placement == PopoverPlacement.TopEnd
        ) {
            let top = viewport.Y + Math.Min(margin, viewport.Height * 0.5)
            let bottom = Math.Max(top, viewport.Y + viewport.Height - margin)
            let above = Math.Max(0.0, target.Y - current.Gap!!- top)
            let below = Math.Max(0.0, bottom - target.Y - target.Height - current.Gap!!)
            heightLimit = Math.Min(heightLimit, Math.Max(1.0, Math.Max(above, below)))
            height = Math.Min(height, heightLimit)
        }
        let origin = Place(viewport, width, height, target)
        let bounds = ElementRect{X: origin.X, Y: origin.Y, Width: width, Height: height}
        let content = current.Content ?? Container{HitTestSelf: false}
        let panel = if let create = current.CreatePanel {
            create(current, bounds, content)
        } else {
            Container{
                Padding: current.Padding!!,
                BackgroundColor: current.BackgroundColor!!,
                BorderColor: current.BorderColor!!,
                BorderWidth: theme.BorderWidth,
                BorderRadius: theme.PanelRadius,
                ScrollbarY: current.ScrollbarY,
                ScrollbarVisibilityY: current.ScrollbarVisibilityY!!,
            }
        }
        panel.Key = "panel"
        panel.Handle = panelHandle
        panel.Position = PositionType.Absolute
        panel.Left = origin.X - rootBox.X
        panel.Top = origin.Y - rootBox.Y
        panel.Width = fit ? Length.Auto: width
        if current.MinWidth != nil {
            panel.MinWidth = minWidth
        }
        if fit || current.MaxWidth != nil {
            panel.MaxWidth = maxWidth
        }
        panel.MaxHeight = presented ? heightLimit: current.MaxHeight
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
        root.Focusable = current.TakeFocus != false
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
        Width: Percent(100),
        Height: Percent(100),
        ZIndex: current.ZIndex + (activeScope?.Order ?? 0),
        content,
    }

    private func Resolve(input PopoverInput, theme Theme) PopoverInput {
        let defaultWidth Length = 280
        let result = input with{
            Width = input.Width ?? defaultWidth,
            MaxHeight = input.MaxHeight == 0.0 ? 360.0: input.MaxHeight,
            Gap = input.Gap ?? theme.Spacing,
            ViewportMargin = input.ViewportMargin ?? theme.ControlGap,
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex,
            Role = input.Role == AccessibilityRole.Auto ? AccessibilityRole.Group: input.Role,
            AccessibilityName = input.AccessibilityName ?? "Popup",
            BackgroundColor = input.BackgroundColor ?? theme.OverlayColor,
            BorderColor = input.BorderColor ?? theme.BorderColor,
            Padding = input.Padding ?? theme.ControlPadding,
            ScrollbarY = input.ScrollbarY ?? theme.Scrollbar,
            ScrollbarVisibilityY = input.ScrollbarVisibilityY ?? Goo.ScrollbarVisibility.Auto,
        }
        let width = result.Width!!
        if width.HasMagnitude && (!Double.IsFinite(width.Magnitude) || width.Magnitude <= 0.0)
        || result.MinWidth != nil && (!Double.IsFinite(result.MinWidth!!) || result.MinWidth!!< 0.0)
        || result.MaxWidth != nil && (!Double.IsFinite(result.MaxWidth!!) || result.MaxWidth!!<= 0.0)
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

    private func Place(viewport ElementRect, width float64, height float64, target ElementRect) Point {
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
        var x = target.X
        var y = target.Y + target.Height + gap
        if current.Placement == PopoverPlacement.BottomEnd || current.Placement == PopoverPlacement.TopEnd {
            x = target.X + target.Width - width
        }
        if current.Placement == PopoverPlacement.TopStart || current.Placement == PopoverPlacement.TopEnd {
            y = target.Y - height - gap
            if y < top && target.Y + target.Height + gap + height <= bottom {
                y = target.Y + target.Height + gap
            }
        } else if current.Placement == PopoverPlacement.RightStart || current.Placement == PopoverPlacement.LeftStart {
            y = target.Y
            if current.Placement == PopoverPlacement.RightStart {
                x = target.X + target.Width + gap
                if x + width > right && target.X - gap - width >= left {
                    x = target.X - gap - width
                }
            } else {
                x = target.X - width - gap
                if x < left && target.X + target.Width + gap + width <= right {
                    x = target.X + target.Width + gap
                }
            }
        } else if y + height > bottom && target.Y - height - gap >= top {
            y = target.Y - height - gap
        }
        return Point{
            X: Math.Clamp(x, left, Math.Max(left, right - width)),
            Y: Math.Clamp(y, top, Math.Max(top, bottom - height))
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
        if disposed || !current.Open || !metrics.IsMounted {
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
        current.OnDismiss?.Invoke(reason)
    }

    private func CloseScope(restoreFocus bool = true) {
        activeScope?.Dispose(restoreFocus)
        activeScope = nil
    }
}
