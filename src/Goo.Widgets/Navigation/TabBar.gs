package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import System
import System.Collections.Generic

/// Whether arrow-key focus also requests selection, or Enter/Space must activate.
public enum TabActivation {
    Automatic;
    Manual
}

/// Panel edge that contains the tabs. The indicator faces the panel.
public enum TabPlacement {
    Top;
    Bottom;
    Left;
    Right
}

/// Controlled peer navigation. The host owns panel content and lifetime.
public data struct TabBarInput {
    /// Ordered entries with unique, nonempty IDs. Nil resolves to an empty list.
    var Items[]?NavigationItem
    /// Controlled selected ID.
    var SelectedId string?
    /// Receives enabled tab activation requests.
    var OnSelect Action[string]?
    /// Automatic selection on arrow-key navigation is the default.
    var Activation TabActivation
    var Placement TabPlacement
    var Vertical bool
    var ShowIndicator bool?
    var Badges Dictionary[string, string]?
    var OnClose Action[string]?
    var OnAdd Action?
    var PinnedIds[]?string
    var DirtyIds[]?string
    var PreviewId string?
    /// Ctrl+Shift and the directional arrow request a new index.
    var OnReorder Action[string, int32]?
    var OverflowMenu bool
    /// Accessible tab-list name. Nil resolves to Tabs.
    var AccessibilityName string?
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Root height. Nil keeps natural height.
    var Height Length?
    /// Minimum tab height. Nil uses the theme's control height.
    var ItemHeight float64?
    /// Customizes item appearance; required identity, focus, handlers, and semantics are reapplied.
    var CreateItem Func[TabBarInput, NavigationItem, Button, Button]?
    /// Customizes root appearance. Ordered children and tab-list semantics are reapplied.
    var CreateRoot Func[TabBarInput, Container, Container]?
}

/// Scrolling tabs with one Tab stop and disabled-aware arrow navigation.
public open class TabBar : Cell[TabBarInput] {
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var input TabBarInput
    private var items[]NavigationItem = []NavigationItem{}
    private var focusedId string?
    private var hasFocus bool
    private var overflowOpen bool

