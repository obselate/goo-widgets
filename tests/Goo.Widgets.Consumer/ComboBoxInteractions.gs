package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Inputs
import Hexa.NET.SDL3
import System
import System.Collections.Generic
import System.Runtime.InteropServices

internal class ComboBoxProbe : ComboBox {
    internal func Render(input ComboBoxInput) Blob -> base.Build(input)
}

func ComboBoxContracts() {
    using let probe = ComboBoxProbe()
    var rejected bool
    try {
        probe.Render(ComboBoxInput{Items: []ComboBoxOption{ComboBoxOption{Id: "a"}, ComboBoxOption{Id: "a"}}})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "ComboBox accepted duplicate IDs")
    rejected = false
    try {
        probe.Render(ComboBoxInput{Width: Double.NaN})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "ComboBox accepted a nonfinite width")
    let root = (probe.Render(ComboBoxInput{Disabled: true, Placeholder: "Pick a target"}) as Container)!!
    let trigger = (root.Children[0] as Button)!!
    Require(
        trigger.Disabled &&
            trigger.Accessibility!!.Role == AccessibilityRole.ComboBox &&
            trigger.Accessibility!!.Value == "Pick a target",
        "ComboBox lost disabled placeholder/role semantics"
    )
}

internal class ComboBoxHost : Cell {
    internal let Overlay ElementHandle = ElementHandle()
    internal let Before ElementHandle = ElementHandle()
    internal var Trigger Button?
    internal var Search TextEntry?
    internal var Panel Container?
    internal let Rows Dictionary[string, Container] = Dictionary[string, Container]()
    internal var IsOpen bool
    internal var Selected string = "beta"
    internal var Commits int32
    internal var Large bool
    internal var Searchable bool
    internal var Disabled bool
    internal var Empty bool
    internal var Show bool = true
    internal var Query string = ""
    internal var BackgroundClicks int32
    private func Open(value bool) {
        IsOpen = value
        Rebuild()
    }

    private func Select(value string) {
        Selected = value
        Commits++
        Rebuild()
    }

    private func QueryChanged(value string) {
        Query = value
        Rebuild()
    }

    private func CaptureTrigger(input ComboBoxInput, prepared Button) Button {
        Trigger = prepared
        return prepared
    }

    private func CaptureSearch(input ComboBoxInput, prepared TextEntry) TextEntry {
        Search = prepared
        return prepared
    }

    private func CapturePanel(input ComboBoxInput, prepared Container) Container {
        Panel = prepared
        return prepared
    }

    private func CaptureRow(input ComboBoxInput, item ComboBoxOption, prepared Container) Container {
        Rows[item.Id!!] = prepared
        return prepared
    }

    private func Options()[]ComboBoxOption {
        if Empty {
            return []ComboBoxOption{}
        }
        if !Large {
            return []ComboBoxOption{
                ComboBoxOption{Id: "alpha", Label: "Alpha"},
                ComboBoxOption{Id: "locked", Label: "Locked", Disabled: true},
                ComboBoxOption{Id: "beta", Label: "Beta"},
                ComboBoxOption{Id: "gamma", Label: "Gamma", Content: Text{Content: "Gamma · custom", Color: "#86efac"}}
            }
        }
        let items = [1500]ComboBoxOption
        for index in 0 ... items.Length {
            items[index] = ComboBoxOption{
                Id: "item-" + index.ToString(),
                Label: "Option " + index.ToString("D4"),
                Disabled: index % 100 == 0
            }
        }
        return items
    }

