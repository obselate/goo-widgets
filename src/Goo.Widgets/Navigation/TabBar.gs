package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// Whether arrow-key focus also requests selection, or Enter/Space must activate.
public enum TabActivation {
    Automatic;
    Manual
}

/// Controlled horizontal peer navigation. The host owns panel content and lifetime.
public data struct TabBarInput {
    /// Ordered entries with unique, nonempty IDs. Nil resolves to an empty list.
    var Items[]?NavigationItem
    /// Controlled selected ID.
    var SelectedId string?
    /// Receives enabled tab activation requests.
    var OnSelect Action[string]?
    /// Automatic selection on arrow-key navigation is the default.
    var Activation TabActivation
    /// Accessible tab-list name. Nil resolves to Tabs.
    var AccessibilityName string?
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Minimum tab height. Nil resolves to 40.
    var ItemHeight float64?
    /// Customizes item appearance; required identity, focus, handlers, and semantics are reapplied.
    var CreateItem Func[TabBarInput, NavigationItem, Button, Button]?
    /// Customizes root appearance; ordered children and horizontal tab-list semantics are reapplied.
    var CreateRoot Func[TabBarInput, Container, Container]?
}

/// Horizontal scrolling tabs with one Tab stop and disabled-aware arrow navigation.
public open class TabBar : Cell[TabBarInput] {
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var input TabBarInput
    private var items[]NavigationItem = []NavigationItem{}
    private var focusedId string?
    private var hasFocus bool

    protected override func Build(value TabBarInput) Blob {
        items = value.Items ?? []NavigationItem{}
        input = value with{
            Items = items,
            AccessibilityName = value.AccessibilityName ?? "Tabs",
            Width = value.Width ?? Length.Percent(100),
            ItemHeight = value.ItemHeight ?? 40.0
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
                PaddingLeft: 16,
                PaddingRight: 16,
                FlexShrink: 0,
                Color: active ? "#fafafa": "#a1a1aa",
                BackgroundColor: active ? "#3f3f46": "#18181b",
                Hover: Style{BackgroundColor: "#27272a"},
                Focus: Style{OutlineWidth: 1, OutlineColor: "#a1a1aa", OutlineOffset: -2},
                item.Content ?? Text{Content: item.Label!!, TextWrap: TextWrap.NoWrap},
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
        }
        var root = Container{Width: input.Width!!, MinWidth: 0, Gap: 2, BackgroundColor: "#18181b"}
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.FlexDirection = FlexDirection.Row
        root.OverflowX = Overflow.Scroll
        root.OverflowY = Overflow.Hidden
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.TabList,
            Name: input.AccessibilityName!!,
            Orientation: AccessibilityOrientation.Horizontal
        }
        root.Children.Clear()
        for button in buttons {
            root.Children.Add(button)
        }
        return root
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
            input.OnSelect?.Invoke(id)
        }
    }

    private func KeyDown(id string, e KeyEvent) {
        if !Enabled(id) {
            return
        }
        var index = -1
        for i in 0 ... items.Length {
            if items[i].Id == id {
                index = i
                break
            }
        }
        var direction int32
        if e.Key == Key.Right {
            direction = 1
        } else if e.Key == Key.Left {
            direction = -1
        } else if e.Key == Key.Home {
            direction = 1
            index = -1
        } else if e.Key == Key.End {
            direction = -1
            index = items.Length
        } else {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        for attempt in 0 ... items.Length {
            index = (index + direction + items.Length) % items.Length
            let item = items[index]
            if item.Disabled {
                continue
            }
            let handle = handles[item.Id!!]
            handle.Focus()
            handle.ScrollIntoView()
            if input.Activation == TabActivation.Automatic {
                Select(item.Id!!)
            }
            return
        }
    }
}
