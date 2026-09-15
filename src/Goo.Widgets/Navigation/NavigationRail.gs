package Goo.Widgets.Navigation

import Goo

/// A controlled vertical navigation rail that can show compact or expanded items.
public data struct NavigationRail {
    /// Ordered navigation entries. Nil resolves to an empty list.
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
    var CreateItem Func[NavigationRail, NavigationItem, Button]?
    /// Creates the rail root from resolved values and item buttons.
    var CreateRoot Func[NavigationRail, []Button, Container]?

    /// Builds a fresh Goo navigation tree.
    public func Build() Blob {
        let createItem = CreateItem
        let createRoot = CreateRoot
        let onSelect = OnSelect
        let items = Items ?? []NavigationItem{}
        let resolved = this with{
            Items = items,
            AccessibilityName = AccessibilityName ?? "Navigation",
            CollapsedWidth = if CollapsedWidth == 0.0 {
                64.0
            } else {
                CollapsedWidth
            },
            ExpandedWidth = if ExpandedWidth == 0.0 {
                220.0
            } else {
                ExpandedWidth
            },
            Height = Height ?? Length.Percent(100.0),
            ItemHeight = if ItemHeight == 0.0 {
                44.0
            } else {
                ItemHeight
            },
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
            FontSize = if FontSize == 0.0 {
                13.0
            } else {
                FontSize
            },
            FontWeight = if FontWeight == 0 {
                600
            } else {
                FontWeight
            },
            Opacity = Opacity ?? 1.0,
            Transform = Transform ?? PanelTransform{},
            CreateItem = nil,
            CreateRoot = nil,
        }

        let buttons = [items.Length]Button
        for index in 0 ... items.Length {
            let source = items[index]
            let id = source.Id ?? ""
            let label = source.Label ?? id
            let item = source with{Id = id, Label = label, AccessibilityName = source.AccessibilityName ?? label,}
            if let createItem = createItem {
                buttons[index] = createItem(resolved, item)
            } else {
                let selected = id == resolved.SelectedId
                var onClick Action? = nil
                if !item.Disabled {
                    if let onSelect = onSelect {
                        onClick = () -> onSelect(id)
                    }
                }
                let button = Button{
                    Key: id,
                    Width: Length.Percent(100.0),
                    Height: resolved.ItemHeight,
                    PaddingLeft: resolved.ItemPaddingHorizontal!!,
                    PaddingRight: resolved.ItemPaddingHorizontal!!,
                    Gap: resolved.ItemGap!!,
                    BorderRadius: resolved.ItemBorderRadius!!,
                    BackgroundColor: if selected {
                        resolved.SelectedBackgroundColor!!
                    } else {
                        resolved.ItemBackgroundColor!!
                    },
                    Color: if selected {
                        resolved.SelectedTextColor!!
                    } else {
                        resolved.TextColor!!
                    },
                    Hover: Style{BackgroundColor: resolved.HoverBackgroundColor!!},
                    Cursor: if item.Disabled {
                        Cursor.Default
                    } else {
                        Cursor.Pointer
                    },
                    Focusable: true,
                    Disabled: item.Disabled,
                    OnClick: onClick,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    JustifyContent: if resolved.Expanded {
                        JustifyContent.FlexStart
                    } else {
                        JustifyContent.Center
                    },
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Tab,
                        Name: item.AccessibilityName!!,
                        Selected: selected,
                    },
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
                buttons[index] = button
            }
        }

        if let createRoot = createRoot {
            return createRoot(resolved, buttons)
        }
        let root = Container{
            Width: if resolved.Expanded {
                resolved.ExpandedWidth
            } else {
                resolved.CollapsedWidth
            },
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
}
