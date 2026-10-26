package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Data
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import Goo.Widgets.Navigation
import Hexa.NET.SDL3
import System
import System.Collections.Generic
import System.Runtime.CompilerServices
import System.Threading

internal class ThemePreferenceHost : EmbeddedWindowHost {
    internal var Wakes int32
    protected override func RequestFrame() {
        Wakes++
    }

    protected override func LoadVulkanLibrary() bool -> throw NotSupportedException(
        "This layout host has no presentation surface."
    )

    protected override func GetVulkanGetInstanceProcAddr() nint -> throw NotSupportedException(
        "This layout host has no presentation surface."
    )

    protected override func UnloadVulkanLibrary() {
        throw NotSupportedException("This layout host has no presentation surface.")
    }

    protected override func GetVulkanInstanceExtensions()[]string -> throw NotSupportedException(
        "This layout host has no presentation surface."
    )

    protected override func CreateVulkanSurface(instance nint, out surface uint64) bool {
        throw NotSupportedException("This layout host has no presentation surface.")
    }

    protected override func DestroyVulkanSurface(instance nint, surface uint64) {
        throw NotSupportedException("This layout host has no presentation surface.")
    }
}

internal class ThemeProbe : Cell {
    internal var Builds int32
    internal var Snapshot Theme
    internal var ReadBytes int64
    internal var MeasureReads bool
    internal let Handle ElementHandle = ElementHandle()

    public override func Build() Blob {
        Builds++
        Snapshot = Theme.Read()
        if MeasureReads {
            var sum = 0.0
            for index in 0 ... 10 {
                sum += Theme.Read().FontSize
            }
            let before = GC.GetAllocatedBytesForCurrentThread()
            for index in 0 ... 10000 {
                sum += Theme.Read().FontSize
            }
            ReadBytes = GC.GetAllocatedBytesForCurrentThread() - before
            Require(sum > 0.0, "Theme reads were not observed.")
        }
        return Text{Handle: Handle, Content: "Retained theme", Color: Snapshot.TextColor, FontSize: Snapshot.FontSize}
    }
}

internal class ThemeScopeHost : Cell {
    internal var Outside ThemeProbe?
    internal var Inside ThemeProbe?
    internal var Value Theme = Theme.Bone
    internal var DensityOverride Density?
    internal var PortalProbe ThemeProbe?
    internal var DialogProbe ThemeProbe?
    internal var MenuProbe ThemeProbe?
    internal var Editor TextEditor?

    public override func Build() Blob {
        let provider = ThemeScope{
            Value: Value,
            Density: DensityOverride,
            Content: () -> Cell.Mount[ThemeProbe]("inside", (probe ThemeProbe) -> Inside = probe),
        }.Build()
        provider.Key = "scope"
        return Container{
            Width: Percent(100),
            Cell.Mount[ThemeProbe]("outside", (probe ThemeProbe) -> Outside = probe),
            provider,
            Portal{Key: "portal", Cell.Mount[ThemeProbe]("portal-content", (probe ThemeProbe) -> PortalProbe = probe),},
            Cell.Mount[ModalDialog, ModalDialogHost](
                "dialog",
                ModalDialog{
                    Open: true,
                    Width: 280.0,
                    AccessibilityName: "Appearance dialog",
                    Content: Cell.Mount[ThemeProbe]("dialog-content", (probe ThemeProbe) -> DialogProbe = probe),
                }
            ),
            Cell.Mount[MenuInput, Menu](
                "menu",
                MenuInput{
                    Open: true,
                    WindowPoint: Point{X: 8.0, Y: 8.0},
                    Items: []MenuItem{
                        MenuItem{
                            Id: "theme",
                            Label: "Appearance menu",
                            Content: Cell.Mount[ThemeProbe]("menu-content", (probe ThemeProbe) -> MenuProbe = probe),
                        }
                    },
                }
            ),
            Cell.Mount[TextAreaInput, TextArea](
                "editor",
                TextAreaInput{
                    Value: "Appearance editing",
                    MinimumRows: 1,
                    CreateEditor: (input TextAreaInput, editor TextEditor) -> {
                        Editor = editor
                        return editor
                    },
                }
            ),
        }
    }
}

func ThemeFrames(host EmbeddedWindowHost) {
    for frame in 0 ... 5 {
        host.RenderFrame(0.016)
    }
}

