package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

/// A host-owned tree node. IDs are unique across the entire hierarchy, including collapsed descendants.
public data struct TreeNode {
    /// Required stable identity.
    var Id string?
    /// Visible and accessible label. Nil resolves to Id.
    var Label string?
    /// Optional arbitrary content in place of the default label.
    var Content Blob?
    /// Disables this node and its descendants.
    var Disabled bool
    /// Child nodes in display order.
    var Children[]?TreeNode
    /// Whether this branch has children that the host has not loaded yet.
    var HasChildren bool
    /// Optional check state. Unspecified omits the checkbox; parents may be Mixed.
    var CheckState AccessibilityChecked
}

/// Resolved visible-node context for customization factories.
public data struct TreeViewRow {
    /// Host node.
    var Node TreeNode
    /// Parent identity, or nil for a root node.
    var ParentId string?
    /// Zero-based depth.
    var Depth int32
    /// Controlled expansion state.
    var Expanded bool
    /// Controlled row selection state.
    var Selected bool
    /// Whether this row is the tree's active keyboard descendant.
    var Active bool
    /// Includes disabled ancestors and the root disabled state.
    var Disabled bool
    /// Whether this is the nonselectable loading placeholder.
    var Loading bool
}

/// Controlled hierarchy, selection, and appearance for a mounted tree.
public data struct TreeViewInput {
    /// Root nodes. Nil resolves to an empty tree.
    var Nodes[]?TreeNode
    /// Controlled expanded identities; unknown/stale IDs are ignored.
    var ExpandedIds[]?string
    /// Requests expansion changes. The host updates ExpandedIds and rebuilds.
    var OnExpandedChange Action[string, bool]?
    /// Controlled single row selection.
    var SelectedId string?
    /// Requests single row selection.
    var OnSelect Action[string]?
    /// Controlled selection. When supplied, this takes precedence over SelectedId.
    var SelectedIds[]?string
    var Multiple bool
    var OnSelectionChange Action[[]string]?
    /// Called when an unloaded branch opens. The host supplies Children and LoadingIds.
    var LoadChildren Action[string]?
    var LoadingIds[]?string
    /// Requests editing of the active row. The host owns the editor and new label.
    var OnRename Action[string]?
    var OnDrop Action[[]string, string, TreeDropPosition]?
    /// Runs before built-in keyboard handling. Return true to handle the event and skip the default action.
    var OnKeyDown Func[KeyEvent, bool]?
    /// Row click, Enter, and accessibility activation also request branch expansion. Defaults to false.
    /// Checkbox clicks and Space retain the host's check policy.
    var ExpandOnActivate bool
    /// Requests a check change without applying any descendant or ancestor cascade. Mixed requests True.
    var OnCheckChange Action[string, AccessibilityChecked]?
    /// Legacy accessibility flag for host-owned check selection.
    var MultiSelectable bool
    /// Disables the whole tree.
    var Disabled bool
    /// Whether to virtualize flattened visible rows. Nil resolves to true.
    var Virtualize bool?
    /// Viewport width. Nil resolves to 100%.
    var Width Length?
    /// Viewport height. Nil resolves to 280.
    var Height Length?
    /// Optional vertical scrollbar appearance for the active scroller.
    var ScrollbarY Scrollbar?
    /// Fixed visual row height. Nil uses the theme's control height.
    var RowHeight float64?
    /// Indentation per depth level. Nil uses the theme spacing.
    var Indent float64?
    /// Accessible tree name. Nil resolves to Tree.
    var AccessibilityName string?
    /// Root fill. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Label color. Nil uses the nearest theme.
    var TextColor Color?
    /// Selected row fill. Nil uses the nearest theme.
    var SelectedColor Color?
    /// Customizes content in the standard row slots.
    var CreateContent Func[TreeViewInput, TreeViewRow, Blob, Blob]?
    /// Customizes the expansion button; required identity and input wiring are reapplied.
    var CreateExpander Func[TreeViewInput, TreeViewRow, Button, Button]?
    /// Customizes the composed Checkbox button; required identity and input wiring are reapplied.
    var CreateCheck Func[TreeViewInput, TreeViewRow, Button, Button]?
    /// Standard slots are added before this factory. Custom children are kept; identity, input, and semantics are reapplied.
    var CreateRow Func[TreeViewInput, TreeViewRow, Container, Container]?
    /// Customizes root appearance; viewport, focus, and tree semantics are reapplied.
    var CreateRoot Func[TreeViewInput, Container, Container]?
}

