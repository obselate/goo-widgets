package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// IDs are unique across all levels, including separators and closed submenus.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
public data struct MenuItem {
    /// Stable, nonempty identity, unique across all menu levels, including separators.
    var Id string?
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Custom item content. Nil uses Label.
    var Content Blob?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Renders a noninteractive divider instead of a command.
    var Separator bool
    /// Submenu items in display order. Nil makes this a leaf command.
    var Children[]?MenuItem
    /// Display-only keyboard chord. Nil omits the shortcut label.
    var Shortcut KeyBinding?
    /// Overrides the menu's shared activation callback for this item.
    var OnClick Action?
}

internal func forwardMenuCallbacks(source[]?MenuItem, invoke Action[Action?]) []?MenuItem {
    guard let source = source else { return nil }
    var result[]?MenuItem
    for index in 0 ... source.Length {
        let item = source[index]
        let children = forwardMenuCallbacks(item.Children, invoke)
        if item.OnClick != nil || !Object.ReferenceEquals(children, item.Children) {
            if result == nil {
                result = [source.Length]MenuItem
                Array.Copy(source, result, source.Length)
            }
            result[index] = item with{
                OnClick = item.OnClick == nil ? nil: () -> invoke(item.OnClick),
                Children = children,
            }
        }
    }
    return result ?? source
}

