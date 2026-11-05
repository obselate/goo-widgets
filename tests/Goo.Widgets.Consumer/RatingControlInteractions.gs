package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Globalization

internal class RatingControlHost : Cell {
    internal var Value float64 = 1.5
    internal var Step float64 = 0.5
    internal var Maximum int32 = 5
    internal var ReadOnly bool
    internal var Disabled bool
    internal var Reject bool
    internal var Changes int32

    public override func Build() Blob -> Container{
        Padding: Theme.Read().ControlPadding,
        Width: Percent(100),
        Cell.Mount[RatingControlInput, RatingControl]("rating", RatingControlInput{
            Value: Value,
            Step: Step,
            Maximum: Maximum,
            Width: Percent(100),
            ReadOnly: ReadOnly,
            Disabled: Disabled,
            AccessibilityName: "Score",
            OnChange: value -> {
                Changes++
                if !Reject {
                    Value = value
                }
                Rebuild()
            }
        })
    }
}

func RatingAccentPixels(window Window, node AccessibilityNode, color Color) int32 {
    let image = ThemeCapture(window)
    var count int32
    for y in int32(node.Bounds.Y) ... int32(node.Bounds.Y + node.Bounds.Height) {
        for x in int32(node.Bounds.X) ... int32(node.Bounds.X + node.Bounds.Width) {
            if ThemePixel(image, x, y, color) {
                count++
            }
        }
    }
    return count
}