    public override func Build() Blob {
        let root = Container{
            Handle: Overlay,
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 24.0,
            Gap: 16.0,
            BackgroundColor: "#111318",
            Color: "#fafafa",
            Text{Key: "title", Content: "ComboBox · controlled selection", FontSize: 24.0, FontWeight: 700},
            Text{
                Key: "hint",
                Content: "Open, navigate, cancel or commit. Search narrows 1,500 virtual options.",
                Color: "#a1a1aa"
            },
            Button{
                Key: "before",
                Handle: Before,
                Height: 36.0,
                Width: 160.0,
                BackgroundColor: "#27272a",
                OnClick: () -> {
                    BackgroundClicks++
                },
                Text{Content: "Background action"}
            }
        }
        if Show {
            root.Children.Add(
                Cell.Mount[ComboBoxInput, ComboBox](
                    "combo",
                    ComboBoxInput{
                        OverlayHost: Overlay,
                        Width: 320.0,
                        PopupHeight: 250.0,
                        SelectedId: Selected,
                        OnSelect: Select,
                        Items: Options(),
                        Open: IsOpen,
                        OnOpenChange: Open,
                        Query: Query,
                        OnQueryChange: QueryChanged,
                        Searchable: Searchable,
                        Disabled: Disabled,
                        AccessibilityName: "Target selector",
                        CreateTrigger: CaptureTrigger,
                        CreateRow: CaptureRow,
                        CreateSearch: CaptureSearch,
                        CreatePopup: CapturePanel,
                    }
                )
            )
        }
        return root
    }
}

func SelectorFindRole(node AccessibilityNode?, role AccessibilityRole) AccessibilityNode? {
    guard let node = node else {
        return nil
    }
    if node.Role == role {
        return node
    }
    for child in node.Children {
        if let found = SelectorFindRole(child, role) {
            return found
        }
    }
    return nil
}

func SelectorCountRole(node AccessibilityNode?, role AccessibilityRole) int32 {
    guard let node = node else {
        return 0
    }
    var count = node.Role == role ? 1: 0
    for child in node.Children {
        count += SelectorCountRole(child, role)
    }
    return count
}

@StructLayout(LayoutKind.Sequential, Size: 128)
internal struct SelectorTextEvent {
    public var Type uint32
    public var Reserved uint32
    public var Timestamp uint64
    public var WindowID uint32
    public var Text nint
}

@DllImport("SDL3", EntryPoint: "SDL_PushEvent", CallingConvention: CallingConvention.Cdecl)
func SelectorPushText(ref event SelectorTextEvent) uint8;

unsafe func SelectorType(window Window, id uint32, text string) {
    Require(
        Marshal.OffsetOf[SelectorTextEvent]("Text") == Marshal.OffsetOf[SDLTextInputEvent]("Text"),
        "SDL text layout differs"
    )
    let storage = Marshal.StringToCoTaskMemUTF8(text)
    try {
        var event = SelectorTextEvent{Type: uint32(SDLEventType.TextInput), WindowID: id, Text: storage}
        Require(SelectorPushText(&event) != uint8(0), "SDL rejected text input")
        PumpFrames(window, 12)
    } finally {
        Marshal.FreeCoTaskMem(storage)
    }
}

func ComboActive(adapter SearchListSemantics, name string) bool {
    let option = FindSemantics(adapter.Tree?.Root, name)
    let entry = FindSemantics(adapter.Tree?.Root, "Search options")
    let list = SelectorFindRole(adapter.Tree?.Root, AccessibilityRole.List)
    return option != nil &&
        ((entry?.Relationships.ActiveDescendant == option.Id) || (list?.Relationships.ActiveDescendant == option.Id))
}

