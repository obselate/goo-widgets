package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import System
import System.Globalization

/// The axis along which the first and second panes are placed.
public enum SplitOrientation {
    /// Places panes side by side.
    Horizontal;
    /// Places panes above and below one another.
    Vertical
}

/// Units for the controlled first-pane value.
public enum SplitUnit {
    /// Expresses the first pane size as a fraction of available space.
    Ratio;
    /// Expresses the first pane size in logical pixels.
    Pixels
}

/// Controlled split layout and callbacks. Oversubscribed minimum sizes shrink proportionally.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
public data struct SplitPaneInput {
    /// First pane content.
    var First Blob?
    /// Second pane content.
    var Second Blob?
    /// First pane ratio (0..1), or logical pixels when Unit is Pixels.
    var Value float64
    /// Value and callback units. Defaults to Ratio.
    var Unit SplitUnit
    /// Pane axis. Defaults to Horizontal.
    var Orientation SplitOrientation
    /// Requested minimum first-pane size in logical pixels.
    var MinimumFirst float64
    /// Requested minimum second-pane size in logical pixels.
    var MinimumSecond float64
    /// Keyboard step in Value units. Nil resolves to .02 or 8 pixels.
    var Step float64?
    /// Receives pointer or keyboard requests; the host must update Value.
    var OnChange Action[float64]?
    /// Receives the last requested value on pointer up; cancellation does not commit.
    var OnCommit Action[float64]?
    /// Disables splitter interaction.
    var Disabled bool
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Root height. Nil resolves to 100%.
    var Height Length?
    /// Pointer target size of the divider in logical pixels. The visible line is the theme border width. Nil resolves to twice the theme spacing.
    var HandleSize float64?
    /// Divider line color. Nil uses the theme border color.
    var HandleColor Color?
    /// Accessible separator name. Nil resolves to Resize panes.
    var AccessibilityName string?
    /// Configures the fresh handle before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Actions, Accessibility.Name, Accessibility.OnAction, Accessibility.Orientation, Accessibility.Range, Accessibility.Role, Disabled, Focusable, Handle, Key, KeyBindings (required entries), OnPointerCancel, OnPointerDown, OnPointerEnter, OnPointerLeave, OnPointerMove, OnPointerUp.
    var ConfigureHandle Action[SplitPaneInput, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Handle.
    var ConfigureRoot Action[SplitPaneInput, Container]?
}

/// A mounted, controlled splitter with captured dragging and keyboard adjustment.
public open class SplitPane : Cell[SplitPaneInput], IDisposable {
    private let rootHandle ElementHandle = ElementHandle()
    private let dividerHandle ElementHandle = ElementHandle()
    private var input SplitPaneInput
    private var available float64
    private var pointer int64 = -1L
    private var origin float64
    private var originSize float64
    private var lastRequest float64
    private var disposed bool
    private var rightToLeft bool
    private var hovered bool
    private var line float64

    /// Creates the stable geometry subscription for this mounted splitter.
    public init() {
        rootHandle.MetricsChanged += Metrics
    }

    /// Releases the splitter's geometry subscription. Idempotent.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        pointer = -1L
        rootHandle.MetricsChanged -= Metrics
    }

