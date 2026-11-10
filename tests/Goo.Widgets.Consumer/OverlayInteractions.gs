package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Layout
import Goo.Widgets.Feedback
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
    private var window Window?
    internal let TooltipTarget ElementHandle = ElementHandle()
    internal let TooltipLabel ElementHandle = ElementHandle()
    internal let Anchor ElementHandle = ElementHandle()
    internal let Edit ElementHandle = ElementHandle()
    internal let Nested ElementHandle = ElementHandle()
    internal let PopupAction ElementHandle = ElementHandle()
    internal let DrawerAction ElementHandle = ElementHandle()
    internal var DialogOpen bool
    internal var DrawerOpen bool
    internal var TopOpen bool
    internal var PopupOpen bool
    internal var MenuOpen bool
    internal var PointPopup bool
    internal var ExplicitViewport bool
    internal var FitWidth bool
    internal var ShowAnchor bool = true
    internal var ShowDialogs bool = true
    internal var EmptyDialog bool
    internal var KeepMenu bool
    internal var BasisContent float64
    internal var PopupPoint Point = Point{X: 800.0, Y: 520.0}
    internal var PassThrough bool
    internal var MenuFocusColor Color?
    internal var AnchorX float64 = 590.0
    internal var AnchorY float64 = 430.0
    internal var BackgroundClicks int32
    internal var BackgroundKeys int32
    internal var BackgroundEscapes int32
    internal var Confirms int32
    internal var Dismisses int32
    internal var OpenChanges int32
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

    private func PopupOpenChange(isOpen bool) {
        Require(!isOpen && PopupOpen, "Popover did not request the new closed state")
        OpenChanges++
        PopupOpen = isOpen
    }

    private func PopupDismiss(reason PopoverDismissReason) {
        Require(!PopupOpen && OpenChanges == Dismisses + 1, "Popover state request did not precede dismissal")
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
            BorderColor: Color.Parse("#6366f1"),
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
        if let color = MenuFocusColor {
            prepared.Focus = Style{Color: color}
        }
        return prepared
    }

    internal func AttachWindow(window Window) {
        this.window = window
    }

    public override func Build() Blob {
        let root = Container{
            Width: Percent(100),
            Height: Percent(100),
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
                OnKeyDown: (event KeyEvent) -> {
                    if event.Key == Key.Escape { BackgroundEscapes++ }
                },
                OnClick: () -> {
                    BackgroundClicks++
                },
                Accessibility: Accessibility{Name: "Background action"},
                Text{Content: "Background action"}
            }
        }
        root.Children.Add(
            Cell.Mount[TooltipInput, Tooltip](
                "tooltip",
                TooltipInput{
                    Window: window,
                    DelayMs: 0.0,
                    Target: Button{Handle: TooltipTarget, Width: 180.0, Height: 38.0, Text{Content: "Tooltip target"}},
                    Content: Text{Handle: TooltipLabel, Content: "Tooltip label"},
                }
            )
        )
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
        root.Children.Add(
            Drawer{
                Open: DrawerOpen,
                Modal: true,
                AccessibilityName: "Modal drawer",
                OnOpenChange: (value) -> {
                    DrawerOpen = value
                    Rebuild()
                },
                Content: Button{
                    Handle: DrawerAction,
                    Accessibility: Accessibility{Name: "Drawer action"},
                    Text{Content: "Drawer action"},
                },
            }.Build()
        )
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
                        Width: Percent(100),
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
                        OnOpenChange: (isOpen bool) -> CloseOuter(),
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
                        OnOpenChange: (isOpen bool) -> CloseTop(),
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
            OnOpenChange: PopupOpenChange,
            OnDismiss: PopupDismiss,
            DismissOnOutsideClick: !PassThrough,
            CreatePanel: CapturePanel,
            CreateRoot: CapturePopup
        }
        if PointPopup {
            popup.WindowPoint = PopupPoint
        } else {
            popup.Anchor = Anchor
        }
        if ExplicitViewport {
            popup.Viewport = ElementRect{X: 20.0, Y: 30.0, Width: 360.0, Height: 480.0}
        }
        if BasisContent > 0.0 {
            popup.Content = Container{FlexBasis: BasisContent, FlexShrink: 1.0, MinHeight: 0.0}
        }
        if FitWidth {
            popup.Width = Length.Auto
            popup.MaxWidth = 240.0
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
                    SubmenuArrowStyle: Style{Color: "#d16b42"},
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
                    OnClick: MenuActivate,
                    OnOpenChange: (isOpen bool) -> MenuDismiss(),
                    DismissOnActivate: !KeepMenu,
                    CreateItem: MenuRow
                }
            )
        )
        return root
    }
}

