package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// IDs are unique across all levels, including separators and closed submenus.
public data struct MenuItem {
    var Id string?
    var Label string?
    var Content Blob?
    var Disabled bool
    var Separator bool
    var Children[]?MenuItem
    var Shortcut KeyBinding?
    /// Overrides the menu's shared activation callback for this item.
    var OnActivate Action?
}

/// Use Anchor for a trigger menu or WindowPoint for a context menu; Open remains host-owned.
public data struct MenuInput {
    var Open bool
    var Anchor ElementHandle?
    var WindowPoint Point?
    var Items[]?MenuItem
    var OnActivate Action[string]?
    var OnDismiss Action?
    /// Nil resolves to true; false keeps the menu open after leaf activation.
    var DismissOnActivate bool?
    var Viewport ElementRect?
    /// Preferred root placement; defaults to BottomStart. The viewport may flip or clamp it.
    var Placement PopoverPlacement
    /// Preferred submenu side; LeftStart or RightStart. Nil resolves to RightStart.
    var SubmenuPlacement PopoverPlacement?
    var Width float64
    var MaxHeight float64
    var ZIndex int32
    var AccessibilityName string?
    /// Optional base style for the submenu direction indicator.
    var SubmenuArrowStyle Style?
    var CreateItem Func[MenuInput, MenuItem, Button, Button]?
    var CreateSeparator Func[MenuInput, MenuItem, Blob]?
    var CreatePanel Func[MenuInput, Container, Container]?
    var CreateRoot Func[MenuInput, Container, Container]?
}

/// A controlled anchored/context menu with roving focus and pointer/keyboard submenus.
public open class Menu : Cell[MenuInput] {
    private var current MenuInput
    private var theme Theme
    private let items Dictionary[string, MenuItem] = Dictionary[string, MenuItem](StringComparer.Ordinal)
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private let active Dictionary[int32, string] = Dictionary[int32, string]()
    private let path List[string] = List[string]()
    private let typeAhead Dictionary[int32, TypeAhead] = Dictionary[int32, TypeAhead]()
    private var wasOpen bool

    protected override func Build(input MenuInput) Blob {
        theme = Theme.Read()
        current = input
        if input.SubmenuPlacement != nil && input.SubmenuPlacement != PopoverPlacement.LeftStart
        && input.SubmenuPlacement != PopoverPlacement.RightStart {
            throw ArgumentOutOfRangeException("Menu submenu placement")
        }
        Validate(input.Items ?? []MenuItem{})
        if !input.Open {
            path.Clear()
            active.Clear()
            typeAhead.Clear()
            wasOpen = false
        } else if !wasOpen {
            path.Clear()
            active.Clear()
            wasOpen = true
        }
        return Level(input.Items ?? []MenuItem{}, 0, input.Anchor, input.WindowPoint, input.AccessibilityName ?? "Menu")
    }

    private func Validate(source[]MenuItem) {
        items.Clear()
        let pending = Stack[MenuItem]()
        for item in source {
            pending.Push(item)
        }
        while pending.Count > 0 {
            let item = pending.Pop()
            let id = item.Id ?? ""
            if String.IsNullOrEmpty(id) || !items.TryAdd(id, item) {
                throw ArgumentException("Menu IDs must be nonempty and unique across all levels")
            }
            let children = item.Children ?? []MenuItem{}
            if item.Separator && children.Length > 0 {
                throw ArgumentException("Menu separators cannot own submenus")
            }
            for child in children {
                pending.Push(child)
            }
            if !handles.ContainsKey(id) {
                handles.Add(id, ElementHandle())
            }
        }
        let removed = List[string]()
        for id in handles.Keys {
            if !items.ContainsKey(id) {
                removed.Add(id)
            }
        }
        for id in removed {
            handles.Remove(id)
        }
    }