internal data struct TreeWalk {
    var Node TreeNode
    var ParentId string?
    var Depth int32
    var Visible bool
    var Disabled bool
}

/// The destination relative to a tree row.
public enum TreeDropPosition {
    Before;
    After;
    Into
}

internal class TreeDrag(Owner TreeView, Ids[]string) { }

/// A controlled tree using one stable focus target and an accessible active descendant, including virtual rows.
public open class TreeView : Cell[TreeViewInput] {
    private let rootHandle ElementHandle = ElementHandle()
    private let viewport ElementHandle = ElementHandle()
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
    private var nodes Dictionary[string, TreeViewRow] = Dictionary[string, TreeViewRow](StringComparer.Ordinal)
    private var indices Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
    private var rows List[TreeViewRow] = List[TreeViewRow]()
    private let typeAhead TypeAhead = TypeAhead()
    private var input TreeViewInput
    private var theme Theme
    private var pointerFocus bool
    private var activeId string?
    private var hasFocus bool
    private var anchorId string?
    private var clickModifiers KeyModifiers
    private var clickFromChild bool
    private var selected HashSet[string] = HashSet[string](StringComparer.Ordinal)

    protected override func Build(value TreeViewInput) Blob {
        theme = Theme.Read()
        let defaultHeight Length = 280
        input = value with{
            Virtualize = value.Virtualize ?? true,
            Width = value.Width ?? Percent(100),
            Height = value.Height ?? defaultHeight,
            RowHeight = value.RowHeight ?? theme.ControlHeight,
            Indent = value.Indent ?? theme.Spacing * 5.0,
            AccessibilityName = value.AccessibilityName ?? theme.Text("Tree"),
            BackgroundColor = value.BackgroundColor ?? theme.PanelColor,
            TextColor = value.TextColor ?? theme.TextColor,
            SelectedColor = value.SelectedColor ?? theme.SelectedFill(theme.AccentColor.WithAlpha(0.15)),
            ScrollbarY = value.ScrollbarY ?? theme.Scrollbar,
        }
        if !Double.IsFinite(input.RowHeight!!) || input.RowHeight!!<= 0.0 || !Double.IsFinite(input.Indent!!) ||
            input.Indent!!< 0.0 {
            throw ArgumentOutOfRangeException("Tree row height/indent")
        }
        let previous = nodes
        nodes = Dictionary[string, TreeViewRow](StringComparer.Ordinal)
        indices = Dictionary[string, int32](StringComparer.Ordinal)
        rows = List[TreeViewRow]()
        let searchable = List[string]()
        let expanded = HashSet[string](input.ExpandedIds ?? []string{}, StringComparer.Ordinal)
        selected = HashSet[string](
            input.SelectedIds ?? (input.SelectedId == nil ? []string{}: []string{input.SelectedId!!}),
            StringComparer.Ordinal
        )
        let loading = HashSet[string](input.LoadingIds ?? []string{}, StringComparer.Ordinal)
        let stack = Stack[TreeWalk]()
        Push(stack, input.Nodes ?? []TreeNode{}, nil, 0, true, input.Disabled)
        while stack.Count > 0 {
            let walk = stack.Pop()
            let node = walk.Node
            if String.IsNullOrEmpty(node.Id) || nodes.ContainsKey(node.Id!!) {
                throw ArgumentException(
                    "Tree node IDs must be nonempty and unique; cyclic/shared nodes are not supported."
                )
            }
            if node.CheckState != AccessibilityChecked.Unspecified &&
                node.CheckState != AccessibilityChecked.False &&
                node.CheckState != AccessibilityChecked.True &&
                node.CheckState != AccessibilityChecked.Mixed {
                throw ArgumentOutOfRangeException("Tree check state")
            }
            let children = node.Children ?? []TreeNode{}
            let row = TreeViewRow{
                Node: node,
                ParentId: walk.ParentId,
                Depth: walk.Depth,
                Expanded: (children.Length > 0 || node.HasChildren) && expanded.Contains(node.Id!!),
                Selected: selected.Contains(node.Id!!),
                Disabled: walk.Disabled || node.Disabled
            }
            nodes.Add(node.Id!!, row)
            if walk.Visible {
                indices.Add(node.Id!!, rows.Count)
                rows.Add(row)
                if !row.Disabled {
                    searchable.Add(node.Id!!)
                }
                if row.Expanded && loading.Contains(node.Id!!) {
                    rows.Add(
                        TreeViewRow{
                            Node: TreeNode{Id: node.Id + "\0loading", Label: theme.Text("Loading…")},
                            ParentId: node.Id,
                            Depth: row.Depth + 1,
                            Disabled: true,
                            Loading: true
                        }
                    )
                }
            }
            Push(stack, children, node.Id, walk.Depth + 1, walk.Visible && row.Expanded, row.Disabled)
        }
        if Index(activeId) < 0 {
            var ancestor = activeId
            while ancestor != nil && previous.ContainsKey(ancestor) {
                ancestor = previous[ancestor].ParentId
                if Index(ancestor) >= 0 {
                    break
                }
            }
            activeId = Index(ancestor) >= 0 ? ancestor: Index(input.SelectedId) >= 0 ? input.SelectedId: First()
        }
        for index in 0 ... rows.Count {
            rows[index] = rows[index]with{Active = rows[index].Node.Id == activeId}
        }
        typeAhead.Items = searchable
        typeAhead.TextForId = (id string) -> nodes[id].Node.Label ?? id
        typeAhead.OnMatch = Activate
        let removed = List[string]()
        for pair in handles {
            if !nodes.ContainsKey(pair.Key) {
                removed.Add(pair.Key)
            }
        }
        for id in removed {
            handles.Remove(id)
        }

        let snapshot = input
        let key((TreeViewRow) -> string) = (row TreeViewRow) -> row.Node.Id!!
        let build((TreeViewRow) -> Blob) = (row TreeViewRow) -> BuildRow(snapshot, row)
        let content Virtual = Virtual(
            VirtualRowsSource[TreeViewRow](
                rows,
                virtualItemExtent(input.RowHeight!!, "estimatedItemHeight"),
                key,
                build,
                nil
            )
        )
        content.Key = "rows"
        content.Handle = viewport
        let fullHeight Length = float64(rows.Count) * input.RowHeight!!
        content.Height = input.Virtualize!!? Percent(100): fullHeight
        content.FlexShrink = 0
        content.MinWidth = 0
        content.MinHeight = 0
        content.OverflowX = Overflow.Hidden
        content.OverflowY = input.Virtualize!!? Overflow.Scroll: Overflow.Hidden
        content.ScrollbarY = if input.Virtualize!! {
            input.ScrollbarY
        } else {
            nil
        }
        // A full-height provider realizes every row without replacing its retained subtree when the mode changes.
        let scroll = Container{
            FlexGrow: 1,
            FlexBasis: 0,
            MinWidth: 0,
            MinHeight: 0,
            OverflowX: Overflow.Hidden,
            OverflowY: input.Virtualize!!? Overflow.Hidden: Overflow.Scroll,
            ScrollbarY: if input.Virtualize!! {
                nil
            } else {
                input.ScrollbarY
            },
            content
        }
        var root = Container{
            LineHeight: theme.LineHeight,
            Handle: rootHandle,
            Width: input.Width!!,
            Height: input.Height!!,
            MinWidth: 0,
            MinHeight: 0,
            BackgroundColor: input.BackgroundColor!!,
            BorderRadius: theme.PanelRadius,
            Padding: Edges{Right: theme.RowInset, Left: theme.RowInset},
            Focus: theme.FocusStyle,
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.Handle = rootHandle
        root.Direction = theme.Direction
        root.Focusable = !input.Disabled
        root.Disabled = input.Disabled
        root.OnPointerDown = (e PointerEvent) -> pointerFocus = true
        root.OnKeyDown = (e KeyEvent) -> {
            pointerFocus = false
            if input.OnKeyDown?.Invoke(e) ?? false {
                e.PreventDefault()
                e.StopPropagation()
                return
            }
            KeyDown(e)
        }
        root.OnFocus = (e FocusEvent) -> {
            hasFocus = true
            RevealActive()
        }
        root.OnBlur = (e FocusEvent) -> {
            hasFocus = false
            typeAhead.Reset()
        }
        var activeHandle ElementHandle?
        if let id = activeId {
            activeHandle = Handle(id)
        }
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Tree,
            Name: input.AccessibilityName!!,
            MultiSelectable: input.Multiple || input.MultiSelectable,
            Relationships: AccessibilityRelationships{ActiveDescendant: activeHandle}
        }
        root.Children.Clear()
        root.Children.Add(scroll)
        return root
    }

