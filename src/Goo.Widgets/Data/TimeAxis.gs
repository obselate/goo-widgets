package Goo.Widgets.Data

import Goo
import Goo.Widgets
import System
import System.Collections.Generic
import System.Globalization

/// An identified interval on a TimeAxis. Times are compared as absolute instants.
public data struct TimeAxisEvent {
    /// Required unique identity.
    var Id string?
    /// Required accessible and visible label.
    var Label string?
    /// Inclusive start instant.
    var Start DateTimeOffset
    /// Exclusive end instant. Equal endpoints represent a point event.
    var End DateTimeOffset
}

/// A resolved tick for custom ruler rendering.
public data struct TimeAxisTick {
    /// Tick instant, beginning at the range start.
    var Time DateTimeOffset
    /// Logical horizontal position within the canvas.
    var X float64
    /// Formatted visible label.
    var Label string?
}

/// Measured placement passed to event factories; duration and minimum visual width both participate in lane collision.
public data struct TimeAxisPlacement {
    /// Original host event.
    var Event TimeAxisEvent
    /// Zero-based collision lane.
    var Lane int32
    /// Clipped horizontal position in the canvas.
    var X float64
    /// Clipped visual width, including the minimum point-event width.
    var Width float64
}

/// A viewport snapshot delivered after initial placement.
public data struct TimeAxisViewport {
    /// First visible instant.
    var Start DateTimeOffset
    /// Last visible instant, capped to the range end.
    var End DateTimeOffset
    /// Horizontal logical scroll offset.
    var Offset float64
}

/// How an initial or explicit reveal target is placed in the viewport.
public enum TimeAxisAlignment {
    Center;
    Start;
    Nearest
}

/// Controlled data, scale, factories, and viewport requests for a horizontal timeline.
public data struct TimeAxisInput {
    /// Inclusive visible range start.
    var Start DateTimeOffset
    /// Exclusive range end; must be later than Start.
    var End DateTimeOffset
    /// Tick interval. Nil resolves to one hour; ranges may contain at most 4096 ticks.
    var TickInterval TimeSpan?
    /// Formats ruler ticks. Nil uses HH:mm in the current culture and the range-start offset.
    var FormatTick Func[DateTimeOffset, string]?
    /// Logical pixels per hour. Nil resolves to 120.
    var PixelsPerHour float64?
    /// Unique identified intervals; events outside the range are omitted.
    var Events[]?TimeAxisEvent
    /// Controlled selected identity.
    var SelectedId string?
    /// Optional event activation callback.
    var OnSelect Action[string]?
    /// Optional action for collapsed events, in chronological order.
    var OnOverflow Action[[]TimeAxisEvent]?
    /// Maximum visible collision lanes. Nil resolves to four; must be from one to 1024.
    var MaximumLanes int32?
    /// Event row height. Nil resolves to 30.
    var LaneHeight float64?
    /// Gap between event rows. Nil resolves to 6.
    var LaneGap float64?
    /// Minimum event visual width, included in collision handling. Nil resolves to 6.
    var MinimumEventWidth float64?
    /// Optional current-time marker. The host updates this value; the widget owns no timer.
    var CurrentTime DateTimeOffset?
    /// Marker label. Nil resolves to Now.
    var MarkerLabel string?
    /// Marker fill. Nil resolves to #fb7185.
    var MarkerColor Color?
    /// Center this instant once after mounting, unless InitialEventId is supplied.
    var InitialTime DateTimeOffset?
    /// Center this event on the first layout. Unknown IDs are ignored; takes precedence over InitialTime.
    var InitialEventId string?
    /// Initial placement. Defaults to Center. Later scroll offsets remain under user/host control.
    var InitialAlignment TimeAxisAlignment
    /// Reports subsequent scroll/viewport changes on the UI thread, including handle scrolling. Hosts displaying the result should Rebuild.
    var OnViewportChanged Action[TimeAxisViewport]?
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Root height. Nil fits the ruler, lanes, and overflow row.
    var Height Length?
    /// Accessible group name. Nil resolves to Timeline.
    var AccessibilityName string?
    /// Customizes a ruler tick; identity and logical position are reapplied.
    var CreateTick Func[TimeAxisInput, TimeAxisTick, Container, Container]?
    /// Customizes the marker; identity, position, and decorative semantics are reapplied.
    var CreateMarker Func[TimeAxisInput, Container, Container]?
    /// Customizes an event; placement, identity, selection, activation, and semantics are reapplied.
    var CreateEvent Func[TimeAxisInput, TimeAxisPlacement, Button, Button]?
    /// Customizes the chronological collapsed-event summary; wiring and placement are reapplied.
    var CreateOverflow Func[TimeAxisInput, []TimeAxisEvent, Button, Button]?
    /// Customizes the scroll viewport; handle, scrolling, semantics, and canvas are reapplied.
    var CreateRoot Func[TimeAxisInput, Container, Container]?
}

