package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// One stable path segment. The last segment is the current location.
public data struct BreadcrumbItem {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string?
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Leading visual indicator. Nil leaves this slot empty.
    var Icon Blob?
}

/// Path segments, navigation callback, and optional sibling locations.
public data struct BreadcrumbInput {
    /// Path segments from root to current location. Nil supplies no segments. IDs must be stable and unique.
    var Items[]?BreadcrumbItem
    /// Receives the selected item ID after user selection. Nil ignores the request.
    var OnSelect Action[string]?
    /// Leading segments retained during overflow. Zero uses 1.
    var KeepStart int32
    /// Trailing segments retained during overflow. Zero uses 1.
    var KeepEnd int32
    /// Returns sibling destinations for a segment ID. Nil supplies no sibling menu.
    /// Hosts must not change state in this callback.
    var SiblingItems Func[string, []BreadcrumbItem]?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Receives the widget input, the path segment, and the prepared content, and returns the replacement content. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateItem Func[BreadcrumbInput, BreadcrumbItem, Blob, Blob]?
}

/// A keyboard-navigable path that moves hidden middle segments into a menu.
public open class Breadcrumb : Cell[BreadcrumbInput], IDisposable {
    private let rootHandle ElementHandle = ElementHandle()
    private let overflowHandle ElementHandle = ElementHandle()
    private let separatorHandle ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private let widths Dictionary[string, float64] = Dictionary[string, float64](StringComparer.Ordinal)
    private var items[]BreadcrumbItem = []BreadcrumbItem{}
    private var input BreadcrumbInput
    private var theme Theme
    private var firstHidden int32 = -1
    private var lastHidden int32 = -1
    private var active string?
    private var overflowId string = "overflow"
    private var menuOpen bool
    private var menuItems[]MenuItem = []MenuItem{}
    private var menuAnchor ElementHandle?

    /// Subscribes to path geometry to measure overflow. Dispose the breadcrumb to release measurement subscriptions.
    public init() {
        rootHandle.MetricsChanged += Measure
        overflowHandle.MetricsChanged += Measure
        separatorHandle.MetricsChanged += Measure
    }

    /// Releases path measurement subscriptions.
    public func Dispose() {
        rootHandle.MetricsChanged -= Measure
        overflowHandle.MetricsChanged -= Measure
        separatorHandle.MetricsChanged -= Measure
        for handle in handles.Values {
            handle.MetricsChanged -= Measure
        }
    }

