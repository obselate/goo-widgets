package Goo.Widgets.Feedback

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import System
import System.Collections.Generic
import System.Diagnostics

/// A controlled toast identity, message, optional action and timeout. Zero timeout stays open.
public data struct ToastItem {
    var Id string
    var Title string
    var Description string?
    var Tone Tone
    var ActionLabel string?
    var OnAction Action?
    var DurationMs float64?
}

/// Toast content and lifecycle. Nil Open means open.
public data struct ToastInput {
    var Window Window
    var Item ToastItem
    var Open bool?
    var OnDismiss Action[string]?
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

    public init() {
        opacity = Animate(1.0)
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
                current.Item.OnAction?.Invoke()
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
            LineHeight: theme.LineHeight,
            Gap: theme.ControlGap,
            Padding: theme.ControlPadding,
            BorderRadius: theme.PanelRadius,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.ToneColor(input.Item.Tone),
            BackgroundColor: theme.PanelColor,
            Opacity: opacity.Value,
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
            Gap: theme.Spacing,
        }
        if let label = input.Item.ActionLabel {
            actions.Children.Add(ActionButton{Content: label, OnClick: action}.Build())
        }
        actions.Children.Add(ActionButton{Content: "Dismiss", OnClick: dismiss}.Build())
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
        if reduced || duration <= 0.0 {
            Finish()
        } else {
            opacity.To(0.0, Motion.Tween(duration / 1000.0, Easing.EaseOut))
        }
        Rebuild()
    }

    private func Finish() {
        if !closing || closed {
            return
        }
        closed = true
        current.OnDismiss?.Invoke(current.Item.Id)
        Rebuild()
    }
}

/// The window corner used by a toast stack.
public enum ToastPlacement {
    BottomRight;
    BottomLeft;
    TopRight;
    TopLeft
}

/// Controlled items in a window overlay. Nil limits use three items and 360 pixels.
public data struct ToastHostInput {
    var Window Window
    var Items[]ToastItem
    var OnDismiss Action[string]?
    var Placement ToastPlacement
    var MaxVisible int32?
    var Width float64?
    var CreateToast Func[ToastInput, Container, Container]?
}

/// Retains removed notifications until their exit animation finishes.
public open class ToastHost : Cell[ToastHostInput] {
    private let retained List[ToastItem] = List[ToastItem]()
    private let dismissed HashSet[string] = HashSet[string]()
    private let incoming HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let positions Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private let finished Action[string]
    private var current ToastHostInput

    public init() {
        finished = Finished
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
        let stack = Container{
            Position: PositionType.Absolute,
            Width: input.Width ?? 360.0,
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
                        Item: item,
                        Open: incoming.Contains(item.Id),
                        OnDismiss: finished,
                        CreateRoot: input.CreateToast,
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
        current.OnDismiss?.Invoke(id)
        Rebuild()
    }
}
