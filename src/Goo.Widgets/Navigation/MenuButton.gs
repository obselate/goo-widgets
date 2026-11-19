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
    var OnClick Action[string]?
    /// Preferred anchor-relative placement. Collision handling can move the popup into view.
    var Placement PopoverPlacement
    /// Transforms the prepared menu input and returns its replacement. Open state, anchor, items, initial focus, and callbacks are reapplied. Nil keeps the default input.
    /// Hosts must not change state in this callback.
    var CreateMenu Func[MenuButtonInput, MenuInput, MenuInput]?
}

/// Opens a Menu with Enter, Space or Down at the first item, or Up at the last.
public open class MenuButton : Cell[MenuButtonInput] {
    private let trigger ElementHandle = ElementHandle()
    private var current MenuButtonInput
    private var initialId string?
    private var sourceItems[]?MenuItem
    private var forwardedItems[]?MenuItem
    private let activateItem Action[string]
    private let invokeItemCallback Action[Action?]

    public init() {
        activateItem = id -> InvokeInputCallback(current.OnClick, id)
        invokeItemCallback = callback -> InvokeInputCallback(callback)
    }

    protected override func Build(input MenuButtonInput) Blob {
        current = input
        if !Object.ReferenceEquals(input.Items, sourceItems) {
            sourceItems = input.Items
            forwardedItems = forwardMenuCallbacks(input.Items, invokeItemCallback)
        }
        let theme = Theme.Read()
        let button = (
            (
                input.Button with{
                    OnClick = () -> Change(!current.Open, false),
                    Trailing = input.Button.Trailing ?? ControlIcons.Create(
                        ControlIcon.ExpandMore,
                        16,
                        input.Button.Disabled ? theme.DisabledTextColor: theme.MutedTextColor
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
            Items: forwardedItems,
            InitialFocusId: initialId,
            Placement: input.Placement,
            OnClick: input.OnClick == nil ? nil: activateItem,
            OnOpenChange: (isOpen bool) -> Change(isOpen, false),
        }
        if let create = input.CreateMenu {
            menu = create(input, menu) with{
                Open = input.Open,
                Anchor = trigger,
                Items = menu.Items,
                InitialFocusId = initialId,
                OnClick = input.OnClick == nil ? nil: activateItem,
                OnOpenChange = (isOpen bool) -> Change(isOpen, false)
            }
        }
        return Container{FlexDirection: FlexDirection.Row, FlexShrink: 1.0, MinWidth: 0.0, button, Cell.Mount[MenuInput, Menu]("menu", menu),}
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
        InvokeInputCallback(current.OnOpenChange, isOpen)
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
        primary.FocusStyle = Style{ZIndex: 1, BasedOn: primary.FocusStyle}
        let arrow = Menu.Button with{
            Content = "",
            AccessibilityName = ArrowAccessibilityName ?? theme.Text("More actions"),
            MinWidth = 0.0,
            PaddingHorizontal = theme.Spacing,
            Disabled = Button.Disabled || Button.Loading || Menu.Button.Disabled,
            ConfigureRoot = (resolved ActionButton, text Text, prepared Button) -> {
                let root = prepared
                root.OnClick = resolved.OnClick
                SquareCorners(root, !theme.RightToLeft)
                root.FocusStyle = Style{ZIndex: 1, BasedOn: root.FocusStyle}
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w SplitButton) Blob -> w.Build()
