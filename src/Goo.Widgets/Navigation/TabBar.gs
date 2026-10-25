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

/// Panel edge that contains the tabs. Start and End follow the theme direction. The indicator faces the panel.
public enum TabPlacement {
    Top;
    Bottom;
    Start;
    End
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

/// Tabs with one Tab stop and disabled-aware arrow navigation. With OverflowMenu, horizontal tabs show only whole tabs.
public open class TabBar : Cell[TabBarInput] {
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var input TabBarInput
    private var items[]NavigationItem = []NavigationItem{}
    private var focusedId string?
    private var hasFocus bool
    private var overflowOpen bool
    private var rightToLeft bool

    protected override func Build(value TabBarInput) Blob {
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        items = value.Items ?? []NavigationItem{}
        input = value with{
            Items = items,
            Vertical = value.Vertical || value.Placement == TabPlacement.Start || value.Placement == TabPlacement.End,
            PinnedIds = value.PinnedIds ?? []string{},
            DirtyIds = value.DirtyIds ?? []string{},
            AccessibilityName = value.AccessibilityName ?? theme.Text("Tabs"),
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
                JustifyContent: input.Vertical ? JustifyContent.FlexStart: JustifyContent.Center,
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
                button.Children.Add(Container{Width: 6, Height: 6, BorderRadius: 3, BackgroundColor: theme.MutedTextColor})
            }
            if input.Badges != nil && input.Badges!!.TryGetValue(id, out var badge) {
                button.Children.Add(Text{Content: badge, FontSize: theme.CaptionFontSize})
                name += ", " + badge
            }
            button.Accessibility!!.Name = name + (dirty ? ", unsaved": "") + (pinned ? ", pinned": "")
            var indicator Container? = nil
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
                    if input.Placement == TabPlacement.Start {
                        marker.End = 0
                    } else {
                        marker.Start = 0
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
                indicator = marker
            }
            if input.OnClose != nil && !pinned {
                button.PaddingEnd = 0
                button.BackgroundColor = Color.Transparent
                button.Hover = Style{}
                let tab = Container{
                    Key: id,
                    FlexDirection: FlexDirection.Row,
                    FlexShrink: 0,
                    AlignItems: AlignItems.Center,
                    PaddingEnd: theme.Spacing * 2,
                    BackgroundColor: active ? theme.ActiveColor: theme.PanelColor,
                    Hover: Style{BackgroundColor: theme.HoverColor},
                    button
                }
                let close = Button{
                    Key: "close-" + id,
                    Width: 20,
                    Height: 20,
                    BorderRadius: theme.RadiusSm,
                    AlignItems: AlignItems.Center,
                    JustifyContent: JustifyContent.Center,
                    Color: theme.MutedTextColor,
                    Hover: Style{BackgroundColor: theme.PressedColor, Color: theme.TextColor},
                    Disabled: item.Disabled,
                    Focusable: !item.Disabled,
                    TabStop: false,
                    OnClick: () -> input.OnClose?.Invoke(id),
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text("Close {0}", item.Label!!)},
                    Focus: theme.FocusStyle,
                    Text{Content: "×", FontSize: theme.FontSize},
                }
                WidgetKeyBindings.BindActivation(close)
                tab.Children.Add(close)
                if let marker = indicator {
                    tab.Children.Add(marker)
                }
                buttons[buttons.Count - 1] = tab
            } else if let marker = indicator {
                button.Children.Add(marker)
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
        root.Direction = theme.Direction
        root.FlexDirection = input.Vertical ? FlexDirection.Column: FlexDirection.Row
        root.OverflowX = input.Vertical || input.OverflowMenu ? Overflow.Hidden: Overflow.Scroll
        root.OverflowY = input.Vertical ? Overflow.Scroll: Overflow.Hidden
        if !input.Vertical && input.OverflowMenu {
            var visible = -1
            let shown = hasFocus && focused ? focusedId: input.SelectedId
            for index in 0 ... items.Length {
                if items[index].Id == shown {
                    visible = index
                }
            }
            root.Layout = WholeTabsLayout(visible, theme.Spacing / 2.0, rightToLeft)
        }
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
            Direction: theme.Direction,
            Width: input.Width!!,
            Height: input.Height ?? Length.Auto,
            MinHeight: 0,
            MinWidth: 0,
            FlexDirection: input.Vertical ? FlexDirection.Column: FlexDirection.Row,
            root,
        }
        if input.OnAdd != nil {
            outer.Children.Add(
                ActionButton{Content: "+", AccessibilityName: theme.Text("Add tab"), MinWidth: 32, OnClick: input.OnAdd}.Build()
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
                        Button: ActionButton{AccessibilityName: theme.Text("All tabs"), MinWidth: 32},
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
            (item NavigationItem) -> item.Disabled,
            rightToLeft
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

internal class WholeTabsLayout(Visible int32, Gap float64, RightToLeft bool) : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        var width = 0.0
        var height = 0.0
        for index in 0 ... context.ChildCount {
            let size = context.MeasureChild(index, LayoutSize{Width: Double.PositiveInfinity, Height: available.Height})
            width += size.Width + (index > 0 ? Gap: 0.0)
            height = Math.Max(height, size.Height)
        }
        return LayoutSize{Width: Math.Min(available.Width, width), Height: height}
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        let widths = [context.ChildCount]float64
        for index in 0 ... widths.Length {
            widths[index] = context.MeasureChild(
                index,
                LayoutSize{Width: Double.PositiveInfinity, Height: finalSize.Height}
            ).Width
        }
        var start int32 = 0
        var end = End(widths, start, finalSize.Width)
        while Visible >= end && start < Visible {
            start++
            end = End(widths, start, finalSize.Width)
        }
        var x = 0.0
        for index in 0 ... widths.Length {
            if index >= start && index < end {
                let x0 = RightToLeft ? finalSize.Width - x - widths[index]: x
                context.ArrangeChild(index, ElementRect{X: x0, Width: widths[index], Height: finalSize.Height})
                x += widths[index] + Gap
            } else {
                context.ArrangeChild(
                    index,
                    ElementRect{
                        X: RightToLeft ? -widths[index] - Gap: finalSize.Width + Gap,
                        Width: widths[index],
                        Height: finalSize.Height
                    }
                )
            }
        }
    }

    private func End(widths[]float64, start int32, width float64) int32 {
        var x = 0.0
        var index = start
        while index < widths.Length && (index == start || x + widths[index] <= width) {
            x += widths[index] + Gap
            index++
        }
        return index
    }
}