func RatingControlInteractions() {
    let host = RatingControlHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: ApplicationRoot(host), Width: 480, Height: 180, AccessibilityAdapter: semantics}.Open()
    try {
        let id = OnlyNativeWindow()
        for palette in []Theme{Theme.Bone, Theme.Ink, Theme.Ink.WithHighContrast()} {
            Theme.Attach(window, palette with{Culture = CultureInfo.GetCultureInfo("fr-FR")})
            host.Value = 1.5
            host.Rebuild()
            PumpFrames(window, 8)
            var rating = FindSemantics(semantics.Tree?.Root, "Score")!!
            Require(rating.Role == AccessibilityRole.Slider && rating.ValueMinimum == 0 && rating.ValueMaximum == 5 && rating.ValueNow == 1.5 && rating.ValueText == "1,5 of 5", "Rating omitted slider range or localized value text")
            host.Value = 0
            host.ReadOnly = true
            host.Rebuild()
            PumpFrames(window, 4)
            let emptyImage = ThemeCapture(window)
            host.Value = 0.2
            host.Rebuild()
            PumpFrames(window, 4)
            let fractionalImage = ThemeCapture(window)
            var fractionalPaint bool
            for y in int32(rating.Bounds.Y) ... int32(rating.Bounds.Y + rating.Bounds.Height) {
                for x in int32(rating.Bounds.X) ... int32(rating.Bounds.X + rating.Bounds.Width) {
                    let at = y * int32(emptyImage.RowBytes) + x * 4
                    fractionalPaint = fractionalPaint || emptyImage.Pixels[at] != fractionalImage.Pixels[at]
                        || emptyImage.Pixels[at + 1] != fractionalImage.Pixels[at + 1]
                        || emptyImage.Pixels[at + 2] != fractionalImage.Pixels[at + 2]
                }
            }
            Require(fractionalPaint, "Wide rating lost a fractional display value")
            host.Value = 1.5
            host.ReadOnly = false
            host.Rebuild()
            PumpFrames(window, 4)
            let before = RatingAccentPixels(window, rating, palette.AccentColor)
            let box = rating.Bounds
            let x = float32(box.X + box.Width * 0.85)
            let y = float32(box.Y + box.Height / 2)
            let changes = host.Changes
            MouseMove(id, x, y)
            PumpFrames(window, 6)
            Require(host.Value == 1.5 && host.Changes == changes && FindSemantics(semantics.Tree?.Root, "Score")!!.ValueNow == 1.5, "Rating hover committed its preview")
            Require(RatingAccentPixels(window, rating, palette.AccentColor) > before, "Rating hover did not paint a preview")
            MouseMove(id, 460, 140)
            PumpFrames(window, 6)
            Require(RatingAccentPixels(window, rating, palette.AccentColor) == before, "Rating pointer leave retained preview paint")
            MouseMove(id, x, y)
            MouseButton(id, x, y, true)
            MouseButton(id, x, y, false)
            PumpFrames(window, 6)
            Require(host.Value == 4.5 && host.Changes == changes + 1, "Rating pointer did not commit a half step once")
            rating = FindSemantics(semantics.Tree?.Root, "Score")!!
            Require(window.PerformAccessibilityAction(rating.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Rating did not focus")
            SendKey(id, SDLScancode.Home)
            PumpFrames(window, 4)
            Require(host.Value == 0, "Rating Home did not clear")
            SendKey(id, SDLScancode.Right)
            PumpFrames(window, 4)
            Require(host.Value == 0.5, "Rating arrow ignored the half step")
            SendKey(id, SDLScancode.End)
            PumpFrames(window, 4)
            Require(host.Value == 5, "Rating End did not reach maximum")
            SendKey(id, SDLScancode.Down)
            PumpFrames(window, 4)
            Require(host.Value == 4.5, "Rating Down did not decrement")
            host.Step = 1
            host.Value = 2
            host.Rebuild()
            PumpFrames(window, 4)
            SendKey(id, SDLScancode.Up)
            PumpFrames(window, 4)
            Require(host.Value == 3, "Rating ignored the whole step")
            host.Reject = true
            SendKey(id, SDLScancode.Right)
            PumpFrames(window, 4)
            Require(host.Value == 3 && FindSemantics(semantics.Tree?.Root, "Score")!!.ValueNow == 3, "Rating retained a rejected request")
            host.Reject = false
            host.ReadOnly = true
            host.Rebuild()
            PumpFrames(window, 4)
            rating = FindSemantics(semantics.Tree?.Root, "Score")!!
            Require(rating.ReadOnly == true && window.PerformAccessibilityAction(rating.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Read-only rating lost focus or semantics")
            let readOnlyChanges = host.Changes
            SendKey(id, SDLScancode.Home)
            MouseMove(id, x, y)
            MouseButton(id, x, y, true)
            MouseButton(id, x, y, false)
            Require(!window.PerformAccessibilityAction(rating.Id, AccessibilityActionRequest(AccessibilityAction.Increment)), "Read-only rating accepted a value action")
            PumpFrames(window, 5)
            Require(host.Value == 3 && host.Changes == readOnlyChanges, "Read-only rating accepted edits")
            host.ReadOnly = false
            host.Disabled = true
            host.Rebuild()
            PumpFrames(window, 4)
            rating = FindSemantics(semantics.Tree?.Root, "Score")!!
            Require(!window.PerformAccessibilityAction(rating.Id, AccessibilityActionRequest(AccessibilityAction.Focus)), "Disabled rating accepted focus")
            MouseButton(id, x, y, true)
            MouseButton(id, x, y, false)
            PumpFrames(window, 4)
            Require(host.Changes == readOnlyChanges, "Disabled rating accepted a pointer edit")
            host.Disabled = false
            host.Step = 0.5
        }
        host.Value = 3.2
        host.Rebuild()
        PumpFrames(window, 4)
        window.PerformAccessibilityAction(FindSemantics(semantics.Tree?.Root, "Score")!!.Id, AccessibilityActionRequest(AccessibilityAction.Focus))
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 4)
        Require(Math.Abs(host.Value - 3.7) < 0.000001, "Rating step changed the fractional origin")
        Theme.Attach(window, Theme.Bone with{Culture = CultureInfo.GetCultureInfo("fr-FR"), Direction = Direction.RightToLeft})
        host.Value = 2
        host.Rebuild()
        PumpFrames(window, 5)
        let reversed = FindSemantics(semantics.Tree?.Root, "Score")!!
        window.PerformAccessibilityAction(reversed.Id, AccessibilityActionRequest(AccessibilityAction.Focus))
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 4)
        Require(host.Value == 2.5, "Rating did not reverse horizontal keys in right-to-left layout")
        Require(window.PerformAccessibilityAction(reversed.Id, AccessibilityActionRequest.SetValue("3.5")), "Rating rejected a valid accessible value")
        PumpFrames(window, 4)
        Require(host.Value == 3.5, "Rating accessible value did not commit")
        host.Maximum = 7
        host.Value = 6.5
        host.Rebuild()
        window.UiScale = 1.5F
        for width in []int32{480, 1100, 2560} {
            window.Width = width
            window.Height = width == 2560 ? 1440: 300
            PumpFrames(window, 8)
            let rating = FindSemantics(semantics.Tree?.Root, "Score")!!
            Require(rating.ValueMaximum == 7 && rating.ValueText == "6,5 of 7" && rating.Bounds.X + rating.Bounds.Width <= float64(width) / 1.5 + 1, "Rating maximum or 150-percent layout did not fit")
            CaptureIssueProof(window, "rating-control-150-" + width.ToString())
        }
        Console.WriteLine("PASS: RatingControl half whole steps pointer preview leave commit arrows Home End controlled read-only disabled slider accessibility light dark high-contrast 150-percent fit")
    } finally {
        CloseNativeWindow(window)
    }
}
