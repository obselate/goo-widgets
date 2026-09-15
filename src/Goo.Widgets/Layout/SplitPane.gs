package Goo.Widgets

import Goo
import System
import System.Globalization

/// The axis along which the first and second panes are placed.
public enum SplitOrientation {
    Horizontal;
    Vertical
}

/// Units for the controlled first-pane value.
public enum SplitUnit {
    Ratio;
    Pixels
}

/// Controlled split layout and callbacks. Oversubscribed minimum sizes shrink proportionally.
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
    /// Divider size in logical pixels. Nil resolves to 6.
    var HandleSize float64?
    /// Accessible separator name. Nil resolves to Resize panes.
    var AccessibilityName string?
    /// Customizes divider appearance; required identity, input, and semantics are reapplied.
    var CreateHandle Func[SplitPaneInput, Container, Container]?
    /// Customizes root appearance; required identity, axis, and pane children are reapplied.
    var CreateRoot Func[SplitPaneInput, Container, Container]?
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
        if !Double.IsFinite(value.Value) || !Double.IsFinite(value.MinimumFirst) || !Double.IsFinite(
            value.MinimumSecond
        )
        || value.MinimumFirst < 0.0 || value.MinimumSecond < 0.0 {
            throw ArgumentOutOfRangeException("Value/minimum sizes")
        }
        let step = value.Step ?? (value.Unit == SplitUnit.Ratio ? .02: 8.0)
        let size = value.HandleSize ?? 6.0
        if !Double.IsFinite(step) || step <= 0.0 || !Double.IsFinite(size) || size < 0.0 {
            throw ArgumentOutOfRangeException("Step/HandleSize")
        }
        input = value with{
            Step = step,
            HandleSize = size,
            Width = value.Width ?? Length.Percent(100),
            Height = value.Height ?? Length.Percent(100),
            AccessibilityName = value.AccessibilityName ?? "Resize panes"
        }
        if input.Disabled {
            pointer = -1L
        }
        let horizontal = input.Orientation == SplitOrientation.Horizontal
        let box = rootHandle.ContentBox
        available = Math.Max(0, (horizontal ? box.Width: box.Height) - size)
        let pixels = Clamp(input.Unit == SplitUnit.Ratio ? available * input.Value: input.Value)
        lastRequest = ToValue(pixels)
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
        var divider = Container{
            BackgroundColor: "#3f3f46",
            Hover: Style{BackgroundColor: "#71717a"},
            Focus: Style{BackgroundColor: "#a1a1aa"}
        }
        if let create = input.CreateHandle {
            divider = create(input, divider)
        }
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
        divider.OnKeyDown = KeyDown
        divider.Accessibility = Accessibility{
            Role: AccessibilityRole.Slider,
            Name: input.AccessibilityName!!,
            Orientation: horizontal ? AccessibilityOrientation.Horizontal: AccessibilityOrientation.Vertical,
            Range: AccessibilityValue{
                Minimum: 0,
                Maximum: input.Unit == SplitUnit.Ratio ? 1.0: available,
                Now: lastRequest,
                Text: lastRequest.ToString("0.##", CultureInfo.InvariantCulture)
            },
            Actions: []AccessibilityAction{
                AccessibilityAction.Increment,
                AccessibilityAction.Decrement,
                AccessibilityAction.SetValue
            },
            OnAction: AccessibilityAction,
        }
        var root = Container{Width: input.Width!!, Height: input.Height!!, MinWidth: 0, MinHeight: 0}
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.Handle = rootHandle
        root.FlexDirection = horizontal ? FlexDirection.Row: FlexDirection.Column
        root.Children.Clear()
        root.Children.Add(first)
        root.Children.Add(divider)
        root.Children.Add(second)
        return root
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        let next = Math.Max(
            0,
            (input.Orientation == SplitOrientation.Horizontal ? metrics.ContentBox.Width: metrics.ContentBox.Height) - (
                input.HandleSize ?? 6
            )
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

    private func Coordinate(e PointerEvent) float64 -> input.Orientation == SplitOrientation.Horizontal ? e
        .WindowPosition
        .X: e
        .WindowPosition
        .Y

    private func Request(pixels float64) {
        let next = ToValue(Clamp(pixels))
        if next == lastRequest {
            return
        }
        lastRequest = next
        input.OnChange?.Invoke(next)
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
        input.OnCommit?.Invoke(lastRequest)
    }

    private func Cancel(e PointerEvent) {
        if pointer == e.PointerId {
            e.ReleaseCapture()
            pointer = -1L
        }
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled {
            return
        }
        let horizontal = input.Orientation == SplitOrientation.Horizontal
        let decrease = e.Key == (horizontal ? Key.Left: Key.Up)
        let increase = e.Key == (horizontal ? Key.Right: Key.Down)
        if !decrease && !increase && e.Key != Key.Home && e.Key != Key.End {
            return
        }
        e.PreventDefault()
        let step = input.Step!!* (input.Unit == SplitUnit.Ratio ? available: 1.0)
        let current = input.Value * (input.Unit == SplitUnit.Ratio ? available: 1.0)
        Request(e.Key == Key.Home ? 0.0: e.Key == Key.End ? available: current + (decrease ? -step: step))
        input.OnCommit?.Invoke(lastRequest)
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
        input.OnCommit?.Invoke(lastRequest)
        return true
    }
}
