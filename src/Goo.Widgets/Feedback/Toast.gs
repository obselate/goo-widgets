package Goo.Widgets.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import System
import System.Collections.Generic
import System.Diagnostics

/// A controlled toast identity, message, optional action and timeout. Zero timeout stays open.
public data struct ToastItem {
    /// Stable, nonempty toast ID. Keep it unique within the host collection.
    var Id string
    /// Required notification heading.
    var Title string
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Semantic color family resolved through the nearest theme. The default is Neutral.
    var Tone Tone
    /// Action button label. Nil omits the action button.
    var ActionLabel string?
    /// Runs when the toast action is activated. Nil supplies no action.
    var OnAction Action?
    /// Finite nonnegative timeout in milliseconds. Nil uses 5000. Zero keeps the toast open. Hover and focus pause the timer.
    var DurationMs float64?
}

/// Toast content and lifecycle. Nil Open means open.
public data struct ToastInput {
    /// Caller-owned window used for overlays and lifecycle notifications. The widget does not dispose it.
    var Window Window
    /// Caller-owned notification content and timeout settings.
    var Item ToastItem
    /// Controlled visibility. Nil means open.
    var Open bool?
    /// Receives the toast ID after timeout or user dismissal. Nil ignores the request.
    var OnDismiss Action[string]?
    /// Requests false after timeout or user action, before the exit animation and OnDismiss. Programmatic closing does not emit it.
    var OnOpenChange Action[bool]?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateRoot Func[ToastInput, Container, Container]?
}

/// A polite notification that pauses its timeout on hover and descendant focus.
public open class Toast : Cell[ToastInput], IDisposable {
    private let opacity Anim[float64]
    private let pointerEnter Action[PointerEvent]
    private let pointerLeave Action[PointerEvent]
    private let focus Action[FocusEvent]
    private let blur Action[FocusEvent]
    private let action Action
    private let dismiss Action
    private var current ToastInput
    private var timer WindowTimer?
    private var remaining float64
    private var started int64
    private var initialized bool
    private var hovered bool
    private var focused bool
    private var departing bool
    private var closing bool
    private var closed bool
    private var reduced bool
    private var duration float64

    /// Creates timeout and focus handlers. Dispose the toast to release its window subscriptions.
    public init() {
        opacity = AnimateValue(1.0)
        opacity.Completed += (reason MotionCompletionReason) -> Finish()
        pointerEnter = (event PointerEvent) -> {
            hovered = true
            Pause()
        }
        pointerLeave = (event PointerEvent) -> {
            hovered = false
            Resume()
        }
        focus = (event FocusEvent) -> {
            focused = true
            Pause()
        }
        blur = (event FocusEvent) -> {
            focused = false
            Resume()
        }
        action = () -> {
            if !closing {
                InvokeInputCallback(current.Item.OnAction)
                Dismiss()
            }
        }
        dismiss = Dismiss
    }

    /// Cancels the window timer when the toast unmounts.
    public func Dispose() {
        timer?.Dispose()
        timer = nil
    }

    protected override func Build(input ToastInput) Blob {
        let theme = Theme.Read()
        let timeout = input.Item.DurationMs ?? 5000.0
        if !Double.IsFinite(timeout) || timeout < 0.0 {
            throw ArgumentOutOfRangeException("DurationMs")
        }
        if initialized && current.Window != input.Window {
            Pause()
        }
        current = input with{Item = input.Item with{DurationMs = timeout}}
        reduced = theme.ReducedMotion
        duration = theme.MotionFastMs
        if !initialized {
            initialized = true
            remaining = timeout
        }
        if input.Open == false && !closing && !departing {
            Pause()
            departing = true
            timer = current.Window.SetTimeout(dismiss, 0.0)
        }
        if closed {
            return Container{}
        }
        Resume()
        let content = Container{
            Gap: theme.Spacing,
            Text{Content: input.Item.Title, Color: theme.TextColor, FontWeight: theme.FontWeight + 100},
        }
        if let description = input.Item.Description {
            content.Children.Add(
                Text{Content: description, Color: theme.MutedTextColor, FontSize: theme.CaptionFontSize}
            )
        }
        let root = Container{
            BasedOn: theme.OverlayStyle,
            LineHeight: theme.LineHeight,
            Gap: theme.ControlGap,
            Padding: theme.ControlPadding,
            BorderRadius: theme.PanelRadius!!,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.ToneColor(input.Item.Tone),
            BackgroundColor: theme.PanelColor,
            OpacityAnim: opacity,
            OnPointerEnter: pointerEnter,
            OnPointerLeave: pointerLeave,
            OnFocus: focus,
            OnBlur: blur,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Status,
                Name: input.Item.Title,
                Live: AccessibilityLive.Polite
            },
            content,
        }
        let actions = Container{
            FlexDirection: FlexDirection.Row,
            JustifyContent: JustifyContent.FlexEnd,
            Gap: theme.ControlGap,
        }
        if let label = input.Item.ActionLabel {
            actions.Children.Add(ActionButton{Content: label, OnClick: action}.Build())
        }
        actions.Children.Add(ActionButton{Content: theme.Text("Dismiss"), OnClick: dismiss}.Build())
        root.Children.Add(actions)
        return input.CreateRoot?.Invoke(input, root) ?? root
    }

    private func Pause() {
        if timer != nil && !departing {
            remaining = Math.Max(
                0.0,
                remaining - float64(Stopwatch.GetTimestamp() - started) * 1000.0 / float64(Stopwatch.Frequency)
            )
            timer!!.Dispose()
            timer = nil
        }
    }

    private func Resume() {
        if timer == nil && !hovered && !focused && !closing && !departing
        && current.Item.DurationMs!!> 0.0 && current.Window.IsOpen {
            started = Stopwatch.GetTimestamp()
            timer = current.Window.SetTimeout(dismiss, remaining)
        }
    }

    private func Dismiss() {
        if closing {
            return
        }
        Pause()
        closing = true
        if !departing {
            InvokeInputCallback(current.OnOpenChange, false)
        }
        if reduced || duration <= 0.0 {
            Finish()
        } else {
            opacity.To(0.0, Motion.Tween(duration, Easing.EaseOut))
        }
        Rebuild()
    }

    private func Finish() {
        if !closing || closed {
            return
        }
        closed = true
        InvokeInputCallback(current.OnDismiss, current.Item.Id)
        Rebuild()
    }
}

