package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import System

/// A controlled menu trigger. The host updates Open after OnOpenChange.
public data struct MenuButtonInput {
    /// Trigger appearance. The widget replaces its click action, handle, and popup semantics.
    var Button ActionButton
    /// Menu entries in display order. Nil supplies no entries.
    var Items[]?MenuItem
    /// Controlled visibility. False hides the popup.
    var Open bool
    /// Receives the requested open state after user interaction. Nil ignores the request.
    var OnOpenChange Action[bool]?
    /// Receives the activated item ID. Nil ignores activation.
    var OnActivate Action[string]?
    /// Preferred anchor-relative placement. Collision handling can move the popup into view.
    var Placement PopoverPlacement
    /// Transforms the prepared menu input and returns its replacement. Open state, anchor, items, initial focus, and callbacks are reapplied. Nil keeps the default input.
    var CreateMenu Func[MenuInput, MenuInput]?
}

/// Opens a Menu with Enter, Space or Down at the first item, or Up at the last.
public open class MenuButton : Cell[MenuButtonInput] {
    private let trigger ElementHandle = ElementHandle()
    private var current MenuButtonInput
    private var initialId string?

    protected override func Build(input MenuButtonInput) Blob {
        current = input
        let theme = Theme.Read()
        let button = (
            (
                input.Button with{
                    OnClick = () -> Change(!current.Open, false),
                    Trailing = input.Button.Trailing ?? ControlIcons.Create(
                        ControlIcon.ExpandMore,
                        16,
                        input.Button.Disabled ? theme.FaintTextColor: theme.MutedTextColor
                    ),
                }
            ).Build() as Button
        )!!
        button.Handle = trigger
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.Button,
            Name: input.Button.AccessibilityName ?? input.Button.Content ?? theme.Text("Menu"),
            HasPopup: true,
            Expanded: input.Open,
        }
        button.OnKeyDown = (event KeyEvent) -> {
            if !button.Disabled && (event.Key == Key.Down || event.Key == Key.Up) {
                event.PreventDefault()
                event.StopPropagation()
                if !event.Repeat {
                    Change(true, event.Key == Key.Up)
                }
            }
        }
        var menu = MenuInput{
            Open: input.Open,
            Anchor: trigger,
            Items: input.Items,
            InitialFocusId: initialId,
            Placement: input.Placement,
            OnActivate: input.OnActivate,
            OnDismiss: () -> Change(false, false),
        }
        if let create = input.CreateMenu {
            menu = create(menu) with{
                Open = input.Open,
                Anchor = trigger,
                Items = input.Items,
                InitialFocusId = initialId,
                OnActivate = input.OnActivate,
                OnDismiss = () -> Change(false, false)
            }
        }
        return Container{FlexDirection: FlexDirection.Row, button, Cell.Mount[MenuInput, Menu]("menu", menu),}
    }

    private func Change(isOpen bool, last bool) {
        if isOpen && (current.Button.Disabled || current.Button.Loading) {
            return
        }
        initialId = nil
        for item in current.Items ?? []MenuItem{} {
            if !item.Disabled && !item.Separator {
                initialId = item.Id
                if !last {
                    break
                }
            }
        }
        if isOpen {
            trigger.Focus()
        }
        current.OnOpenChange?.Invoke(isOpen)
    }
}

/// A primary action beside an independently controlled menu trigger.
public data struct SplitButton {
    /// Primary action descriptor. The adjacent arrow opens Menu independently.
    var Button ActionButton
    /// Controlled descriptor for the arrow-triggered menu.
    var Menu MenuButtonInput
    /// Accessible name for the menu arrow. Nil uses localized menu text.
    var ArrowAccessibilityName string?

    /// Builds the primary action and its menu arrow.
    public func Build() Blob {
        let theme = Theme.Read()
        let primary = (Button.Build() as Button)!!
        primary.BorderEndWidth = 0
        SquareCorners(primary, theme.RightToLeft)
        let arrow = Menu.Button with{
            Content = "",
            AccessibilityName = ArrowAccessibilityName ?? theme.Text("More actions"),
            MinWidth = 0.0,
            PaddingHorizontal = theme.Spacing,
            Disabled = Button.Disabled || Button.Loading || Menu.Button.Disabled,
            CreateRoot = (resolved ActionButton, text Text) -> {
                let root = ((resolved with{OnClick = nil}).Build() as Button)!!
                root.OnClick = resolved.OnClick
                SquareCorners(root, !theme.RightToLeft)
                return root
            },
        }
        return Container{
            Direction: theme.Direction,
            FlexDirection: FlexDirection.Row,
            primary,
            Cell.Mount[MenuButtonInput, MenuButton]("split-menu", Menu with{Button = arrow}),
        }
    }

    shared {
        private func SquareCorners(button Button, left bool) {
            if left {
                button.BorderTopLeftRadius = 0
                button.BorderBottomLeftRadius = 0
            } else {
                button.BorderTopRightRadius = 0
                button.BorderBottomRightRadius = 0
            }
        }
    }
}
