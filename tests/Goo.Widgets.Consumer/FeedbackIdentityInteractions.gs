package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery
import Goo.Widgets.Media
import Hexa.NET.SDL3
import System
import System.Collections.Generic
import System.Diagnostics
import System.Threading

internal class FeedbackIdentityHost : Cell {
    internal var Window Window?
    internal var Items[]ToastItem = []ToastItem{}
    internal var Dismisses int32
    internal var Actions int32
    internal let Before ElementHandle = ElementHandle()
    internal let Panel ElementHandle = ElementHandle()
    internal var SpinnerRoot Container?
    internal var SpinnerBuilds int32
    internal let SpinnerFrame ElementHandle = ElementHandle()
    internal let AvatarFrames[]ElementHandle = []ElementHandle{
        ElementHandle(),
        ElementHandle(),
        ElementHandle(),
        ElementHandle()
    }
    internal let PresenceDots[]ElementHandle = []ElementHandle{ElementHandle(), ElementHandle(), ElementHandle()}

    internal func Show(id string) {
        Items = []ToastItem{
            ToastItem{
                Id: id,
                Title: "Saved " + id,
                Description: "Changes are safe.",
                DurationMs: 600.0,
                ActionLabel: "Undo",
                OnAction: () -> {
                    Actions++
                },
                Tone: Tone.Success
            }
        }
        Rebuild()
    }

    public override func Build() Blob {
        let root = Container{
            Width: Percent(100),
            Height: Percent(100),
            Padding: 20,
            Button{
                Handle: Before,
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Before"},
                Text{Content: "Before"}
            },
            Cell.Mount[SpinnerInput, Spinner](
                "spinner",
                SpinnerInput{
                    Variant: SpinnerVariant.Bars,
                    CreateRoot: (input SpinnerInput, visual Container) -> {
                        SpinnerBuilds++
                        SpinnerRoot = visual
                        visual.Handle = SpinnerFrame
                        return visual
                    }
                }
            ),
        }
        let avatars = (
            AvatarGroup{
                Size: 48,
                Overlap: 14,
                Max: 3,
                AccessibilityName: "Project members",
                Items: []Avatar{
                    Avatar{FallbackText: "AL", Presence: StatusState.Done},
                    Avatar{FallbackText: "BE", Presence: StatusState.Waiting},
                    Avatar{FallbackText: "CK", Presence: StatusState.Offline},
                    Avatar{FallbackText: "DM"},
                    Avatar{FallbackText: "ES"},
                },
            }.Build() as Container
        )!!
        for index in 0 ... 4 {
            avatars.Children[index].Handle = AvatarFrames[index]
        }
        for index in 0 ... 3 {
            avatars.Children[index + 4].Handle = PresenceDots[index]
        }
        root.Children.Add(avatars)
        if let window = Window {
            root.Children.Add(
                Cell.Mount[ToastHostInput, ToastHost](
                    "toasts",
                    ToastHostInput{
                        Window: window,
                        Items: Items,
                        OnDismiss: (id string) -> {
                            Dismisses++
                            Items = []ToastItem{}
                            Rebuild()
                        },
                        CreateToast: (input ToastInput, visual Container) -> {
                            visual.Handle = Panel
                            return visual
                        },
                    }
                )
            )
        }
        return root
    }
}

func FeedbackWait(window Window, milliseconds int32) {
    let clock = Stopwatch.StartNew()
    var previous = 0.0
    while clock.ElapsedMilliseconds < milliseconds {
        let now = clock.Elapsed.TotalSeconds
        window.Pump(now - previous)
        previous = now
        Thread.Sleep(10)
    }
}

func SpinnerBarHeight(window Window, frame ElementRect) float64 {
    Require(window.RequestCapture() == WindowCaptureRequestStatus.Accepted, "Spinner capture was rejected")
    var capture = window.PollCapture()
    while capture == nil {
        Thread.Sleep(1)
        window.Pump(0.0)
        capture = window.PollCapture()
    }
    let image = capture!!
    let scale = float64(image.Width) / float64(window.Width)
    let bar = int32((frame.X + frame.Width * 0.1) * scale)
    let gap = int32((frame.X + frame.Width * 0.3) * scale)
    var total = 0.0
    var peak = 0.0
    for y in int32(frame.Y * scale) ... int32((frame.Y + frame.Height) * scale) {
        var ink = 0.0
        for channel in 0 ... 3 {
            let row = y * int32(image.RowBytes) + channel
            ink += Math.Abs(float64(image.Pixels[row + bar * 4]) - float64(image.Pixels[row + gap * 4]))
        }
        total += ink
        peak = Math.Max(peak, ink)
    }
    return total / peak / scale / frame.Height
}