func ThemeBackgroundContracts() {
    for background in[]Color{Color.Transparent, Color.White, Color.Black} {
        using let host = ThemePreferenceHost()
        host.Resize(360, 280, 360, 280)
        host.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
        let window = Window{Root: ThemeProbe(), Background: background}
        Theme.Attach(window, Theme.Bone)
        Require(
            window.Background == (background == Color.Transparent ? background: Theme.Bone.CanvasColor),
            "Initial fixed attachment overwrote transparency or missed an opaque host."
        )
        window.Attach(host)
        for theme in[]Theme{Theme.Ink, Theme.Bone} {
            Theme.Attach(window, theme)
            let expected = background == Color.Transparent ? background: theme.CanvasColor
            Require(window.Background == expected, "Repeated fixed attachment lost background ownership.")
            host.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, ReducedMotion: true})
            ThemeFrames(host)
            Require(
                window.Background == expected && window.Foreground == theme.TextColor,
                "Fixed appearance updates overwrote transparency or lost the palette colors."
            )
            host.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
            ThemeFrames(host)
        }
    }
    let opened = Window{
        Root: ThemeProbe(), Width: 360, Height: 280,
        Background: Color.Transparent, Transparent: true, Decorated: false,
    }
    Theme.Attach(opened, Theme.Bone)
    try {
        opened.Open()
        PumpFrames(opened, 5)
        Require(opened.Background == Color.Transparent, "Opening a fixed-theme window overwrote its transparent clear.")
        Theme.Attach(opened, Theme.Ink)
        Theme.SetMode(opened, ThemeMode.Light)
        PumpFrames(opened, 5)
        Require(
            opened.Background == Color.Transparent && opened.Foreground == Theme.Bone.TextColor,
            "Applying a palette to an open window overwrote its transparent clear or missed its text color."
        )
    } finally {
        opened.RequestClose()
        PumpFrames(opened, 3)
    }
    using let glassHost = ThemePreferenceHost()
    using let defaultHost = ThemePreferenceHost()
    glassHost.Resize(360, 280, 360, 280)
    defaultHost.Resize(360, 280, 360, 280)
    glassHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    defaultHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    let glass = Window{Root: ThemeProbe()}
    let untouched = Window{Root: ThemeProbe()}
    glass.Background = Color.Transparent
    glass.Attach(glassHost)
    untouched.Attach(defaultHost)
    ThemeFrames(glassHost)
    ThemeFrames(defaultHost)
    Require(
        glass.Background == Color.Transparent && untouched.Background == Theme.Bone.CanvasColor,
        "Automatic theme attachment overwrote an app background or missed an untouched window."
    )
    glassHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    defaultHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(glassHost)
    ThemeFrames(defaultHost)
    Require(
        glass.Background == Color.Transparent && untouched.Background == Theme.Ink.CanvasColor
        && glass.Foreground == Theme.Ink.TextColor && untouched.Foreground == Theme.Ink.TextColor,
        "System appearance overwrote an app background or stopped updating theme-owned colors."
    )
    untouched.Background = Color.Transparent
    defaultHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    ThemeFrames(defaultHost)
    Require(
        untouched.Background == Color.Transparent && untouched.Foreground == Theme.Bone.TextColor,
        "System appearance overwrote a background set after automatic attachment."
    )
    Theme.Attach(glass, Theme.Bone)
    glassHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    ThemeFrames(glassHost)
    Require(
        glass.Background == Color.Transparent && glass.Foreground == Theme.Bone.TextColor,
        "An explicit palette overwrote the app's transparent background or missed its text color."
    )
    let shell = Window{Root: ThemeProbe(), Decorated: false}
    shell.BackdropFallbackColor = Color.White
    Theme.Attach(shell, Theme.InkGlass)
    let glassSet = shell.Transparent && shell.Backdrop == WindowBackdrop.Blur
        && shell.FrameTheme == SystemTheme.Dark && shell.Background == Color.Transparent
    Theme.Attach(shell, Theme.Ink)
    Require(
        glassSet && !shell.Transparent && shell.Backdrop == WindowBackdrop.None
        && shell.BackdropFallbackColor == Color.White && shell.FrameTheme == SystemTheme.Unknown
        && shell.Background == Theme.Ink.CanvasColor,
        "An opaque palette did not undo the glass window settings."
    )
    using let nativeHost = ThemePreferenceHost()
    nativeHost.Resize(360, 280, 360, 280)
    nativeHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    let native = Window{Root: ThemeProbe()}
    native.Attach(nativeHost)
    Theme.Attach(native, Theme.Native)
    ThemeFrames(nativeHost)
    let light = Theme.Read(native)
    let accent = Color.Rgb(0, 140, 120)
    nativeHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, AccentColor: accent})
    ThemeFrames(nativeHost)
    let dark = Theme.Read(native)
    Require(
        light.CanvasColor == Theme.Native.CanvasColor && dark.CanvasColor != light.CanvasColor
        && dark.AccentColor == accent && dark.OnAccentColor == Color.Black && dark.FontFamily == light.FontFamily,
        "Native did not follow the system appearance and accent with readable accent text."
    )
    Console.WriteLine(
        "PASS theme background: automatic attachment, appearance updates, app takeover, explicit palette, glass undo, native"
    )
}

