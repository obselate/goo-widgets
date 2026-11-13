package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import System
import System.Collections
import System.Collections.Generic
import System.Diagnostics
import System.Globalization
import System.IO
import System.Reflection

func FocusProperty(value object, name string) object {
    let property = value.GetType().GetProperty(
        name,
        BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
    )
    ?? throw MissingMemberException(value.GetType().FullName, name)
    return property.GetValue(value) ?? throw InvalidOperationException("Missing focus property: " + name)
}

func FocusField(value object, name string) object {
    let field = value.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)
    ?? throw MissingFieldException(value.GetType().FullName, name)
    return field.GetValue(value) ?? throw InvalidOperationException("Missing focus field: " + name)
}

func FocusVisual(node object) bool {
    if bool(FocusProperty(node, "FocusVisible")) {
        return true
    }
    for child in IEnumerable(FocusProperty(node, "Children")) {
        if FocusVisual(child) {
            return true
        }
    }
    return false
}

func FocusSettled(window Window, adapter SearchListSemantics, visible bool = true) {
    let deadline = Stopwatch.GetTimestamp() + Stopwatch.Frequency * 5
    let posted = typeof(Window).GetMethod("hasPostedActions", BindingFlags.Instance | BindingFlags.NonPublic)
    ?? throw MissingMethodException("Window.hasPostedActions")
    let scroll = typeof(Window).GetMethod("hasScrollDemand", BindingFlags.Instance | BindingFlags.NonPublic)
    ?? throw MissingMethodException("Window.hasScrollDemand")
    let resolver = FocusField(window, "resolver")
    let motion = FocusField(window, "motionPump")
    while Stopwatch.GetTimestamp() < deadline {
        let moving = int32(FocusProperty(FocusProperty(resolver, "Animating"), "Count")) > 0
        || bool(FocusProperty(motion, "Active"))
        || bool(scroll.Invoke(window, nil) ?? throw InvalidOperationException("Scroll demand is unavailable."))
        window.Pump(moving ? 0.25: 0.0)
        if !window.IsVisible || !window.IsFocused || moving
        || bool(FocusField(window, "dirty")) || int32(FocusField(window, "pendingRebuild")) != 0
        || bool(FocusField(window, "pendingMetrics"))
        || int32(FocusField(window, "pendingRetainedInvalidation")) != 0
        || int32(FocusField(window, "pendingImageCompletion")) != 0
        || bool(FocusProperty(FocusField(resolver, "Scrollbars"), "HasPending"))
        || bool(posted.Invoke(window, nil) ?? throw InvalidOperationException("Posted action state is unavailable.")) {
            continue
        }
        if !visible {
            return
        }
        if ThemeFocused(adapter.Tree?.Root) == nil {
            continue
        }
        if FocusVisual(FocusField(window, "node")) || FocusVisual(FocusField(window, "portalRoot")) {
            return
        }
    }
    throw TimeoutException("Focus visual state did not settle.")
}

func FocusKey(window Window, key Key) {
    window.PlatformInput.KeyPress(key, KeyModifiers{})
    window.PlatformInput.KeyRelease(key)
}

func FocusCrop(window Window, bounds ElementRect, uiScale float64) ImageSource {
    let image = ThemeCapture(window)
    let scale = uiScale * float64(image.Width) / float64(window.NativeWidth)
    let left = Math.Max(0, int32(Math.Floor((bounds.X - 6) * scale)))
    let top = Math.Max(0, int32(Math.Floor((bounds.Y - 6) * scale)))
    let right = Math.Min(int32(image.Width), int32(Math.Ceiling((bounds.X + bounds.Width + 6) * scale)))
    let bottom = Math.Min(int32(image.Height), int32(Math.Ceiling((bounds.Y + bounds.Height + 6) * scale)))
    let width = right - left
    let height = bottom - top
    Require(width > 0 && height > 0, "Focused control is outside the capture.")
    let pixels = [width * height * 4]uint8
    for row in 0 ... height {
        Array.Copy(image.Pixels, (top + row) * int32(image.RowBytes) + left * 4, pixels, row * width * 4, width * 4)
    }
    return ImageSource(width, height, pixels)
}

