package Goo.Widgets.Layout

import Goo
import System

/// Passive hover and keyboard-focus label shown in the Window overlay.
public data struct TooltipInput {
    /// Open window that schedules the hover delay.
    var Window Window?
    /// Existing control to label without changing its input handlers.
    var Target Blob?
    /// Custom label content. It and its descendants must be passive so the overlay passes pointer input through.
    var Content Blob?
    /// Simple label used when Content is absent.
    var Text string?
    /// Hover delay in milliseconds; nil uses 500 and zero shows immediately.
    var DelayMs float64?
    /// Preferred anchored position; Goo flips it at the viewport edge.
    var Placement PortalPlacement
    /// Space around the label; nil uses 6 logical pixels.
    var Gap float64?
    /// Overlay order; zero uses 30.
    var ZIndex int32
    /// Optional layout style for the target wrapper.
    var RootStyle Style?
    /// Optional replacement style for the default label panel.
    var BubbleStyle Style?
    /// Replaces the default panel. The returned panel and its descendants must be passive.
    var CreateBubble Func[TooltipInput, Blob, Container]?
}

/// Wraps a control with a delayed, anchored label that never takes focus.
public open class Tooltip : Cell[TooltipInput], IDisposable {
    private let anchor ElementHandle = ElementHandle()
    private var current TooltipInput
    private var pending WindowTimer?
    private var hovered bool
    private var focused bool
    private var visible bool
    private var suppressed bool
    private var disposed bool

    /// Cancels a pending label when this Cell unmounts.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        CancelPending()
    }

    protected override func Build(input TooltipInput) Blob {
        if input.Window == nil || input.Target == nil {
            throw ArgumentException("Tooltip requires Window and Target")
        }
        if input.Content == nil && String.IsNullOrWhiteSpace(input.Text) {
            throw ArgumentException("Tooltip requires Content or Text")
        }
        let delay = input.DelayMs ?? 500.0
        let gap = input.Gap ?? 6.0
        if !Double.IsFinite(delay) || delay < 0.0 || !Double.IsFinite(gap) || gap < 0.0 {
            throw ArgumentOutOfRangeException("input", "Tooltip delay and gap must be finite and nonnegative")
        }
        if !Enum.IsDefined(input.Placement) {
            throw ArgumentOutOfRangeException("Placement")
        }
        if current.Window != input.Window {
            CancelPending()
            hovered = false
            focused = false
            visible = false
            suppressed = false
        }
        current = input with{DelayMs = delay, Gap = gap, ZIndex = input.ZIndex == 0 ? 30: input.ZIndex}
        let root = Container{
            BasedOn: current.RootStyle,
            Handle: anchor,
            Position: PositionType.Relative,
            HitTestSelf: false,
            OnPointerEnter: (event PointerEvent) -> PointerEntered(),
            OnPointerLeave: (event PointerEvent) -> PointerLeft(),
            OnPointerDown: (event PointerEvent) -> Dismiss(),
            OnFocus: (event FocusEvent) -> FocusEntered(),
            OnBlur: (event FocusEvent) -> FocusLeft(),
            OnKeyDown: KeyDown,
            input.Target!!,
        }
        if input.Target!!.Disabled {
            root.Children.Add(Container{
                Position: PositionType.Absolute,
                Left: 0.0,
                Right: 0.0,
                Top: 0.0,
                Bottom: 0.0,
                HitTestSelf: true,
                Focusable: false,
                TabStop: false,
                Accessibility: Accessibility{Role: AccessibilityRole.None, Hidden: true},
            })
        }
        if visible {
            let content = current.Content ?? Text{Content: current.Text!!, FontSize: 12.0, Color: "#E8EDF2"}
            let bubble = if let create = current.CreateBubble {
                create(current, content)
            } else {
                Container{
                    BasedOn: current.BubbleStyle ?? Style{
                        Padding: Edges{Top: 6.0, Right: 9.0, Bottom: 6.0, Left: 9.0},
                        BackgroundColor: "#202832",
                        BorderColor: Color.Parse("#465260"),
                        BorderWidth: 1.0,
                        BorderRadius: 6.0,
                    },
                    content,
                }
            }
            bubble.HitTestSelf = false
            bubble.Focusable = false
            bubble.TabStop = false
            bubble.Accessibility = Accessibility{Role: AccessibilityRole.None, Hidden: true}
            root.Children.Add(Portal{
                Anchor: anchor,
                Placement: current.Placement,
                ZIndex: current.ZIndex,
                Padding: gap,
                bubble,
            })
        }
        return root
    }

    private func PointerEntered() {
        hovered = true
        if suppressed {
            return
        }
        if focused || visible {
            Show()
            return
        }
        CancelPending()
        if current.DelayMs!! == 0.0 {
            Show()
        } else {
            pending = current.Window!!.SetTimeout(() -> Show(), current.DelayMs!!)
        }
    }

    private func PointerLeft() {
        hovered = false
        suppressed = false
        CancelPending()
        if !focused {
            Hide()
        }
    }

    private func FocusEntered() {
        focused = true
        CancelPending()
        if !suppressed {
            Show()
        }
    }

    private func FocusLeft() {
        focused = false
        suppressed = false
        if !hovered {
            Hide()
        }
    }

    private func KeyDown(event KeyEvent) {
        if event.Key == Key.Escape {
            Dismiss()
        }
    }

    private func Dismiss() {
        suppressed = true
        Hide()
    }

    private func Show() {
        pending = nil
        if disposed || visible || suppressed || !anchor.IsMounted || (!hovered && !focused) {
            return
        }
        visible = true
        Rebuild()
    }

    private func Hide() {
        CancelPending()
        if !visible {
            return
        }
        visible = false
        Rebuild()
    }

    private func CancelPending() {
        pending?.Dispose()
        pending = nil
    }
}