func ThemePolicyContracts() {
    using let literalHost = ThemePreferenceHost()
    literalHost.Resize(360, 280, 360, 280)
    let literalAccent = Color.Rgb(31, 91, 173)
    let literalRoot = ThemeScopeHost(){
        Value = Theme{AccentColor: literalAccent, BackdropColor: Color.Transparent, HoverColor: Color.Transparent}
    }
    let literalWindow = Window{Root: literalRoot}
    Theme.Attach(literalWindow, Theme{AccentColor: literalAccent})
    literalWindow.Attach(literalHost)
    ThemeFrames(literalHost)
    for probe in []ThemeProbe{literalRoot.Outside!!, literalRoot.Inside!!} {
        Require(probe.Snapshot.FontSize == Theme.Default.FontSize && probe.Handle.ContentBox.Height > 0.0,
            "A consumer theme literal did not render text at the default size.")
        Require(probe.Snapshot.AccentColor == literalAccent, "Theme normalization lost the consumer accent.")
    }
    Require(literalRoot.Inside!!.Snapshot.BackdropColor == Color.Transparent
        && literalRoot.Inside!!.Snapshot.HoverColor == Color.Transparent, "Theme normalization replaced transparent tints.")
    using let darkHost = ThemePreferenceHost()
    darkHost.Resize(360, 280, 360, 280)
    let accent = Color.Rgb(31, 91, 173)
    darkHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, AccentColor: accent})
    let darkProbe = ThemeProbe()
    let darkWindow = Window{Root: darkProbe}
    Theme.Attach(darkWindow)
    darkWindow.Attach(darkHost)
    ThemeFrames(darkHost)
    Require(
        darkProbe.Snapshot.CanvasColor == Theme.Ink.CanvasColor
        && darkProbe.Snapshot.TextColor == Theme.Ink.TextColor
        && darkWindow.Background == Theme.Ink.CanvasColor && darkWindow.Foreground == Theme.Ink.TextColor
        && darkProbe.Snapshot.AccentColor == accent,
        "Initial System Dark did not publish the Ink snapshot and window pair."
    )
    darkHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, AccentColor: Color.Rgb(40, 120, 90)})
    ThemeFrames(darkHost)
    Require(darkProbe.Snapshot.AccentColor == Color.Rgb(40, 120, 90), "System accent changes were not applied.")
    darkHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(darkHost)
    Require(darkProbe.Snapshot.AccentColor == Theme.Ink.AccentColor, "Unknown system accent lost the palette fallback.")
    Theme.Attach(darkWindow, Theme.Bone with{AccentColor = accent})
    darkHost.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light, AccentColor: Color.Rgb(40, 120, 90)})
    ThemeFrames(darkHost)
    Require(darkProbe.Snapshot.AccentColor == accent, "System appearance overwrote an application accent.")
    using let first = ThemePreferenceHost()
    using let second = ThemePreferenceHost()
    first.Resize(360, 280, 360, 280)
    second.Resize(360, 280, 360, 280)
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    second.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    let root = ThemeScopeHost()
    let other = ThemeProbe()
    let window = Window{Root: root}
    let otherWindow = Window{Root: other}
    Theme.Attach(window)
    Theme.Attach(otherWindow, Theme.Bone)
    window.Attach(first)
    otherWindow.Attach(second)
    ThemeFrames(first)
    ThemeFrames(second)
    Require(root.Outside!!.Snapshot.CanvasColor == Theme.Bone.CanvasColor, "Initial Light did not select Bone.")
    Require(other.Snapshot.CanvasColor == Theme.Bone.CanvasColor, "Fixed attachment followed system Dark.")
    let outside = root.Outside!!
    let inside = root.Inside!!
    let outsideBuilds = outside.Builds
    let insideBuilds = inside.Builds
    let otherBuilds = other.Builds
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(first)
    ThemeFrames(second)
    Require(
        outside.Builds == outsideBuilds + 1 && inside.Builds == insideBuilds && other.Builds == otherBuilds,
        "Appearance invalidation escaped its effective provider or window."
    )
    Require(
        outside.Snapshot.CanvasColor == Theme.Ink.CanvasColor
        && outside.Snapshot.RaisedColor == Theme.Ink.RaisedColor
        && outside.Snapshot.OverlayColor == Theme.Ink.OverlayColor
        && window.Background == Theme.Ink.CanvasColor && window.Foreground == Theme.Ink.TextColor,
        "System Dark did not publish the window pair and dependent snapshot together."
    )
    Require(
        root.PortalProbe?.Snapshot.TextColor == Theme.Ink.TextColor
        && root.DialogProbe?.Snapshot.TextColor == Theme.Ink.TextColor
        && root.MenuProbe?.Snapshot.TextColor == Theme.Ink.TextColor,
        "An open logical Portal, dialog or menu retained the old palette."
    )
    Require(
        root.Editor?.CaretColor == Theme.Ink.TextColor
        && root.Editor?.SelectionColor == Theme.Ink.AccentColor.WithAlpha(0.35),
        "Editing colors did not change with System appearance."
    )
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(first)
    Require(outside.Builds == outsideBuilds + 1, "Equal preferences rebuilt a theme reader.")
    inside.MeasureReads = true
    inside.Rebuild()
    ThemeFrames(first)
    Require(inside.ReadBytes == 0L, "Warm retained Theme.Read allocated per read: " + inside.ReadBytes.ToString())
    outside.MeasureReads = true
    other.MeasureReads = true
    outside.Rebuild()
    other.Rebuild()
    ThemeFrames(first)
    ThemeFrames(second)
    Require(
        outside.ReadBytes == 0L && other.ReadBytes == 0L,
        "Warm window theme reads allocated or crossed window ownership."
    )
    let beforeMotion = outside.Builds
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, ReducedMotion: true})
    ThemeFrames(first)
    Require(
        outside.Builds == beforeMotion + 1 && inside.Snapshot.Scrollbar.FadeMs == 0.0
        && Theme.Read(window).Scrollbar.FadeMs == 0.0,
        "Reduced motion did not invalidate a zero-duration theme or a fixed subtree scrollbar."
    )
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark, ReducedMotion: false})
    ThemeFrames(first)
    Require(inside.Snapshot.Scrollbar.FadeMs == 250.0, "Scrollbar fade did not recover after reduced motion.")
    first.UpdatePreferences(PlatformPreferences{
        Theme: SystemTheme.Dark, HighContrast: true, TextScaleFactor: 1.5F
    })
    ThemeFrames(first)
    Require(
        outside.Snapshot.BorderColor == outside.Snapshot.TextColor
        && inside.Snapshot.BorderColor == inside.Snapshot.TextColor
        && outside.Snapshot.FontSize == Theme.Default.FontSize * 1.5
        && inside.Snapshot.FontSize == root.Value.FontSize * 1.5
        && inside.Snapshot.ControlHeight == root.Value.ControlHeight * 1.5,
        "High contrast or text scale did not reach the window and fixed scope."
    )
    root.Rebuild()
    ThemeFrames(first)
    Require(inside.Snapshot.FontSize == root.Value.FontSize * 1.5, "Text scale compounded on rebuild.")
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(first)
    Require(
        outside.Snapshot.FontSize == Theme.Default.FontSize
        && inside.Snapshot.FontSize == root.Value.FontSize
        && inside.Snapshot.BorderColor == root.Value.BorderColor,
        "Preference removal did not restore authored theme values."
    )
    root.Value = Theme.Bone with{ControlHeight = 23.0, AccentColor = Theme.Bone.DangerColor, TransitionMs = 77.0}
    root.Rebuild()
    ThemeFrames(first)
    Require(
        root.Inside == inside && inside.Snapshot.ControlHeight == 23.0,
        "Scope update remounted its child or replaced an authored control height."
    )
    root.DensityOverride = Density.Touch
    root.Rebuild()
    ThemeFrames(first)
    Require(
        root.Inside == inside && inside.Snapshot.ControlHeight == 44.0
        && inside.Snapshot.ControlPadding == 16.0 && inside.Snapshot.ControlGap == 8.0,
        "Density was not an absolute retained scope transformation."
    )
    Theme.Attach(window, Theme.Default with{FontSize = 19.0, ControlHeight = 23.0, TransitionMs = 123.0})
    Theme.SetMode(window, ThemeMode.Dark)
    ThemeFrames(first)
    Require(
        Theme.Read(window).FontSize == 19.0 && Theme.Read(window).ControlHeight == 23.0,
        "SetMode replaced custom typography or metrics."
    )
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Light})
    ThemeFrames(first)
    Require(Theme.Read(window).CanvasColor == Theme.Ink.CanvasColor, "Locked Dark followed the system.")
    Theme.SetMode(window, ThemeMode.System)
    ThemeFrames(first)
    Require(
        Theme.Read(window).CanvasColor == Theme.Bone.CanvasColor
        && Theme.Read(window).RaisedColor == Theme.Bone.RaisedColor
        && Theme.Read(window).OverlayColor == Theme.Bone.OverlayColor,
        "System mode did not resume preference tracking."
    )
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Unknown, ReducedMotion: true})
    ThemeFrames(first)
    Require(
        Theme.Read(window).CanvasColor == Theme.Bone.CanvasColor && Theme.Read(window).TransitionMs == 0.0
        && inside.Snapshot.TransitionMs == 0.0,
        "Unknown appearance or reduced-motion policy was lost."
    )
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Unknown, ReducedMotion: false})
    ThemeFrames(first)
    Require(
        Theme.Read(window).TransitionMs == 123.0 && inside.Snapshot.TransitionMs == 77.0,
        "Reduced motion destroyed an authored window or subtree transition duration."
    )
    Theme.Attach(window, Theme.Default with{CanvasColor = Theme.Bone.DangerColor})
    first.UpdatePreferences(PlatformPreferences{Theme: SystemTheme.Dark})
    ThemeFrames(first)
    Require(window.Background == Theme.Bone.DangerColor, "A custom fixed palette followed the system.")
    Console.WriteLine(
        "PASS theme policy: two windows, later child rebuild, shadowing, live scope/density, equal preferences, fixed/custom modes, reduced motion; warm Read bytes scope/window/second="
        + inside.ReadBytes.ToString() + "/" + outside.ReadBytes.ToString() + "/" + other.ReadBytes.ToString()
    )
}