func FocusPixels(source ImageSource)[]uint8 {
    let image = FocusField(source, "image")
    let method = image.GetType().GetMethod("Pixels", BindingFlags.Instance | BindingFlags.NonPublic)
    ?? throw MissingMethodException("DecodedImage.Pixels")
    return method.Invoke(image, nil) as []uint8 ?? throw InvalidOperationException("Image pixels are unavailable.")
}

func FocusDifference(actual[]uint8, expected[]uint8, pixel int32) bool {
    for channel in 0 ... 4 {
        if Math.Abs(int32(actual[pixel * 4 + channel]) - int32(expected[pixel * 4 + channel])) > 4 {
            return true
        }
    }
    return false
}

func FocusCompare(actual ImageSource, path string, output string, approve bool) int32 {
    if approve {
        Directory.CreateDirectory(Path.GetDirectoryName(path) ?? throw InvalidOperationException(path))
        File.WriteAllBytes(path, actual.EncodePng())
        return 0
    }
    Require(File.Exists(path), "Missing approved focus crop: " + path)
    using let expected = ImageSource.Decode(File.ReadAllBytes(path))
    let actualPixels = FocusPixels(actual)
    let expectedPixels = FocusPixels(expected)
    let sameSize = actual.Width == expected.Width && actual.Height == expected.Height
    var changed = actual.Width * actual.Height
    if sameSize {
        changed = 0
        for pixel in 0 ... actualPixels.Length / 4 {
            if FocusDifference(actualPixels, expectedPixels, pixel) {
                changed++
            }
        }
    }
    if changed == 0 {
        return 0
    }
    let diff = [actualPixels.Length]uint8
    for pixel in 0 ... diff.Length / 4 {
        let different = !sameSize || FocusDifference(actualPixels, expectedPixels, pixel)
        diff[pixel * 4] = different ? uint8(255): uint8(0)
        diff[pixel * 4 + 2] = different ? uint8(255): uint8(0)
        diff[pixel * 4 + 3] = uint8(255)
    }
    Directory.CreateDirectory(output)
    let name = Path.GetFileName(path)
    File.WriteAllBytes(Path.Combine(output, name), actual.EncodePng())
    using let image = ImageSource(actual.Width, actual.Height, diff)
    let diffPath = Path.Combine(output, Path.GetFileNameWithoutExtension(name) + "-diff.png")
    File.WriteAllBytes(diffPath, image.EncodePng())
    Console.Error.WriteLine(
        "FAIL focus " + Path.GetFileNameWithoutExtension(name) + " pixels=" + changed.ToString() + " diff=" + diffPath
    )
    return changed
}