    protected override func Build(value SplitPaneInput) Blob {
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        if !Double.IsFinite(value.Value) || !Double.IsFinite(value.MinimumFirst) || !Double.IsFinite(
            value.MinimumSecond
        )
        || value.MinimumFirst < 0.0 || value.MinimumSecond < 0.0 {
            throw ArgumentOutOfRangeException("Value/minimum sizes")
        }
        let step = value.Step ?? (value.Unit == SplitUnit.Ratio ? .02: theme.Spacing * 2.0)
        let size = value.HandleSize ?? theme.Spacing * 2.0
        line = theme.BorderWidth
        if !Double.IsFinite(step) || step <= 0.0 || !Double.IsFinite(size) || size < 0.0 {
            throw ArgumentOutOfRangeException("Step/HandleSize")
        }
        input = value with{
            Step = step,
            HandleSize = size,
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? Percent(100),
            AccessibilityName = value.AccessibilityName ?? theme.Text("Resize panes")
        }
        if input.Disabled {
            pointer = -1L
        }
        let horizontal = input.Orientation == SplitOrientation.Horizontal
        let box = rootHandle.ContentBox
        available = Math.Max(0, (horizontal ? box.Width: box.Height) - line)
        let requested = input.Unit == SplitUnit.Ratio ? available * input.Value: input.Value
        let pixels = Clamp(requested)
        lastRequest = pixels == requested ? input.Value: ToValue(pixels)
        let first = Container{Key: "first", MinWidth: 0, MinHeight: 0, FlexShrink: 0, Overflow: Overflow.Hidden}
        let second = Container{
            Key: "second",
            MinWidth: 0,
            MinHeight: 0,
            FlexGrow: 1,
            FlexBasis: 0,
            Overflow: Overflow.Hidden
        }
        if horizontal {
            first.Width = pixels
        } else {
            first.Height = pixels
        }
        if let content = input.First {
            first.Children.Add(content)
        }
        if let content = input.Second {
            second.Children.Add(content)
        }
        let overlap = -Math.Max(0.0, size - line) / 2.0
        var divider = Container{
            ZIndex: 1,
            FlexDirection: horizontal ? FlexDirection.Row: FlexDirection.Column,
            JustifyContent: JustifyContent.Center,
            Margin: horizontal ? Edges{Left: overlap, Right: overlap}: Edges{Top: overlap, Bottom: overlap},
            FocusStyle: Style{
                BasedOn: theme.FocusStyle,
                OutlineWidth: Math.Max(1.0, theme.FocusRingWidth),
                OutlineOffset: -theme.FocusRingWidth
            },
            Container{
                Key: "line",
                Width: horizontal ? line: Percent(100),
                Height: horizontal ? Percent(100): line,
                BackgroundColor: pointer != -1L ? theme.AccentColor: hovered &&
                    !input.Disabled ? theme.StrongBorderColor
                : value.HandleColor ?? theme.BorderColor,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
            },
        }
        input.ConfigureHandle?.Invoke(input, divider)
        divider.Key = "divider"
        divider.Handle = dividerHandle
        divider.FlexShrink = 0
        divider.Disabled = input.Disabled
        divider.Focusable = !input.Disabled
        divider.Cursor = horizontal ? Cursor.ResizeHorizontal: Cursor.ResizeVertical
        if horizontal {
            divider.Width = size
        } else {
            divider.Height = size
        }
        divider.OnPointerDown = Begin
        divider.OnPointerMove = Move
        divider.OnPointerUp = End
        divider.OnPointerCancel = Cancel
        divider.OnPointerEnter = (e PointerEvent) -> Hover(true)
        divider.OnPointerLeave = (e PointerEvent) -> Hover(false)
        WidgetKeyBindings.AppendBindings(divider, []KeyBinding{
            KeyBinding{Key: Key.Home, OnPress: () -> KeyAction(Key.Home)},
            KeyBinding{Key: Key.End, OnPress: () -> KeyAction(Key.End)},
            KeyBinding{Key: Key.Left, Repeat: true, OnPress: () -> KeyAction(Key.Left)},
            KeyBinding{Key: Key.Right, Repeat: true, OnPress: () -> KeyAction(Key.Right)},
            KeyBinding{Key: Key.Up, Repeat: true, OnPress: () -> KeyAction(Key.Up)},
            KeyBinding{Key: Key.Down, Repeat: true, OnPress: () -> KeyAction(Key.Down)},
        })
        let dividerAccessibility = if let configured = divider.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        dividerAccessibility.Role = AccessibilityRole.Separator
        dividerAccessibility.Name = input.AccessibilityName!!
        dividerAccessibility.Orientation = horizontal ? AccessibilityOrientation.Vertical: AccessibilityOrientation.Horizontal
        dividerAccessibility.Range = AccessibilityValue{
                Minimum: 0,
                Maximum: input.Unit == SplitUnit.Ratio ? 1.0: available,
                Now: lastRequest,
                Text: lastRequest.ToString("0.##", CultureInfo.InvariantCulture)
            }
        dividerAccessibility.Actions = []AccessibilityAction{
                AccessibilityAction.Increment,
                AccessibilityAction.Decrement,
                AccessibilityAction.SetValue
            }
        dividerAccessibility.OnAction = AccessibilityAction
        divider.Accessibility = dividerAccessibility
        var root = Container{Width: input.Width!!, Height: input.Height!!, MinWidth: 0, MinHeight: 0}
        root.Children.Clear()
        root.Children.Add(first)
        root.Children.Add(divider)
        root.Children.Add(second)
        input.ConfigureRoot?.Invoke(input, root)
        root.Handle = rootHandle
        root.Direction = theme.Direction
        root.FlexDirection = horizontal ? FlexDirection.Row: FlexDirection.Column
        return root
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        let next = Math.Max(
            0,
            (
                input.Orientation == SplitOrientation.Horizontal ? metrics.ContentBox.Width: metrics.ContentBox.Height
            ) - line
        )
        if Math.Abs(next - available) > .01 {
            available = next
            Rebuild()
        }
    }