internal class ThemeVirtualRow : Cell {
    internal var Id int32
    internal var Snapshot Theme
    internal let Handle ElementHandle = ElementHandle()
    public override func Build() Blob {
        Snapshot = Theme.Read()
        return Button{
            Handle: Handle,
            Height: Snapshot.ControlHeight,
            Width: Percent(100),
            Focusable: true,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Row " + Id.ToString()},
            Color: Snapshot.TextColor,
            BackgroundColor: Snapshot.PanelColor,
            Text{Content: Id.ToString(), FontSize: Snapshot.FontSize},
        }
    }
}

internal class ThemeVirtualHost : Cell {
    internal let Items List[int32] = List[int32]()
    internal let Rows Dictionary[int32, ThemeVirtualRow] = Dictionary[int32, ThemeVirtualRow]()
    internal let Handle ElementHandle = ElementHandle()
    internal var Realizations int32
    internal var UseItems bool
    internal var UsePortal bool
    internal var DensityValue Density?
    private let builder Func[int32, Blob]

    internal init() {
        for index in 0 ... 10000 {
            Items.Add(index)
        }
        builder = BuildRow
    }

    private func BuildRow(index int32) Blob {
        Realizations++
        let theme = Theme.Read()
        return Container{
            Height: theme.ControlHeight,
            Cell.Mount[ThemeVirtualRow](
                "counter",
                (row ThemeVirtualRow) -> {
                    row.Id = index
                    Rows[index] = row
                }
            ),
        }
    }

    public override func Build() Blob -> ThemeScope{
        Density: DensityValue,
        Content: () -> {
            let theme = Theme.Read()
            let view = if UseItems {
                VirtualItems(Items, 300.0, theme.ControlHeight, (index int32) -> index.ToString(), builder)
            } else {
                VirtualRows(Items, theme.ControlHeight, (index int32) -> index.ToString(), builder)
            }
            view.Handle = Handle
            view.Width = 300.0
            view.Height = 180.0
            return if UsePortal {
                Portal{Width: 300, Height: 180, view}
            } else {
                view
            }
        },
    }.Build()
}

func ThemeVirtualContracts() {
    for useItems in[]bool{false, true} {
        for portal in[]bool{false, true} {
            using let host = ThemePreferenceHost()
            host.Resize(360, 240, 360, 240)
            let root = ThemeVirtualHost(){UseItems = useItems, UsePortal = portal}
            let semantics = SearchListSemantics()
            let window = Window{Root: root, AccessibilityAdapter: semantics}
            Theme.Attach(window)
            window.Attach(host)
            host.SetFocused(true)
            ThemeFrames(host)
            Require(root.Handle.ScrollToItem("30"), "The themed virtual list rejected its anchor.")
            ThemeFrames(host)
            let retained = root.Rows[30]
            Require(retained.Handle.Focus(), "The themed row could not hold focus.")
            let anchor = root.Handle.ScrollOffset.Y
            let rowY = retained.Handle.BorderBox.Y
            let before = root.Realizations
            Theme.SetMode(window, ThemeMode.Dark)
            ThemeFrames(host)
            Require(
                root.Rows[30] == retained && retained.Snapshot.TextColor == Theme.Ink.TextColor,
                "ContextVersion reused old virtual content or remounted a retained row."
            )
            Require(
                Math.Abs(root.Handle.ScrollOffset.Y - anchor) < 0.1,
                "A palette-only change moved the virtual scroll anchor."
            )
            Require(
                root.Realizations > before && root.Realizations - before < 100,
                "Theme refresh skipped visible rows or rebuilt all metadata rows."
            )
            let paletteCallbacks = root.Realizations - before
            let beforeDensity = root.Realizations
            Theme.SetMode(window, ThemeMode.Light)
            root.DensityValue = Density.Touch
            root.Rebuild()
            ThemeFrames(host)
            Require(
                root.Rows[30] == retained && retained.Handle.IsMounted
                && retained.Snapshot.ControlHeight == 44.0
                && Math.Abs(retained.Handle.BorderBox.Y - rowY) < 0.1
                && ThemeFocused(semantics.Tree?.Root)?.Name == "Row 30",
                "Density changed the virtual anchor, focused row identity or retained theme."
            )
            Require(root.Realizations - beforeDensity < 100, "Density rebuilt the whole virtual data set.")
            let densityCallbacks = root.Realizations - beforeDensity
            Require(root.Handle.ScrollToItem("200"), "New themed rows were not reachable.")
            ThemeFrames(host)
            Require(
                root.Rows[200].Snapshot.TextColor == Theme.Bone.TextColor
                && root.Rows[200].Snapshot.ControlHeight == 44.0,
                "A newly realized row retained the old theme."
            )
            Console.WriteLine(
                "PASS virtual theme: items=" + useItems.ToString() + " portal=" + portal.ToString()
                + " palette callbacks=" + paletteCallbacks.ToString() +
                    " density callbacks=" +
                    densityCallbacks.ToString()
                + " total refresh/scroll callbacks=" + (root.Realizations - before).ToString()
            )
        }
    }
}

func ThemeCapture(window Window) WindowCapture {
    let deadline = Environment.TickCount64 + 20000
    var previous = Environment.TickCount64
    var accepted = false
    while Environment.TickCount64 < deadline {
        if !accepted {
            accepted = window.RequestCapture() == WindowCaptureRequestStatus.Accepted
        }
        let now = Environment.TickCount64
        window.Pump(float64(now - previous) / 1000.0)
        previous = now
        if accepted {
            if let image = window.PollCapture() {
                return image
            }
        }
        Thread.Sleep(1)
    }
    throw TimeoutException("Theme capture did not complete.")
}

func ThemePixel(image WindowCapture, x int32, y int32, color Color) bool {
    let at = y * int32(image.RowBytes) + x * 4
    return Math.Abs(int32(image.Pixels[at]) - int32(Math.Round(float64(color.R) * 255.0))) <= 2
    && Math.Abs(int32(image.Pixels[at + 1]) - int32(Math.Round(float64(color.G) * 255.0))) <= 2
    && Math.Abs(int32(image.Pixels[at + 2]) - int32(Math.Round(float64(color.B) * 255.0))) <= 2
}

internal class ThemeDensityHost : Cell {
    internal var DensityValue Density
    internal var Input PlatformInput?
    internal let ButtonHandle ElementHandle = ElementHandle()
    internal let IconHandle ElementHandle = ElementHandle()
    internal let CheckHandle ElementHandle = ElementHandle()
    internal var Explicit ActionButton

