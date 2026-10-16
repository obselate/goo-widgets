package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// A controlled vertical navigation rail that can show compact or expanded items.
public data struct NavigationRailInput {
    /// Ordered navigation entries with unique, nonempty IDs. Nil resolves to an empty list.
    var Items[]?NavigationItem
    /// ID of the selected entry.
    var SelectedId string?
    /// Whether labels and the expanded width are used.
    var Expanded bool
    /// Called with an enabled item's ID when it is activated.
    var OnSelect Action[string]?
    /// Accessible tab-list name. Nil resolves to "Navigation".
    var AccessibilityName string?
    /// Width while collapsed. Zero resolves to 64.
    var CollapsedWidth float64
    /// Width while expanded. Zero resolves to 220.
    var ExpandedWidth float64
    /// Height. Nil resolves to 100%.
    var Height Length?
    /// Item height. Zero resolves to 44.
    var ItemHeight float64
    /// Gap between items. Nil resolves to 4 and preserves explicit zero.
    var Gap float64?
    /// Horizontal item padding. Nil resolves to 10 and preserves explicit zero.
    var ItemPaddingHorizontal float64?
    /// Item content gap. Nil resolves to 10 and preserves explicit zero.
    var ItemGap float64?
    /// Item corner radius. Nil resolves to 6 and preserves explicit zero.
    var ItemBorderRadius float64?
    /// Rail background. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Normal item background. Nil resolves to transparent.
    var ItemBackgroundColor Color?
    /// Selected item background. Nil resolves to #27272a.
    var SelectedBackgroundColor Color?
    /// Hover item background. Nil resolves to #27272a.
    var HoverBackgroundColor Color?
    /// Normal text color. Nil resolves to #a1a1aa.
    var TextColor Color?
    /// Selected text color. Nil resolves to #fafafa.
    var SelectedTextColor Color?
    /// Label font size. Zero resolves to 13.
    var FontSize float64
    /// Label font weight. Zero resolves to 600.
    var FontWeight int32
    /// Optional label font family.
    var FontFamily string?
    /// Rail opacity. Nil resolves to 1 and preserves explicit zero.
    var Opacity float64?
    /// Rail transform. Nil resolves to identity.
    var Transform PanelTransform?
    /// Creates an item button from resolved rail and item values.
    var CreateItem Func[NavigationRailInput, NavigationItem, Button]?
    /// Creates the rail root from resolved values and item buttons.
    var CreateRoot Func[NavigationRailInput, []Button, Container]?

    internal func Resolve() NavigationRailInput -> this with{
        Items = Items ?? []NavigationItem{},
        AccessibilityName = AccessibilityName ?? "Navigation",
        CollapsedWidth = CollapsedWidth == 0.0 ? 64.0: CollapsedWidth,
        ExpandedWidth = ExpandedWidth == 0.0 ? 220.0: ExpandedWidth,
        Height = Height ?? Percent(100.0),
        ItemHeight = ItemHeight == 0.0 ? 44.0: ItemHeight,
        Gap = Gap ?? 4.0,
        ItemPaddingHorizontal = ItemPaddingHorizontal ?? 10.0,
        ItemGap = ItemGap ?? 10.0,
        ItemBorderRadius = ItemBorderRadius ?? 6.0,
        BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
        ItemBackgroundColor = ItemBackgroundColor ?? Color.Transparent,
        SelectedBackgroundColor = SelectedBackgroundColor ?? Color.Parse("#27272a"),
        HoverBackgroundColor = HoverBackgroundColor ?? Color.Parse("#27272a"),
        TextColor = TextColor ?? Color.Parse("#a1a1aa"),
        SelectedTextColor = SelectedTextColor ?? Color.Parse("#fafafa"),
        FontSize = FontSize == 0.0 ? 13.0: FontSize,
        FontWeight = FontWeight == 0 ? 600: FontWeight,
        Opacity = Opacity ?? 1.0,
        Transform = Transform ?? PanelTransform{},
        CreateItem = nil,
        CreateRoot = nil,
    }
}

/// A mounted vertical navigation rail with one tab stop and caller-owned selection.
public open class NavigationRail : Cell[NavigationRailInput] {
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var input NavigationRailInput
    private var items[]NavigationItem = []NavigationItem{}
    private var focusedId string?
    private var hasFocus bool

    protected override func Build(value NavigationRailInput) Blob {
        input = value.Resolve()
        let resolved = input
        let createItem = value.CreateItem
        let createRoot = value.CreateRoot
        items = input.Items!!
        let ids = HashSet[string](StringComparer.Ordinal)
        var first string?
        for item in items {
            if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) {
                throw ArgumentException("Rail IDs must be nonempty and unique")
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
        let tabStop = hasFocus && Enabled(focusedId) ? focusedId: Enabled(input.SelectedId) ? input.SelectedId: first

        let buttons = [items.Length]Button
        for index in 0 ... items.Length {
            let source = items[index]
            let id = source.Id ?? ""
            let label = source.Label ?? id
            let item = source with{Id = id, Label = label, AccessibilityName = source.AccessibilityName ?? label,}
            var button Button
            if let createItem = createItem {
                button = createItem(resolved, item)
            } else {
                let selected = id == resolved.SelectedId
                button = Button{
                    Key: id,
                    Width: Percent(100.0),
                    Height: resolved.ItemHeight,
                    Padding: Edges{Right: resolved.ItemPaddingHorizontal!!, Left: resolved.ItemPaddingHorizontal!!},
                    Gap: resolved.ItemGap!!,
                    BorderRadius: resolved.ItemBorderRadius!!,
                    BackgroundColor: selected ? resolved.SelectedBackgroundColor!!: resolved.ItemBackgroundColor!!,
                    Color: selected ? resolved.SelectedTextColor!!: resolved.TextColor!!,
                    Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
                    Cursor: item.Disabled ? Cursor.Default: Cursor.Pointer,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    JustifyContent: resolved.Expanded ? JustifyContent.FlexStart: JustifyContent.Center,
                }
                if let content = item.Content {
                    button.Children.Add(content)
                }
                if resolved.Expanded || item.Content == nil {
                    let text = Text{
                        Content: label,
                        FontSize: resolved.FontSize,
                        FontWeight: resolved.FontWeight,
                        TextWrap: TextWrap.NoWrap,
                        TextTrimming: TextTrimming.Ellipsis,
                    }
                    if let fontFamily = resolved.FontFamily {
                        text.FontFamily = fontFamily
                    }
                    button.Children.Add(text)
                }
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
                Selected: id == input.SelectedId,
            }
            buttons[index] = button
        }

        if let createRoot = createRoot {
            return createRoot(resolved, buttons)
        }
        let root = Container{
            Width: resolved.Expanded ? resolved.ExpandedWidth: resolved.CollapsedWidth,
            Height: resolved.Height!!,
            Gap: resolved.Gap!!,
            BackgroundColor: resolved.BackgroundColor!!,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            FlexDirection: FlexDirection.Column,
            Accessibility: Accessibility{
                Role: AccessibilityRole.TabList,
                Name: resolved.AccessibilityName!!,
                Orientation: AccessibilityOrientation.Vertical,
            },
        }
        for button in buttons {
            root.Children.Add(button)
        }
        return root
    }

    private func Enabled(id string?) bool {
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
        if e.Key == Key.Down {
            direction = 1
        } else if e.Key == Key.Up {
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
            if !item.Disabled {
                let handle = handles[item.Id!!]
                handle.Focus()
                handle.ScrollIntoView()
                return
            }
        }
    }
}
