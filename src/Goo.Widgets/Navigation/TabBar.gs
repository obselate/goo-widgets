package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import System
import System.Collections.Generic

/// Whether arrow-key focus also requests selection, or Enter/Space must activate.
public enum TabActivation {
    /// Selects a tab as keyboard focus moves to it.
    Automatic;
    /// Selects the focused tab only on explicit activation.
    Manual
}

/// Panel edge that contains the tabs. Start and End follow the theme direction. The indicator faces the panel.
public enum TabPlacement {
    /// Places tabs above the associated content.
    Top;
    /// Places tabs below the associated content.
    Bottom;
    /// Places tabs at the content start edge.
    Start;
    /// Places tabs at the content end edge.
    End
}

/// Controlled peer navigation. The host owns panel content and lifetime.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
public data struct TabBarInput {
    /// Ordered entries with unique, nonempty IDs. Nil resolves to an empty list.
    var Items[]?NavigationItem
    /// Controlled selected ID.
    var SelectedId string?
    /// Receives enabled tab activation requests.
    var OnSelect Action[string]?
    /// Automatic selection on arrow-key navigation is the default.
    var Activation TabActivation
    /// Panel edge containing the tabs. Start and End follow the theme direction. Top is the default.
    var Placement TabPlacement
    /// Uses vertical tab layout. Placement at Start or End also selects vertical layout.
    var Vertical bool
    /// Shows the selected-tab indicator. Nil means true.
    var ShowIndicator bool?
    /// Badge text indexed by tab ID. Nil supplies no badges.
    var Badges Dictionary[string, string]?
    /// Receives the tab ID when its close action is activated. Nil hides close actions.
    var OnClose Action[string]?
    /// Requests a new tab when the add action is activated. Nil hides the add action.
    var OnAdd Action?
    /// IDs of tabs with pinned presentation and no close action. Nil pins no tabs.
    var PinnedIds[]?string
    /// IDs of tabs with unsaved-change indicators. Nil marks no tabs as dirty.
    var DirtyIds[]?string
    /// ID of the temporary preview tab. Nil marks no tab as preview.
    var PreviewId string?
    /// Ctrl+Shift and the directional arrow request a new index.
    var OnReorder Action[string, int32]?
    /// Moves overflowing whole horizontal tabs into a menu instead of clipping them.
    var OverflowMenu bool
    /// Accessible tab-list name. Nil resolves to Tabs.
    var AccessibilityName string?
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Root height. Nil keeps natural height.
    var Height Length?
    /// Minimum tab height. Nil uses the theme's control height.
    var ItemHeight float64?
    /// Configures the fresh item before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Role, Accessibility.Selected, Disabled, Focusable, Handle, Key, KeyBindings (required entries), OnBlur, OnClick, OnFocus, OnKeyDown, TabStop.
    var ConfigureItem Action[TabBarInput, NavigationItem, Button]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Orientation, Accessibility.Role, Layout.
    var ConfigureRoot Action[TabBarInput, Container]?
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
                Cursor: item.Disabled ? Cursor.Default: Cursor.Pointer,
                MinHeight: input.ItemHeight!!,
                Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                FlexShrink: 0,
                MaxWidth: Percent(100),
                BorderWidth: theme.HighContrast ? theme.BorderWidth: 0,
                BorderColor: Color.Transparent,
                Color: active ? theme.TextColor: theme.ChromeTextColor,
                FontStyle: id == input.PreviewId ? FontStyle.Italic: FontStyle.Normal,
                BackgroundColor: active ? theme.ActiveColor: theme.ChromeColor,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                FocusStyle: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: input.Vertical ? JustifyContent.FlexStart: JustifyContent.Center,
                Gap: theme.ControlGap,
                item.Content ??
                    Text{
                    Content: item.Label!!,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                    MinWidth: 0,
                    FlexShrink: 1,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    FontWeight: theme.LabelFontWeight,
                },
            }
            if let configure = input.ConfigureItem {
                let originalAccessibilityName = (button.Accessibility?.Name ?? "")
                let originalAccessibilityRole = (button.Accessibility?.Role ?? AccessibilityRole(0))
                let originalAccessibilitySelected = button.Accessibility?.Selected
                let originalDisabled = button.Disabled
                let originalFocusable = button.Focusable
                let originalHandle = button.Handle
                let originalKey = button.Key
                let originalOnBlur = button.OnBlur
                let originalOnClick = button.OnClick
                let originalOnFocus = button.OnFocus
                let originalOnKeyDown = button.OnKeyDown
                let originalTabStop = button.TabStop
                configure.Invoke(input, item, button)
                if (button.Accessibility?.Name ?? "") != originalAccessibilityName {
                    throw InvalidOperationException("TabBar owns Accessibility.Name; set TabBarInput.AccessibilityName instead of changing it in ConfigureItem")
                }
                if (button.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                    throw InvalidOperationException("TabBar owns Accessibility.Role; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.Accessibility?.Selected != originalAccessibilitySelected {
                    throw InvalidOperationException("TabBar owns Accessibility.Selected; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.Disabled != originalDisabled {
                    throw InvalidOperationException("TabBar owns Disabled; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.Focusable != originalFocusable {
                    throw InvalidOperationException("TabBar owns Focusable; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.Handle != originalHandle {
                    throw InvalidOperationException("TabBar owns Handle; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.Key != originalKey {
                    throw InvalidOperationException("TabBar owns Key; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.OnBlur != originalOnBlur {
                    throw InvalidOperationException("TabBar owns OnBlur; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.OnClick != originalOnClick {
                    throw InvalidOperationException("TabBar owns OnClick; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.OnFocus != originalOnFocus {
                    throw InvalidOperationException("TabBar owns OnFocus; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.OnKeyDown != originalOnKeyDown {
                    throw InvalidOperationException("TabBar owns OnKeyDown; configure TabBarInput instead of changing it in ConfigureItem")
                }
                if button.TabStop != originalTabStop {
                    throw InvalidOperationException("TabBar owns TabStop; configure TabBarInput instead of changing it in ConfigureItem")
                }
            }
            theme.ApplyInteraction(button, InteractionFamily.Tab, active)
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
            let buttonAccessibility = if let configured = button.Accessibility { Accessibility{...configured} } else { Accessibility{} }
            buttonAccessibility.Role = AccessibilityRole.Tab
            buttonAccessibility.Name = item.AccessibilityName!!
            buttonAccessibility.Selected = active
            button.Accessibility = buttonAccessibility
            buttons.Add(button)
            let pinned = Array.IndexOf(input.PinnedIds!!, id) >= 0
            let dirty = Array.IndexOf(input.DirtyIds!!, id) >= 0
            var name = item.AccessibilityName!!
            if dirty {
                button.Children.Add(Container{Width: 6, Height: 6, BorderRadius: 3, BackgroundColor: theme.ChromeTextColor})
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
                button.PaddingEnd = theme.Spacing
                button.FlexShrink = 1
                button.BackgroundColor = Color.Transparent
                button.HoverStyle = Style{}
                button.ActiveStyle = Style{BackgroundColor: Color.Transparent}
                button.DisabledStyle = Style{BackgroundColor: Color.Transparent, Color: theme.DisabledTextColor, Opacity: 1.0}
                let tab = Container{
                    Key: id,
                    FlexDirection: FlexDirection.Row,
                    FlexShrink: 0,
                    MaxWidth: Percent(100),
                    AlignItems: AlignItems.Center,
                    PaddingEnd: theme.Spacing * 2,
                    BackgroundColor: active ? theme.ActiveColor: theme.ChromeColor,
                    HoverStyle: Style{BackgroundColor: active ? theme.ActiveColor: theme.HoverColor},
                    Disabled: item.Disabled,
                    DisabledStyle: Style{Color: theme.DisabledTextColor, Opacity: theme.DisabledOpacity},
                    button
                }
                let close = Button{
                    Key: "close-" + id,
                    Width: 20,
                    Height: 20,
                    BorderRadius: theme.RadiusSm!!,
                    AlignItems: AlignItems.Center,
                    JustifyContent: JustifyContent.Center,
                    Color: theme.ChromeTextColor,
                    DisabledStyle: Style{BackgroundColor: Color.Transparent, Opacity: 1.0},
                    Disabled: item.Disabled,
                    Focusable: !item.Disabled,
                    TabStop: false,
                    OnClick: () -> InvokeInputCallback(input.OnClose, id),
                    Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text("Close {0}", item.Label!!)},
                    TransitionMs: theme.TransitionMs,
                    TransitionEasing: Easing.EaseOut,
                    TransitionProperties: theme.InteractionTransitions,
                    Text{Content: "×", FontSize: theme.FontSize},
                }
                theme.ApplyInteraction(close, InteractionFamily.Button)
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
            BackgroundColor: theme.ChromeColor,
            ScrollbarX: theme.Scrollbar,
        }
        root.Children.Clear()
        for button in buttons {
            root.Children.Add(button)
        }
        if let configure = input.ConfigureRoot {
            let originalAccessibilityName = (root.Accessibility?.Name ?? "")
            let originalAccessibilityOrientation = (root.Accessibility?.Orientation ?? AccessibilityOrientation(0))
            let originalAccessibilityRole = (root.Accessibility?.Role ?? AccessibilityRole(0))
            let originalLayout = root.Layout
            configure.Invoke(input, root)
            if (root.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("TabBar owns Accessibility.Name; set TabBarInput.AccessibilityName instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Orientation ?? AccessibilityOrientation(0)) != originalAccessibilityOrientation {
                throw InvalidOperationException("TabBar owns Accessibility.Orientation; configure TabBarInput instead of changing it in ConfigureRoot")
            }
            if (root.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("TabBar owns Accessibility.Role; configure TabBarInput instead of changing it in ConfigureRoot")
            }
            if root.Layout != originalLayout {
                throw InvalidOperationException("TabBar owns Layout; configure TabBarInput instead of changing it in ConfigureRoot")
            }
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
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.TabList
        rootAccessibility.Name = input.AccessibilityName!!
        rootAccessibility.Orientation = input.Vertical ? AccessibilityOrientation.Vertical: AccessibilityOrientation.Horizontal
        root.Accessibility = rootAccessibility
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
                ActionButton{Content: "+", AccessibilityName: theme.Text("Add tab"), MinWidth: 32, OnClick: () -> InvokeInputCallback(input.OnAdd)}.Build()
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
                        OnClick: Select,
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
            InvokeInputCallback(input.OnSelect, id)
        }
    }

    private func KeyDown(id string, e KeyEvent) {
        if !Enabled(id) {
            return
        }
        if e.Key == Key.Delete || (e.Key == Key.W && e.Modifiers.HasPrimary) {
            if input.OnClose != nil && Array.IndexOf(input.PinnedIds!!, id) < 0 {
                e.PreventDefault()
                e.StopPropagation()
                if !e.Repeat {
                    InvokeInputCallback(input.OnClose, id)
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
                InvokeInputCallback(input.OnReorder, id, next)
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