    public override func Build() Blob -> ThemeScope{
        Density: DensityValue,
        Content: () -> {
            let theme = Theme.Read()
            let button = ActionButton{Content: "Keyboard focus"}.Build()
            button.Handle = ButtonHandle
            let icon = IconButton{
                AccessibilityName: "No authored ring",
                CreateRoot: (input IconButton, content Blob) -> Button{
                    Width: input.Width!!,
                    Height: input.Height!!,
                    Padding: 0.0,
                    BackgroundColor: Color.Transparent,
                    Focus: Style{OutlineWidth: 0.0},
                    content,
                },
            }.Build()
            icon.Handle = IconHandle
            let check = Checkbox{Label: "Checkbox target"}.Build()
            check.Handle = CheckHandle
            return Container{
                KeyBindings: WidgetKeyBindings.Editing(Input),
                Padding: 24.0,
                Gap: 16.0,
                BasedOn: theme.CanvasStyle,
                button,
                icon,
                check,
                ActionButton{
                    Content: "Explicit geometry",
                    Height: 23.0,
                    MinWidth: 0.0,
                    PaddingHorizontal: 0.0,
                    BorderRadius: 0.0,
                    FontFamily: "monospace",
                    CreateText: (input ActionButton) -> {
                        Explicit = input
                        return Text{Content: input.Content!!}
                    },
                }.Build(),
            }
        },
    }.Build()
}

func ThemeDensityContracts() {
    let root = ThemeDensityHost()
    let window = Window{Root: root, Width: 360, Height: 340}
    Theme.Attach(window)
    root.Input = window.PlatformInput
    try {
        window.Open()
        for density in[]Density{Density.Standard, Density.Compact, Density.Comfortable, Density.Touch} {
            root.DensityValue = density
            root.Rebuild()
            PumpFrames(window, 6)
            let expected = switch density {
                case Density.Compact: 28.0
                case Density.Comfortable: 40.0
                case Density.Touch: 44.0
                default: 32.0
            }
            Require(
                Math.Abs(root.ButtonHandle.BorderBox.Height - expected) < 0.1
                && Math.Abs(root.IconHandle.BorderBox.Height - expected) < 0.1
                && Math.Abs(root.CheckHandle.BorderBox.Height - expected) < 0.1,
                "Density did not update the real control hit boxes."
            )
            Require(
                root.Explicit.Height == 23.0 && root.Explicit.PaddingHorizontal == 0.0
                && root.Explicit.BorderRadius == 0.0 && root.Explicit.FontFamily == "monospace",
                "The theme replaced explicit zero geometry or font customization."
            )
        }
        Theme.Attach(window, Theme.Default with{TransitionMs = 1000.0})
        root.DensityValue = Density.Standard
        root.Rebuild()
        PumpFrames(window, 6)
        let bounds = root.ButtonHandle.BorderBox
        let id = OnlyNativeWindow()
        MouseButton(id, float32(bounds.X + bounds.Width / 2), float32(bounds.Y + bounds.Height / 2), true)
        MouseButton(id, float32(bounds.X + bounds.Width / 2), float32(bounds.Y + bounds.Height / 2), false)
        PumpFrames(window, 4)
        let pointer = ThemeCapture(window)
        Require(
            ThemePixel(
                pointer,
                int32(bounds.X) - 3,
                int32(bounds.Y + bounds.Height / 2),
                Theme.Read(window).CanvasColor
            ),
            "Pointer-only focus showed the keyboard ring."
        )
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 4)
        let authored = ThemeCapture(window)
        let icon = root.IconHandle.BorderBox
        Require(
            ThemePixel(authored, int32(icon.X) - 3, int32(icon.Y + icon.Height / 2), Theme.Read(window).CanvasColor),
            "An explicit zero ring width was overwritten."
        )
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 4)
        let focused = ThemeCapture(window)
        let check = root.CheckHandle.BorderBox
        Require(
            ThemePixel(focused, int32(check.X) - 3, int32(check.Y + check.Height / 2), Theme.Read(window).FocusColor),
            "Real Tab traversal did not paint the theme focus ring."
        )
        Console.WriteLine(
            "PASS theme density, explicit zero/font overrides, pointer modality and captured keyboard focus"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
}

func ThemeFocused(node AccessibilityNode?) AccessibilityNode? {
    guard let node = node else {
        return nil
    }
    if node.Focused {
        return node
    }
    for child in node.Children {
        if let focused = ThemeFocused(child) {
            return focused
        }
    }
    return nil
}

class GallerySizingPage(Fill bool) : GalleryPage {
    public override func Title() string -> Fill ? "Percentage sizing": "Compact sizing"
    public override func Build() Blob -> Container{
        Width: Percent(100), Height: Fill ? Percent(100): Length.Auto,
        Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: "Percentage demo"},
        Text{Content: "Content box"}
    }
}

func GalleryStageContracts() {
    for width in[]int32{1100, 960} {
        let registry = GalleryRegistry([]GalleryCategory{GalleryCategory("Sizing", "widgets", []GalleryPage{
            GallerySizingPage(true), GallerySizingPage(false)
        })})
        using let gallery = Gallery(registry, 0, width == 1100)
        let adapter = SearchListSemantics()
        let window = Window{Root: gallery, Width: width, Height: width == 1100 ? 800: 640, AccessibilityAdapter: adapter}
        gallery.AttachWindow(window)
        try {
            window.Open()
            PumpFrames(window, 12)
            let demo = FeedbackNode(adapter, AccessibilityRole.Group, "Percentage demo").Bounds
            let expectedWidth = width == 1100 ? 936.0: 588.0
            Require(Math.Abs(demo.Width - expectedWidth) < 2
                && Math.Abs(demo.X + demo.Width - (width == 1100 ? 1018.0: 894.0)) < 2
                && Math.Abs(demo.Y + demo.Height - (window.Height - 74.0)) < 2,
                "Percentage demo escaped the stage content box: " + demo.ToString())
            CaptureIssueProof(window, "gallery-percent-" + width.ToString())
            gallery.Show(1)
            PumpFrames(window, 12)
            let compact = FeedbackNode(adapter, AccessibilityRole.Group, "Percentage demo").Bounds
            Require(compact.Y + compact.Height < 400, "A small demo card grew to fill the page: " + compact.ToString())
        } finally {
            window.RequestClose()
            PumpFrames(window, 5)
        }
    }
}