    private func Level(source[]MenuItem, depth int32, anchor ElementHandle?, point Point?, name string) Blob {
        if depth > 64 {
            throw ArgumentException("Menus support at most 64 submenu levels")
        }
        var selected = active.TryGetValue(depth, out var prior) ? prior: ""
        if !Eligible(source, selected) {
            selected = First(source)
        }
        active[depth] = selected
        if !typeAhead.ContainsKey(depth) {
            typeAhead.Add(depth, TypeAhead())
        }
        let search = typeAhead[depth]
        let searchable = List[string]()
        for item in source {
            if !item.Disabled && !item.Separator {
                searchable.Add(item.Id!!)
            }
        }
        search.Items = searchable
        search.TextForId = (id string) -> items[id].Label ?? id
        search.OnMatch = (id string) -> Focus(depth, id)
        let rows = Container{Gap: theme.Spacing / 2.0, Accessibility: Accessibility{Role: AccessibilityRole.None}}
        for item in source {
            let id = item.Id!!
            if item.Separator {
                let separator = if let create = current.CreateSeparator {
                    create(current, item)
                } else {
                    Container{
                        Height: theme.BorderWidth,
                        Margin: Edges{Top: theme.Spacing, Bottom: theme.Spacing},
                        BackgroundColor: theme.BorderColor,
                    }
                }
                separator.Key = id
                separator.Focusable = false
                separator.Accessibility = Accessibility{Role: AccessibilityRole.None}
                rows.Children.Add(separator)
                continue
            }
            let hasChildren = (item.Children ?? []MenuItem{}).Length > 0
            let label = item.Label ?? id
            let content = item.Content ??
            Text{
                Content: label,
                FontFamily: theme.FontFamily,
                FontSize: theme.FontSize,
                FontWeight: theme.FontWeight,
                Color: item.Disabled ? theme.FaintTextColor: theme.TextColor,
            }
            let prepared = Button{
                MinHeight: theme.ControlHeight,
                Padding: Edges(theme.Spacing, theme.ControlPadding),
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: theme.ControlGap,
                BackgroundColor: selected == id ? theme.AccentColor.WithAlpha(0.15): Color.Transparent,
                BorderRadius: theme.ControlRadius,
                Focus: Style{OutlineWidth: 2.0, OutlineColor: theme.FocusColor, OutlineOffset: -2.0},
                Cursor: item.Disabled ? Cursor.Default: Cursor.Pointer,
            }
            let row = if let create = current.CreateItem {
                create(current, item, prepared)
            } else {
                prepared
            }
            row.Key = id
            row.Handle = handles[id]
            row.Focusable = !item.Disabled
            row.TabStop = selected == id && !item.Disabled
            row.Disabled = item.Disabled
            row.Accessibility = Accessibility{
                Role: AccessibilityRole.MenuItem,
                Name: label,
                Expanded: hasChildren ? path.Count > depth && path[depth] == id: nil,
            }
            row.OnClick = () -> Activate(depth, id)
            WidgetKeyBindings.BindActivation(row)
            row.OnFocus = (event FocusEvent) -> {
                event.StopPropagation()
                active[depth] = id
                Rebuild()
            }
            row.OnPointerEnter = (event PointerEvent) -> Hover(depth, id)
            row.OnKeyDown = (event KeyEvent) -> KeyDown(source, depth, id, event)
            row.Children.Clear()
            row.Children.Add(Container{Key: "content", FlexGrow: 1.0, MinWidth: 0.0, content})
            if let shortcut = item.Shortcut {
                row.Children.Add(Kbd{Keys: []KeyBinding{shortcut}, Keycaps: false}.Build())
            }
            if hasChildren {
                row.Children.Add(
                    Text{
                        Key: "arrow",
                        Content: OpensLeft() ? "‹": "›",
                        FontFamily: theme.FontFamily,
                        FontSize: theme.HeadingFontSize,
                        Color: theme.MutedTextColor,
                        BasedOn: current.SubmenuArrowStyle
                    }
                )
            }
            rows.Children.Add(row)
        }
        var overlays[]Blob = []Blob{}
        if current.Open && path.Count > depth {
            let parentId = path[depth]
            if Eligible(source, parentId) {
                let parent = items[parentId]
                let children = parent.Children ?? []MenuItem{}
                if children.Length > 0 {
                    overlays = []Blob{Level(children, depth + 1, handles[parentId], nil, parent.Label ?? parentId)}
                } else {
                    Truncate(depth)
                }
            } else {
                Truncate(depth)
            }
        }
        var popup = PopoverInput{
            Open: current.Open,
            Content: rows,
            Overlays: overlays,
            Role: AccessibilityRole.Menu,
            AccessibilityName: name,
            MaxHeight: current.MaxHeight,
            ZIndex: current.ZIndex,
            Placement: depth == 0 ? current.Placement: current.SubmenuPlacement ?? PopoverPlacement.RightStart,
            Padding: theme.Spacing,
            DismissOnOutsideClick: depth == 0,
            OnDismiss: (reason PopoverDismissReason) -> CloseLevel(depth),
            CreatePanel: Panel,
            CreateRoot: Root,
        }
        if let anchor = anchor {
            popup.Anchor = anchor
        }
        if let point = point {
            popup.WindowPoint = point
        }
        if let viewport = current.Viewport {
            popup.Viewport = viewport
        }
        if current.Width != 0.0 {
            popup.Width = current.Width
        }
        if selected != "" {
            popup.InitialFocus = handles[selected]
        }
        return Cell.Mount[PopoverInput, Popover]("menu-level-" + depth.ToString(), popup)
    }