    private func Push(
        stack Stack[TreeWalk],
        children[]TreeNode,
        parent string?,
        depth int32,
        visible bool,
        disabled bool
    ) {
        for var index = children.Length; index > 0; index-- {
            stack.Push(
                TreeWalk{
                    Node: children[index - 1],
                    ParentId: parent,
                    Depth: depth,
                    Visible: visible,
                    Disabled: disabled
                }
            )
        }
    }

    private func Handle(id string) ElementHandle {
        if !handles.ContainsKey(id) {
            handles.Add(id, ElementHandle())
        }
        return handles[id]
    }

    private func Index(id string?) int32 {
        if id == nil || !indices.ContainsKey(id) {
            return -1
        }
        let index = indices[id]
        return rows[index].Disabled ? -1: index
    }

    private func First() string? {
        let index = RovingFocus.Next[TreeViewRow](
            rows,
            -1,
            Key.Home,
            AccessibilityOrientation.Vertical,
            false,
            (row TreeViewRow) -> row.Disabled
        )
        return index < 0 ? nil: rows[index].Node.Id
    }

    private func Activate(id string) {
        if Index(id) < 0 {
            return
        }
        activeId = id
        rootHandle.Focus()
        RevealActive()
    }

    private func RevealActive() {
        if activeId == nil || Index(activeId) < 0 {
            return
        }
        let handle = Handle(activeId!!)
        if handle.IsMounted {
            handle.ScrollIntoView()
        } else if input.Virtualize ?? true {
            viewport.ScrollToItem(activeId!!)
        }
    }

