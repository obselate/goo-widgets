package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Layout
import Hexa.NET.SDL3

internal class DisclosureChild : Cell, IDisposable {
    internal var Count int32
    internal var Disposals int32
    internal let Handle ElementHandle = ElementHandle{}
    internal var Button Button?

    public override func Build() Blob {
        let button = Goo
            .Button{
            Handle: Handle,
            Height: 40,
            OnClick: () -> {
                Count++
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Retained child"},
            Text{Content: "Retained counter: " + Count.ToString()},
        }
        Button = button
        return button
    }

    public func Dispose() {
        Disposals++
    }
}

internal class DisclosureHost : Cell {
    internal var Expanded bool = true
    internal var Disabled bool
    internal var Show bool = true
    internal var Changes int32
    internal var Mounts int32
    internal var Child DisclosureChild?
    internal var Header Button?
    internal let HeaderHandle ElementHandle = ElementHandle{}

    func MakeIndicator(props Disclosure) Blob -> Text{
        Content: if props.Expanded {
            "−"
        } else {
            "+"
        }
    }

    func MakeBody(props Disclosure, body Container) Container {
        body.BorderColor = Color.Parse("#25634d")
        body.BorderWidth = 1
        return body
    }

    func MakeRoot(props Disclosure, header Button, body Container) Container -> Container{
        Width: props.Width!!,
        BorderRadius: 8,
        BorderWidth: 1,
        BorderColor: "#28765c",
        BackgroundColor: "#102822",
        header,
        body,
    }

    public override func Build() Blob {
        if !Show {
            return Container{}
        }
        let section = Disclosure{
            Label: "Connection details",
            Expanded: Expanded,
            Disabled: Disabled,
            ShowFocusHighlight: true,
            HeaderPadding: 0.0,
            Content: Cell.Mount[DisclosureChild](
                "child",
                (child DisclosureChild) -> {
                    if Child != child {
                        Mounts++
                    }
                    Child = child
                }
            ),
            OnExpandedChange: (expanded bool) -> {
                Expanded = expanded
                Changes++
                Rebuild()
            },
            CreateIndicator: MakeIndicator,
            CreateHeader: (headerProps Disclosure, header Button) -> {
                Require(
                    headerProps.HeaderPadding == 0.0 && headerProps.BackgroundColor != nil,
                    "Disclosure header factory did not receive resolved props or preserve explicit zero."
                )
                header.Handle = HeaderHandle
                Header = header
                return header
            },
            CreateContent: MakeBody,
            CreateRoot: MakeRoot,
        }
        return Container{
            Padding: 24,
            BackgroundColor: "#09090b",
            Color: "#fafafa",
            Gap: 16,
            Text{Content: "Disclosure · retained content", FontSize: 22},
            section.Build(),
            Text{Content: "Pointer, Enter, and Space share the controlled expanded state.", Color: "#a1a1aa"}
        }
    }
}

func DisclosureInteractions() {
    let host = DisclosureHost{}
    let semantics = SearchListSemantics{}
    let window = Window{Title: "Disclosure interaction verification", Width: 580, Height: 340, Root: host}
    window.AccessibilityAdapter = semantics
    window.Open()
    try {
        PumpFrames(window, 12)
        let child = host.Child!!
        let childId = FindSemantics(semantics.Tree?.Root, "Retained child")!!.Id
        let native = OnlyNativeWindow()
        ClickNativeButton(window, native, child.Button!!)
        Require(child.Count == 1 && host.Mounts == 1, "Disclosure child did not mount and handle input.")
        CaptureIssueProof(window, "Disclosure-expanded")
        ClickNativeButton(window, native, host.Header!!)
        Require(!host.Expanded && host.Changes == 1, "Disclosure pointer activation did not request collapse.")
        Require(host.Header!!.Accessibility?.Expanded == false, "Disclosure header did not expose collapsed semantics.")
        Require(
            child.Handle.IsMounted && child.Disposals == 0 && !child.Handle.Focus(),
            "Collapsed content must stay mounted while rejecting focus."
        )
        Require(
            FindSemantics(semantics.Tree?.Root, "Retained child") == nil
            && !window.PerformAccessibilityAction(childId, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Collapsed content remained accessible or activatable."
        )
        CaptureIssueProof(window, "Disclosure-collapsed")
        Require(host.HeaderHandle.Focus(), "Disclosure header cannot receive focus.")
        SendKey(native, SDLScancode.Return)
        PumpFrames(window, 4)
        Require(
            host.Expanded && host.Changes == 2 && host.Child == child && child.Count == 1 && host.Mounts == 1,
            "Enter did not reopen the same mounted child state."
        )
        SendKey(native, SDLScancode.Space)
        PumpFrames(window, 4)
        Require(!host.Expanded && host.Changes == 3, "Space did not toggle the focused header.")
        SendKey(native, SDLScancode.Space)
        PumpFrames(window, 4)
        Require(host.Expanded && host.Changes == 4 && child.Count == 1, "Reopening lost child state.")
        CaptureIssueProof(window, "Disclosure-reopened")
        host.Disabled = true
        host.Rebuild()
        PumpFrames(window, 4)
        ClickNativeButton(window, native, host.Header!!)
        let headerId = FindSemantics(semantics.Tree?.Root, "Connection details")!!.Id
        Require(
            host.Expanded && host.Changes == 4 && !host.HeaderHandle.Focus()
            && !window.PerformAccessibilityAction(headerId, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Disabled disclosure accepted activation or focus."
        )
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 4)
        Require(
            child.Disposals == 1 && !child.Handle.IsMounted,
            "Removing disclosure did not dispose its child exactly once."
        )
        Console.WriteLine(
            "PASS: Disclosure pointer/Enter/Space, disabled input, hidden accessibility, retained child state, factories, unmount disposal."
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 3)
    }
    Require(!window.IsOpen, "Disclosure verification window did not close.")
}
