package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class TimeAxisProbe : TimeAxis {
    internal func Render(input TimeAxisInput) Blob -> base.Build(input)
}

func AxisDay() DateTimeOffset -> DateTimeOffset(2026, 9, 14, 8, 0, 0, TimeSpan.Zero)

func AxisEvents()[]TimeAxisEvent {
    let day = AxisDay()
    return []TimeAxisEvent{
        TimeAxisEvent{Id: "alpha", Label: "Backup", Start: day, End: day.AddHours(3)},
        TimeAxisEvent{Id: "beta", Label: "Index refresh", Start: day.AddHours(1), End: day.AddHours(2)},
        TimeAxisEvent{Id: "overflow", Label: "Diagnostics", Start: day.AddHours(1.5), End: day.AddHours(2.5)},
        TimeAxisEvent{Id: "gamma", Label: "Reports", Start: day.AddHours(2), End: day.AddHours(3)},
        TimeAxisEvent{Id: "target", Label: "Release", Start: day.AddHours(6), End: day.AddHours(7)},
        TimeAxisEvent{Id: "point", Label: "Milestone", Start: day.AddHours(6), End: day.AddHours(6)},
        TimeAxisEvent{Id: "outside", Label: "Yesterday", Start: day.AddHours(-4), End: day.AddHours(-1)},
    }
}

func TimeAxisContracts() {
    let day = AxisDay()
    let placements = Dictionary[string, TimeAxisPlacement]()
    var hidden[]TimeAxisEvent = []TimeAxisEvent{}
    var overflowActivated int32
    var root Container?
    let probe = TimeAxisProbe()
    try {
        probe.Render(
            TimeAxisInput{
                Start: day,
                End: day.AddHours(12),
                Events: AxisEvents(),
                MaximumLanes: 2,
                OnOverflow: (items[]TimeAxisEvent) -> {
                    overflowActivated = items.Length
                },
                CreateEvent: (input TimeAxisInput, placement TimeAxisPlacement, prepared Button) -> {
                    placements.Add(placement.Event.Id!!, placement)
                    return Button(){Text{Content: placement.Event.Label!!}}
                },
                CreateOverflow: (input TimeAxisInput, items[]TimeAxisEvent, prepared Button) -> {
                    hidden = items
                    return prepared
                },
                CreateRoot: (input TimeAxisInput, prepared Container) -> {
                    root = prepared
                    return prepared
                },
            }
        )
        Require(
            placements.Count == 5 && !placements.ContainsKey("outside") &&
                hidden.Length == 1 &&
                hidden[0].Id == "overflow",
            "TimeAxis lost clipping or collision overflow"
        )
        Require(
            placements["alpha"].Lane == 0 && placements["beta"].Lane == 1 && placements["gamma"].Lane == 1,
            "Adjacent TimeAxis events did not reuse collision lanes"
        )
        Require(
            placements["point"].Width == 6.0 && placements["target"].Lane != placements["point"].Lane,
            "Point width was omitted from lane collisions"
        )
        let canvas = (root!!.Children[0] as Container)!!
        for child in canvas.Children {
            if child.Key == "overflow" {
                child.OnClick?.Invoke()
            }
        }
        Require(overflowActivated == 1 && root!!.Handle != nil, "Overflow action or prepared viewport handle was lost")
        var rejected bool
        try {
            probe.Render(TimeAxisInput{Start: day, End: day.AddDays(1), TickInterval: TimeSpan.FromSeconds(1)})
        } catch (error ArgumentException) {
            rejected = true
        }
        Require(rejected, "TimeAxis accepted unbounded tick creation")
        rejected = false
        try {
            probe.Render(TimeAxisInput{Start: day, End: day})
        } catch (error ArgumentException) {
            rejected = true
        }
        Require(rejected, "TimeAxis accepted an empty range")
    } finally {
        probe.Dispose()
        probe.Dispose()
    }
}

internal class TimeAxisHost : Cell {
    internal var Selected string?
    internal var Current DateTimeOffset = AxisDay().AddHours(6.25)
    internal var ViewChanges int32
    internal var OverflowClicks int32
    internal var LastView TimeAxisViewport
    internal var Root Container?
    internal let Buttons Dictionary[string, Button] = Dictionary[string, Button]()
    internal var Show bool = true
    internal var Scale float64 = 120
    private func Event(input TimeAxisInput, placement TimeAxisPlacement, prepared Button) Button {
        prepared.Handle = ElementHandle()
        if placement.Event.Id == "point" {
            prepared.BackgroundColor = "#fbbf24"
        }
        Buttons[placement.Event.Id!!] = prepared
        return prepared
    }

