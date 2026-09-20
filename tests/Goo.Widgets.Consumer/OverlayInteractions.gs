package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Layout
import Goo.Widgets.Navigation
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class PopoverProbe : Popover {
    internal func Render(input PopoverInput) Blob -> base.Build(input)
}

internal class MenuProbe : Menu {
    internal func Render(input MenuInput) Blob -> base.Build(input)
}

func OverlayContracts() {
    let probe = PopoverProbe()
    try {
        var rejected bool
        try {
            probe.Render(PopoverInput{Open: true})
        } catch (error ArgumentException) {
            rejected = true
        }
        Require(rejected, "Popover accepted an open popup without an anchor or point")
        rejected = false
        try {
            probe.Render(PopoverInput{Open: true, WindowPoint: Point{}, Width: Double.NaN})
        } catch (error ArgumentException) {
            rejected = true
        }
        Require(rejected, "Popover accepted a nonfinite size")
        var activations int32
        let visual = (
            ModalDialog{
                Open: true,
                OnConfirm: () -> {
                    activations++
                },
                ConfirmDisabled: true,
                CreateConfirm: (input ModalDialog, content Blob) -> Button(){content}
            }.Build() as Container
        )!!
        let panel = (visual.Children[1] as Container)!!
        let actions = (panel.Children[panel.Children.Count - 1] as Container)!!
        let confirm = (actions.Children[1] as Button)!!
        confirm.OnClick?.Invoke()
        Require(confirm.Disabled && activations == 1, "Custom modal buttons lost action/disabled wiring")
    } finally {
        probe.Dispose()
    }
    let menu = MenuProbe()
    var rejected bool
    try {
        menu.Render(
            MenuInput{
                Items: []MenuItem{
                    MenuItem{Id: "same"},
                    MenuItem{Id: "parent", Children: []MenuItem{MenuItem{Id: "same"}}}
                }
            }
        )
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Menu accepted duplicate nested identities")
}

internal class OverlayHost : Cell {
    internal let Before ElementHandle = ElementHandle()
    internal let Anchor ElementHandle = ElementHandle()
    internal let Edit ElementHandle = ElementHandle()
    internal let Nested ElementHandle = ElementHandle()
    internal let PopupAction ElementHandle = ElementHandle()
    internal var DialogOpen bool
    internal var TopOpen bool
    internal var PopupOpen bool
    internal var MenuOpen bool
    internal var PointPopup bool
    internal var ShowAnchor bool = true
    internal var ShowDialogs bool = true
    internal var EmptyDialog bool
    internal var KeepMenu bool
    internal var AnchorX float64 = 590.0
    internal var AnchorY float64 = 430.0
    internal var BackgroundClicks int32
    internal var BackgroundKeys int32
    internal var Confirms int32
    internal var Dismisses int32
    internal var LastDismiss PopoverDismissReason
    internal var Activated string = ""
    internal var OuterRoot Container?
    internal var TopRoot Container?
    internal var PopupRoot Container?
    internal var PopupPanel Container?
    internal var OuterBackdrop Button?
    internal var ConfirmButton Button?
    internal var CancelButton Button?
    internal let MenuRows Dictionary[string, Button] = Dictionary[string, Button]()

    private func CloseOuter() {
        DialogOpen = false
        Rebuild()
    }

    private func CloseTop() {
        TopOpen = false
        Rebuild()
    }

    private func Confirm() {
        Confirms++
        DialogOpen = false
        Rebuild()
    }

    private func PopupDismiss(reason PopoverDismissReason) {
        LastDismiss = reason
        Dismisses++
        PopupOpen = false
        Rebuild()
    }

    private func MenuDismiss() {
        MenuOpen = false
        Rebuild()
    }

    private func MenuActivate(id string) {
        Activated = id
        Rebuild()
    }

    private func PanelRoot() Container -> Container{
        Position: PositionType.Absolute,
        Left: 0.0,
        Right: 0.0,
        Top: 0.0,
        Bottom: 0.0,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
    }

    private func Outer(input ModalDialog, backdrop Button, panel Container) Container {
        OuterBackdrop = backdrop
        backdrop.Handle = ElementHandle()
        let result = PanelRoot()
        OuterRoot = result
        return result
    }

    private func Top(input ModalDialog, backdrop Button, panel Container) Container {
        let result = PanelRoot()
        TopRoot = result
        return result
    }

    private func Cancel(input ModalDialog, content Blob) Button {
        let result = Button{
            Handle: ElementHandle(),
            Focusable: !EmptyDialog,
            Padding: 10.0,
            BackgroundColor: "#27272a",
            BorderRadius: 5.0,
            content
        }
        CancelButton = result
        return result
    }

    private func ConfirmFactory(input ModalDialog, content Blob) Button {
        let result = Button{
            Handle: ElementHandle(),
            Focusable: !EmptyDialog,
            Padding: 10.0,
            BackgroundColor: "#6366f1",
            BorderRadius: 5.0,
            content
        }
        ConfirmButton = result
        return result
    }

    private func CapturePanel(input PopoverInput, bounds ElementRect, content Blob) Container {
        let result = Container{
            Padding: 14.0,
            BackgroundColor: "#1e2130",
            BorderWidth: 1.0,
            BorderColor: "#6366f1",
            BorderRadius: 9.0
        }
        PopupPanel = result
        return result
    }

    private func CapturePopup(input PopoverInput, backdrop Container, panel Container) Container {
        let result = Container{Position: PositionType.Absolute, Left: 0.0, Right: 0.0, Top: 0.0, Bottom: 0.0}
        PopupRoot = result
        return result
    }

    private func MenuRow(input MenuInput, item MenuItem, prepared Button) Button {
        MenuRows[item.Id!!] = prepared
        return prepared
    }

    public override func Build() Blob {
        let root = Container{
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            BackgroundColor: "#111318",
            Padding: 24.0,
            Gap: 16.0,
            Color: "#fafafa",
            OnKeyDown: (event KeyEvent) -> {
                BackgroundKeys++
            },
            Text{Key: "title", Content: "Managed overlays", FontSize: 26.0, FontWeight: 700},
            Text{
                Key: "description",
                Content: "Nested dialogs · anchored popovers · accessible context menus",
                FontSize: 14.0,
                Color: "#a1a1aa"
            },
            Button{
                Key: "before",
                Handle: Before,
                Width: 180.0,
                Height: 38.0,
                BackgroundColor: "#27272a",
                BorderRadius: 6.0,
                OnClick: () -> {
                    BackgroundClicks++
                },
                Accessibility: Accessibility{Name: "Background action"},
                Text{Content: "Background action"}
            }
        }
        if ShowAnchor {
            root.Children.Add(
                Button{
                    Key: "anchor",
                    Handle: Anchor,
                    Position: PositionType.Absolute,
                    Left: AnchorX,
                    Top: AnchorY,
                    Width: 180.0,
                    Height: 38.0,
                    BackgroundColor: "#4f46e5",
                    BorderRadius: 6.0,
                    OnClick: () -> {
                        PopupOpen = true
                        Rebuild()
                    },
                    Accessibility: Accessibility{Name: "Open popup"},
                    Text{Content: "Open popup"}
                }
            )
        }
        if ShowDialogs {
            let content = if EmptyDialog {
                Blob(Text{Content: "No focusable children. Escape still closes this dialog."})
            } else {
                Container{
                    Gap: 12.0,
                    Text{Content: "Focus stays in this dialog until it closes.", Color: "#a1a1aa"},
                    TextEntry{
                        Handle: Edit,
                        Value: "Release notes",
                        Width: Length.Percent(100),
                        Height: 38.0,
                        Padding: 8.0,
                        BackgroundColor: "#09090b",
                        Accessibility: Accessibility{Name: "Dialog editor"}
                    },
                    Button{
                        Handle: Nested,
                        Height: 36.0,
                        BackgroundColor: "#312e81",
                        OnClick: () -> {
                            TopOpen = true
                            Rebuild()
                        },
                        Accessibility: Accessibility{Name: "Open nested dialog"},
                        Text{Content: "Open nested dialog"}
                    }
                }
            }
            root.Children.Add(
                Cell.Mount[ModalDialog, ModalDialogHost](
                    "outer",
                    ModalDialog{
                        Open: DialogOpen,
                        Header: Text{Content: "Review change", FontSize: 21.0, FontWeight: 700},
                        Content: content,
                        AccessibilityName: "Review change",
                        Width: 440.0,
                        OnClose: CloseOuter,
                        OnCancel: CloseOuter,
                        OnConfirm: Confirm,
                        CreateRoot: Outer,
                        CreateCancel: Cancel,
                        CreateConfirm: ConfirmFactory
                    }
                )
            )
            root.Children.Add(
                Cell.Mount[ModalDialog, ModalDialogHost](
                    "top",
                    ModalDialog{
                        Open: TopOpen,
                        Header: Text{Content: "Nested confirmation", FontSize: 21.0, FontWeight: 700},
                        Width: 370.0,
                        Content: Text{Content: "Only this top dialog receives keyboard input.", Color: "#a1a1aa"},
                        AccessibilityName: "Nested confirmation",
                        OnClose: CloseTop,
                        OnCancel: CloseTop,
                        OnConfirm: CloseTop,
                        CreateRoot: Top
                    }
                )
            )
        }
        var popup = PopoverInput{
            Open: PopupOpen,
            AccessibilityName: "Quick details",
            Width: 280.0,
            MaxHeight: 220.0,
            Content: Container{
                Gap: 14.0,
                Text{Content: "Quick details", FontSize: 18.0, FontWeight: 700},
                Text{Content: "This popup flips above its anchor and stays inside the viewport.", Color: "#c4c4cf"},
                Button{
                    Handle: PopupAction,
                    Height: 34.0,
                    BackgroundColor: "#4f46e5",
                    Text{Content: "Continue"},
                    Accessibility: Accessibility{Name: "Popup action"}
                }
            },
            OnDismiss: PopupDismiss,
            CreatePanel: CapturePanel,
            CreateRoot: CapturePopup
        }
        if PointPopup {
            popup.WindowPoint = Point{X: 800.0, Y: 520.0}
        } else {
            popup.Anchor = Anchor
        }
        root.Children.Add(Cell.Mount[PopoverInput, Popover]("popup", popup))
        root.Children.Add(
            Cell.Mount[MenuInput, Menu](
                "menu",
                MenuInput{
                    Open: MenuOpen,
                    WindowPoint: Point{X: 630.0, Y: 180.0},
                    Width: 220.0,
                    AccessibilityName: "Actions",
                    Items: []MenuItem{
                        MenuItem{Id: "open", Label: "Open"},
                        MenuItem{Id: "disabled", Label: "Unavailable action", Disabled: true},
                        MenuItem{Id: "separator", Separator: true},
                        MenuItem{
                            Id: "tools",
                            Label: "Tools",
                            Children: []MenuItem{
                                MenuItem{Id: "copy", Label: "Copy address"},
                                MenuItem{Id: "offline", Label: "Offline action", Disabled: true},
                                MenuItem{
                                    Id: "advanced",
                                    Label: "Advanced",
                                    Children: []MenuItem{MenuItem{Id: "inspect", Label: "Inspect details"}}
                                },
                            }
                        },
                        MenuItem{Id: "delete", Label: "Delete"},
                    },
                    OnActivate: MenuActivate,
                    OnDismiss: MenuDismiss,
                    DismissOnActivate: !KeepMenu,
                    CreateItem: MenuRow
                }
            )
        )
        return root
    }
}

func OverlayFocus(adapter SearchListSemantics, name string) bool -> FindSemantics(
    adapter.Tree?.Root,
    name
)?.Focused ?? false

func OverlayInteractions() {
    OverlayContracts()
    let host = OverlayHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Overlay verification",
        Width: 860,
        Height: 560,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 12)
        let id = OnlyNativeWindow()
        host.Before.Focus()
        let oldBackground = FindSemantics(semantics.Tree?.Root, "Background action")!!.Id
        host.DialogOpen = true
        host.Rebuild()
        PumpFrames(window, 16)
        Require(OverlayFocus(semantics, "Dialog editor"), "Managed dialog did not enter its first eligible child")
        Require(
            !host.Before.Focus() && !window.PerformAccessibilityAction(
                oldBackground,
                AccessibilityActionRequest(AccessibilityAction.Activate)
            ),
            "Modal permitted background focus or accessibility activation"
        )
        Require(
            FindSemantics(semantics.Tree?.Root, "Background action") == nil,
            "Modal exposed background accessibility content"
        )
        CaptureIssueProof(window, "modal-managed")
        host.ConfirmButton!!.Handle!!.Focus()
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 5)
        Require(OverlayFocus(semantics, "Dialog editor"), "Tab escaped the dialog")
        CompositeClick(window, host.Nested)
        Require(host.TopOpen && !host.Edit.Focus(), "Nested modal left its underlying dialog active")
        Require(FindSemantics(semantics.Tree?.Root, "Dialog editor") == nil, "Nested modal exposed underlying content")
        CaptureIssueProof(window, "modal-nested")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 10)
        Require(
            !host.TopOpen && host.DialogOpen && OverlayFocus(semantics, "Open nested dialog"),
            "Closing nested dialog failed to restore its trigger"
        )
        MouseButton(id, 12.0F, 12.0F, true)
        MouseButton(id, 12.0F, 12.0F, false)
        PumpFrames(window, 10)
        Require(
            !host.DialogOpen && OverlayFocus(semantics, "Background action"),
            "Backdrop dismissal failed to restore prior focus"
        )
        host.EmptyDialog = true
        host.DialogOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        Require(OverlayFocus(semantics, "Review change"), "Empty dialog did not focus its fallback root")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        Require(!host.DialogOpen && OverlayFocus(semantics, "Background action"), "Fallback Escape/restore failed")
        host.EmptyDialog = false
        host.DialogOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        host.ShowDialogs = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(OverlayFocus(semantics, "Background action"), "Dialog unmount failed to restore focus")
        host.DialogOpen = false
        host.Anchor.Focus()
        host.PopupOpen = true
        host.Rebuild()
        window.Pump(0.016)
        Require(
            !host.PopupAction.Focus(),
            "Popover accepted input at its provisional root measurement"
        )
        window.Pump(0.016)
        Require(
            !host.PopupAction.Focus(),
            "Popover accepted input at its provisional wrapped-content measurement"
        )
        window.Pump(0.016)
        let panel = host.PopupPanel!!.Handle!!.BorderBox
        let anchor = host.Anchor.BorderBox
        Require(
            panel.Y + panel.Height <= anchor.Y + .5 && panel.X >= 8.0 && panel.X + panel.Width <= 852.5,
            "Popover's first visible frame did not use its measured viewport"
        )
        Require(
            FindSemantics(semantics.Tree?.Root, "Popup action") != nil,
            "Popover's measured first frame was not presented"
        )
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "Popup action"), "Popover did not enter its content")
        CaptureIssueProof(window, "popover-flipped")
        host.AnchorX = 100.0
        host.AnchorY = 140.0
        host.Rebuild()
        PumpFrames(window, 14)
        let moved = host.PopupPanel!!.Handle!!.BorderBox
        Require(Math.Abs(moved.X - 100.0) < .5 && moved.Y > 177.5, "Popover did not track a moved anchor")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        Require(
            !host.PopupOpen && host.LastDismiss == PopoverDismissReason.Escape && OverlayFocus(semantics, "Open popup"),
            "Popover Escape/restore failed"
        )
        host.PointPopup = true
        host.PopupOpen = true
        host.Rebuild()
        window.Width = 440
        PumpFrames(window, 18)
        let narrow = host.PopupPanel!!.Handle!!.BorderBox
        Require(
            narrow.X >= 7.5 && narrow.X + narrow.Width <= 432.5 && narrow.Y + narrow.Height <= 552.5,
            "Point popup escaped resized bounds"
        )
        CaptureIssueProof(window, "popover-point-narrow")
        MouseButton(id, 12.0F, 12.0F, true)
        MouseButton(id, 12.0F, 12.0F, false)
        PumpFrames(window, 8)
        Require(
            !host.PopupOpen && host.LastDismiss == PopoverDismissReason.OutsideClick && host.BackgroundClicks == 0,
            "Outside click failed to dismiss without activating background"
        )
        window.Width = 860
        host.PointPopup = false
        host.PopupOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        host.ShowAnchor = false
        host.Rebuild()
        PumpFrames(window, 14)
        Require(
            !host.PopupOpen && host.LastDismiss == PopoverDismissReason.AnchorRemoved,
            "Removed anchor retained its popup lifecycle"
        )
        host.Before.Focus()
        host.MenuOpen = true
        host.Rebuild()
        PumpFrames(window, 16)
        Require(OverlayFocus(semantics, "Open"), "Menu failed initial focus")
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 7)
        Require(OverlayFocus(semantics, "Tools"), "Menu navigation failed to skip disabled/separator rows")
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 14)
        Require(OverlayFocus(semantics, "Copy address"), "Right did not enter the submenu")
        SendKey(id, SDLScancode.Down)
        PumpFrames(window, 7)
        Require(OverlayFocus(semantics, "Advanced"), "Submenu Down failed to skip disabled items")
        SendKey(id, SDLScancode.Right)
        PumpFrames(window, 14)
        Require(OverlayFocus(semantics, "Inspect details"), "Nested submenu did not receive focus")
        CaptureIssueProof(window, "menu-nested")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 12)
        Require(host.MenuOpen && OverlayFocus(semantics, "Advanced"), "Escape closed more than the active menu level")
        SendKey(id, SDLScancode.Left)
        PumpFrames(window, 12)
        Require(OverlayFocus(semantics, "Tools"), "Left failed to return to the parent menu")
        SendKey(id, SDLScancode.End)
        PumpFrames(window, 7)
        Require(OverlayFocus(semantics, "Delete"), "Menu End failed")
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 7)
        Require(OverlayFocus(semantics, "Open"), "Menu Home failed")
        host.KeepMenu = true
        host.Rebuild()
        PumpFrames(window, 6)
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(host.Activated == "open" && host.MenuOpen, "Menu activation ignored its stay-open policy")
        let toolsBox = host.MenuRows["tools"].Handle!!.BorderBox
        MouseMove(id, float32(toolsBox.X + 20.0), float32(toolsBox.Y + 15.0))
        PumpFrames(window, 14)
        Require(FindSemantics(semantics.Tree?.Root, "Copy address") != nil, "Pointer hover did not open a submenu")
        let openBox = host.MenuRows["open"].Handle!!.BorderBox
        MouseMove(id, float32(openBox.X + 20.0), float32(openBox.Y + 15.0))
        PumpFrames(window, 14)
        Require(
            FindSemantics(semantics.Tree?.Root, "Copy address") == nil,
            "Submenu blocked pointer movement back to its parent"
        )
        Require(OverlayFocus(semantics, "Open"), "Closing a submenu replaced explicit parent-item focus")
        host.KeepMenu = false
        host.Rebuild()
        PumpFrames(window, 5)
        CompositeClick(window, host.MenuRows["open"].Handle!!)
        Require(
            !host.MenuOpen && OverlayFocus(semantics, "Background action"),
            "Menu activation failed to dismiss/restore"
        )
        Require(
            host.BackgroundClicks == 0 && host.Confirms == 0,
            "An overlay accidentally activated a background or confirmation action"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: native managed modal entry/containment/nesting/fallback/backdrop/unmount, popover anchor/point/flip/resize/dismiss/restore, menu disabled/separator/keyboard/submenu/hover/activation policy"
    )
}