    protected open override func Build(value BreadcrumbInput) Blob {
        let nextTheme = Theme.Read()
        let remeasure = nextTheme.FontSize != theme.FontSize ||
            nextTheme.FontFamily != theme.FontFamily ||
            nextTheme.ControlHeight != theme.ControlHeight ||
            nextTheme.ControlPadding != theme.ControlPadding ||
            nextTheme.Spacing != theme.Spacing ||
            !Object.Equals(input.CreateItem, value.CreateItem)
        input = value with{
            KeepStart = value.KeepStart == 0 ? 1: value.KeepStart,
            KeepEnd = value.KeepEnd == 0 ? 1: value.KeepEnd
        }
        theme = nextTheme
        let next = value.Items ?? []BreadcrumbItem{}
        if !Object.ReferenceEquals(items, next) || remeasure {
            items = next
            for handle in handles.Values {
                handle.MetricsChanged -= Measure
            }
            handles.Clear()
            widths.Clear()
            let ids = HashSet[string](StringComparer.Ordinal)
            for item in items {
                if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) {
                    throw ArgumentException("Breadcrumb IDs must be nonempty and unique")
                }
                let handle = ElementHandle()
                handle.MetricsChanged += Measure
                handles.Add(item.Id!!, handle)
            }
            overflowId = "overflow"
            while handles.ContainsKey(overflowId) {
                overflowId += ":"
            }
            firstHidden = -1
            lastHidden = -1
            menuOpen = false
        }
        let visible = List[string]()
        for index in 0 ... items.Length - 1 {
            if index == firstHidden {
                visible.Add(overflowId)
            }
            if firstHidden < 0 || index < firstHidden || index > lastHidden {
                visible.Add(items[index].Id!!)
            }
        }
        let focus = RovingFocus{Ids: visible.ToArray(), ActiveId: active, RightToLeft: theme.RightToLeft, OnMove: Move}
        let root = Container{
            Handle: rootHandle,
            Direction: theme.Direction,
            Width: Percent(100),
            MinWidth: 0,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.Spacing,
            Overflow: Overflow.Hidden,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: value.AccessibilityName ?? theme.Text("Breadcrumb")}
        }
        for index in 0 ... items.Length {
            if index == firstHidden {
                root.Children.Add(
                    Button{
                        Key: overflowId,
                        Handle: overflowHandle,
                        FlexShrink: 0,
                        MinHeight: theme.ControlHeight,
                        Padding: Edges(theme.Spacing, theme.ControlPadding),
                        TabStop: focus.TabStop(overflowId),
                        OnClick: OpenOverflow,
                        OnFocus: (e FocusEvent) -> {
                            if active != overflowId {
                                active = overflowId
                                Rebuild()
                            }
                        },
                        OnKeyDown: (e KeyEvent) -> focus.Handle(e),
                        BackgroundColor: Color.Transparent,
                        TransitionMs: theme.TransitionMs,
                        TransitionEasing: Easing.EaseOut,
                        TransitionProperties: theme.InteractionTransitions,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.Button,
                            Name: theme.Text("Show hidden path"),
                            Expanded: menuOpen
                        },
                        Text{Content: "…", Color: theme.MutedTextColor}
                    }
                )
                theme.ApplyInteraction(root.Children[root.Children.Count - 1], InteractionFamily.Button)
                WidgetKeyBindings.BindActivation(root.Children[root.Children.Count - 1])
                AddChevron(root)
            }
            if firstHidden >= 0 && index >= firstHidden && index <= lastHidden {
                continue
            }
            let item = items[index]
            let id = item.Id!!
            let current = index == items.Length - 1
            let label = Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: theme.Spacing,
                Text{
                    Content: item.Label ?? id,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    Color: current ? theme.TextColor: theme.LinkColor,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis
                }
            }
            if let icon = item.Icon {
                label.Children.Insert(0, icon)
            }
            let content = input.CreateItem?.Invoke(input, item, label) ?? label
            if current {
                root.Children.Add(
                    Container{
                        Key: id,
                        Handle: handles[id],
                        MinWidth: 0,
                        FlexShrink: widths.Count == items.Length ? 1: 0,
                        Accessibility: Accessibility{
                            Role: AccessibilityRole.Text,
                            Name: item.Label ?? id,
                            Description: theme.Text("Current location")
                        },
                        content
                    }
                )
            } else {
                let button = Button{
                    Key: id,
                    Handle: handles[id],
                    FlexShrink: 0,
                    MinHeight: theme.ControlHeight,
                    Padding: Edges(theme.Spacing, theme.ControlPadding),
                    BackgroundColor: Color.Transparent,
                    TabStop: focus.TabStop(id),
                    OnClick: () -> InvokeInputCallback(input.OnSelect, id),
                    OnFocus: (e FocusEvent) -> {
                        if active != id {
                            active = id
                            Rebuild()
                        }
                    },
                    OnKeyDown: (e KeyEvent) -> focus.Handle(e),
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Accessibility: Accessibility{Role: AccessibilityRole.Link, Name: item.Label ?? id},
                    content
                }
                theme.ApplyInteraction(button, InteractionFamily.Button)
                WidgetKeyBindings.BindActivation(button)
                root.Children.Add(button)
            }
            if value.SiblingItems != nil && !current {
                let sibling = Button{
                    Handle: index == 0 ? separatorHandle: nil,
                    FlexShrink: 0,
                    MinHeight: theme.ControlHeight,
                    Padding: Edges(theme.Spacing, theme.ControlPadding),
                    BackgroundColor: Color.Transparent,
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Button,
                        Name: theme.Text("Locations in {0}", item.Label ?? id)
                    },
                    OnClick: () -> OpenSiblings(id),
                    Text{Content: "›", Color: theme.MutedTextColor}
                }
                theme.ApplyInteraction(sibling, InteractionFamily.Button)
                WidgetKeyBindings.BindActivation(sibling)
                root.Children.Add(sibling)
            } else if index < items.Length - 1 {
                AddChevron(root)
            }
        }
        return Container{
            MinWidth: 0,
            Width: Percent(100),
            root,
            Cell.Mount[MenuInput, Menu](
                "path-menu",
                MenuInput{
                    Open: menuOpen,
                    Anchor: menuAnchor,
                    Items: menuItems,
                    AccessibilityName: theme.Text("Path locations"),
                    OnClick: (id string) -> InvokeInputCallback(input.OnSelect, id),
                    OnOpenChange: (isOpen bool) -> {
                        menuOpen = isOpen
                        Rebuild()
                    }
                }
            )
        }
    }

    private func AddChevron(root Container) {
        root.Children.Add(
            Text{
                Handle: root.Children.Count == 1 ? separatorHandle: nil,
                Content: "›",
                FlexShrink: 0,
                Color: theme.MutedTextColor,
                Accessibility: Accessibility{Hidden: true}
            }
        )
    }

    private func Move(id string) {
        active = id
        if id == overflowId {
            overflowHandle.Focus()
        } else {
            handles[id].Focus()
        }
        Rebuild()
    }

    private func OpenOverflow() {
        let entries = List[MenuItem]()
        for index in firstHidden ... lastHidden + 1 {
            let item = items[index]
            entries.Add(MenuItem{Id: item.Id, Label: item.Label})
        }
        menuItems = entries.ToArray()
        menuAnchor = overflowHandle
        menuOpen = true
        Rebuild()
    }

    private func OpenSiblings(id string) {
        let entries = List[MenuItem]()
        for item in input.SiblingItems?.Invoke(id) ?? []BreadcrumbItem{} {
            entries.Add(MenuItem{Id: item.Id, Label: item.Label})
        }
        menuItems = entries.ToArray()
        menuAnchor = handles[id]
        menuOpen = entries.Count > 0
        Rebuild()
    }

    private func Measure(metrics ElementMetrics) {
        if !rootHandle.IsMounted || rootHandle.ContentBox.Width <= 0 {
            return
        }
        let measured = widths.Count == items.Length
        for item in items {
            let handle = handles[item.Id!!]
            if handle.IsMounted && handle.BorderBox.Width > 0 && !widths.ContainsKey(item.Id!!) {
                widths.Add(item.Id!!, handle.BorderBox.Width)
            }
        }
        if widths.Count != items.Length {
            return
        }
        let gap = theme.Spacing * 2 + (separatorHandle.IsMounted ? separatorHandle.BorderBox.Width: theme.FontSize)
        var total = Math.Max(0, items.Length - 1) * gap
        for item in items {
            total += widths[item.Id!!]
        }
        var start = -1
        var end = -1
        if total > rootHandle.ContentBox.Width && items.Length > 2 {
            start = Math.Clamp(input.KeepStart, 1, items.Length - 2)
            end = items.Length - Math.Clamp(input.KeepEnd, 1, items.Length - start - 1) - 1
            let overflowWidth = overflowHandle.IsMounted ? overflowHandle.BorderBox.Width: theme.FontSize + theme.ControlPadding * 2
            var shown = total + overflowWidth + gap
            for index in start ... end + 1 {
                shown -= widths[items[index].Id!!] + gap
            }
            while shown > rootHandle.ContentBox.Width && end < items.Length - 2 {
                end++
                shown -= widths[items[end].Id!!] + gap
            }
            while shown > rootHandle.ContentBox.Width && start > 1 {
                start--
                shown -= widths[items[start].Id!!] + gap
            }
        }
        if !measured || start != firstHidden || end != lastHidden {
            firstHidden = start
            lastHidden = end
            Rebuild()
        }
    }
}

/// A breadcrumb for file paths with optional sibling location menus.
public class PathBar : Breadcrumb {
    protected override func Build(input BreadcrumbInput) Blob -> base.Build(
        input with{AccessibilityName = input.AccessibilityName ?? Theme.Read().Text("Path")}
    )
}