    private func CaptureRoot(input TimeAxisInput, prepared Container) Container {
        Root = prepared
        return prepared
    }

    public override func Build() Blob {
        let root = Container(){
            .Width: Length.Percent(100),
            .Height: Length.Percent(100),
            .Padding: 24,
            .Gap: 20,
            .BackgroundColor: "#111318",
            Text{Key: "title", Content: "TimeAxis · September 14", FontSize: 24, Color: "#fafafa"},
            Text{
                Key: "hint",
                Content: "Scroll the ruler or use Left/Right, Home/End. Overlapping events occupy separate lanes.",
                Color: "#a1a1aa"
            }
        }
        if Show {
            root.Children.Add(
                Cell.Mount[TimeAxisInput, TimeAxis](
                    "axis",
                    TimeAxisInput{
                        Start: AxisDay(),
                        End: AxisDay().AddHours(12),
                        Events: AxisEvents(),
                        MaximumLanes: 2,
                        CurrentTime: Current,
                        PixelsPerHour: Scale,
                        SelectedId: Selected ?? "",
                        InitialEventId: "target",
                        CreateEvent: Event,
                        CreateRoot: CaptureRoot,
                        OnSelect: (id string) -> {
                            Selected = id
                            Rebuild()
                        },
                        OnOverflow: (items[]TimeAxisEvent) -> {
                            OverflowClicks++
                        },
                        OnViewportChanged: (view TimeAxisViewport) -> {
                            ViewChanges++
                            LastView = view
                        },
                    }
                )
            )
        }
        return root
    }
}

func TimeAxisInteractions() {
    TimeAxisContracts()
    let host = TimeAxisHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "TimeAxis verification",
        Width: 700,
        Height: 360,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        let handle = host.Root!!.Handle!!
        let expected = 6.5 * 120.0 - handle.ContentBox.Width / 2.0
        Require(
            Math.Abs(handle.ScrollOffset.X - expected) < .5 && host.ViewChanges == 0,
            "Initial event centering failed or was reported as a later scroll"
        )
        CompositeClick(window, host.Buttons["target"].Handle!!)
        Require(host.Selected == "target", "Native TimeAxis event selection failed")
        CaptureIssueProof(window, "time-axis-centered")
        handle.Focus()
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 10)
        Require(
            handle.ScrollOffset.X < .1 && host.ViewChanges > 0 && host.LastView.Start == AxisDay(),
            "TimeAxis failed to report keyboard scrolling"
        )
        let changes = host.ViewChanges
        host.Current = host.Current.AddMinutes(10)
        host.Rebuild()
        PumpFrames(window, 10)
        Require(handle.ScrollOffset.X < .1 && host.ViewChanges == changes, "Marker update fought the user's viewport")
        let rootBox = handle.ContentBox
        // The aggregate overflow is placed under its hidden event interval.
        MouseButton(id, float32(rootBox.X + 210.0), float32(rootBox.Y + 30.0 + 2.0 * 36.0 + 15.0), true)
        MouseButton(id, float32(rootBox.X + 210.0), float32(rootBox.Y + 30.0 + 2.0 * 36.0 + 15.0), false)
        PumpFrames(window, 8)
        Require(host.OverflowClicks == 1, "Native overflow action did not expose collapsed events")
        CaptureIssueProof(window, "time-axis-overflow")
        handle.JumpTo(300, 0)
        PumpFrames(window, 8)
        Require(host.LastView.Offset > 299.5, "Host handle scrolling was not reported")
        host.Scale = 180
        host.Rebuild()
        PumpFrames(window, 10)
        Require(
            Math.Abs(handle.ScrollOffset.X - 300.0) < .5 && handle.ScrollRange.X > 1400.0,
            "Scale change lost the viewport or failed to change the scroll range"
        )
        window.Width = 420
        PumpFrames(window, 10)
        Require(Math.Abs(handle.ScrollOffset.X - 300.0) < .5, "Resize restarted initial centering")
        CaptureIssueProof(window, "time-axis-narrow")
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(!handle.IsMounted, "TimeAxis removal retained its viewport")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: TimeAxis collision/overflow/point/clipping, native selection, initial centering, user/host scroll, marker/scale/resize and removal"
    )
}