    private func Select(id string, toggle bool = false, extend bool = false) {
        if Index(id) < 0 {
            return
        }
        let previous = activeId
        Activate(id)
        if input.OnSelectionChange == nil {
            input.OnSelect?.Invoke(id)
            return
        }
        let next = HashSet[string](StringComparer.Ordinal)
        if input.Multiple && toggle {
            next.UnionWith(selected)
        }
        if input.Multiple && extend {
            let anchor = Index(anchorId) >= 0 ? Index(anchorId): Index(previous)
            let target = Index(id)
            for index in Math.Min(Math.Max(0, anchor), target) ... Math.Max(anchor, target) + 1 {
                if !rows[index].Disabled {
                    next.Add(rows[index].Node.Id!!)
                }
            }
        } else {
            if !next.Add(id) {
                next.Remove(id)
            }
            anchorId = id
        }
        let values = List[string]()
        for row in rows {
            if !row.Disabled && next.Contains(row.Node.Id!!) {
                values.Add(row.Node.Id!!)
            }
        }
        input.OnSelectionChange?.Invoke(values.ToArray())
    }

    private func ActivateRow(id string) {
        if Index(id) < 0 {
            return
        }
        let row = rows[Index(id)]
        Select(id)
        if input.ExpandOnActivate && ((row.Node.Children ?? []TreeNode{}).Length > 0 || row.Node.HasChildren) {
            Expand(id, !row.Expanded)
        }
    }

    private func Expand(id string, expanded bool) {
        if Index(id) < 0 {
            return
        }
        Activate(id)
        input.OnExpandedChange?.Invoke(id, expanded)
        let node = rows[Index(id)].Node
        if expanded && node.HasChildren && node.Children == nil && !(input.LoadingIds ?? []string{}).Contains(id) {
            input.LoadChildren?.Invoke(id)
        }
    }