/// A mounted horizontal time axis with deterministic collision lanes and initial viewport placement.
public open class TimeAxis : Cell[TimeAxisInput], IDisposable {
    private let viewport ElementHandle = ElementHandle()
    private var input TimeAxisInput
    private var events[]TimeAxisEvent = []TimeAxisEvent{}
    private var canvasWidth float64
    private var initialDone bool
    private var lastOffset float64
    private var lastWidth float64
    private var disposed bool

    /// Subscribes to stable viewport metrics for this mounted instance.
    public init() {
        viewport.MetricsChanged += Metrics
    }

    /// Releases the viewport subscription. Idempotent; caller-supplied data remains host-owned.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        viewport.MetricsChanged -= Metrics
    }

    protected override func Build(value TimeAxisInput) Blob {
        input = value with{
            TickInterval = value.TickInterval ?? TimeSpan.FromHours(1),
            PixelsPerHour = value.PixelsPerHour ?? 120.0,
            MaximumLanes = value.MaximumLanes ?? 4,
            LaneHeight = value.LaneHeight ?? 30.0,
            LaneGap = value.LaneGap ?? 6.0,
            MinimumEventWidth = value.MinimumEventWidth ?? 6.0,
            MarkerLabel = value.MarkerLabel ?? "Now",
            MarkerColor = value.MarkerColor ?? Color.Parse("#fb7185"),
            Width = value.Width ?? Length.Percent(100),
            AccessibilityName = value.AccessibilityName ?? "Timeline"
        }
        let duration = input.End - input.Start
        if duration.Ticks <= 0 || input.TickInterval!!.Ticks <= 0 {
            throw ArgumentOutOfRangeException("TimeAxis range/tick interval")
        }
        if duration.Ticks / input.TickInterval!!.Ticks >= 4096L {
            throw ArgumentOutOfRangeException("TimeAxis has more than 4096 ticks")
        }
        let scale = input.PixelsPerHour!!
        let height = input.LaneHeight!!
        let gap = input.LaneGap!!
        let minimum = input.MinimumEventWidth!!
        canvasWidth = duration.TotalHours * scale
        if !Double.IsFinite(scale) || scale <= 0.0 || !Double.IsFinite(canvasWidth) ||
            canvasWidth > 1e9 ||
            canvasWidth < .01
        || !Double.IsFinite(height) || height <= 0.0 || !Double.IsFinite(gap) || gap < 0.0 || !Double.IsFinite(
            minimum
        ) ||
            minimum <= 0.0
        || input.MaximumLanes!!< 1 || input.MaximumLanes!!> 1024 {
            throw ArgumentOutOfRangeException("TimeAxis scale/lanes")
        }
        events = input.Events ?? []TimeAxisEvent{}
        let ids = HashSet[string](StringComparer.Ordinal)
        let visible = List[TimeAxisEvent]()
        for item in events {
            if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) || String.IsNullOrWhiteSpace(item.Label) {
                throw ArgumentException("TimeAxis events require unique IDs and labels.")
            }
            if item.End < item.Start {
                throw ArgumentOutOfRangeException("TimeAxis event interval")
            }
            if item.Start < input.End &&
                (item.End > input.Start || (item.Start == item.End && item.Start == input.Start)) {
                visible.Add(item)
            }
        }
        visible.Sort(
            (a TimeAxisEvent, b TimeAxisEvent) -> a.Start == b.Start ? StringComparer.Ordinal.Compare(a.Id, b.Id): a
                .Start
                .CompareTo(b.Start)
        )
        let ends = List[float64]()
        let placements = List[TimeAxisPlacement]()
        let overflow = List[TimeAxisEvent]()
        for item in visible {
            let left = Math.Max(0, X(item.Start))
            let right = Math.Min(canvasWidth, Math.Max(left + minimum, X(item.End)))
            var lane int32
            while lane < ends.Count && ends[lane] > left {
                lane++
            }
            if lane >= input.MaximumLanes!! {
                overflow.Add(item)
                continue
            }
            if lane == ends.Count {
                ends.Add(right)
            } else {
                ends[lane] = right
            }
            placements.Add(TimeAxisPlacement{Event: item, Lane: lane, X: left, Width: right - left})
        }
        let canvasHeight = 30.0 + float64(Math.Max(1, ends.Count) + (overflow.Count > 0 ? 1: 0)) * (height + gap)
        let canvas = Container{
            Width: canvasWidth,
            Height: canvasHeight,
            FlexShrink: 0,
            Position: PositionType.Relative,
            Overflow: Overflow.Hidden
        }
        let tickCount = int32(duration.Ticks / input.TickInterval!!.Ticks) + 1
        for index in 0 ... tickCount {
            let time = input.Start.AddTicks(int64(index) * input.TickInterval!!.Ticks)
            let tick = TimeAxisTick{
                Time: time,
                X: X(time),
                Label: input.FormatTick == nil ? time.ToString("HH:mm", CultureInfo.CurrentCulture): input.FormatTick!!(
                    time
                )
            }
            var blob = Container{
                Width: 1,
                Height: canvasHeight,
                BackgroundColor: "#34343e",
                HitTestSelf: false,
                Text{
                    Content: tick.Label!!,
                    Position: PositionType.Absolute,
                    Left: 5,
                    Top: 3,
                    FontSize: 11,
                    Color: "#a1a1aa",
                    TextWrap: TextWrap.NoWrap
                }
            }
            if let create = input.CreateTick {
                blob = create(input, tick, blob)
            }
            blob.Key = "tick:" + index.ToString()
            blob.Position = PositionType.Absolute
            blob.Left = tick.X
            blob.Top = 0
            canvas.Children.Add(blob)
        }
        for placement in placements {
            let item = placement.Event
            let selected = item.Id == input.SelectedId
            var blob = Button{
                PaddingLeft: 8,
                PaddingRight: 8,
                BackgroundColor: selected ? Color.Parse("#4f46a5"): Color.Parse("#313b50"),
                BorderRadius: 4,
                BorderWidth: selected ? 2.0: 0.0,
                BorderColor: "#a5b4fc",
                Color: "#e4e4e7",
                Hover: Style{Opacity: .85},
                Focus: Style{BorderWidth: 2, BorderColor: "#e0e7ff"},
                Overflow: Overflow.Hidden,
                JustifyContent: JustifyContent.Center,
                Text{Content: item.Label!!, FontSize: 12, TextWrap: TextWrap.NoWrap}
            }
            if placement.Width < 40.0 {
                blob.Children.Clear()
            }
            if let create = input.CreateEvent {
                blob = create(input, placement, blob)
            }
            blob.Key = "event:" + item.Id!!
            Place(blob, placement.X, 30.0 + float64(placement.Lane) * (height + gap), placement.Width, height)
            blob.Focusable = input.OnSelect != nil
            blob.OnClick = input.OnSelect == nil ? nil: () -> input.OnSelect?.Invoke(item.Id!!)
            WidgetKeyBindings.BindActivation(blob)
            blob.Accessibility = Accessibility{
                Role: AccessibilityRole.Button,
                Name: EventName(item),
                Selected: selected
            }
            canvas.Children.Add(blob)
        }
        if overflow.Count > 0 {
            let hidden = overflow.ToArray()
            let left = Math.Max(0, X(hidden[0].Start))
            var right = Math.Min(canvasWidth, left + 80.0)
            for item in hidden {
                right = Math.Min(canvasWidth, Math.Max(right, X(item.End)))
            }
            var blob = Button{
                PaddingLeft: 6,
                PaddingRight: 6,
                BackgroundColor: "#292936",
                Color: "#c4b5fd",
                BorderRadius: 4,
                Overflow: Overflow.Hidden,
                Text{Content: "+" + hidden.Length.ToString() + " more", FontSize: 12, TextWrap: TextWrap.NoWrap}
            }
            if let create = input.CreateOverflow {
                blob = create(input, hidden, blob)
            }
            blob.Key = "overflow"
            Place(blob, left, 30.0 + float64(ends.Count) * (height + gap), right - left, height)
            blob.Focusable = input.OnOverflow != nil
            blob.OnClick = input.OnOverflow == nil ? nil: () -> input.OnOverflow?.Invoke(hidden)
            WidgetKeyBindings.BindActivation(blob)
            let names = List[string]()
            for item in hidden {
                names.Add(EventName(item))
            }
            blob.Accessibility = Accessibility{
                Role: AccessibilityRole.Button,
                Name: hidden.Length.ToString() + " overlapping events",
                Description: String.Join("; ", names)
            }
            canvas.Children.Add(blob)
        }
        if let time = input.CurrentTime {
            if time >= input.Start && time < input.End {
                var marker = Container{
                    Width: 2,
                    Height: canvasHeight,
                    BackgroundColor: input.MarkerColor!!,
                    HitTestSelf: false,
                    Text{
                        Content: input.MarkerLabel!!,
                        Position: PositionType.Absolute,
                        Left: 5,
                        Top: 16,
                        FontSize: 10,
                        Color: input.MarkerColor!!,
                        TextWrap: TextWrap.NoWrap
                    }
                }
                if let create = input.CreateMarker {
                    marker = create(input, marker)
                }
                marker.Key = "marker"
                marker.Position = PositionType.Absolute
                marker.Left = X(time)
                marker.Top = 0
                marker.HitTestSelf = false
                marker.Accessibility = Accessibility{Hidden: true}
                canvas.Children.Add(marker)
            }
        }
        let naturalHeight Length = canvasHeight + 8.0
        var root = Container{
            Handle: viewport,
            Focusable: true,
            Width: input.Width!!,
            Height: input.Height ?? naturalHeight,
            MinWidth: 0,
            BackgroundColor: "#17171e",
            BorderRadius: 6
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.Handle = viewport
        root.OverflowX = Overflow.Scroll
        root.OverflowY = Overflow.Hidden
        root.OnKeyDown = KeyDown
        root.Accessibility = Accessibility{Role: AccessibilityRole.Group, Name: input.AccessibilityName!!}
        root.Children.Clear()
        root.Children.Add(canvas)
        return root
    }

    private func Place(blob Blob, x float64, y float64, width float64, height float64) {
        blob.Position = PositionType.Absolute
        blob.Left = x
        blob.Top = y
        blob.Width = width
        blob.Height = height
        blob.MinWidth = 0
        blob.FlexShrink = 0
    }

    private func X(time DateTimeOffset) float64 -> (time - input.Start).TotalHours * input.PixelsPerHour!!

    private func EventName(item TimeAxisEvent) string -> item.Label + ", " + item.Start.ToString(
        "g",
        CultureInfo.CurrentCulture
    ) +
        " – " +
        item
        .End
        .ToString("g", CultureInfo.CurrentCulture)

    private func At(x float64) DateTimeOffset {
        let ticks = (input.End - input.Start).Ticks
        return input.Start.AddTicks(
            Math.Clamp(int64(Math.Clamp(x / canvasWidth, 0.0, 1.0) * float64(ticks)), 0L, ticks)
        )
    }

    private func ApplyInitial(width float64, scrollRange float64) bool {
        if width <= 0.0 || initialDone {
            return false
        }
        let eventId = input.InitialEventId
        var target = input.InitialTime
        var targetEnd = target
        if !String.IsNullOrEmpty(eventId) {
            target = nil
            for item in events {
                if item.Id == eventId {
                    target = item.Start
                    targetEnd = item.End
                    break
                }
            }
        }
        if let time = target {
            let left = Math.Clamp(X(time), 0.0, canvasWidth)
            let right = Math.Clamp(X(targetEnd ?? time), left, canvasWidth)
            let alignment = input.InitialAlignment
            var offset = left
            if alignment == TimeAxisAlignment.Center {
                offset = (left + right - width) / 2.0
            } else if alignment == TimeAxisAlignment.Nearest {
                let current = viewport.ScrollOffset.X
                offset = left < current ? left: right > current + width ? right - width: current
            }
            lastOffset = Math.Clamp(offset, 0.0, scrollRange)
            viewport.JumpTo(lastOffset, 0)
        } else {
            lastOffset = viewport.ScrollOffset.X
        }
        lastWidth = width
        initialDone = true
        return true
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if ApplyInitial(metrics.ContentBox.Width, metrics.ScrollRange.X) {
            return
        }
        if Math.Abs(lastOffset - metrics.ScrollOffset.X) < .01 && Math.Abs(lastWidth - metrics.ContentBox.Width) < .01 {
            return
        }
        lastOffset = metrics.ScrollOffset.X
        lastWidth = metrics.ContentBox.Width
        input.OnViewportChanged?.Invoke(
            TimeAxisViewport{Start: At(lastOffset), End: At(lastOffset + lastWidth), Offset: lastOffset}
        )
    }

    private func KeyDown(e KeyEvent) {
        let current = viewport.ScrollOffset.X
        var next = current
        if e.Key == Key.Left {
            next -= input.PixelsPerHour!!/ 4.0
        } else if e.Key == Key.Right {
            next += input.PixelsPerHour!!/ 4.0
        } else if e.Key == Key.Home {
            next = 0
        } else if e.Key == Key.End {
            next = viewport.ScrollRange.X
        } else {
            return
        }
        e.PreventDefault()
        viewport.JumpTo(Math.Clamp(next, 0.0, viewport.ScrollRange.X), 0)
    }
}