func OverlayFocus(adapter SearchListSemantics, name string) bool -> FindSemantics(adapter.Tree?.Root, name)?.Focused ??
false

func SemanticDepth(node AccessibilityNode?, name string) int32 {
    guard let node = node else {
        return -1
    }
    if node.Name == name {
        return 0
    }
    for child in node.Children {
        let depth = SemanticDepth(child, name)
        if depth >= 0 {
            return depth + 1
        }
    }
    return -1
}

func ModalClipboardInteractions() {
    let host = OverlayHost{DialogOpen: true}
    let semantics = SearchListSemantics{}
    let window = Window{
        Title: "Modal clipboard verification",
        Width: 860,
        Height: 560,
        Root: ApplicationRoot(host),
        AccessibilityAdapter: semantics,
    }
    host.AttachWindow(window)
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 16)
        Require(OverlayFocus(semantics, "Dialog editor"), "Managed dialog did not focus its editor")
        let id = OnlyNativeWindow()
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorType(window, id, "keyboard")
        SendKey(id, SDLScancode.Backspace)
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        SelectorKey(id, SDLScancode.C, SDLKeymod.Ctrl)
        PumpFrames(window, 4)
        Require(window.GetClipboardText() == "keyboar", "Modal editor copy or Backspace failed")
        SendKey(id, SDLScancode.End)
        SelectorKey(id, SDLScancode.V, SDLKeymod.Ctrl)
        PumpFrames(window, 4)
        Require(FindSemantics(semantics.Tree?.Root, "Dialog editor")!!.Value == "keyboarkeyboar", "Modal editor paste failed")
        SendKey(id, SDLScancode.Return)
        SelectorKey(id, SDLScancode.Tab, SDLKeymod.Shift)
        PumpFrames(window, 4)
    })
    Console.WriteLine("PASS: managed modal typing, Backspace, select all, copy, paste, Enter and Shift+Tab without application editing bindings")
}

