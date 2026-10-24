package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class ChoiceHost : Cell {
    internal var Radio string = "one"
    internal var Single[]string = []string{"one"}
    internal var Multiple[]string = []string{"one"}
    internal var Busy bool
    internal var Pressed bool
    internal var Clicks int32
    internal var Check AccessibilityChecked
    internal var ActionHandle ElementHandle = ElementHandle()
    internal var RadioRoot Container?
    internal var SingleRoot Container?
    internal var MultiRoot Container?

    public override func Build() Blob {
        let action = ActionButton{
            Content: "Save changes",
            Leading: Text{Content: "+"},
            Trailing: Text{Content: ">"},
            Shortcut: "Ctrl S",
            Loading: Busy,
            Pressed: Pressed,
            OnClick: () -> {
                Clicks++
                Pressed = !Pressed
                Rebuild()
            },
        }.Build()
        ActionHandle = action.Handle ?? ActionHandle
        action.Handle = ActionHandle
        return Container{
            Padding: 24,
            Gap: 16,
            BasedOn: Theme.Read().CanvasStyle,
            Cell.Mount[RadioGroupInput, RadioGroup](
                "radio",
                RadioGroupInput{
                    AccessibilityName: "Radio choices",
                    SelectedId: Radio,
                    Card: true,
                    OnSelect: (id string) -> {
                        Radio = id
                        Rebuild()
                    },
                    Items: []RadioOption{
                        RadioOption{Id: "one", Label: "Radio one", Description: "First choice"},
                        RadioOption{Id: "locked", Label: "Radio locked", Disabled: true},
                        RadioOption{Id: "three", Label: "Radio three"},
                    },
                    CreateRoot: (input RadioGroupInput, root Container) -> {
                        RadioRoot = root
                        return root
                    },
                }
            ),
            Cell.Mount[ToggleGroupInput, ToggleGroup](
                "single",
                ToggleGroupInput{
                    AccessibilityName: "Single choices",
                    SelectedIds: Single,
                    OnChange: (ids[]string) -> {
                        Single = ids
                        Rebuild()
                    },
                    Items: []ToggleOption{
                        ToggleOption{Id: "one", Label: "Single one"},
                        ToggleOption{Id: "locked", Label: "Single locked", Disabled: true},
                        ToggleOption{Id: "three", Label: "Single three"},
                    },
                    CreateRoot: (input ToggleGroupInput, root Container) -> {
                        SingleRoot = root
                        return root
                    },
                }
            ),
            Cell.Mount[ToggleGroupInput, ToggleGroup](
                "multiple",
                ToggleGroupInput{
                    AccessibilityName: "Multiple choices",
                    Multiple: true,
                    SelectedIds: Multiple,
                    Look: ToggleGroupLook.Toolbar,
                    OnChange: (ids[]string) -> {
                        Multiple = ids
                        Rebuild()
                    },
                    Items: []ToggleOption{
                        ToggleOption{Id: "one", Label: "Multiple one"},
                        ToggleOption{Id: "locked", Label: "Multiple locked", Disabled: true},
                        ToggleOption{Id: "three", Label: "Multiple three"},
                    },
                    CreateRoot: (input ToggleGroupInput, root Container) -> {
                        MultiRoot = root
                        return root
                    },
                }
            ),
            Checkbox{
                Label: "Checkbox card",
                Description: "Retains checkbox semantics",
                Card: true,
                State: Check,
                OnChange: (state AccessibilityChecked) -> {
                    Check = state
                    Rebuild()
                }
            }.Build(),
            action,
        }
    }
}

func ChoiceKey(window Window, key SDLScancode) {
    SendKey(OnlyNativeWindow(), key)
    PumpFrames(window, 6)
}

func OneTabStop(root Container) bool {
    var stops = 0
    for child in root.Children {
        if child.TabStop {
            stops++
        }
    }
    return stops == 1
}

