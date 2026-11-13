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
import System.Reflection
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
    internal let SpinnerViewport ElementHandle = ElementHandle()
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
            Banner{
                Content: "This notification contains a long message that must wrap inside a narrow window without pushing the dismiss button outside the banner bounds.",
                AccessibilityName: "Narrow banner",
                DismissAccessibilityName: "Dismiss narrow banner",
                OnDismiss: () -> {
                    Dismisses++
                },
            }.Build(),
            Button{
                Handle: Before,
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Before"},
                Text{Content: "Before"}
            },
            Container{
                Handle: SpinnerViewport,
                Height: 64,
                FlexShrink: 0,
                OverflowY: Overflow.Scroll,
                ScrollbarVisibilityY: ScrollbarVisibility.Hidden,
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
                Container{Height: 256, FlexShrink: 0},
            },
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
                        CreateToast: (host ToastHostInput, input ToastInput, visual Container) -> {
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
    let scale = float64(image.Width) / float64(window.NativeWidth)
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
    SkeletonInteractions()
    let host = FeedbackIdentityHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Feedback verification",
        Size: LayoutSize(800, 540),
        Root: host,
        AccessibilityAdapter: semantics
    }
    RunNativeWindow(window, () -> {
        window.Open()
        host.Window = window
        host.Rebuild()
        PumpFrames(window, 4)
        let banner = FindSemantics(semantics.Tree?.Root, "Narrow banner")!!.Bounds
        let dismiss = FindSemantics(semantics.Tree?.Root, "Dismiss narrow banner")!!.Bounds
        Require(
            dismiss.X >= banner.X && dismiss.Y >= banner.Y
            && dismiss.X + dismiss.Width <= banner.X + banner.Width
            && dismiss.Y + dismiss.Height <= banner.Y + banner.Height,
            "Banner dismiss button escaped its bounds after wrapping"
        )
        var frames = 0
        window.PresentationAccepted += (receipt WindowPresentationAccepted) -> frames++
        let flags = BindingFlags.Instance | BindingFlags.NonPublic
        let node = typeof(ElementHandle).GetField("node", flags)!!.GetValue(host.SpinnerFrame)!!
        let segment = (node.GetType().GetProperty("Children", flags)!!.GetValue(node) as System.Collections.IList)!![0]!!
        let opacity = segment.GetType().GetProperty("Opacity", flags)!!
        let initial = float64(opacity.GetValue(segment)!!)
        FeedbackWait(window, 150)
        Require(Math.Abs(float64(opacity.GetValue(segment)!!) - initial) > 0.001, "Visible Spinner animation did not advance")
        Require(host.SpinnerViewport.JumpTo(0.0, 256.0), "Spinner viewport did not scroll")
        FeedbackWait(window, 100)
        let clippedFrames = frames
        FeedbackWait(window, 150)
        Require(frames == clippedFrames, "Fully clipped Spinner continued presenting frames")
        Require(host.SpinnerViewport.JumpTo(0.0, 0.0), "Spinner viewport did not restore")
        let resumed = float64(opacity.GetValue(segment)!!)
        FeedbackWait(window, 150)
        Require(Math.Abs(float64(opacity.GetValue(segment)!!) - resumed) > 0.001, "Spinner animation did not resume after scrolling into view")
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
    })

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
    let proof = Window{Title: "Feedback gallery", Size: LayoutSize(1100, 760), Root: gallery}
    RunNativeWindow(proof, () -> {
        proof.Open()
        gallery.AttachWindow(proof)
        Theme.SetMode(proof, ThemeMode.Light)
        PumpFrames(proof, 12)
        CaptureIssueProof(proof, "feedback-identity-light")
        Theme.SetMode(proof, ThemeMode.Dark)
        PumpFrames(proof, 12)
        CaptureIssueProof(proof, "feedback-identity-dark")
    })
    Console.WriteLine(
        "PASS: avatar circle and presence bounds, toast timeout, hover/focus pause, action, retained exit, polite status, spinner clipped idle and resume, period and range without rebuilds, reduced-motion still frame"
    )
}

internal class SkeletonHost : Cell {
    internal let Before ElementHandle = ElementHandle()
    internal let After ElementHandle = ElementHandle()
    internal let Viewport ElementHandle = ElementHandle()
    internal let Shimmer ElementHandle = ElementHandle()
    internal var Animated bool?
    internal var Named bool
    internal var Builds int32
    internal let Roots []Container? = [3]Container?

    private func Capture(index int32, root Container) Container {
        Builds++
        Roots[index] = root
        if index == 2 {
            let shape = (root.Children[0] as Container)!!
            if shape.Children.Count > 0 { shape.Children[0].Handle = Shimmer }
        }
        return root
    }