    private func Clamp(value float64) float64 {
        let total = input.MinimumFirst + input.MinimumSecond
        let factor = total > available && total > 0.0 ? available / total: 1.0
        return Math.Clamp(
            value,
            input.MinimumFirst * factor,
            Math.Max(input.MinimumFirst * factor, available - input.MinimumSecond * factor)
        )
    }

    private func ToValue(pixels float64) float64 -> input.Unit == SplitUnit.Ratio ? (
        available > 0.0 ? pixels / available: 0.0
    ): pixels

    private func Coordinate(e PointerEvent) float64 -> input.Orientation == SplitOrientation.Vertical ? e
        .WindowPosition
        .Y:
    rightToLeft ? -e.WindowPosition.X: e.WindowPosition.X

    private func Request(pixels float64) {
        let next = ToValue(Clamp(pixels))
        if next == lastRequest {
            return
        }
        lastRequest = next
        InvokeInputCallback(input.OnChange, next)
    }

    private func Begin(e PointerEvent) {
        if input.Disabled || pointer != -1L || e.Button != PointerButton.Primary {
            return
        }
        pointer = e.PointerId
        origin = Coordinate(e)
        originSize = Clamp(input.Unit == SplitUnit.Ratio ? available * input.Value: input.Value)
        e.Capture()
        e.PreventDefault()
        dividerHandle.Focus()
        Rebuild()
    }

    private func Move(e PointerEvent) {
        if !input.Disabled && pointer == e.PointerId {
            Request(originSize + Coordinate(e) - origin)
        }
    }

    private func End(e PointerEvent) {
        if pointer != e.PointerId {
            return
        }
        e.ReleaseCapture()
        pointer = -1L
        InvokeInputCallback(input.OnCommit, lastRequest)
        Rebuild()
    }

    private func Cancel(e PointerEvent) {
        if pointer == e.PointerId {
            e.ReleaseCapture()
            pointer = -1L
            Rebuild()
        }
    }

    private func Hover(value bool) {
        hovered = value
        Rebuild()
    }

    private func KeyAction(key Key) {
        if input.Disabled {
            return
        }
        let horizontal = input.Orientation == SplitOrientation.Horizontal
        let decrease = key == (horizontal ? (rightToLeft ? Key.Right: Key.Left): Key.Up)
        let increase = key == (horizontal ? (rightToLeft ? Key.Left: Key.Right): Key.Down)
        if !decrease && !increase && key != Key.Home && key != Key.End {
            return
        }
        let step = input.Step!!* (input.Unit == SplitUnit.Ratio ? available: 1.0)
        let current = input.Value * (input.Unit == SplitUnit.Ratio ? available: 1.0)
        Request(key == Key.Home ? 0.0: key == Key.End ? available: current + (decrease ? -step: step))
        InvokeInputCallback(input.OnCommit, lastRequest)
    }

    private func AccessibilityAction(request AccessibilityActionRequest) bool {
        if input.Disabled {
            return false
        }
        var value = input.Value
        if request.Action == Goo.AccessibilityAction.Increment {
            value += input.Step!!
        } else if request.Action == Goo.AccessibilityAction.Decrement {
            value -= input.Step!!
        } else if request.Action == Goo.AccessibilityAction.SetValue {
            if !Double.TryParse(request.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out value) ||
                !Double.IsFinite(value) {
                return false
            }
        } else {
            return false
        }
        Request(value * (input.Unit == SplitUnit.Ratio ? available: 1.0))
        InvokeInputCallback(input.OnCommit, lastRequest)
        return true
    }
}