func GalleryNavigationContracts(window Window, gallery Gallery, registry GalleryRegistry, adapter SearchListSemantics) {
    let id = OnlyNativeWindow()
    Require(Theme.Read(window).CanvasColor == Theme.Ink.CanvasColor, "Gallery did not default to Ink.")
    FeedbackNode(adapter, AccessibilityRole.Heading, "Action button")
    Require(FeedbackNode(adapter, AccessibilityRole.Tab, "Action button").Selected == true, "Initial sidebar selection is missing.")
    SelectorKey(id, SDLScancode.Pageup, SDLKeymod.Ctrl)
    PumpFrames(window, 30)
    FeedbackNode(adapter, AccessibilityRole.Heading, registry.CurrentPage(registry.Count() - 1).Name())
    let lastRow = FeedbackNode(adapter, AccessibilityRole.Tab, registry.CurrentPage(registry.Count() - 1).Name()).Bounds
    Require(lastRow.Y >= 110 && lastRow.Y + lastRow.Height <= window.Height - 100,
        "Page navigation did not reveal the selected sidebar row: " + lastRow.Y.ToString())
    SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Ctrl)
    PumpFrames(window, 8)
    FeedbackNode(adapter, AccessibilityRole.Heading, "Action button")
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 5)
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Search widgets", "Ctrl K did not focus search.")
    SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Ctrl)
    PumpFrames(window, 8)
    FeedbackNode(adapter, AccessibilityRole.Heading, "Icon button")
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Search widgets", "Page navigation moved search focus.")
    SelectorType(window, id, "icbt")
    PumpFrames(window, 8)
    let rows = List[AccessibilityNode]()
    FeedbackNodes(adapter.Tree?.Root, AccessibilityRole.Tab, "", rows)
    Require(rows.Count == 1 && rows[0].Name == "Icon button", "Search did not filter with fuzzy matching.")
    SendKey(id, SDLScancode.Down)
    PumpFrames(window, 5)
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Icon button", "Down did not focus the first search match.")
    SendKey(id, SDLScancode.Return)
    PumpFrames(window, 5)
    Require(FeedbackNode(adapter, AccessibilityRole.Tab, "Icon button").Selected == true, "Sidebar activation did not select its page.")
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 5)
    SendKey(id, SDLScancode.Escape)
    PumpFrames(window, 5)
    SendKey(id, SDLScancode.Down)
    PumpFrames(window, 5)
    SendKey(id, SDLScancode.End)
    PumpFrames(window, 5)
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Icon button", "End did not stay within the Actions category.")
    SendKey(id, SDLScancode.Home)
    PumpFrames(window, 5)
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Action button", "Home did not focus the first category row.")
    SendKey(id, SDLScancode.Down)
    PumpFrames(window, 5)
    SendKey(id, SDLScancode.Up)
    PumpFrames(window, 5)
    SendKey(id, SDLScancode.Space)
    PumpFrames(window, 8)
    FeedbackNode(adapter, AccessibilityRole.Heading, "Action button")
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 5)
    SelectorType(window, id, "no-widget-can-match-this-query")
    PumpFrames(window, 8)
    FeedbackNode(adapter, AccessibilityRole.Button, "Clear search")
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Clear search").Bounds)
    FeedbackNode(adapter, AccessibilityRole.Tab, "Action button")
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 5)
    SelectorType(window, id, "icbt")
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 5)
    SelectorType(window, id, "Calendar")
    SendKey(id, SDLScancode.Return)
    PumpFrames(window, 8)
    FeedbackNode(adapter, AccessibilityRole.Heading, "Calendar")
    SendKey(id, SDLScancode.Escape)
    PumpFrames(window, 5)
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Light").Bounds)
    Require(Theme.Read(window).CanvasColor == Theme.Bone.CanvasColor, "Light did not select Bone.")
    FeedbackClick(window, FeedbackNode(adapter, AccessibilityRole.Button, "Dark").Bounds)
    Require(Theme.Read(window).CanvasColor == Theme.Ink.CanvasColor, "Dark did not restore Ink.")
    for width in[]int32{960, 1440, 1707} {
        window.Width = width
        window.Height = width == 960 ? 640: width == 1440 ? 900: 960
        PumpFrames(window, 12)
        let footer = FeedbackNode(adapter, AccessibilityRole.Button, "Light").Bounds
        let search = FeedbackNode(adapter, AccessibilityRole.TextInput, "Search widgets").Bounds
        Require(footer.Y > search.Y + search.Height && footer.Y + footer.Height < window.Height,
            "Gallery footer or search did not fit the window.")
        if width == 960 {
            gallery.Show(registry.IndexOf("Calendar"))
            PumpFrames(window, 12)
            let title = FeedbackNode(adapter, AccessibilityRole.Heading, "Calendar").Bounds
            let demo = FeedbackNode(adapter, AccessibilityRole.Text, "en-US").Bounds
            Require(demo.X >= title.X, "A wide demo shifted behind the stage's left edge.")
            let day = FeedbackNode(adapter, AccessibilityRole.GridCell, "Monday, September 14, 2026")
            Require(window.PerformAccessibilityAction(day.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
                "The calendar day did not accept focus.")
            SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Ctrl)
            PumpFrames(window, 8)
            FeedbackNode(adapter, AccessibilityRole.Heading, "Date picker")
        }
    }
    window.Width = 1100
    window.Height = 800
    let menuIndex = registry.IndexOf("Menu")
    gallery.Show(menuIndex)
    PumpFrames(window, 20)
    FeedbackNode(adapter, AccessibilityRole.Menu, "Project actions")
    SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Ctrl)
    PumpFrames(window, 12)
    FeedbackNode(adapter, AccessibilityRole.Heading, registry.CurrentPage(menuIndex + 1).Name())
    gallery.Show(menuIndex)
    PumpFrames(window, 20)
    SelectorKey(id, SDLScancode.K, SDLKeymod.Ctrl)
    PumpFrames(window, 8)
    Require(ThemeFocused(adapter.Tree?.Root)?.Name == "Search widgets", "Ctrl K did not leave a nonmodal popup.")
    let dialogIndex = registry.IndexOf("Modal dialog host")
    gallery.Show(dialogIndex)
    PumpFrames(window, 20)
    FeedbackNode(adapter, AccessibilityRole.Dialog, "Review deployment")
    SelectorKey(id, SDLScancode.Pagedown, SDLKeymod.Ctrl)
    PumpFrames(window, 12)
    FeedbackNode(adapter, AccessibilityRole.Heading, registry.CurrentPage(dialogIndex + 1).Name())
    let dialogs = List[AccessibilityNode]()
    FeedbackNodes(adapter.Tree?.Root, AccessibilityRole.Dialog, "Review deployment", dialogs)
    Require(dialogs.Count == 0, "Page navigation left the old modal dialog open.")
    gallery.Show(0)
    PumpFrames(window, 8)
    Console.WriteLine("PASS gallery navigation: wrap, focus, fuzzy search, sidebar keys, appearance")
}

