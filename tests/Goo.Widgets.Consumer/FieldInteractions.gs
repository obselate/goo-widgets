package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Globalization

internal class FieldHost : Cell {
    internal var Number float64 = 4
    internal var LastCommit float64 = -1
    internal var Commits int32
    internal var Text string = "secret"
    internal var TextCommit string?
    internal var Disabled bool
    internal var ReadOnly bool
    internal var Reject bool
    internal var Entry TextEntry?
    internal var PasswordEntry TextEntry?
    internal let NumberHandle ElementHandle = ElementHandle()
    internal let PasswordHandle ElementHandle = ElementHandle()

    public override func Build() Blob -> Container{
        Width: Percent(100),
        Padding: 20,
        FlexDirection: FlexDirection.Column,
        Gap: 20,
        Cell.Mount[NumberInputInput, NumberInput](
            "number",
            NumberInputInput{
                Label: "Quantity",
                Description: "Between zero and twenty",
                Value: Number,
                Minimum: 0,
                Maximum: 20,
                Step: 0.5,
                Disabled: Disabled,
                Width: Percent(100),
                OnChange: value -> {
                    if !Reject {
                        Number = value
                    }
                    Rebuild()
                },
                OnCommit: value -> {
                    LastCommit = value
                    Commits++
                },
                CreateEntry: (input, entry) -> {
                    Entry = entry
                    entry.Handle = NumberHandle
                    return entry
                }
            }
        ),
        TextField{
            Label: "Password",
            Value: Text,
            Controlled: true,
            Clearable: true,
            Password: true,
            RevealButton: true,
            MaxLength: 4,
            Disabled: Disabled,
            Width: Percent(100),
            OnChange: value -> {
                Text = value
                Rebuild()
            },
            OnCommit: value -> TextCommit = value,
            CreateEntry: input -> {
                PasswordEntry = TextEntry{
                    Handle: PasswordHandle,
                    Value: input.Value ?? "",
                    Controlled: input.Controlled,
                    Password: input.Password,
                    OnChange: input.OnChange,
                    OnSubmit: input.OnSubmit,
                    Accessibility: Accessibility{ReadOnly: ReadOnly},
                    Height: 36,
                    Width: Percent(100)
                }
                return PasswordEntry!!
            }
        }.Build(),
        Button{Key: "other", Height: 36, Accessibility: Accessibility{Name: "Other"}},
    }
}

