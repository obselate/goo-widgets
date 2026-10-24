package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import System

/// A controlled menu trigger. The host updates Open after OnOpenChange.
public data struct MenuButtonInput {
    var Button ActionButton
    var Items[]?MenuItem
    var Open bool
    var OnOpenChange Action[bool]?
    var OnActivate Action[string]?
    var Placement PopoverPlacement
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
                    Trailing = input.Button.Trailing ?? MaterialIcons.Create(
                        "expand_more",
                        16,
                        input.Button.Disabled ? theme.FaintTextColor: theme.MutedTextColor
                    ),
                }
            ).Build() as Button
        )!!
        button.Handle = trigger
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.Button,
            Name: input.Button.AccessibilityName ?? input.Button.Content ?? "Menu",
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
    var Button ActionButton
    var Menu MenuButtonInput
    var ArrowAccessibilityName string?

    /// Builds the primary action and its menu arrow.
    public func Build() Blob {
        let arrow = Menu.Button with{
            Content = "",
            AccessibilityName = ArrowAccessibilityName ?? "More actions",
            MinWidth = 0.0,
            Disabled = Button.Disabled || Button.Loading || Menu.Button.Disabled,
        }
        return Container{
            FlexDirection: FlexDirection.Row,
            Button.Build(),
            Cell.Mount[MenuButtonInput, MenuButton]("split-menu", Menu with{Button = arrow}),
        }
    }
}
