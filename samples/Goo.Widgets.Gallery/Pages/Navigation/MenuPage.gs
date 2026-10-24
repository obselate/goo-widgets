package Goo.Widgets.Gallery.Pages.Navigation

import Goo
import Goo.Widgets
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
    private var selected string = "none"
    private func Dismiss() {
        isOpen = false
        Rebuild()
    }

    private func Activate(id string) {
        selected = id
        Rebuild()
    }

    private func OpenTrigger() {
        usePoint = false
        isOpen = true
        Rebuild()
    }

    public override func Build() Blob {
        let theme = Theme.Read()
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
            OnPointerDown: (event PointerEvent) -> {
                if event.Button == PointerButton.Secondary {
                    event.PreventDefault()
                    point = event.WindowPosition
                    usePoint = true
                    isOpen = true
                    Rebuild()
                }
            },
            Text{Key: "selected", Content: "Selected " + selected, FontSize: 13.0},
            Container{
                Key: "directions",
                FlexDirection: FlexDirection.Row,
                Gap: 12,
                Button{
                    Padding: 8,
                    BackgroundColor: theme.Button.BackgroundColor!!,
                    Color: theme.TextColor,
                    OnClick: () -> {
                        openUp = !openUp
                        isOpen = false
                        Rebuild()
                    },
                    Text{Content: openUp ? "Root: up": "Root: down"}
                },
                Button{
                    Padding: 8,
                    BackgroundColor: theme.Button.BackgroundColor!!,
                    Color: theme.TextColor,
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
                Top: 200.0,
                Width: 220.0,
                Height: 36.0,
                BackgroundColor: theme.Button.BackgroundColor!!,
                Color: theme.TextColor,
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