func FieldInteractions() {
    let host = FieldHost()
    let semantics = SearchListSemantics()
    let root = ApplicationRoot(host)
    let window = Window{Root: root, Width: 500, Height: 400, AccessibilityAdapter: semantics, Title: "Field contracts"}
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 10)
        Require(host.NumberHandle.Focus(), "Number input did not focus")
        let id = OnlyNativeWindow()
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 5)
        Require(host.Number == 4.5, "Arrow Up did not use the fractional step")
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Pageup)
        PumpFrames(window, 5)
        Require(host.Number == 9, "Page Up did not default to ten steps")
        SendKey(id, SDLScancode.Pagedown)
        PumpFrames(window, 5)
        Require(host.Number == 4, "Page Down did not reverse the page step")
        host.Reject = true
        host.Rebuild()
        PumpFrames(window, 3)
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 5)
        Require(host.Number == 4 && host.Entry!!.Value == "4", "Number input retained a rejected controlled value")
        host.Reject = false
        host.Rebuild()
        PumpFrames(window, 3)
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorType(window, id, "99")
        Require(host.Number == 4, "Draft committed before Enter or blur")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(
            host.Number == 20 && host.LastCommit == 20 && host.Commits == 1,
            "Enter did not clamp and commit the draft: value=" + host.Number.ToString()
            + " commit=" + host.LastCommit.ToString() + " count=" + host.Commits.ToString()
            + " draft=" + host.Entry!!.Value
        )
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorType(window, id, "-5")
        Require(host.PasswordHandle.Focus(), "Password did not focus")
        PumpFrames(window, 5)
        Require(
            host.Number == 0 && host.LastCommit == 0 && host.Commits == 2,
            "Blur did not clamp and commit the draft"
        )
        let number = FindSemantics(semantics.Tree?.Root, "Quantity")!!
        Require(
            number.Role == AccessibilityRole.SpinButton && number.ValueMinimum == 0
            && number.ValueMaximum == 20 && number.Relationships.LabelledBy.Count == 1
            && number.Relationships.DescribedBy.Count == 1,
            "Number field lost range or form relationships"
        )
        let increase = FindSemantics(semantics.Tree?.Root, "Increase")!!
        Require(
            window.PerformAccessibilityAction(increase.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Spin button did not activate"
        )
        PumpFrames(window, 5)
        Require(host.Number == 0.5, "Spin button did not step")
        host.PasswordHandle.Focus()
        FeedbackClick(window, FeedbackNode(semantics, AccessibilityRole.Text, "Quantity").Bounds)
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 5)
        Require(host.Number == 1, "Form label did not focus the custom entry handle")
        Require(host.PasswordEntry!!.Password, "Password field did not start masked")
        let reveal = FindSemantics(semantics.Tree?.Root, "Show password")!!
        Require(
            window.PerformAccessibilityAction(reveal.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Reveal button did not activate"
        )
        PumpFrames(window, 5)
        Require(
            !host.PasswordEntry!!.Password && FindSemantics(semantics.Tree?.Root, "Hide password") != nil,
            "Reveal did not expose text and keep its named toggle"
        )
        let hide = FindSemantics(semantics.Tree?.Root, "Hide password")!!
        window.PerformAccessibilityAction(hide.Id, AccessibilityActionRequest(AccessibilityAction.Activate))
        PumpFrames(window, 5)
        Require(host.PasswordEntry!!.Password, "Hide did not restore masking")
        Require(host.Text == "secret", "Soft count limit discarded input")
        host.PasswordHandle.Focus()
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 4)
        Require(host.TextCommit == "secret", "TextField did not commit on Enter")
        host.TextCommit = nil
        host.NumberHandle.Focus()
        PumpFrames(window, 4)
        Require(host.TextCommit == "secret", "TextField did not commit on blur")
        for width in[]int32{320, 700, 2560} {
            window.UiScale = 1.5F
            window.Width = width
            PumpFrames(window, 5)
            for handle in[]ElementHandle{host.NumberHandle, host.PasswordHandle} {
                let bounds = handle.BorderBox
                Require(
                    bounds.X >= 0 && bounds.Width > 0
                    && bounds.X + bounds.Width <= float64(width) / 1.5 + 1,
                    "Field content did not fit the scaled viewport"
                )
            }
        }
        window.UiScale = 1
        window.Width = 500
        PumpFrames(window, 5)
        let clear = FindSemantics(semantics.Tree?.Root, "Clear Password")!!
        window.PerformAccessibilityAction(clear.Id, AccessibilityActionRequest(AccessibilityAction.Activate))
        PumpFrames(window, 5)
        Require(
            host.Text == "" && host.PasswordEntry!!.Value == ""
            && FindSemantics(semantics.Tree?.Root, "Clear Password") == nil,
            "Clear did not update controlled text"
        )
        let numeric = FindSemantics(semantics.Tree?.Root, "Quantity")!!
        Require(
            !window.PerformAccessibilityAction(numeric.Id, AccessibilityActionRequest.SetValue("invalid")),
            "Invalid accessibility input was accepted"
        )
        PumpFrames(window, 5)
        Require(
            host.Entry!!.Value == "invalid" && host.Entry!!.Accessibility!!.Invalid == true,
            "Invalid accessibility draft was discarded"
        )
        Require(
            window.PerformAccessibilityAction(numeric.Id, AccessibilityActionRequest.SetValue("2")),
            "Valid accessibility input was rejected"
        )
        PumpFrames(window, 5)
        Require(host.Number == 2, "Accessibility input did not commit")
        host.Text = "Read only"
        host.ReadOnly = true
        host.Rebuild()
        PumpFrames(window, 5)
        Require(FindSemantics(semantics.Tree?.Root, "Clear Password") == nil, "Read-only field exposed a clear button")
        host.ReadOnly = false
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 5)
        Require(!host.NumberHandle.Focus(), "Disabled NumberInput accepted focus")
        Require(FindSemantics(semantics.Tree?.Root, "Clear Password") == nil, "Disabled field exposed a clear button")
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    FieldCultureContract()
    AddonFramePixels()
    FieldGalleryProof()
    Console.WriteLine("PASS: field keys, draft commits, clamp, controlled edits, clear, reveal and form semantics")
}

func FieldCultureContract() {
    let previous = CultureInfo.CurrentCulture
    CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("de-DE")
    let host = FieldHost()
    let root = ApplicationRoot(host)
    let window = Window{Root: root, Width: 500, Height: 400}
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 8)
        host.NumberHandle.Focus()
        let id = OnlyNativeWindow()
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorType(window, id, "2,5")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(host.Number == 2.5 && host.Entry!!.Value == "2,5", "Number input ignored the current culture")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorType(window, id, "invalid")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 5)
        Require(
            host.Number == 2.5 && host.Entry!!.Value == "invalid" && host.Entry!!.Accessibility!!.Invalid == true,
            "Invalid numeric draft was committed or discarded"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
        CultureInfo.CurrentCulture = previous
    }
}