func OverlayInteractions() {
    RunContracts(OverlayContracts)
    TeachingTipInteractions()
    let host = OverlayHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Overlay verification",
        Width: 860,
        Height: 560,
        Root: root,
        AccessibilityAdapter: semantics
    }
    host.AttachWindow(window)
    RunNativeWindow(window, () -> {
        window.Open()
        let id = OnlyNativeWindow()
        Require(SDL.SyncWindow(SDL.GetWindowFromID(id)), "Overlay native window state did not settle")
        WaitVirtual(
            window,
            () -> window.IsVisible && host.TooltipTarget.IsMounted &&
                host.TooltipTarget.BorderBox.Width > 0.0 && host.TooltipTarget.BorderBox.Height > 0.0
        )
        host.Before.Focus()
        let tooltipBounds = host.TooltipTarget.BorderBox
        MouseMove(id, float32(tooltipBounds.X + tooltipBounds.Width / 2.0), float32(tooltipBounds.Y + tooltipBounds.Height / 2.0))
        WaitVirtual(window, () -> host.TooltipLabel.IsMounted)
        Require(host.TooltipLabel.IsMounted, "Hover did not show the tooltip")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 40)
        Require(!host.TooltipLabel.IsMounted, "Escape did not keep the hovered tooltip dismissed")
        Require(host.BackgroundEscapes == 0, "Tooltip Escape reached the focused control")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 4)
        Require(host.BackgroundEscapes == 1, "Escape did not reach the focused control after tooltip dismissal")
        MouseMove(id, 4.0F, 4.0F)
        PumpFrames(window, 4)
        MouseMove(id, float32(tooltipBounds.X + tooltipBounds.Width / 2.0), float32(tooltipBounds.Y + tooltipBounds.Height / 2.0))
        WaitVirtual(window, () -> host.TooltipLabel.IsMounted)
        Require(host.TooltipLabel.IsMounted, "Tooltip did not reopen after leaving and re-entering")
        MouseMove(id, 4.0F, 4.0F)
        WaitVirtual(window, () -> !host.TooltipLabel.IsMounted)
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
        host.DrawerOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        Require(
            host.DrawerAction.IsMounted && host.DrawerAction.BorderBox.Width > 0.0 && host.DrawerAction.BorderBox.Height > 0.0,
            "Modal drawer content was not mounted and visible"
        )
        Require(OverlayFocus(semantics, "Drawer action"), "Modal drawer did not set initial focus")
        Require(!host.Before.Focus(), "Modal drawer allowed background focus")
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "Drawer action"), "Tab escaped the modal drawer")
        SelectorKey(id, SDLScancode.Tab, SDLKeymod.Shift)
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "Drawer action"), "Shift+Tab escaped the modal drawer")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        Require(!host.DrawerOpen && OverlayFocus(semantics, "Background action"), "Modal drawer Escape/restore failed")
        host.DrawerOpen = true
        host.Rebuild()
        PumpFrames(window, 12)
        MouseButton(id, 700.0F, 400.0F, true)
        MouseButton(id, 700.0F, 400.0F, false)
        PumpFrames(window, 8)
        Require(!host.DrawerOpen && OverlayFocus(semantics, "Background action"), "Modal drawer scrim/restore failed")
        host.DialogOpen = false
        host.Anchor.Focus()
        host.PopupOpen = true
        host.Rebuild()
        window.Pump(0.016)
        Require(!host.PopupAction.Focus(), "Popover accepted input at its provisional root measurement")
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
        let anchoredDepth = SemanticDepth(semantics.Tree?.Root, "Popup action")
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
        host.ExplicitViewport = true
        host.PopupOpen = true
        host.Rebuild()
        window.Width = 440
        PumpFrames(window, 18)
        let narrow = host.PopupPanel!!.Handle!!.BorderBox
        Require(
            narrow.X >= 27.5 && narrow.X + narrow.Width <= 372.5
            && narrow.Y >= 37.5 && narrow.Y + narrow.Height <= 502.5,
            "Point popup escaped its explicit viewport"
        )
        CaptureIssueProof(window, "popover-point-narrow")
        Require(
            anchoredDepth > 0 && SemanticDepth(semantics.Tree?.Root, "Popup action") == anchoredDepth && OverlayFocus(semantics, "Popup action"),
            "Point popup changed the accessibility depth or initial focus of its content"
        )
        SendKey(id, SDLScancode.Tab)
        PumpFrames(window, 4)
        Require(OverlayFocus(semantics, "Popup action"), "Tab left the point popup")
        MouseButton(id, 12.0F, 12.0F, true)
        MouseButton(id, 12.0F, 12.0F, false)
        PumpFrames(window, 8)
        Require(
            !host.PopupOpen && host.LastDismiss == PopoverDismissReason.OutsideClick && host.BackgroundClicks == 0,
            "Outside click failed to dismiss without activating background"
        )
        Require(!OverlayFocus(semantics, "Open popup"), "Outside click restored focus to the popover trigger")
        let background = host.Before.BorderBox
        let pressX = background.X + background.Width / 2.0
        let pressY = background.Y + background.Height / 2.0
        host.BasisContent = 20.0
        for passThrough in []bool{false, true} {
            host.PassThrough = passThrough
            let outcomes = []string{"", ""}
            for covered in []bool{false, true} {
                host.PopupPoint = covered
                ? Point{X: background.X, Y: background.Y - 80.0}
                : Point{X: background.X, Y: background.Y + background.Height + 20.0}
                host.PopupOpen = true
                host.Rebuild()
                PumpFrames(window, 14)
                let shortPanel = host.PopupPanel!!.Handle!!.BorderBox
                Require(
                    covered
                    ? shortPanel.Y + shortPanel.Height < background.Y && shortPanel.X < pressX && shortPanel.X + shortPanel.Width > pressX
                    : shortPanel.Y > background.Y + background.Height,
                    "Short point popup is not placed for the press check: " + shortPanel.ToString()
                )
                let clicks = host.BackgroundClicks
                MouseButton(id, float32(pressX), float32(pressY), true)
                MouseButton(id, float32(pressX), float32(pressY), false)
                PumpFrames(window, 8)
                outcomes[covered ? 1: 0] = (host.PopupOpen ? "open": "closed by " + host.LastDismiss.ToString())
                + ", background clicks " + (host.BackgroundClicks - clicks).ToString()
                host.PopupOpen = false
                host.Rebuild()
                PumpFrames(window, 8)
            }
            Require(
                outcomes[0] == outcomes[1] && (passThrough || outcomes[0] == "closed by OutsideClick, background clicks 0"),
                "A press below a short point popup gave '" + outcomes[1] + "', a press outside its column gave '" + outcomes[0] + "'"
            )
            Console.WriteLine("Point popup press, DismissOnOutsideClick " + (!passThrough).ToString() + ": " + outcomes[1])
        }
        host.PassThrough = false
        host.PopupPoint = Point{X: 800.0, Y: 520.0}
        for basis in []float64{120.0, 400.0} {
            host.BasisContent = basis
            host.PopupOpen = true
            host.Rebuild()
            PumpFrames(window, 14)
            let sized = host.PopupPanel!!.Handle!!.BorderBox
            Require(
                Math.Abs(sized.Height - Math.Min(basis + 30.0, 220.0)) < 0.5 && sized.Y < 520.0 && sized.Y + sized.Height <= 502.5,
                "Clamped point popup with " + basis.ToString() + " px flex-basis content is " + sized.ToString()
            )
            host.PopupOpen = false
            host.Rebuild()
            PumpFrames(window, 8)
        }
        host.BasisContent = 0.0
        window.Width = 860
        host.PointPopup = false
        host.ExplicitViewport = false
        host.AnchorX = 590.0
        host.AnchorY = 430.0
        for basis in []float64{120.0, 400.0} {
            host.BasisContent = basis
            host.PopupOpen = true
            host.Rebuild()
            PumpFrames(window, 14)
            let flipped = host.PopupPanel!!.Handle!!.BorderBox
            Require(
                Math.Abs(flipped.Height - Math.Min(basis + 30.0, 220.0)) < 0.5 && flipped.Y + flipped.Height <= host.Anchor.BorderBox.Y + 0.5,
                "Flipped anchored popup with " + basis.ToString() + " px flex-basis content is " + flipped.ToString()
            )
            host.PopupOpen = false
            host.Rebuild()
            PumpFrames(window, 8)
        }
        host.BasisContent = 0.0
        host.AnchorX = 100.0
        host.AnchorY = 140.0
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
        host.ShowAnchor = true
        host.FitWidth = true
        host.PopupOpen = true
        host.Rebuild()
        PumpFrames(window, 14)
        let fitted = host.PopupPanel!!.Handle!!.BorderBox
        Require(
            fitted.Width > 120.0 && fitted.Width <= 240.5 && FindSemantics(semantics.Tree?.Root, "Popup action") != nil,
            "Content-width popover was not presented within its MaxWidth"
        )
        CaptureIssueProof(window, "popover-content-width")
        SendKey(id, SDLScancode.Escape)
        PumpFrames(window, 8)
        host.FitWidth = false
        host.Before.Focus()
        host.MenuOpen = true
        host.Rebuild()
        PumpFrames(window, 16)
        Require(OverlayFocus(semantics, "Open"), "Menu failed initial focus")
        SendKey(id, SDLScancode.U)
        PumpFrames(window, 6)
        Require(OverlayFocus(semantics, "Open"), "Menu type-ahead reached a disabled item")
        SendKey(id, SDLScancode.Home)
        SendKey(id, SDLScancode.T)
        SendKey(id, SDLScancode.O)
        PumpFrames(window, 6)
        Require(OverlayFocus(semantics, "Tools"), "Menu type-ahead did not retain a matching prefix")
        SendKey(id, SDLScancode.Home)
        PumpFrames(window, 6)
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
        let classic = Theme.Default with{
            HoverColor = Color.Rgb(0, 0, 128),
            FocusColor = Color.Black,
            ControlRadius = 0.0,
            TransitionMs = 0.0,
        }
        host.MenuFocusColor = Color.White
        Theme.Attach(window, classic)
        PumpFrames(window, 6)
        Require(WhiteTextOnNavy(window, host.MenuRows["open"].Handle!!), "Menu row focus color did not reach the label")
        host.MenuFocusColor = nil
        Theme.Attach(window, classic with{HoverTextColor = Color.White})
        PumpFrames(window, 6)
        Require(WhiteTextOnNavy(window, host.MenuRows["open"].Handle!!), "Menu highlight ignored the theme text color")
        Theme.Attach(window)
        PumpFrames(window, 6)
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
    })
    Console.WriteLine(
        "PASS: native managed modal entry/containment/nesting/fallback/backdrop/unmount, popover anchor/point/flip/resize/dismiss/restore/content width, menu disabled/separator/keyboard/submenu/hover/activation policy"
    )
}