func ComboBoxInteractions() {
    ComboBoxContracts()
    let host = ComboBoxHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "ComboBox verification",
        Width: 720,
        Height: 520,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 14)
        let id = OnlyNativeWindow()
        CompositeClick(window, host.Trigger!!.Handle!!)
        PumpFrames(window, 14)
        Require(host.IsOpen && ComboActive(semantics, "Beta"), "ComboBox failed to reveal its selected option")
        Require(FindSemantics(semantics.Tree?.Root, "Beta")!!.Selected == true, "Selected option semantics missing")
        SendKey(id, SDLScancode.Up)
        PumpFrames(window, 7)
        Require(
            ComboActive(semantics, "Alpha") && host.Selected == "beta",
            "Arrow navigation selected or failed to skip a disabled option"
        )
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 10)
        Require(
            !host.IsOpen && host.Commits == 0 && OverlayFocus(semantics, "Target selector"),
            "ComboBox cancellation changed selection or lost focus"
        )
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 12)
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 7)
        Require(ComboActive(semantics, "Gamma"), "ComboBox End failed")
        CaptureIssueProof(window, "combobox-fixed")
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 10)
        Require(
            !host.IsOpen && host.Selected == "gamma" && host.Commits == 1 && OverlayFocus(semantics, "Target selector"),
            "ComboBox commit/restore failed"
        )
        CompositeClick(window, host.Trigger!!.Handle!!)
        PumpFrames(window, 12)
        Require(
            !window.PerformAccessibilityAction(
                FindSemantics(semantics.Tree?.Root, "Locked")!!.Id,
                AccessibilityActionRequest(AccessibilityAction.Select)
            ),
            "Disabled option accepted an accessibility selection"
        )
        MouseButton(id, 10.0F, 10.0F, true)
        MouseButton(id, 10.0F, 10.0F, false)
        PumpFrames(window, 9)
        Require(!host.IsOpen && host.BackgroundClicks == 0, "ComboBox outside click escaped its overlay")
        host.Large = true
        host.Searchable = true
        host.Selected = "item-1201"
        host.Rebuild()
        PumpFrames(window, 9)
        CompositeClick(window, host.Trigger!!.Handle!!)
        PumpFrames(window, 18)
        Require(
            ComboActive(semantics, "Option 1201") && (host.Search?.Handle?.IsMounted ?? false),
            "Long searchable list did not reveal its selected option"
        )
        Require(
            SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.ListItem) < 30,
            "ComboBox realized its full long list"
        )
        CaptureIssueProof(window, "combobox-virtual")
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 12)
        Require(ComboActive(semantics, "Option 1499"), "ComboBox End failed across unmounted options")
        SelectorType(window, id, "Option 0042")
        PumpFrames(window, 14)
        Require(
            SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.ListItem) == 1 &&
                ComboActive(semantics, "Option 0042"),
            "Controlled search failed to update active options"
        )
        host.Query = "Option 0043"
        host.Rebuild()
        PumpFrames(window, 9)
        Require(
            FindSemantics(semantics.Tree?.Root, "Search options")!!.Value == "Option 0043" &&
                ComboActive(semantics, "Option 0043"),
            "External query failed to replace the focused search buffer"
        )
        host.Query = "Option 0042"
        host.Rebuild()
        PumpFrames(window, 9)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 12)
        Require(host.Selected == "item-42" && !host.IsOpen && host.Commits == 2, "Search selection failed")
        host.Query = "nothing matches"
        host.Rebuild()
        PumpFrames(window, 7)
        CompositeClick(window, host.Trigger!!.Handle!!)
        PumpFrames(window, 12)
        SendKey(id, SDLScancode.Down)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 7)
        Require(host.IsOpen && host.Commits == 2, "Empty search committed a nonexistent option")
        CaptureIssueProof(window, "combobox-empty")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(!host.Trigger!!.Handle!!.Focus(), "Disabled ComboBox remained focusable")
        host.Disabled = false
        host.Query = ""
        host.Rebuild()
        PumpFrames(window, 8)
        CompositeClick(window, host.Trigger!!.Handle!!)
        PumpFrames(window, 12)
        window.Width = 370
        PumpFrames(window, 14)
        let panel = host.Panel!!.Handle!!.BorderBox
        Require(panel.X >= 7.5 && panel.X + panel.Width <= 362.5, "ComboBox popup escaped resized overlay bounds")
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(host.Before.Focus(), "Unmounting ComboBox left a focus scope behind")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: native ComboBox controlled/disabled/custom options, keyboard commit/cancel, focus restoration, long-list reveal, search, empty input, resize and unmount"
    )
}