func ChoiceInteractions() {
    let host = ChoiceHost()
    let root = ApplicationRoot(host)
    let adapter = SearchListSemantics()
    let window = Window{
        Title: "Buttons and choices",
        Width: 620,
        Height: 660,
        Root: root,
        AccessibilityAdapter: adapter
    }
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 20)
        Require(
            FeedbackNode(adapter, AccessibilityRole.Group, "Radio choices").Role == AccessibilityRole.Group,
            "Radio group role missing"
        )
        Require(
            FeedbackNode(adapter, AccessibilityRole.Radio, "Radio one").Checked == AccessibilityChecked.True,
            "Selected radio state missing"
        )
        Require(
            OneTabStop(host.RadioRoot!!) && OneTabStop(host.SingleRoot!!) && OneTabStop(host.MultiRoot!!),
            "Choices do not expose one tab stop per group"
        )
        for palette in[]Theme{Theme.Bone, Theme.Ink} {
            Theme.Attach(window, palette)
            PumpFrames(window, 12)
            let button = (host.SingleRoot!!.Children[0] as Button)!!
            let bounds = button.Handle!!.BorderBox
            let image = ThemeCapture(window)
            Require(
                ThemePixel(image, int32(bounds.X), int32(bounds.Y + bounds.Height / 2), palette.StrongBorderColor)
                && ThemePixel(image, int32(bounds.X + bounds.Width / 2), int32(bounds.Y + 3), palette.PanelColor),
                "Selected segment lost its surface or contrasting boundary"
            )
        }
        ChoiceKey(window, SDLScancode.Tab)
        Require(FeedbackNode(adapter, AccessibilityRole.Radio, "Radio one").Focused, "Tab did not enter selected radio")
        ChoiceKey(window, SDLScancode.Down)
        Require(
            host.Radio == "three" && FeedbackNode(adapter, AccessibilityRole.Radio, "Radio three").Focused,
            "Radio arrow did not skip disabled choice and select"
        )
        ChoiceKey(window, SDLScancode.Down)
        Require(host.Radio == "one", "Radio arrows did not wrap")
        ChoiceKey(window, SDLScancode.End)
        Require(host.Radio == "three", "Radio End did not select last")
        ChoiceKey(window, SDLScancode.Home)
        ChoiceKey(window, SDLScancode.Space)
        ChoiceKey(window, SDLScancode.Return)
        Require(host.Radio == "one", "Radio Home or activation changed the wrong choice")
        ChoiceKey(window, SDLScancode.Tab)
        ChoiceKey(window, SDLScancode.Right)
        Require(host.Single.Length == 1 && host.Single[0] == "three", "Single toggle arrow did not select")
        Require(
            FeedbackNode(adapter, AccessibilityRole.Button, "Single three").Checked == AccessibilityChecked.True,
            "Single toggle checked state missing"
        )
        ChoiceKey(window, SDLScancode.Home)
        Require(host.Single[0] == "one", "Single toggle Home failed")
        ChoiceKey(window, SDLScancode.End)
        Require(host.Single[0] == "three", "Single toggle End failed")
        ChoiceKey(window, SDLScancode.Tab)
        ChoiceKey(window, SDLScancode.Right)
        Require(host.Multiple.Length == 1 && host.Multiple[0] == "one", "Multiple toggle arrow changed selection")
        Require(
            FeedbackNode(adapter, AccessibilityRole.Button, "Multiple three").Focused,
            "Multiple arrow did not move focus"
        )
        ChoiceKey(window, SDLScancode.Space)
        Require(
            host.Multiple.Length == 2 && FeedbackNode(
                adapter,
                AccessibilityRole.Button,
                "Multiple three"
            ).Checked == AccessibilityChecked.True,
            "Space did not add a multiple choice"
        )
        ChoiceKey(window, SDLScancode.Return)
        Require(host.Multiple.Length == 1, "Enter did not remove a multiple choice")
        ChoiceKey(window, SDLScancode.Home)
        Require(
            FeedbackNode(adapter, AccessibilityRole.Button, "Multiple one").Focused && OneTabStop(host.MultiRoot!!),
            "Multiple Home lost roving focus"
        )
        ChoiceKey(window, SDLScancode.Tab)
        ChoiceKey(window, SDLScancode.Space)
        Require(
            FeedbackNode(adapter, AccessibilityRole.Checkbox, "Checkbox card").Checked == AccessibilityChecked.True,
            "Checkbox card lost checkbox semantics"
        )
        ChoiceKey(window, SDLScancode.Tab)
        ChoiceKey(window, SDLScancode.Return)
        Require(
            host.Clicks == 1 && FeedbackNode(
                adapter,
                AccessibilityRole.Button,
                "Save changes"
            ).Checked == AccessibilityChecked.True,
            "Action pressed state did not follow activation"
        )
        let width = host.ActionHandle.BorderBox.Width
        host.Busy = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(Math.Abs(width - host.ActionHandle.BorderBox.Width) < 0.1, "Loading changed button width")
        Require(
            FeedbackNode(adapter, AccessibilityRole.Button, "Save changes").Busy == true,
            "Loading busy state missing"
        )
        ChoiceKey(window, SDLScancode.Return)
        ChoiceKey(window, SDLScancode.Space)
        CompositeClick(window, host.ActionHandle)
        Require(host.Clicks == 1, "Busy action accepted input")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    if !String.IsNullOrEmpty(Environment.GetEnvironmentVariable("GOO_WIDGETS_PROOF_DIR")) {
        for page in[]string{"ActionButton", "Radio group", "Toggle group"} {
            for dark in[]bool{false, true} {
                for size in 0 ... 3 {
                    let width = size == 1 ? 900: size == 2 ? 2560: 1100
                    let height = size == 1 ? 720: size == 2 ? 1440: 800
                    let registry = CreateRegistry()
                    let gallery = Gallery(registry, registry.IndexOf(page))
                    let semantics = SearchListSemantics()
                    let proof = Window{
                        Title: page,
                        Width: width,
                        Height: height,
                        Root: gallery,
                        AccessibilityAdapter: semantics,
                    }
                    gallery.AttachWindow(proof)
                    Theme.SetMode(proof, dark ? ThemeMode.Dark: ThemeMode.Light)
                    if size == 2 {
                        Theme.Attach(proof, Theme.Read(proof).WithTextScale(1.5))
                    }
                    proof.Open()
                    try {
                        PumpFrames(proof, 20)
                        let nodes = List[AccessibilityNode]()
                        for role in[]AccessibilityRole{
                            AccessibilityRole.Text,
                            AccessibilityRole.Button,
                            AccessibilityRole.Radio,
                            AccessibilityRole.Checkbox,
                        } {
                            FeedbackNodes(semantics.Tree?.Root, role, "", nodes)
                        }
                        for node in nodes {
                            let bounds = node.Bounds
                            Require(
                                bounds.X >= 0 && bounds.Y >= 0 && bounds.X + bounds.Width <= width + 1
                                && bounds.Y + bounds.Height <= height + 1,
                                "Gallery content did not fit: " + page
                            )
                        }
                        CaptureIssueProof(
                            proof,
                            page.Replace(' ', '-') + (dark ? "-dark": "-light")
                            + (size == 0 ? "": size == 1 ? "-compact": "-150pct")
                        )
                    } finally {
                        proof.RequestClose()
                        PumpFrames(proof, 5)
                    }
                }
            }
        }
    }
    Console.WriteLine("PASS: native buttons, radio cards, checkbox cards and single/multiple roving choices")
}