func WhiteTextOnNavy(window Window, row ElementHandle) bool {
    let image = ThemeCapture(window)
    let box = row.BorderBox
    let scale = float64(image.Width) / float64(window.Width)
    var navy = false
    var white = false
    for y in int32(box.Y * scale) + 1 ... int32((box.Y + box.Height) * scale) - 1 {
        for x in int32(box.X * scale) + 1 ... int32((box.X + box.Width) * scale) - 1 {
            let at = y * int32(image.RowBytes) + x * 4
            navy = navy || ThemePixel(image, x, y, Color.Rgb(0, 0, 128))
            white = white || image.Pixels[at] >= 200 && image.Pixels[at + 1] >= 200 && image.Pixels[at + 2] >= 200
        }
    }
    return navy && white
}

internal class TeachingTipHost : Cell {
    internal let Anchor ElementHandle = ElementHandle()
    internal var Open bool
    internal var Anchored bool = true
    internal var LightDismiss bool
    internal var ActionDisabled bool
    internal var AcceptChange bool = true
    internal var Requests int32
    internal var Actions int32

    private func Change(value bool) {
        Require(!value, "TeachingTip requested opening during dismissal")
        Requests++
        if AcceptChange { Open = value }
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Width: Percent(100), Height: Percent(100), Padding: 40.0,
        Button{Handle: Anchor, Width: 140.0, Height: 40.0, Focusable: true,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Tip target"},
            Text{Content: "Bookmark"}},
        TeachingTip{
            Open: Open, Anchor: Anchored ? Anchor: nil, OnOpenChange: Change,
            Title: "Bookmark", Subtitle: "Reading list", AccessibilityName: "Save bookmark",
            CloseText: "Close tip", ActionText: "Save", ActionDisabled: ActionDisabled,
            LightDismiss: LightDismiss, OnActionClick: () -> { Actions++ },
            Content: Text{Content: "Page 12"},
        }.Build(),
    }
}