/// Use Anchor for a trigger menu or WindowPoint for a context menu; Open remains host-owned.
public data struct MenuInput {
    /// Controlled visibility. False hides the popup.
    var Open bool
    /// Caller-owned mounted trigger handle. Nil requires WindowPoint when open.
    var Anchor ElementHandle?
    /// Context-menu origin in window logical pixels. Nil uses Anchor.
    var WindowPoint Point?
    /// Root menu entries in display order. Nil supplies no entries. IDs must be unique across all levels.
    var Items[]?MenuItem
    /// Receives the activated leaf item ID unless its own callback overrides it. Runs before optional dismissal. Nil ignores the request.
    var OnClick Action[string]?
    /// Requests visibility changes after user dismissal. Nil ignores the request.
    var OnOpenChange Action[bool]?
    /// Enabled root item focused when the menu opens. Nil selects the first item.
    var InitialFocusId string?
    /// Nil resolves to true; false keeps the menu open after leaf activation.
    var DismissOnActivate bool?
    /// Collision bounds in window logical pixels. Nil uses the window viewport.
    var Viewport ElementRect?
    /// Preferred root placement; defaults to BottomStart. The viewport may flip or clamp it.
    var Placement PopoverPlacement
    /// Preferred submenu side; LeftStart or RightStart. Nil opens toward the end edge of the theme direction.
    var SubmenuPlacement PopoverPlacement?
    /// Menu width. Nil fits the widest item, limited by the viewport.
    var Width Length?
    /// Height limit. Nil fits the items, limited by the viewport.
    var MaxHeight Length?
    /// Overlay stacking order. Zero selects the widget default layer.
    var ZIndex int32
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Optional base style for the submenu direction indicator.
    var SubmenuArrowStyle Style?
    /// Configures the fresh item before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Expanded, Accessibility.Name, Accessibility.Role, Disabled, Focusable, Handle, Key, KeyBindings (required entries), OnClick, OnFocus, OnKeyDown, OnPointerEnter, TabStop.
    var ConfigureItem Action[MenuInput, MenuItem, Button]?
    /// Configures the fresh separator before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Accessibility.Role, Focusable, Key.
    var ConfigureSeparator Action[MenuInput, MenuItem, Blob]?
    /// Configures the fresh panel before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Handle, Key.
    var ConfigurePanel Action[MenuInput, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// The widget does not replace configured metadata or children.
    var ConfigureRoot Action[MenuInput, Container]?
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
        return Level(input.Items ?? []MenuItem{}, 0, input.Anchor, input.WindowPoint, input.AccessibilityName ?? theme.Text("Menu"))
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
            selected = depth == 0 &&
                Eligible(source, current.InitialFocusId ?? "") ? current.InitialFocusId!!: First(source)
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
        let highlight Color? = theme.HoverTextColor == Color{} ? nil: theme.HoverTextColor
        let rows = Container{
            Direction: theme.Direction,
            Gap: theme.Spacing / 2.0,
            Accessibility: Accessibility{Role: AccessibilityRole.None}
        }
        for item in source {
            let id = item.Id!!
            if item.Separator {
                let separator = Container{
                        Height: theme.BorderWidth,
                        Margin: Edges{Top: theme.Spacing, Bottom: theme.Spacing},
                        BackgroundColor: theme.BorderColor,
                    }
                if let configure = current.ConfigureSeparator {
                    let originalAccessibilityRole = (separator.Accessibility?.Role ?? AccessibilityRole(0))
                    let originalFocusable = separator.Focusable
                    let originalKey = separator.Key
                    configure.Invoke(current, item, separator)
                    if (separator.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                        throw InvalidOperationException("Menu owns Accessibility.Role; configure MenuInput instead of changing it in ConfigureSeparator")
                    }
                    if separator.Focusable != originalFocusable {
                        throw InvalidOperationException("Menu owns Focusable; configure MenuInput instead of changing it in ConfigureSeparator")
                    }
                    if separator.Key != originalKey {
                        throw InvalidOperationException("Menu owns Key; configure MenuInput instead of changing it in ConfigureSeparator")
                    }
                }
                separator.Key = id
                separator.Focusable = false
                let separatorAccessibility = if let configured = separator.Accessibility { Accessibility{...configured} } else { Accessibility{} }
                separatorAccessibility.Role = AccessibilityRole.None
                separator.Accessibility = separatorAccessibility
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
                TextWrap: TextWrap.NoWrap,
                TextTrimming: TextTrimming.Ellipsis,
            }
            let highlightText = selected == id ? highlight: nil
            let prepared = Button{
                MinHeight: theme.ControlHeight,
                Padding: Edges(theme.Spacing, theme.ControlPadding),
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: theme.ControlGap,
                BackgroundColor: selected == id ? theme.HoverColor: Color.Transparent,
                Color: highlightText ?? theme.TextColor,
                HoverStyle: Style{Color: highlight ?? theme.TextColor},
                ActiveStyle: Style{Color: highlight ?? theme.TextColor},
                BorderRadius: theme.ControlRadius!!,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                Cursor: item.Disabled ? Cursor.Default: Cursor.Pointer,
            }
            let row = prepared
            row.Children.Clear()
            row.Children.Add(Container{Key: "content", FlexGrow: 1.0, FlexShrink: 1.0, MinWidth: 0.0, content})
            if let shortcut = item.Shortcut {
                row.Children.Add(Kbd{Keys: []KeyBinding{shortcut}, Keycaps: false, Color: highlightText}.Build())
            }
            if hasChildren {
                row.Children.Add(
                    Text{
                        Key: "arrow",
                        Content: OpensLeft() == theme.RightToLeft ? "›": "‹",
                        FontFamily: theme.FontFamily,
                        FontSize: theme.HeadingFontSize,
                        Color: highlightText ?? theme.MutedTextColor,
                        BasedOn: current.SubmenuArrowStyle
                    }
                )
            }
            if let configure = current.ConfigureItem {
                let originalAccessibilityExpanded = row.Accessibility?.Expanded
                let originalAccessibilityName = (row.Accessibility?.Name ?? "")
                let originalAccessibilityRole = (row.Accessibility?.Role ?? AccessibilityRole(0))
                let originalDisabled = row.Disabled
                let originalFocusable = row.Focusable
                let originalHandle = row.Handle
                let originalKey = row.Key
                let originalOnClick = row.OnClick
                let originalOnFocus = row.OnFocus
                let originalOnKeyDown = row.OnKeyDown
                let originalOnPointerEnter = row.OnPointerEnter
                let originalTabStop = row.TabStop
                configure.Invoke(current, item, row)
                if row.Accessibility?.Expanded != originalAccessibilityExpanded {
                    throw InvalidOperationException("Menu owns Accessibility.Expanded; configure MenuInput instead of changing it in ConfigureItem")
                }
                if (row.Accessibility?.Name ?? "") != originalAccessibilityName {
                    throw InvalidOperationException("Menu owns Accessibility.Name; set MenuInput.AccessibilityName instead of changing it in ConfigureItem")
                }
                if (row.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                    throw InvalidOperationException("Menu owns Accessibility.Role; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.Disabled != originalDisabled {
                    throw InvalidOperationException("Menu owns Disabled; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.Focusable != originalFocusable {
                    throw InvalidOperationException("Menu owns Focusable; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.Handle != originalHandle {
                    throw InvalidOperationException("Menu owns Handle; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.Key != originalKey {
                    throw InvalidOperationException("Menu owns Key; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.OnClick != originalOnClick {
                    throw InvalidOperationException("Menu owns OnClick; set MenuInput.OnClick instead of changing it in ConfigureItem")
                }
                if row.OnFocus != originalOnFocus {
                    throw InvalidOperationException("Menu owns OnFocus; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.OnKeyDown != originalOnKeyDown {
                    throw InvalidOperationException("Menu owns OnKeyDown; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.OnPointerEnter != originalOnPointerEnter {
                    throw InvalidOperationException("Menu owns OnPointerEnter; configure MenuInput instead of changing it in ConfigureItem")
                }
                if row.TabStop != originalTabStop {
                    throw InvalidOperationException("Menu owns TabStop; configure MenuInput instead of changing it in ConfigureItem")
                }
            }
            theme.ApplyInteraction(row, InteractionFamily.Row)
            row.Key = id
            row.Handle = handles[id]
            row.Focusable = !item.Disabled
            row.TabStop = selected == id && !item.Disabled
            row.Disabled = item.Disabled
            let rowAccessibility = if let configured = row.Accessibility { Accessibility{...configured} } else { Accessibility{} }
            rowAccessibility.Role = AccessibilityRole.MenuItem
            rowAccessibility.Name = label
            rowAccessibility.Expanded = hasChildren ? path.Count > depth && path[depth] == id: nil
            row.Accessibility = rowAccessibility
            row.OnClick = () -> Activate(depth, id)
            WidgetKeyBindings.BindActivation(row)
            row.OnFocus = (event FocusEvent) -> {
                event.StopPropagation()
                active[depth] = id
                Rebuild()
            }
            row.OnPointerEnter = (event PointerEvent) -> Hover(depth, id)
            row.OnKeyDown = (event KeyEvent) -> KeyDown(source, depth, id, event)
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
            Placement: depth == 0 ? current.Placement: SubmenuPlacement(),
            Padding: theme.Spacing,
            DismissOnOutsideClick: depth == 0,
            OnDismiss: (reason PopoverDismissReason) -> CloseLevel(depth),
            ConfigurePanel: Panel,
            ConfigureRoot: Root,
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
        if current.Width != nil {
            popup.Width = current.Width
        }
        if selected != "" {
            popup.InitialFocus = handles[selected]
        }
        return Cell.Mount[PopoverInput, Popover]("menu-level-" + depth.ToString(), popup)
    }

    private func Panel(input PopoverInput, bounds ElementRect, content Blob, prepared Container) {
        prepared.LineHeight = theme.LineHeight
        prepared.Padding = theme.Spacing
        prepared.BasedOn = theme.OverlayStyle
        prepared.BackgroundColor = theme.OverlayColor
        prepared.BorderColor = theme.BorderColor
        prepared.BorderWidth = theme.BorderWidth
        prepared.BorderRadius = theme.PanelRadius!!
        prepared.ScrollbarY = nil
        if let configure = current.ConfigurePanel {
            let originalHandle = prepared.Handle
            let originalKey = prepared.Key
            configure.Invoke(current, prepared)
            if prepared.Handle != originalHandle {
                throw InvalidOperationException("Menu owns Handle; configure MenuInput instead of changing it in ConfigurePanel")
            }
            if prepared.Key != originalKey {
                throw InvalidOperationException("Menu owns Key; configure MenuInput instead of changing it in ConfigurePanel")
            }
        }
    }

    private func Root(input PopoverInput, backdrop Container, panel Container, prepared Container) {
        prepared.Position = PositionType.Absolute
        prepared.Left = 0.0
        prepared.Right = 0.0
        prepared.Top = 0.0
        prepared.Bottom = 0.0
        current.ConfigureRoot?.Invoke(current, prepared)
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
        if let callback = item.OnClick {
            InvokeInputCallback(callback)
        } else {
            InvokeInputCallback(current.OnClick, id)
        }
        if current.DismissOnActivate ?? true {
            InvokeInputCallback(current.OnOpenChange, false)
        }
    }

    private func CloseLevel(depth int32) {
        if depth == 0 {
            InvokeInputCallback(current.OnOpenChange, false)
            return
        }
        let parentId = path.Count >= depth ? path[depth - 1]: ""
        Truncate(depth - 1)
        Focus(depth - 1, parentId)
        Rebuild()
    }

    private func SubmenuPlacement() PopoverPlacement -> current.SubmenuPlacement ??
        (theme.RightToLeft ? PopoverPlacement.LeftStart: PopoverPlacement.RightStart)

    private func OpensLeft() bool -> SubmenuPlacement() == PopoverPlacement.LeftStart

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