    public override func Build() Blob -> Container{
        Width: Percent(100), Height: Percent(100), Padding: 20.0, Gap: 12.0,
        Button{Handle: Before, Focusable: true, Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Before"}},
        Container{
            Handle: Viewport, Height: 200, FlexShrink: 0, Gap: 12,
            OverflowY: Overflow.Scroll, ScrollbarVisibilityY: ScrollbarVisibility.Hidden,
            Cell.Mount[SkeletonInput, Skeleton]("text", SkeletonInput{
                Width: Percent(100), Animated: Animated, AccessibilityName: Named ? "Loading text": nil,
                CreateRoot: (input, root) -> Capture(0, root),
            }),
            Cell.Mount[SkeletonInput, Skeleton]("circle", SkeletonInput{
                Variant: SkeletonVariant.Circle, Animated: Animated, AccessibilityName: Named ? "Loading avatar": nil,
                CreateRoot: (input, root) -> Capture(1, root),
            }),
            Cell.Mount[SkeletonInput, Skeleton]("rectangle", SkeletonInput{
                Variant: SkeletonVariant.Rectangle, Width: Percent(100), Animated: Animated, AccessibilityName: "Loading preview",
                CreateRoot: (input, root) -> Capture(2, root),
            }),
            Container{Height: 512, FlexShrink: 0},
        },
        Button{Handle: After, Focusable: true, Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "After"}},
    }
}

func SkeletonDifference(first WindowCapture, second WindowCapture) int32 {
    Require(first.Width == second.Width && first.Height == second.Height, "Skeleton capture size changed")
    var changed int32
    for index in 0 ... first.Pixels.Length {
        if first.Pixels[index] != second.Pixels[index] { changed++ }
    }
    return changed
}

