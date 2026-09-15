package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Layout
import Goo.Widgets.Navigation

internal class MenuExample : Cell {
    private let trigger ElementHandle = ElementHandle()
    private var isOpen bool = true
    private var openUp bool
    private var openLeft bool
    private var usePoint bool
    private var point Point
    private var selected string = "No action selected"
    private func Dismiss() {
        isOpen = false
        Rebuild()
    }

    private func Activate(id string) {
        selected = "Selected: " + id
        Rebuild()
    }

    private func OpenTrigger() {
        usePoint = false
        isOpen = true
        Rebuild()
    }

    public override func Build() Blob {
        var menu = MenuInput{
            Open: isOpen,
            Placement: openUp ? PopoverPlacement.TopStart: PopoverPlacement.BottomStart,
            SubmenuPlacement: openLeft ? PopoverPlacement.LeftStart: PopoverPlacement.RightStart,
            Width: 240.0,
            AccessibilityName: "Project actions",
            OnDismiss: Dismiss,
            OnActivate: Activate,
            Items: []MenuItem{
                MenuItem{Id: "open", Label: "Open project"},
                MenuItem{Id: "rename", Label: "Rename"},
                MenuItem{Id: "separator", Separator: true},
                MenuItem{
                    Id: "tools",
                    Label: "Tools",
                    Children: []MenuItem{
                        MenuItem{Id: "copy", Label: "Copy address"},
                        MenuItem{Id: "reveal", Label: "Reveal in folder"},
                        MenuItem{
                            Id: "more",
                            Label: "More",
                            Children: []MenuItem{MenuItem{Id: "inspect", Label: "Inspect details"}}
                        },
                    }
                },
                MenuItem{Id: "offline", Label: "Sync unavailable", Disabled: true},
            }
        }
        if usePoint {
            menu.WindowPoint = point
        } else {
            menu.Anchor = trigger
        }
        return Container{
            Width: 720.0,
            Height: 420.0,
            Gap: 14.0,
            Color: "#fafafa",
            OnPointerDown: (event PointerEvent) -> {
                if event.Button == PointerButton.Secondary {
                    event.PreventDefault()
                    point = event.WindowPosition
                    usePoint = true
                    isOpen = true
                    Rebuild()
                }
            },
            Text{Key: "title", Content: "Project actions", FontSize: 22.0, FontWeight: 700},
            Text{
                Key: "hint",
                Content: "Right-click for a context menu. Choose opening directions below; arrows follow the submenu side.",
                FontSize: 14.0,
                Color: "#a1a1aa"
            },
            Text{Key: "selected", Content: selected, FontSize: 13.0, Color: "#a5b4fc"},
            Container{
                Key: "directions",
                FlexDirection: FlexDirection.Row,
                Gap: 12,
                Button{
                    Padding: 8,
                    BackgroundColor: "#27272a",
                    OnClick: () -> {
                        openUp = !openUp
                        isOpen = false
                        Rebuild()
                    },
                    Text{Content: openUp ? "Root: up": "Root: down"}
                },
                Button{
                    Padding: 8,
                    BackgroundColor: "#27272a",
                    OnClick: () -> {
                        openLeft = !openLeft
                        isOpen = false
                        Rebuild()
                    },
                    Text{Content: openLeft ? "Submenus: left": "Submenus: right"}
                }
            },
            Button{
                Key: "trigger",
                Handle: trigger,
                Position: PositionType.Absolute,
                Left: 350.0,
                Top: 270.0,
                Width: 220.0,
                Height: 36.0,
                BackgroundColor: "#27272a",
                BorderRadius: 6.0,
                OnClick: OpenTrigger,
                OnKeyDown: (event KeyEvent) -> {
                    if event.Key == Key.Menu || event.Key == Key.F10 && event.Modifiers.Shift {
                        event.PreventDefault()
                        OpenTrigger()
                    }
                },
                Text{Content: "Open actions"}
            },
            Cell.Mount[MenuInput, Menu]("menu", menu)
        }
    }
}

internal class MenuPage : GalleryPage {
    override func Title() string -> "Menu"

    override func Build() Blob -> Cell.Mount[MenuExample]("menu-example")
}