func ThemeCatalogContracts() {
    GalleryStageContracts()
    let registry = CreateRegistry()
    let gallery = Gallery(registry, 0)
    let adapter = SearchListSemantics()
    let window = Window{Root: gallery, Width: 1100, Height: 800, AccessibilityAdapter: adapter}
    gallery.AttachWindow(window)
    try {
        window.Open()
        PumpFrames(window, 12)
        GalleryNavigationContracts(window, gallery, registry, adapter)
        for mode in[]ThemeMode{ThemeMode.Light, ThemeMode.Dark} {
            Theme.SetMode(window, mode)
            for index in 0 ... registry.Count() {
                gallery.Show(index)
                PumpFrames(window, 8)
                let title = registry.CurrentPage(index).Name()
                let image = ThemeCapture(window)
                Require(image.Width > 0u && image.Height > 0u, "The real widget catalog did not capture.")
                CaptureIssueProof(window, "theme-" + mode.ToString() + "-" + index.ToString())
                Console.WriteLine("CAPTURE theme catalog: " + mode.ToString() + " / " + title)
                if title == "Modal dialog host" {
                    FeedbackClick(
                        window,
                        FeedbackNode(adapter, AccessibilityRole.Button, "Open nested confirmation").Bounds
                    )
                    FeedbackNode(adapter, AccessibilityRole.Dialog, "Nested confirmation")
                    CaptureIssueProof(window, "theme-" + mode.ToString() + "-nested-dialog")
                    SendKey(OnlyNativeWindow(), SDLScancode.Escape)
                    PumpFrames(window, 8)
                } else if title == "Combo box" {
                    FeedbackCombo(window, adapter)
                } else if title == "Disclosure" {
                    FeedbackDisclosure(window, adapter)
                } else if title == "Media transport" {
                    FeedbackMedia(window, adapter)
                } else if title == "Tree view" {
                    FeedbackTree(window, adapter)
                } else if title == "Menu" {
                    FeedbackMenu(window, adapter)
                } else if title == "Banner" {
                    let dismiss = FeedbackNode(adapter, AccessibilityRole.Button, "Dismiss Info")
                    Require(
                        window.PerformAccessibilityAction(dismiss.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
                        "Banner dismiss action was not available."
                    )
                    Require(
                        FindSemantics(adapter.Tree?.Root, "Dismiss Info") != nil,
                        "Banner was removed before its close animation."
                    )
                    PumpFrames(window, 30)
                    Require(
                        FindSemantics(adapter.Tree?.Root, "Dismiss Info") == nil,
                        "Banner did not close after its millisecond transition."
                    )
                }
                if title == "Modal dialog host" || title == "Modal dialog" || title == "Popover"
                || title == "Date picker" || title == "Combo box" || title == "Menu" || title == "Tooltip" {
                    SendKey(OnlyNativeWindow(), SDLScancode.Escape)
                    PumpFrames(window, 12)
                    let closed = ThemeCapture(window)
                    Require(
                        ThemePixel(closed, 1, 1, Theme.Read(window).CanvasColor),
                        "Closing an overlay left the wrong window palette."
                    )
                    CaptureIssueProof(window, "theme-" + mode.ToString() + "-" + index.ToString() + "-closed")
                }
                for step in 0 ... 6 {
                    SendKey(OnlyNativeWindow(), SDLScancode.Tab)
                    PumpFrames(window, 3)
                    let focused = ThemeFocused(adapter.Tree?.Root)
                    Require(focused != nil, "Gallery Tab traversal lost semantic focus: " + title)
                    let focusedImage = ThemeCapture(window)
                    Require(focusedImage.Width > 0u, "A focused widget did not capture.")
                    CaptureIssueProof(
                        window,
                        "theme-" + mode.ToString() + "-" + index.ToString() + "-focus-" + step.ToString()
                    )
                    Console.WriteLine(
                        "FOCUS theme " + mode.ToString() + " / " + title + ": "
                        + focused!!.Role.ToString() + " / " + focused!!.Name
                    )
                }
            }
        }
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
}

internal class ThemeCostProbe : Cell {
    internal var Themed bool
    internal var Builds int32
    internal var BaseColor Color

    public override func Build() Blob {
        Builds++
        let color = Themed ? Theme.Read().TextColor: BaseColor
        return Text{Content: "Profiler comparison", Color: color, FontSize: 14}
    }
}

func ThemeCostContracts() {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let root = ThemeCostProbe(){BaseColor = Theme.Default.TextColor}
    let window = Window{Root: root}
    Theme.Attach(window)
    window.Attach(host)
    ThemeFrames(host)
    for themed in[]bool{false, true} {
        root.Themed = themed
        root.Rebuild()
        ThemeFrames(host)
        Console.WriteLine("THEME_COST phase=" + (themed ? "retained-read": "plain"))
        let builds = root.Builds
        let before = GC.GetAllocatedBytesForCurrentThread()
        for frame in 0 ... 480 {
            root.Rebuild()
            host.RenderFrame(0.016)
        }
        let bytes = GC.GetAllocatedBytesForCurrentThread() - before
        Require(root.Builds - builds == 480, "The cost fixture did not execute every queued child rebuild.")
        Console.WriteLine(
            "THEME_COST queued builds=" + (root.Builds - builds).ToString()
            + " managed bytes=" + bytes.ToString()
        )
    }
}

@MethodImpl(MethodImplOptions.NoInlining)
func ThemeAttachmentReference() WeakReference {
    using let host = ThemePreferenceHost()
    host.Resize(320, 240, 320, 240)
    let window = Window{Root: ThemeProbe()}
    Theme.Attach(window)
    window.Attach(host)
    ThemeFrames(host)
    return WeakReference(window)
}

func ThemeAttachmentContracts() {
    let reference = ThemeAttachmentReference()
    for attempt in 0 ... 3 {
        GC.Collect()
        GC.WaitForPendingFinalizers()
        GC.Collect()
    }
    Require(!reference.IsAlive, "The Widgets attachment or preference subscription retained a disposed window.")
    Console.WriteLine("PASS weak Widgets attachment ownership after embedded window disposal")
}

func ThemeInteractions() {
    var rejected = false
    try {
        Theme.Read()
    } catch (error InvalidOperationException) {
        rejected = true
    }
    Require(rejected, "Theme.Read outside an owned build silently selected a global value.")
    ThemeBackgroundContracts()
    ThemePolicyContracts()
    ThemeAttachmentContracts()
    ThemeCostContracts()
    ThemeVirtualContracts()
    ThemeDensityContracts()
    ThemeScrollbarContracts()
    ThemeCatalogContracts()
}

internal class ThemeScrollbarHost : Cell {
    internal let Items List[int32] = List[int32]()
    internal let View ElementHandle = ElementHandle()
    internal let Core ElementHandle = ElementHandle()
    internal let FirstRow ElementHandle = ElementHandle()
    internal let CustomTrack ElementHandle = ElementHandle()
    internal let CustomThumb ElementHandle = ElementHandle()
    internal var Mode int32
    private let builder Func[int32, Blob]

    internal init() {
        for index in 0 ... 100 {
            Items.Add(index)
        }
        builder = BuildRow
    }

    private func BuildRow(index int32) Blob {
        let theme = Theme.Read()
        return Container{
            Handle: index == 0 ? FirstRow: nil,
            Height: theme.ControlHeight,
            Width: Percent(100),
            BackgroundColor: theme.FieldColor,
        }
    }

    public override func Build() Blob {
        let theme = Theme.Read()
        let view = VirtualRows(Items, theme.ControlHeight, (index int32) -> index.ToString(), builder)
        view.Handle = View
        view.Width = 200
        view.Height = 160
        view.BackgroundColor = theme.FieldColor
        if Mode == 1 {
            view.ScrollbarVisibilityY = ScrollbarVisibility.Always
        }
        if Mode == 2 {
            view.ScrollbarVisibilityY = ScrollbarVisibility.Hidden
        }
        if Mode == 3 {
            view.ScrollbarY = Scrollbar{}
            view.ScrollbarVisibilityY = ScrollbarVisibility.Always
        }
        if Mode == 4 {
            view.ScrollbarY = Scrollbar{
                Thickness: 10,
                HitThickness: 14,
                Inset: 2,
                MinThumbLength: 24,
                ReserveSpace: false,
                Track: Container{Handle: CustomTrack, BackgroundColor: Color.Transparent},
                Thumb: Container{Handle: CustomThumb, BackgroundColor: Color.Rgb(180, 20, 160)},
            }
            view.ScrollbarVisibilityY = ScrollbarVisibility.Always
        }
        return Container{
            Width: Percent(100),
            Height: Percent(100),
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.FlexStart,
            Padding: 16,
            Gap: 24,
            view,
            Container{
                Handle: Core,
                Width: 200,
                Height: 160,
                OverflowY: Overflow.Scroll,
                BackgroundColor: theme.FieldColor,
                Container{Width: 200, Height: 3200, FlexShrink: 0},
            },
        }
    }
}

func ThemeThumbPoint(view ElementHandle) Point {
    let bounds = view.ContentBox
    let maximum = view.ScrollRange.Y
    let length = bounds.Height - 4.0
    let thumb = Math.Max(24.0, length * bounds.Height / (bounds.Height + maximum))
    return Point{
        X: bounds.X + bounds.Width - 5.0,
        Y: bounds.Y + 2.0 + (length - thumb) * view.ScrollOffset.Y / maximum + thumb / 2.0,
    }
}

func ThemeScrollbarContracts() {
    let root = ThemeScrollbarHost()
    let window = Window{Root: root, Width: 480, Height: 240}
    Theme.Attach(window, Theme.Default)
    try {
        window.Open()
        PumpFrames(window, 8)
        let theme = Theme.Read(window)
        let descriptor = theme.Scrollbar
        let other = theme.Scrollbar
        Require(
            descriptor != other && descriptor.Track != other.Track && descriptor.Thumb != other.Thumb
            && descriptor.Thickness == 6.0 && descriptor.HitThickness == 12.0
            && descriptor.Inset == 2.0 && descriptor.MinThumbLength == 24.0
            && !descriptor.ReserveSpace && descriptor.HideDelayMs == 1000.0
            && descriptor.FadeMs == (window.Preferences.ReducedMotion == true ? 0.0: 250.0),
            "The themed scrollbar reused mutable parts or lost its overlay/hit geometry."
        )
        Require(
            Math.Abs(root.FirstRow.BorderBox.Width - 200.0) < 0.1,
            "The overlay scrollbar reserved row layout space."
        )
        let id = OnlyNativeWindow()
        MouseMove(id, 5.0F, 5.0F)
        Require(root.View.JumpTo(0, 300) && root.Core.JumpTo(0, 300), "The scrollbar fixture did not overflow.")
        PumpFrames(window, 2)
        let thumb = ThemeThumbPoint(root.View)
        let image = ThemeCapture(window)
        Require(
            !ThemePixel(image, int32(thumb.X), int32(thumb.Y), theme.FieldColor),
            "Scrolling the default helper did not paint its real thumb."
        )
        let bare = root.Core.ContentBox
        Require(
            ThemePixel(image, int32(bare.X + bare.Width - 5.0), int32(bare.Y + 24.0), theme.FieldColor),
            "A core-only scroller acquired the Widgets scrollbar paint."
        )
        let before = root.View.ScrollOffset.Y
        let hit = float32(root.View.ContentBox.X + root.View.ContentBox.Width - 10.0)
        MouseButton(id, hit, float32(thumb.Y), true)
        MouseMove(id, hit, float32(thumb.Y + 40.0))
        MouseButton(id, hit, float32(thumb.Y + 40.0), false)
        PumpFrames(window, 4)
        Require(
            root.View.ScrollOffset.Y > before + 100.0,
            "Dragging outside the painted six-pixel thumb missed the twelve-pixel hit band."
        )
        CaptureIssueProof(window, "theme-scrollbar-drag")
        MouseMove(id, 5.0F, 5.0F)
        for mode in[]int32{1, 2, 3, 4} {
            root.Mode = mode
            root.Rebuild()
            PumpFrames(window, 4)
            let capture = ThemeCapture(window)
            if mode == 4 {
                CaptureIssueProof(window, "theme-scrollbar-custom")
                let box = root.CustomThumb.BorderBox
                Require(
                    root.CustomTrack.IsMounted && root.CustomThumb.IsMounted && Math.Abs(box.Width - 10.0) < 0.1,
                    "Custom parts lost geometry: width=" + box.Width.ToString()
                    + " range=" + root.View.ScrollRange.Y.ToString()
                )
                Require(
                    ThemePixel(
                        capture,
                        int32(box.X + box.Width / 2.0),
                        int32(box.Y + box.Height / 2.0),
                        Color.Rgb(180, 20, 160)
                    ),
                    "The custom scrollbar did not keep its authored paint."
                )
            } else {
                let point = ThemeThumbPoint(root.View)
                let painted = !ThemePixel(capture, int32(point.X), int32(point.Y), theme.FieldColor)
                Require(painted == (mode == 1), "Scrollbar visibility precedence was lost: " + mode.ToString())
            }
        }
        root.Items.Clear()
        root.Items.Add(0)
        root.Items.Add(1)
        root.Mode = 0
        root.Rebuild()
        PumpFrames(window, 5)
        let empty = ThemeCapture(window)
        let bounds = root.View.ContentBox
        Require(
            root.View.ScrollRange.Y == 0.0
            && ThemePixel(empty, int32(bounds.X + bounds.Width - 5.0), int32(bounds.Y + 24.0), theme.FieldColor),
            "A nonoverflowing viewport retained scrollbar paint."
        )
        Console.WriteLine(
            "PASS captured default scrollbar, expanded hit drag, overlay layout, Auto configuration, explicit Always/Hidden/blank/custom parts and unstyled core scroller"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
}