func FocusGoldens() {
    let timer = Stopwatch.StartNew()
    let directory = Path.GetFullPath("tests/Goo.Widgets.Consumer/FocusGoldens")
    let output = Path.GetFullPath("artifacts/native-test/focus")
    let approve = Environment.GetEnvironmentVariable("GOO_WIDGETS_APPROVE_FOCUS") == "1"
    Require(!approve || Environment.GetEnvironmentVariable("CI") != "true", "CI cannot approve focus crops.")
    if Directory.Exists(output) {
        Directory.Delete(output, true)
    }
    let page = FocusGoldenPage()
    let plain = HashSet[string](
        []string{
            "Button",
            "Checkbox",
            "RadioButton",
            "Switch",
            "TextField",
            "TextArea",
            "NumberInput",
            "ComboBox",
            "Slider",
            "ListRow"
        }
    )
    let toolbar = HashSet[string](
        []string{"Button", "IconButton", "ToggleButton", "Switch", "TabBar", "ToggleGroup", "MenuButton"}
    )
    let adapter = SearchListSemantics()
    let window = Window{Root: page, Size: LayoutSize(720, 800), VSync: false, AccessibilityAdapter: adapter}
    page.Window = window
    var captures = 0
    var failures = 0
    RunNativeWindow(window, () -> {
        Theme.Attach(
            window,
            Theme.Default with{
                FontFamily = "DejaVu Sans",
                HeadingFontFamily = "DejaVu Sans",
                MonoFontFamily = "DejaVu Sans Mono",
                Culture = CultureInfo.InvariantCulture
            }
        )
        window.Open()
        Require(window.RequestActivation() == WindowOperationResult.Accepted, "Focus fixture activation was rejected.")
        FocusSettled(window, adapter, false)
        for mode in[]ThemeMode{ThemeMode.Light, ThemeMode.Dark} {
            Theme.SetMode(window, mode)
            for scale in[]float64{1, 1.5} {
                window.UiScale = float32(scale)
                for layout in[]string{"plain", "rounded", "toolbar"} {
                    for control in page.Controls {
                        if layout == "plain" && !plain.Contains(control) {
                            continue
                        }
                        if layout == "toolbar" && !toolbar.Contains(control) {
                            continue
                        }
                        Console.WriteLine(
                            "FOCUS " + control + " " + layout + " " + mode.ToString() + " " + scale.ToString(
                                CultureInfo.InvariantCulture
                            )
                        )
                        page.Control = control
                        page.Layout = layout
                        page.Rebuild()
                        FocusSettled(window, adapter, false)
                        window.Focus.Clear()
                        let seen = HashSet[AccessibilityId]()
                        var index = 0
                        while index < 64 {
                            FocusKey(window, Key.Tab)
                            FocusSettled(window, adapter)
                            let focused = ThemeFocused(adapter.Tree?.Root) ??
                                throw InvalidOperationException("Keyboard focus is missing.")
                            if !seen.Add(focused.Id) {
                                break
                            }
                            let prefix = control + "-" + layout + "-" + mode.ToString().ToLowerInvariant() +
                                "-" +
                                scale.ToString("0.0", CultureInfo.InvariantCulture) + "-" + index.ToString()
                            using let image = FocusCrop(window, control == "TextFieldActions" ? page.FieldActionsHandle.BorderBox: focused.Bounds, scale)
                            failures += FocusCompare(
                                image,
                                Path.Combine(directory, prefix + ".png"),
                                output,
                                approve
                            ) > 0 ? 1: 0
                            captures++
                            if index == 0 &&
                                (
                                control == "ListView" ||
                                    control == "TreeView" ||
                                    control == "DataGrid" ||
                                    control == "TabBar" ||
                                    control == "Menu" ||
                                    control == "ComboBox" ||
                                    control == "ToggleGroup" ||
                                    control == "RadioGroup" ||
                                    control == "NavigationRail"
                            ) {
                                if control == "ComboBox" {
                                    FocusKey(window, Key.Down)
                                    FocusSettled(window, adapter)
                                    Require(
                                        ThemeFocused(adapter.Tree?.Root)?.Role == AccessibilityRole.List,
                                        "Combo box popup did not take keyboard focus."
                                    )
                                }
                                FocusKey(window, control == "DataGrid" ? Key.Down: Key.End)
                                FocusSettled(window, adapter)
                                let lastFocused = ThemeFocused(adapter.Tree?.Root) ??
                                    throw InvalidOperationException("Keyboard focus is missing.")
                                using let last = FocusCrop(window, lastFocused.Bounds, scale)
                                failures += FocusCompare(
                                    last,
                                    Path.Combine(directory, prefix + "-last.png"),
                                    output,
                                    approve
                                ) > 0 ? 1: 0
                                captures++
                                FocusKey(window, control == "DataGrid" ? Key.Up: Key.Home)
                                FocusSettled(window, adapter)
                            }
                            index++
                        }
                        Require(index > 0 && index < 64, "Invalid focus traversal: " + control)
                    }
                }
            }
        }
    })
    timer.Stop()
    Console.WriteLine(
        "FOCUS controls=" + page.Controls.Length.ToString() + " crops=" + captures.ToString() +
            " failures=" +
            failures.ToString() +
            " seconds=" +
            timer
            .Elapsed
            .TotalSeconds
            .ToString("0.00", CultureInfo.InvariantCulture) +
            " settle=FocusVisible+idle-UI-queue tolerance=4/channel"
    )
    Require(Directory.GetFiles(directory, "*.png").Length == captures, "Approved focus crop count changed.")
    Require(failures == 0, "Focus golden images differ.")
    Require(timer.Elapsed.TotalSeconds < 90, "Focus golden fixture exceeded 90 seconds.")
}