/// The window corner used by a toast stack.
public enum ToastPlacement {
    /// Stacks notifications at the bottom right of the window.
    BottomRight;
    /// Stacks notifications at the bottom left of the window.
    BottomLeft;
    /// Stacks notifications at the top right of the window.
    TopRight;
    /// Stacks notifications at the top left of the window.
    TopLeft
}

/// Controlled items in a window overlay. Nil limits use three items and 360 pixels.
public data struct ToastHostInput {
    /// Caller-owned window used for overlays and lifecycle notifications. The widget does not dispose it.
    var Window Window
    /// Host-owned notifications in display order. Each ID must be nonempty and unique.
    var Items[]ToastItem
    /// Receives the dismissed toast ID. The host removes it from Items. Nil ignores the request.
    var OnDismiss Action[string]?
    /// Preferred anchor-relative placement. Collision handling can move the popup into view.
    var Placement ToastPlacement
    /// Maximum displayed notifications, clamped to zero or greater. Nil uses 3.
    var MaxVisible int32?
    /// Stack width, limited by the viewport. Nil uses 360.
    var Width Length?
    /// Receives the host input, toast input, and prepared container, and returns its replacement. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateToast Func[ToastHostInput, ToastInput, Container, Container]?
}

/// Retains removed notifications until their exit animation finishes.
public open class ToastHost : Cell[ToastHostInput] {
    private let retained List[ToastItem] = List[ToastItem]()
    private let dismissed HashSet[string] = HashSet[string]()
    private let incoming HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let positions Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private let createToast Func[ToastInput, Container, Container]
    private let finished Action[string]
    private var current ToastHostInput

    /// Creates the retained notification-dismissal handler.
    public init() {
        finished = Finished
        createToast = (toast, root) -> current.CreateToast?.Invoke(current, toast, root) ?? root
    }

    protected override func Build(input ToastHostInput) Blob {
        current = input
        let theme = Theme.Read()
        let items = input.Items ?? []ToastItem{}
        incoming.Clear()
        positions.Clear()
        for index in 0 ... retained.Count {
            positions[retained[index].Id] = index
        }
        for item in items {
            incoming.Add(item.Id)
            if positions.TryGetValue(item.Id, out var index) {
                retained[index] = item
            } else if !dismissed.Contains(item.Id) {
                positions[item.Id] = retained.Count
                retained.Add(item)
            }
        }
        dismissed.RemoveWhere(id -> !incoming.Contains(id))
        let defaultWidth Length = 360.0
        let stack = Container{
            Position: PositionType.Absolute,
            Width: input.Width ?? defaultWidth,
            MaxWidth: Percent(100),
            Gap: theme.ControlGap,
            Padding: theme.ControlGap,
        }
        if input.Placement == ToastPlacement.TopLeft || input.Placement == ToastPlacement.TopRight {
            stack.Top = 0.0
        } else {
            stack.Bottom = 0.0
        }
        if input.Placement == ToastPlacement.TopLeft || input.Placement == ToastPlacement.BottomLeft {
            stack.Left = 0.0
        } else {
            stack.Right = 0.0
        }
        for index in 0 ... Math.Min(retained.Count, Math.Max(0, input.MaxVisible ?? 3)) {
            let item = retained[index]
            stack.Children.Add(
                Cell.Mount[ToastInput, Toast](
                    item.Id,
                    ToastInput{
                        Window: input.Window,
                        Item: item with{OnAction = item.OnAction == nil ? nil: () -> InvokeInputCallback(item.OnAction)},
                        Open: incoming.Contains(item.Id),
                        OnDismiss: finished,
                        CreateRoot: input.CreateToast == nil ? nil: createToast,
                    }
                )
            )
        }
        return Portal{Width: Percent(100), Height: Percent(100), ZIndex: 30, stack}
    }

    private func Finished(id string) {
        for index in 0 ... retained.Count {
            if retained[index].Id == id {
                retained.RemoveAt(index)
                break
            }
        }
        dismissed.Add(id)
        InvokeInputCallback(current.OnDismiss, id)
        Rebuild()
    }
}