    protected override func Build(value TabBarInput) Blob {
        let theme = Theme.Read()
        items = value.Items ?? []NavigationItem{}
        input = value with{
            Items = items,
            Vertical = value.Vertical || value.Placement == TabPlacement.Left || value.Placement == TabPlacement.Right,
            PinnedIds = value.PinnedIds ?? []string{},
            DirtyIds = value.DirtyIds ?? []string{},
            AccessibilityName = value.AccessibilityName ?? "Tabs",
            Width = value.Width ?? Percent(100),
            ItemHeight = value.ItemHeight ?? theme.ControlHeight
        }
        if !Double.IsFinite(input.ItemHeight!!) || input.ItemHeight!!< 0.0 {
            throw ArgumentOutOfRangeException("ItemHeight")
        }
        let ids = HashSet[string](StringComparer.Ordinal)
        var first string?
        for item in items {
            if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) {
                throw ArgumentException("Tab IDs must be nonempty and unique")
            }
            if !handles.ContainsKey(item.Id!!) {
                handles.Add(item.Id!!, ElementHandle())
            }
            if first == nil && !item.Disabled {
                first = item.Id
            }
        }
        let removed = List[string]()
        for entry in handles {
            if !ids.Contains(entry.Key) {
                removed.Add(entry.Key)
            }
        }
        for id in removed {
            handles.Remove(id)
        }
        let focused = Enabled(focusedId)
        let selected = Enabled(input.SelectedId)
        let tabStop = hasFocus && focused ? focusedId: selected ? input.SelectedId: first
        let buttons = List[Blob](items.Length)
        for source in items {
            let id = source.Id!!
            let item = source with{
                Label = source.Label ?? id,
                AccessibilityName = source.AccessibilityName ?? source.Label ?? id
            }
            let active = id == input.SelectedId
            var button = Button{
                Opacity: item.Disabled ? .45: 1.0,
                Cursor: item.Disabled ? Cursor.Default: Cursor.Pointer,
                MinHeight: input.ItemHeight!!,
                Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                FlexShrink: 0,
                Color: active ? theme.TextColor: theme.MutedTextColor,
                FontStyle: id == input.PreviewId ? FontStyle.Italic: FontStyle.Normal,
                BackgroundColor: active ? theme.ActiveColor: theme.PanelColor,
                Hover: Style{BackgroundColor: theme.HoverColor},
                Focus: Style{OutlineWidth: 2.0, OutlineColor: theme.FocusColor, OutlineOffset: -2.0},
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: theme.ControlGap,
                item.Content ??
                    Text{
                    Content: item.Label!!,
                    TextWrap: TextWrap.NoWrap,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    FontWeight: theme.LabelFontWeight,
                },
            }
            if let create = input.CreateItem {
                button = create(input, item, button)
            }
            button.Key = id
            button.Handle = handles[id]
            button.Disabled = item.Disabled
            button.Focusable = !item.Disabled
            button.TabStop = id == tabStop
            button.OnClick = () -> Select(id)
            WidgetKeyBindings.BindActivation(button)
            button.OnFocus = (e FocusEvent) -> {
                focusedId = id
                hasFocus = true
                Rebuild()
            }
            button.OnBlur = (e FocusEvent) -> {
                hasFocus = false
                Rebuild()
            }
            button.OnKeyDown = (e KeyEvent) -> KeyDown(id, e)
            button.Accessibility = Accessibility{
                Role: AccessibilityRole.Tab,
                Name: item.AccessibilityName!!,
                Selected: active
            }
            buttons.Add(button)
            let pinned = Array.IndexOf(input.PinnedIds!!, id) >= 0
            let dirty = Array.IndexOf(input.DirtyIds!!, id) >= 0
            var name = item.AccessibilityName!!
            if dirty {
                button.Children.Add(Text{Content: "●", FontSize: theme.CaptionFontSize})
            }
            if input.Badges != nil && input.Badges!!.TryGetValue(id, out var badge) {
                button.Children.Add(Text{Content: badge, FontSize: theme.CaptionFontSize})
                name += ", " + badge
            }
            button.Accessibility!!.Name = name + (dirty ? ", unsaved": "") + (pinned ? ", pinned": "")
            if active && (input.ShowIndicator ?? true) {
                let marker = Container{
                    Position: PositionType.Absolute,
                    BackgroundColor: theme.AccentColor,
                    HitTestSelf: false
                }
                if input.Vertical {
                    marker.Width = 2
                    marker.Top = 0
                    marker.Bottom = 0
                    if input.Placement == TabPlacement.Left {
                        marker.Right = 0
                    } else {
                        marker.Left = 0
                    }
                } else {
                    marker.Height = 2
                    marker.Left = 0
                    marker.Right = 0
                    if input.Placement == TabPlacement.Bottom {
                        marker.Top = 0
                    } else {
                        marker.Bottom = 0
                    }
                }
                button.Children.Add(marker)
            }
            if input.OnClose != nil && !pinned {
                let tab = Container{
                    Key: id,
                    FlexDirection: FlexDirection.Row,
                    FlexShrink: 0,
                    AlignItems: AlignItems.Center,
                    button
                }
                let close = Button{
                    Key: "close-" + id,
                    Width: 28,
                    MinHeight: input.ItemHeight!!,
                    Disabled: item.Disabled,
                    Focusable: !item.Disabled,
                    TabStop: false,
                    OnClick: () -> input.OnClose?.Invoke(id),
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Close " + item.Label!!},
                    Focus: theme.FocusStyle,
                    Text{Content: "×", FontSize: theme.FontSize},
                }
                WidgetKeyBindings.BindActivation(close)
                tab.Children.Add(close)
                buttons[buttons.Count - 1] = tab
            }
        }
        var root = Container{
            LineHeight: theme.LineHeight,
            Width: input.Width!!,
            Height: input.Height ?? Length.Auto,
            MinHeight: 0,
            MinWidth: 0,
            Gap: theme.Spacing / 2.0,
            BackgroundColor: theme.PanelColor,
            ScrollbarX: theme.Scrollbar,
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.FlexDirection = input.Vertical ? FlexDirection.Column: FlexDirection.Row
        root.OverflowX = input.Vertical ? Overflow.Hidden: Overflow.Scroll
        root.OverflowY = input.Vertical ? Overflow.Scroll: Overflow.Hidden
        root.ScrollbarY = theme.Scrollbar
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.TabList,
            Name: input.AccessibilityName!!,
            Orientation: input.Vertical ? AccessibilityOrientation.Vertical: AccessibilityOrientation.Horizontal
        }
        root.Children.Clear()
        for button in buttons {
            root.Children.Add(button)
        }
        if !input.OverflowMenu && input.OnAdd == nil {
            return root
        }
        root.Width = input.Vertical ? Percent(100): Length.Auto
        root.FlexGrow = 1
        root.FlexShrink = 1
        root.FlexBasis = 0
        let outer = Container{
            Width: input.Width!!,
            Height: input.Height ?? Length.Auto,
            MinHeight: 0,
            MinWidth: 0,
            FlexDirection: input.Vertical ? FlexDirection.Column: FlexDirection.Row,
            root,
        }
        if input.OnAdd != nil {
            outer.Children.Add(
                ActionButton{Content: "+", AccessibilityName: "Add tab", MinWidth: 32, OnClick: input.OnAdd}.Build()
            )
        }
        if input.OverflowMenu {
            let entries = [items.Length]MenuItem
            for index in 0 ... items.Length {
                entries[index] = MenuItem{
                    Id: items[index].Id,
                    Label: items[index].Label,
                    Disabled: items[index].Disabled
                }
            }
            outer.Children.Add(
                Cell.Mount[MenuButtonInput, MenuButton](
                    "overflow",
                    MenuButtonInput{
                        Button: ActionButton{AccessibilityName: "All tabs", MinWidth: 32},
                        Open: overflowOpen,
                        Items: entries,
                        OnActivate: Select,
                        OnOpenChange: (isOpen bool) -> {
                            overflowOpen = isOpen
                            Rebuild()
                        },
                    }
                )
            )
        }
        return outer
    }

    private func Enabled(id string?) bool {
        if id == nil {
            return false
        }
        for item in items {
            if item.Id == id {
                return !item.Disabled
            }
        }
        return false
    }

    private func Select(id string) {
        if Enabled(id) {
            handles[id].ScrollIntoView()
            input.OnSelect?.Invoke(id)
        }
    }

    private func KeyDown(id string, e KeyEvent) {
        if !Enabled(id) {
            return
        }
        if e.Key == Key.Delete || (e.Key == Key.W && (e.Modifiers.Ctrl || e.Modifiers.Super)) {
            if input.OnClose != nil && Array.IndexOf(input.PinnedIds!!, id) < 0 {
                e.PreventDefault()
                e.StopPropagation()
                if !e.Repeat {
                    input.OnClose?.Invoke(id)
                }
            }
            return
        }
        var index = -1
        for i in 0 ... items.Length {
            if items[i].Id == id {
                index = i
                break
            }
        }
        let next = RovingFocus.Next[NavigationItem](
            items,
            index,
            e.Key,
            input.Vertical ? AccessibilityOrientation.Vertical: AccessibilityOrientation.Horizontal,
            true,
            (item NavigationItem) -> item.Disabled
        )
        if next < 0 {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        if e.Modifiers.Ctrl && e.Modifiers.Shift && input.OnReorder != nil {
            if !e.Repeat {
                input.OnReorder?.Invoke(id, next)
            }
            return
        }
        let item = items[next]
        let handle = handles[item.Id!!]
        handle.Focus()
        handle.ScrollIntoView()
        if input.Activation == TabActivation.Automatic {
            Select(item.Id!!)
        }
    }
}