func FeedbackIdentityInteractions() {
    let host = FeedbackIdentityHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Feedback verification",
        Width: 800,
        Height: 540,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    host.Window = window
    host.Rebuild()
    try {
        PumpFrames(window, 4)
        for index in 0 ... 4 {
            let frame = host.AvatarFrames[index].BorderBox
            Require(
                Math.Abs(frame.Width - 48.0) < 0.1 && Math.Abs(frame.Height - 48.0) < 0.1,
                "Avatar group lost its circle bounds"
            )
        }
        for index in 0 ... 3 {
            let frame = host.AvatarFrames[index].BorderBox
            let dot = host.PresenceDots[index].BorderBox
            Require(
                Math.Abs(dot.Width - 12.0) < 0.1 && Math.Abs(dot.Height - 12.0) < 0.1
                && dot.X >= frame.X && dot.Y >= frame.Y
                && dot.X + dot.Width <= frame.X + frame.Width + 0.1
                && dot.Y + dot.Height <= frame.Y + frame.Height + 0.1,
                "Avatar presence dot escapes its rendered bounds"
            )
        }
        let builds = host.SpinnerBuilds
        let pulses = List[float64]()
        for tick in 0 ... 90 {
            window.Pump(1.0 / 60.0)
            pulses.Add((SpinnerBarHeight(window, host.SpinnerFrame.BorderBox) - 0.35) / 0.65)
        }
        var low = 1.0
        var high = 0.0
        for tick in 0 ... 60 {
            Require(Math.Abs(pulses[tick] + pulses[tick + 30] - 1.0) < 0.1, "Spinner phase does not follow its period")
            low = Math.Min(low, pulses[tick])
            high = Math.Max(high, pulses[tick])
        }
        Require(low < 0.05 && high > 0.95, "Spinner phase did not cover its range")
        Require(host.SpinnerBuilds == builds, "Spinner rebuilt while animating")
        host.Before.Focus()
        host.Show("auto")
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "Before"), "Toast stole focus")
        Require(host.Panel.IsMounted, "Toast did not mount in the overlay")
        let status = FeedbackNode(semantics, AccessibilityRole.Status, "Saved auto")
        Require(status.Live == AccessibilityLive.Polite, "Toast is not a polite live region")
        FeedbackWait(window, 850)
        Require(host.Dismisses == 1 && !host.Panel.IsMounted, "Toast did not auto-dismiss after its exit")

        host.Show("hover")
        PumpFrames(window, 4)
        let box = host.Panel.BorderBox
        MouseMove(OnlyNativeWindow(), float32(box.X + 8), float32(box.Y + 8))
        PumpFrames(window, 4)
        FeedbackWait(window, 850)
        Require(host.Dismisses == 1 && host.Panel.IsMounted, "Hovered toast did not pause")
        MouseMove(OnlyNativeWindow(), 5.0F, 5.0F)
        FeedbackWait(window, 850)
        Require(host.Dismisses == 2, "Toast did not resume after hover")

        host.Show("focus")
        PumpFrames(window, 4)
        let undo = FeedbackNode(semantics, AccessibilityRole.Button, "Undo")
        Require(
            window.PerformAccessibilityAction(undo.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Undo did not focus"
        )
        FeedbackWait(window, 850)
        Require(host.Dismisses == 2 && host.Panel.IsMounted, "Focused toast did not pause")
        SendKey(OnlyNativeWindow(), SDLScancode.Tab)
        PumpFrames(window, 4)
        FeedbackWait(window, 850)
        Require(host.Dismisses == 2, "Moving focus within the toast restarted its timeout")
        host.Before.Focus()
        FeedbackWait(window, 850)
        Require(host.Dismisses == 3, "Toast did not resume after focus left")

        host.Show("action")
        PumpFrames(window, 4)
        FeedbackClick(window, FeedbackNode(semantics, AccessibilityRole.Button, "Undo").Bounds)
        FeedbackWait(window, 250)
        Require(host.Actions == 1 && host.Dismisses == 4, "Toast action or dismissal did not run exactly once")

        host.Show("removed")
        PumpFrames(window, 4)
        host.Items = []ToastItem{}
        host.Rebuild()
        PumpFrames(window, 1)
        Require(host.Panel.IsMounted, "Host dropped a departing toast before its exit")
        window.Pump(0.1)
        Require(host.Dismisses == 4, "Toast exit ended before its duration")
        FeedbackWait(window, 300)
        Require(!host.Panel.IsMounted && host.Dismisses == 5, "Externally removed toast did not finish its exit")
    } finally {
        window.RequestClose()
        PumpFrames(window, 4)
    }

    using let embedded = ThemePreferenceHost()
    embedded.Resize(400, 300, 400, 300)
    embedded.UpdatePreferences(PlatformPreferences{ReducedMotion: true})
    let still = FeedbackIdentityHost()
    let stillWindow = Window{Root: still}
    stillWindow.Attach(embedded)
    ThemeFrames(embedded)
    let builds = still.SpinnerBuilds
    let first = still.SpinnerRoot
    for frame in 0 ... 120 {
        embedded.RenderFrame(0.016)
    }
    Require(still.SpinnerBuilds == builds && still.SpinnerRoot == first, "Reduced-motion spinner did not remain static")

    let registry = CreateRegistry()
    let gallery = Gallery(registry, registry.IndexOf("Toast"))
    let proof = Window{Title: "Feedback gallery", Width: 1100, Height: 760, Root: gallery}
    proof.Open()
    gallery.AttachWindow(proof)
    try {
        Theme.SetMode(proof, ThemeMode.Light)
        PumpFrames(proof, 12)
        CaptureIssueProof(proof, "feedback-identity-light")
        Theme.SetMode(proof, ThemeMode.Dark)
        PumpFrames(proof, 12)
        CaptureIssueProof(proof, "feedback-identity-dark")
    } finally {
        proof.RequestClose()
        PumpFrames(proof, 4)
    }
    Console.WriteLine(
        "PASS: avatar circle and presence bounds, toast timeout, hover/focus pause, action, retained exit, polite status, spinner period and range without rebuilds, reduced-motion still frame"
    )
}