func TeachingTipInteractions() {
    let host = TeachingTipHost()
    let semantics = SearchListSemantics()
    let window = Window{Title: "Teaching tip verification", Width: 640, Height: 480,
        Root: ApplicationRoot(host), AccessibilityAdapter: semantics}
    Theme.Attach(window, Theme.Ink)
    RunNativeWindow(window, () -> {
        window.Open()
        let id = OnlyNativeWindow()
        WaitVirtual(window, () -> host.Anchor.IsMounted)
        for palette in []Theme{Theme.Ink, Theme.Bone, Theme.Ink.WithHighContrast()} {
            Theme.Attach(window, palette)
            for anchored in []bool{true, false} {
                host.Anchored = anchored
                host.LightDismiss = false
                host.ActionDisabled = true
                host.Anchor.Focus()
                host.Open = true
                host.Rebuild()
                WaitVirtual(window, () -> FindSemantics(semantics.Tree?.Root, "Close tip") != nil)
                let tip = FindSemantics(semantics.Tree?.Root, "Save bookmark")!!
                Require(tip.Role == AccessibilityRole.Dialog && (anchored || tip.Modal == true),
                    "TeachingTip lost dialog or modal semantics")
                let action = FindSemantics(semantics.Tree?.Root, "Save")!!
                Require(action.Disabled && !window.PerformAccessibilityAction(action.Id,
                    AccessibilityActionRequest(AccessibilityAction.Activate)),
                    "TeachingTip disabled action accepted activation")
                SendKey(id, SDLScancode.Tab)
                PumpFrames(window, 4)
                Require(OverlayFocus(semantics, "Close tip"), "TeachingTip Tab reached the disabled action")
                MouseButton(id, 620.0F, 460.0F, true)
                MouseButton(id, 620.0F, 460.0F, false)
                PumpFrames(window, 4)
                Require(host.Open, "TeachingTip dismissed with LightDismiss false")
                host.ActionDisabled = false
                host.Rebuild()
                PumpFrames(window, 5)
                Require(window.PerformAccessibilityAction(FindSemantics(semantics.Tree?.Root, "Close tip")!!.Id,
                    AccessibilityActionRequest(AccessibilityAction.Focus)), "TeachingTip close button did not focus")
                let previousActions = host.Actions
                SendKey(id, SDLScancode.Tab)
                PumpFrames(window, 4)
                Require(OverlayFocus(semantics, "Save"), "TeachingTip enabled action did not enter Tab order")
                SendKey(id, SDLScancode.Return)
                PumpFrames(window, 4)
                Require(host.Actions == previousActions + 1 && host.Open, "TeachingTip action closed the tip or failed activation")
                host.AcceptChange = false
                SendKey(id, SDLScancode.Escape)
                PumpFrames(window, 4)
                Require(host.Open, "TeachingTip mutated controlled Open")
                host.AcceptChange = true
                let close = FindSemantics(semantics.Tree?.Root, "Close tip")!!.Bounds
                MouseButton(id, float32(close.X + close.Width / 2), float32(close.Y + close.Height / 2), true)
                MouseButton(id, float32(close.X + close.Width / 2), float32(close.Y + close.Height / 2), false)
                WaitVirtual(window, () -> !host.Open)
                Require(OverlayFocus(semantics, "Tip target"), "TeachingTip did not restore target focus")
                host.LightDismiss = true
                host.Open = true
                host.Rebuild()
                WaitVirtual(window, () -> FindSemantics(semantics.Tree?.Root, "Close tip") != nil)
                MouseButton(id, 620.0F, 460.0F, true)
                MouseButton(id, 620.0F, 460.0F, false)
                WaitVirtual(window, () -> !host.Open)
                host.Open = true
                host.Rebuild()
                WaitVirtual(window, () -> FindSemantics(semantics.Tree?.Root, "Close tip") != nil)
                SendKey(id, SDLScancode.Escape)
                WaitVirtual(window, () -> !host.Open)
            }
        }
        Require(host.Requests == 24 && host.Actions == 6, "TeachingTip callback counts changed")
        for width in []int32{480, 900, 1600, 2560} {
            window.Width = width
            window.Height = width == 2560 ? 1440: 480
            window.UiScale = 1.5F
            for anchored in []bool{true, false} {
                host.Anchored = anchored
                host.Open = true
                host.Rebuild()
                PumpFrames(window, 16)
                let panel = FindSemantics(semantics.Tree?.Root, "Save bookmark")!!.Bounds
                Require(panel.X >= 0 && panel.Y >= 0
                    && panel.X + panel.Width <= float64(window.Width) / window.UiScale + 1
                    && panel.Y + panel.Height <= float64(window.Height) / window.UiScale + 1,
                    "TeachingTip escaped the scaled viewport")
                host.Open = false
                host.Rebuild()
                PumpFrames(window, 4)
            }
        }
    })
    Console.WriteLine("PASS: TeachingTip anchored/centered, pointer close/light-dismiss, Escape, controlled Open, action keyboard/disabled, focus restore, dialog semantics, Ink/Bone/high contrast")
}