    private func Check(id string) {
        if Index(id) < 0 {
            return
        }
        let row = rows[Index(id)]
        if row.Node.CheckState == AccessibilityChecked.Unspecified {
            return
        }
        Activate(id)
        input.OnCheckChange?.Invoke(
            id,
            row.Node.CheckState == AccessibilityChecked.True ? AccessibilityChecked.False: AccessibilityChecked.True
        )
    }

    private func BuildRow(snapshot TreeViewInput, row TreeViewRow) Blob {
        let id = row.Node.Id!!
        let children = List[Blob]()
        if row.Loading {
            return Container{
                Key: id,
                Height: snapshot.RowHeight!!,
                PaddingStart: theme.ControlPadding + float64(row.Depth) * snapshot.Indent!!,
                Accessibility: Accessibility{Role: AccessibilityRole.Status, Name: theme.Text("Loading children"), Busy: true},
                Text{Content: theme.Text("Loading…"), Color: theme.MutedTextColor}
            }
        }
        let branch = (row.Node.Children ?? []TreeNode{}).Length > 0 || row.Node.HasChildren
        if branch {
            var expander = Button{
                Width: theme.ControlHeight,
                Height: Math.Min(theme.ControlHeight, snapshot.RowHeight!!),
                BackgroundColor: Color.Transparent,
                Padding: theme.Spacing / 2.0,
                MaterialIcons.Create(row.Expanded ? "expand_more": theme.RightToLeft ? "chevron_left": "chevron_right", 16, snapshot.TextColor)
            }
            if let create = snapshot.CreateExpander {
                expander = create(snapshot, row, expander)
            }
            expander.Key = "expander"
            expander.Focusable = false
            expander.TabStop = false
            expander.Disabled = row.Disabled || snapshot.OnExpandedChange == nil
            expander.OnClick = () -> Expand(id, !row.Expanded)
            expander.Accessibility = Accessibility{Hidden: true}
            children.Add(expander)
        } else {
            children.Add(
                Container{
                    Key: "expander",
                    Width: theme.ControlHeight,
                    FlexShrink: 0,
                    Accessibility: Accessibility{Hidden: true}
                }
            )
        }
        if row.Node.CheckState != AccessibilityChecked.Unspecified {
            var check = (
                Checkbox{
                    State: row.Node.CheckState,
                    Disabled: row.Disabled || snapshot.OnCheckChange == nil,
                    OnChange: (state AccessibilityChecked) -> Check(id)
                }.Build() as Button
            )!!
            if let create = snapshot.CreateCheck {
                check = create(snapshot, row, check)
            }
            check.Key = "check"
            check.Focusable = false
            check.TabStop = false
            check.Disabled = row.Disabled || snapshot.OnCheckChange == nil
            check.OnClick = () -> Check(id)
            check.Accessibility = Accessibility{Hidden: true}
            children.Add(check)
        }
        var label Blob = row
            .Node
            .Content ??
            Text{
            Content: row.Node.Label ?? id,
            Color: row.Selected ? theme.SelectedText(snapshot.TextColor!!): snapshot.TextColor!!,
            TextWrap: TextWrap.NoWrap,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            FontWeight: theme.FontWeight,
        }
        if let create = snapshot.CreateContent {
            label = create(snapshot, row, label)
        }
        children.Add(Container{Key: "content", FlexGrow: 1, FlexShrink: 1, MinWidth: 0, label})
        let tinted = row.Selected || theme.Selection == SelectionStyle.Tint
        var root = Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            PaddingStart: theme.ControlPadding + float64(row.Depth) * snapshot.Indent!!,
            BackgroundColor: row.Selected ? snapshot.SelectedColor!!: Color.Transparent,
            BorderRadius: theme.RowInset > 0.0 ? theme.ControlRadius: 0.0,
            Hover: Style{BackgroundColor: tinted ? snapshot.SelectedColor!!: theme.HoverColor},
            OutlineWidth: row.Active && hasFocus && !pointerFocus ? theme.FocusRingWidth: 0.0,
            OutlineColor: theme.FocusColor,
            OutlineOffset: -theme.FocusRingWidth,
            Opacity: row.Disabled ? .45: 1.0,
            Overflow: Overflow.Hidden
        }
        for child in children {
            root.Children.Add(child)
        }
        if row.Selected && theme.Selection == SelectionStyle.Indicator {
            root.Children.Add(theme.SelectionBar())
        }
        if let create = snapshot.CreateRow {
            root = create(snapshot, row, root)
        }
        root.Key = id
        root.Handle = Handle(id)
        root.FlexDirection = FlexDirection.Row
        root.AlignItems = AlignItems.Center
        root.MinWidth = 0
        root.Height = snapshot.RowHeight!!
        root.FlexShrink = 0
        root.Disabled = row.Disabled
        root.Focusable = false
        root.TabStop = false
        root.OnPointerDown = (e PointerEvent) -> {
            clickModifiers = e.Modifiers
            clickFromChild = e.IsFromInteractiveChild
        }
        root.OnClick = () -> {
            if !clickFromChild {
                if snapshot.OnSelectionChange != nil {
                    Select(id, clickModifiers.Ctrl || clickModifiers.Super, clickModifiers.Shift)
                    if snapshot.ExpandOnActivate && branch {
                        Expand(id, !row.Expanded)
                    }
                } else {
                    ActivateRow(id)
                }
            }
        }
        if snapshot.OnDrop != nil && !row.Disabled {
            root.DragSource = DragSource(
                (e DragStartEvent) -> {
                    let ids = List[string]()
                    if selected.Contains(id) {
                        for item in rows {
                            if !item.Disabled && selected.Contains(item.Node.Id!!) {
                                ids.Add(item.Node.Id!!)
                            }
                        }
                    } else {
                        ids.Add(id)
                    }
                    return DragData(TreeDrag(this, ids.ToArray()), DragEffect.Move)
                }
            )
            root.DropTarget = DropTarget(
                (e DragEvent) -> CanDrop(e, id) ? DragEffect.Move: DragEffect.None,
                (e DragEvent) -> {
                    if e.Kind == DragEventKind.Drop && CanDrop(e, id) {
                        let payload = (e.Data.Value as TreeDrag)!!
                        let position = e.Position.Y < snapshot.RowHeight!!/ 4.0 ? TreeDropPosition.Before:
                        e.Position.Y > snapshot.RowHeight!!* .75 ? TreeDropPosition.After: TreeDropPosition.Into
                        snapshot.OnDrop?.Invoke(payload.Ids, id, position)
                    }
                }
            )
        }
        root.OnFocus = (e FocusEvent) -> {
            activeId = id
        }
        let actions = List[AccessibilityAction]()
        if !row.Disabled {
            actions.Add(AccessibilityAction.Focus)
            if snapshot.OnSelect != nil || snapshot.OnSelectionChange != nil {
                actions.Add(AccessibilityAction.Select)
            }
            actions.Add(AccessibilityAction.Activate)
            if branch && snapshot.OnExpandedChange != nil {
                actions.Add(row.Expanded ? AccessibilityAction.Collapse: AccessibilityAction.Expand)
            }
        }
        let semantics = Accessibility{
            Role: AccessibilityRole.TreeItem,
            Name: row.Node.Label ?? id,
            Level: row.Depth + 1,
            Selected: row.Selected,
            Checked: row.Node.CheckState,
            Expanded: branch ? row.Expanded: nil,
            Actions: actions.ToArray()
        }
        if actions.Count > 0 {
            semantics.OnAction = (request AccessibilityActionRequest) -> AccessibilityAction(id, request)
        }
        root.Accessibility = semantics
        return root
    }

    private func AccessibilityAction(id string, request AccessibilityActionRequest) bool {
        if Index(id) < 0 {
            return false
        }
        let row = rows[Index(id)]
        if request.Action == Goo.AccessibilityAction.Focus {
            Activate(id)
            return true
        }
        if request.Action == Goo
            .AccessibilityAction
            .Select &&
            (input.OnSelect != nil || input.OnSelectionChange != nil) {
            Select(id)
            return true
        }
        if request.Action == Goo.AccessibilityAction.Activate {
            if input.ExpandOnActivate && ((row.Node.Children ?? []TreeNode{}).Length > 0 || row.Node.HasChildren) {
                ActivateRow(id)
                return true
            }
            if row.Node.CheckState != AccessibilityChecked.Unspecified && input.OnCheckChange != nil {
                Check(id)
                return true
            }
            if input.OnSelect != nil || input.OnSelectionChange != nil {
                Select(id)
                return true
            }
            Activate(id)
            return true
        }
        if (request.Action == Goo.AccessibilityAction.Expand || request.Action == Goo.AccessibilityAction.Collapse)
        && input.OnExpandedChange != nil && ((row.Node.Children ?? []TreeNode{}).Length > 0 || row.Node.HasChildren) {
            Expand(id, request.Action == Goo.AccessibilityAction.Expand)
            return true
        }
        return false
    }

    private func CanDrop(e DragEvent, id string) bool {
        let payload = e.Data.Value as TreeDrag
        if payload == nil || payload.Owner != this || Index(id) < 0 {
            return false
        }
        var ancestor string? = id
        while ancestor != nil {
            for source in payload.Ids {
                if ancestor == source {
                    return false
                }
            }
            ancestor = nodes[ancestor].ParentId
        }
        return true
    }

    private func KeyDown(e KeyEvent) {
        if input.Disabled {
            return
        }
        let index = Index(activeId)
        if index < 0 {
            return
        }
        if input.Multiple && (e.Modifiers.Ctrl || e.Modifiers.Super) && e.Key == Key.A {
            let ids = List[string]()
            for item in rows {
                if !item.Disabled {
                    ids.Add(item.Node.Id!!)
                }
            }
            input.OnSelectionChange?.Invoke(ids.ToArray())
            e.PreventDefault()
            e.StopPropagation()
            return
        }
        typeAhead.ActiveId = activeId
        if typeAhead.HandleKey(e) {
            return
        }
        let row = rows[index]
        var next = index
        if e.Key == Key.Up || e.Key == Key.Down || e.Key == Key.Home || e.Key == Key.End {
            next = RovingFocus.Next[TreeViewRow](
                rows,
                index,
                e.Key,
                AccessibilityOrientation.Vertical,
                false,
                (item TreeViewRow) -> item.Disabled
            )
        } else if e.Key == (theme.RightToLeft ? Key.Right: Key.Left) {
            if row.Expanded {
                Expand(row.Node.Id!!, false)
            } else {
                next = Index(row.ParentId)
            }
        } else if e.Key == (theme.RightToLeft ? Key.Left: Key.Right) {
            if (row.Node.Children ?? []TreeNode{}).Length > 0 || row.Node.HasChildren {
                if !row.Expanded {
                    Expand(row.Node.Id!!, true)
                } else {
                    for child in index + 1 ... rows.Count {
                        if rows[child].Depth <= row.Depth {
                            break
                        }
                        if rows[child].ParentId == row.Node.Id && !rows[child].Disabled {
                            next = child
                            break
                        }
                    }
                }
            }
        } else if e.Key == Key.Enter {
            ActivateRow(row.Node.Id!!)
        } else if e.Key == Key.Space {
            if row.Node.CheckState != AccessibilityChecked.Unspecified {
                Check(row.Node.Id!!)
            } else {
                Select(row.Node.Id!!, e.Modifiers.Ctrl || e.Modifiers.Super, e.Modifiers.Shift)
            }
        } else if e.Key == Key.F2 {
            input.OnRename?.Invoke(row.Node.Id!!)
        } else {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        if next >= 0 && next < rows.Count {
            let id = rows[next].Node.Id!!
            if next != index &&
                input.OnSelectionChange != nil &&
                (e.Key == Key.Up || e.Key == Key.Down || e.Key == Key.Home || e.Key == Key.End) &&
                (!(e.Modifiers.Ctrl || e.Modifiers.Super) || e.Modifiers.Shift) {
                Select(id, e.Modifiers.Ctrl || e.Modifiers.Super, e.Modifiers.Shift)
            } else {
                Activate(id)
            }
        }
    }
}