    private func Panel(input PopoverInput, bounds ElementRect, content Blob) Container {
        let prepared = Container{
            LineHeight: theme.LineHeight,
            Padding: theme.Spacing,
            BackgroundColor: theme.PanelColor,
            BorderColor: theme.BorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.PanelRadius,
        }
        return if let create = current.CreatePanel {
            create(current, prepared)
        } else {
            prepared
        }
    }

    private func Root(input PopoverInput, backdrop Container, panel Container) Container {
        let prepared = Container{Position: PositionType.Absolute, Left: 0.0, Right: 0.0, Top: 0.0, Bottom: 0.0}
        return if let create = current.CreateRoot {
            create(current, prepared)
        } else {
            prepared
        }
    }

    private func Eligible(source[]MenuItem, id string) bool {
        for item in source {
            if item.Id == id {
                return !item.Disabled && !item.Separator
            }
        }
        return false
    }

    private func First(source[]MenuItem) string {
        let next = RovingFocus.Next[MenuItem](
            source, -1, Key.Home, AccessibilityOrientation.Vertical, true,
            (item MenuItem) -> item.Disabled || item.Separator)
        return next < 0 ? "": source[next].Id!!
    }

    private func Move(source[]MenuItem, depth int32, id string, key Key) {
        var index = 0
        for i in 0 ... source.Length {
            if source[i].Id == id {
                index = i
            }
        }
        let next = RovingFocus.Next[MenuItem](
            source, index, key, AccessibilityOrientation.Vertical, true,
            (item MenuItem) -> item.Disabled || item.Separator)
        if next >= 0 {
            Focus(depth, source[next].Id!!)
        }
    }

    private func Focus(depth int32, id string) {
        if id == "" || !handles.TryGetValue(id, out var handle) {
            return
        }
        active[depth] = id
        handle.Focus()
        handle.ScrollIntoView()
        Rebuild()
    }

    private func Truncate(depth int32) {
        if path.Count > depth {
            path.RemoveRange(depth, path.Count - depth)
        }
    }

    private func OpenChild(depth int32, id string) {
        let children = items[id].Children ?? []MenuItem{}
        if children.Length == 0 {
            return
        }
        if path.Count > depth && path[depth] == id {
            return
        }
        Truncate(depth)
        path.Add(id)
        active[depth + 1] = First(children)
        Rebuild()
    }

    private func Hover(depth int32, id string) {
        if !items.TryGetValue(id, out var item) || item.Disabled || item.Separator {
            return
        }
        Focus(depth, id)
        if (item.Children ?? []MenuItem{}).Length > 0 {
            OpenChild(depth, id)
        } else {
            Truncate(depth)
        }
        Rebuild()
    }

    private func Activate(depth int32, id string) {
        if !items.TryGetValue(id, out var item) || item.Disabled || item.Separator {
            return
        }
        if (item.Children ?? []MenuItem{}).Length > 0 {
            OpenChild(depth, id)
            return
        }
        if let callback = item.OnActivate {
            callback()
        } else {
            current.OnActivate?.Invoke(id)
        }
        if current.DismissOnActivate ?? true {
            current.OnDismiss?.Invoke()
        }
    }

    private func CloseLevel(depth int32) {
        if depth == 0 {
            current.OnDismiss?.Invoke()
            return
        }
        let parentId = path.Count >= depth ? path[depth - 1]: ""
        Truncate(depth - 1)
        Focus(depth - 1, parentId)
        Rebuild()
    }

    private func OpensLeft() bool -> current.SubmenuPlacement == PopoverPlacement.LeftStart

    private func KeyDown(source[]MenuItem, depth int32, id string, event KeyEvent) {
        let search = typeAhead[depth]
        search.ActiveId = id
        if search.HandleKey(event) {
            return
        }
        if event.Key == Key.Up || event.Key == Key.Down || event.Key == Key.Home || event.Key == Key.End {
            event.PreventDefault()
            event.StopPropagation()
            Move(source, depth, id, event.Key)
        } else if event.Key == (OpensLeft() ? Key.Left: Key.Right) {
            event.PreventDefault()
            event.StopPropagation()
            OpenChild(depth, id)
        } else if event.Key == (OpensLeft() ? Key.Right: Key.Left) && depth > 0 {
            event.PreventDefault()
            event.StopPropagation()
            CloseLevel(depth)
        }
    }
}