func SkeletonInteractions() {
    let host = SkeletonHost()
    let semantics = SearchListSemantics()
    let window = Window{Title: "Skeleton verification", Size: LayoutSize(640, 480), Root: host, AccessibilityAdapter: semantics}
    Theme.Attach(window, Theme.Ink)
    var presents int32
    window.PresentationAccepted += (accepted WindowPresentationAccepted) -> { presents++ }
    RunNativeWindow(window, () -> {
        window.Open()
        WaitVirtual(window, () -> host.Roots[2] != nil && FindSemantics(semantics.Tree?.Root, "Loading preview") != nil)
        let status = FindSemantics(semantics.Tree?.Root, "Loading preview")!!
        Require(status.Role == AccessibilityRole.Status, "Skeleton role: " + status.Role.ToString())
        Require(status.Busy == true, "Skeleton busy state: " + status.Busy.ToString())
        Require(!window.PerformAccessibilityAction(status.Id, AccessibilityActionRequest(AccessibilityAction.Activate))
            && !window.PerformAccessibilityAction(status.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Skeleton accepted activation or focus")
        Require(host.Roots[0]!!.Accessibility!!.Hidden == true && host.Roots[1]!!.Accessibility!!.Hidden == true,
            "Decorative skeletons were not hidden")
        Require(host.Roots[0]!!.Children.Count == 3 && host.Roots[1]!!.Children.Count == 1,
            "Skeleton text or circle geometry changed")
        host.Before.Focus()
        SendKey(OnlyNativeWindow(), SDLScancode.Tab)
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "After"), "Skeleton entered Tab order")
        FeedbackClick(window, status.Bounds)
        Require(FindSemantics(semantics.Tree?.Root, "Loading preview")!!.Focused == false, "Skeleton pointer click took focus")
        let builds = host.Builds
        let first = ThemeCapture(window)
        PumpFrames(window, 30)
        let second = ThemeCapture(window)
        Require(SkeletonDifference(first, second) > 100 && host.Builds == builds,
            "Skeleton shimmer did not move without rebuilding")
        let visibleX = host.Shimmer.BorderBox.X
        FeedbackWait(window, 150)
        Require(Math.Abs(host.Shimmer.BorderBox.X - visibleX) > 0.1, "Visible Skeleton sweep did not advance")
        Require(host.Viewport.JumpTo(0.0, 512.0), "Skeleton viewport did not scroll")
        FeedbackWait(window, 100)
        let clippedFrames = presents
        FeedbackWait(window, 150)
        Require(presents == clippedFrames, "Fully clipped Skeleton continued presenting frames")
        Require(host.Viewport.JumpTo(0.0, 0.0), "Skeleton viewport did not restore")
        let restoredX = host.Shimmer.BorderBox.X
        FeedbackWait(window, 150)
        Require(Math.Abs(host.Shimmer.BorderBox.X - restoredX) > 0.1, "Skeleton sweep did not resume after scrolling into view")
        host.Animated = false
        host.Named = true
        host.Rebuild()
        PumpFrames(window, 8)
        let staticBuilds = host.Builds
        let still = ThemeCapture(window)
        PumpFrames(window, 8)
        let idlePresents = presents
        PumpFrames(window, 30)
        Require(presents == idlePresents, "Static Skeleton continued presenting frames")
        Require(SkeletonDifference(still, ThemeCapture(window)) == 0 && host.Builds == staticBuilds,
            "Static Skeleton changed paint or rebuilt")
        for palette in []Theme{Theme.Ink, Theme.Bone, Theme.Ink.WithHighContrast()} {
            Theme.Attach(window, palette)
            for width in []int32{480, 900, 1600, 2560} {
                window.Size = LayoutSize(float64(width) / window.UiScale, float64(width == 2560 ? 1440: 480) / window.UiScale)
                window.UiScale = 1.5F
                PumpFrames(window, 12)
                for name in []string{"Loading text", "Loading avatar", "Loading preview"} {
                    let bounds = FindSemantics(semantics.Tree?.Root, name)!!.Bounds
                    Require(bounds.Width > 0 && bounds.Height > 0 && bounds.X >= 0 && bounds.Y >= 0
                        && bounds.X + bounds.Width <= float64(window.NativeWidth) / window.UiScale + 1
                        && bounds.Y + bounds.Height <= float64(window.NativeHeight) / window.UiScale + 1,
                        "Skeleton escaped the scaled viewport")
                }
            }
        }
    })
    using let baseline = ThemePreferenceHost()
    baseline.Resize(640, 480, 640, 480)
    baseline.UpdatePreferences(PlatformPreferences{ReducedMotion: true})
    let plain = Window{Root: ThemeProbe()}
    plain.Attach(baseline)
    ThemeFrames(baseline)
    let before = baseline.Wakes
    for frame in 0 ... 120 { baseline.RenderFrame(0.016) }
    let idleWakes = baseline.Wakes - before
    using let embedded = ThemePreferenceHost()
    embedded.Resize(640, 480, 640, 480)
    embedded.UpdatePreferences(PlatformPreferences{ReducedMotion: true})
    let staticHost = SkeletonHost()
    let staticWindow = Window{Root: staticHost}
    staticWindow.Attach(embedded)
    ThemeFrames(embedded)
    let wakes = embedded.Wakes
    let builds = staticHost.Builds
    for frame in 0 ... 120 { embedded.RenderFrame(0.016) }
    Require(embedded.Wakes - wakes == idleWakes && staticHost.Builds == builds,
        "Reduced-motion Skeleton idle: wakes " + (embedded.Wakes - wakes).ToString()
        + ", baseline " + idleWakes.ToString() + ", builds " + (staticHost.Builds - builds).ToString())
    for root in staticHost.Roots {
        for shape in root!!.Children {
            Require((shape as Container)!!.Children.Count == 0, "Reduced-motion Skeleton retained its shimmer")
        }
    }
    embedded.UpdatePreferences(PlatformPreferences{ReducedMotion: false})
    ThemeFrames(embedded)
    Require((staticHost.Roots[0]!!.Children[0] as Container)!!.Children.Count == 1,
        "Skeleton did not restore shimmer when reduced motion ended")
    staticHost.Animated = false
    staticHost.Rebuild()
    ThemeFrames(embedded)
    let idle = embedded.Wakes
    for frame in 0 ... 120 { embedded.RenderFrame(0.016) }
    Require(embedded.Wakes - idle == idleWakes, "Animated false Skeleton continued scheduling frames")
    let registry = CreateRegistry()
    let gallery = Gallery(registry, registry.IndexOf("Skeleton"))
    let gallerySemantics = SearchListSemantics()
    let proof = Window{Title: "Skeleton gallery", Size: LayoutSize(960 / 1.5, 640 / 1.5), UiScale: 1.5F,
        Root: gallery, AccessibilityAdapter: gallerySemantics}
    gallery.AttachWindow(proof)
    RunNativeWindow(proof, () -> {
        proof.Open()
        for width in []int32{960, 1600, 2560} {
            proof.Size = LayoutSize(float64(width) / proof.UiScale, float64(width == 2560 ? 1440: 640) / proof.UiScale)
            PumpFrames(proof, 16)
            let card = gallery.CardHandle.BorderBox
            let pause = FindSemantics(gallerySemantics.Tree?.Root, "Pause")!!.Bounds
            Require(pause.X >= card.X && pause.Y >= card.Y && pause.X + pause.Width <= card.X + card.Width
                && pause.Y + pause.Height <= card.Y + card.Height - 32,
                "Skeleton gallery content did not fit the scaled window")
        }
    })
    Console.WriteLine("PASS: Skeleton text/circle/rectangle, moving paint without rebuilds, clipped idle and resume, static pixels, hidden or busy accessibility, pointer/Tab exclusion, Ink/Bone/high contrast, 150 percent viewport fit, reduced-motion and Animated false idle")
}