func FieldGalleryProof() {
    for mode in[]ThemeMode{ThemeMode.Light, ThemeMode.Dark} {
        for title in[]string{"Text field", "Number input", "Form field"} {
            let registry = CreateRegistry()
            let gallery = Gallery(registry, registry.IndexOf(title))
            let window = Window{Root: gallery, Width: 1100, Height: 800, Title: title}
            gallery.AttachWindow(window)
            Theme.SetMode(window, mode)
            window.Open()
            try {
                PumpFrames(window, 15)
                CaptureIssueProof(
                    window,
                    "gallery-" + title.ToLowerInvariant().Replace(" ", "-")
                    + "-" + mode.ToString().ToLowerInvariant()
                )
            } finally {
                window.RequestClose()
                PumpFrames(window, 3)
            }
        }
    }
}

internal class AddonFrameHost : Cell {
    internal var Invalid bool
    internal let Frame ElementHandle = ElementHandle()
    internal let Other ElementHandle = ElementHandle()
    internal let SearchFrame ElementHandle = ElementHandle()
    internal let Leading ElementHandle = ElementHandle()
    internal let Trailing ElementHandle = ElementHandle()

    public override func Build() Blob {
        let leading = MaterialIcons.Create("search", 16, Theme.Read().MutedTextColor)
        leading.Handle = Leading
        let trailing = MaterialIcons.Create("close", 16, Theme.Read().MutedTextColor)
        trailing.Handle = Trailing
        return Container{
            Width: Percent(100),
            Height: Percent(100),
            Padding: 20,
            Gap: 16,
            Container{
                Handle: Frame,
                Width: 280,
                Height: 48,
                TextField{
                    Value: "team",
                    AccessibilityName: "Addon field",
                    Width: Percent(100),
                    EntryHeight: 48,
                    BorderWidth: 4,
                    BorderRadius: 12,
                    Invalid: Invalid,
                    PrefixAddon: Text{Content: "https://"},
                    SuffixAddon: Text{Content: ".dev"},
                }.Build(),
            },
            Container{
                Handle: SearchFrame,
                Width: 280,
                Height: 48,
                TextField{
                    Value: "Search widgets",
                    AccessibilityName: "Search",
                    Width: Percent(100),
                    EntryHeight: 48,
                    Leading: leading,
                    Trailing: trailing,
                }.Build(),
            },
            Button{Handle: Other, Width: 60, Height: 24},
        }
    }
}

func AddonFramePixels() {
    let host = AddonFrameHost()
    let semantics = SearchListSemantics()
    let window = Window{Root: host, Width: 360, Height: 240, AccessibilityAdapter: semantics}.Open()
    try {
        for palette in[]Theme{Theme.Bone, Theme.Ink} {
            Theme.Attach(window, palette)
            for invalid in[]bool{false, true} {
                host.Invalid = invalid
                host.Rebuild()
                PumpFrames(window, 6)
                for focused in[]bool{false, true} {
                    if focused {
                        window.PerformAccessibilityAction(
                            FindSemantics(semantics.Tree?.Root, "Addon field")!!.Id,
                            AccessibilityActionRequest(AccessibilityAction.Focus)
                        )
                    } else {
                        host.Other.Focus()
                    }
                    PumpFrames(window, 4)
                    Require(
                        FindSemantics(semantics.Tree?.Root, "Addon field")!!.Focused == focused,
                        "Addon border check did not reach the requested focus state"
                    )
                    let box = host.Frame.BorderBox
                    let image = ThemeCapture(window)
                    let border = invalid ? palette.DangerColor: palette.InputBorderColor
                    for offset in[]Point{
                        Point{X: 24, Y: 1},
                        Point{X: box.Width - 24, Y: 1},
                        Point{X: 24, Y: box.Height - 2},
                        Point{X: box.Width - 24, Y: box.Height - 2},
                        Point{X: 5, Y: 5},
                        Point{X: box.Width - 6, Y: 5},
                        Point{X: 5, Y: box.Height - 6},
                        Point{X: box.Width - 6, Y: box.Height - 6},
                    } {
                        Require(
                            ThemePixel(image, int32(box.X + offset.X), int32(box.Y + offset.Y), border),
                            "TextField addon covered its frame border or rounded corner"
                        )
                    }
                    Require(
                        ThemePixel(image, int32(box.X), int32(box.Y), palette.CanvasColor),
                        "TextField addon painted outside its rounded corner"
                    )
                }
            }
            let search = host.SearchFrame.BorderBox
            let leading = host.Leading.BorderBox
            let trailing = host.Trailing.BorderBox
            CaptureIssueProof(
                window,
                "textfield-leading-" + (palette.CanvasColor == Theme.Bone.CanvasColor ? "light": "dark")
            )
            Require(
                Math.Abs(leading.X - search.X - 13) < 0.1
                && Math.Abs(search.X + search.Width - trailing.X - trailing.Width - 13) < 0.1
                && leading.Width == 16 && trailing.Width == 16,
                "TextField adornment slots lost their horizontal inset or fixed width"
            )
        }
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    Console.WriteLine("PASS: addon frame pixels in light, dark, focused and invalid fields")
}
