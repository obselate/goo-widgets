package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import System

/// Interactive card shown for a target.
public data struct HoverCardInput {
    /// Control that opens and anchors the card. It keeps its own input handlers and Handle.
    var Target Blob?
    /// Card content. It can hold buttons and links.
    var Content Blob?
    /// Hover delay before opening. Nil uses 500. Zero opens at once.
    var OpenDelayMs float64?
    /// Delay after the pointer and focus leave the target and card. Nil uses 300.
    var CloseDelayMs float64?
    var Placement PopoverPlacement
    /// Nil uses 320.
    var Width Length?
    var AccessibilityName string?
}

/// Opens a Group card on hover, focus or press without moving focus. Tab reaches the card content.
/// It stays open while the pointer or focus is on the target or the card. Escape closes it.
/// A touch press keeps it open until an outside press.
public open class HoverCard : Cell[HoverCardInput], IDisposable {
    private let anchor ElementHandle = ElementHandle()
    private let pointerEnter Action[PointerEvent]
    private let pointerLeave Action[PointerEvent]
    private let pointerUp Action[PointerEvent]
    private let focus Action[FocusEvent]
    private let blur Action[FocusEvent]
    private let dismiss Action[PopoverDismissReason]
    private let show Action
    private let hide Action
    private var current HoverCardInput
    private var window Window?
    private var pending WindowTimer?
    private var hovered bool
    private var focused bool
    private var shown bool
    private var pinned bool

    /// Creates a retained hover card with stable input callbacks.
    public init() {
        pointerEnter = (event PointerEvent) -> {
            hovered = true
            Update()
        }
        pointerLeave = (event PointerEvent) -> {
            hovered = false
            Update()
        }
        pointerUp = (event PointerEvent) -> {
            Cancel()
            pinned = event.Device == PointerDevice.Touch
            shown = true
            Rebuild()
        }
        focus = (event FocusEvent) -> {
            focused = true
            Update()
        }
        blur = (event FocusEvent) -> {
            focused = false
            Update()
        }
        dismiss = (reason PopoverDismissReason) -> {
            pinned = false
            Show(false)
        }
        show = () -> Show(true)
        hide = () -> Show(false)
    }

    /// Cancels a pending open or close when this Cell unmounts.
    public func Dispose() {
        Cancel()
    }

    protected override func Build(input HoverCardInput) Blob {
        if input.Target == nil || input.Content == nil {
            throw ArgumentException("HoverCard requires Target and Content")
        }
        let openDelay = input.OpenDelayMs ?? 500.0
        let closeDelay = input.CloseDelayMs ?? 300.0
        if !Double.IsFinite(openDelay) || openDelay < 0.0 || !Double.IsFinite(closeDelay) || closeDelay < 0.0 {
            throw ArgumentOutOfRangeException("input", "HoverCard delays must be finite and nonnegative")
        }
        current = input with{OpenDelayMs = openDelay, CloseDelayMs = closeDelay}
        window = Theme.Key.Window
        let defaultWidth Length = 320
        let target = input.Target!!
        target.Handle = target.Handle ?? anchor
        return Container{
            HitTestSelf: false,
            OnPointerEnter: pointerEnter,
            OnPointerLeave: pointerLeave,
            OnPointerUp: pointerUp,
            OnFocus: focus,
            OnBlur: blur,
            target,
            Cell.Mount[PopoverInput, Popover](
                "card",
                PopoverInput{
                    Open: shown,
                    Anchor: target.Handle,
                    Placement: input.Placement,
                    Width: input.Width ?? defaultWidth,
                    TakeFocus: false,
                    DismissOnOutsideClick: pinned,
                    AccessibilityName: input.AccessibilityName,
                    OnDismiss: dismiss,
                    Content: input.Content,
                }
            ),
        }
    }

    private func Update() {
        Cancel()
        if pinned || (hovered || focused) == shown {
            return
        }
        if shown {
            pending = window!!.SetTimeout(hide, current.CloseDelayMs!!)
        } else if focused || current.OpenDelayMs!!== 0.0 {
            Show(true)
        } else {
            pending = window!!.SetTimeout(show, current.OpenDelayMs!!)
        }
    }

    private func Show(value bool) {
        Cancel()
        if shown != value {
            shown = value
            Rebuild()
        }
    }

    private func Cancel() {
        pending?.Dispose()
        pending = nil
    }
}
