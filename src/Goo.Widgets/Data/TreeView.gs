package Goo.Widgets.Data

import System
import System.Collections.Generic
import Goo
import Goo.Widgets.Icons
import Goo.Widgets.Inputs

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
  var Children [] ? TreeNode
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
}

/// Controlled hierarchy, selection, and appearance for a mounted tree.
public data struct TreeViewInput {
  /// Root nodes. Nil resolves to an empty tree.
  var Nodes [] ? TreeNode
  /// Controlled expanded identities; unknown/stale IDs are ignored.
  var ExpandedIds [] ? string
  /// Requests expansion changes. The host updates ExpandedIds and rebuilds.
  var OnExpandedChange Action[string, bool]?
  /// Controlled single row selection.
  var SelectedId string?
  /// Requests single row selection.
  var OnSelect Action[string]?
  /// Requests a check change without applying any descendant or ancestor cascade. Mixed requests True.
  var OnCheckChange Action[string, AccessibilityChecked]?
  /// Describes a host policy allowing multiple checked nodes; row selection remains single.
  var MultiSelectable bool
  /// Disables the whole tree.
  var Disabled bool
  /// Whether to virtualize flattened visible rows. Nil resolves to true.
  var Virtualize bool?
  /// Viewport width. Nil resolves to 100%.
  var Width Length?
  /// Viewport height. Nil resolves to 280.
  var Height Length?
  /// Fixed visual row height. Nil resolves to 34.
  var RowHeight float64?
  /// Indentation per depth level. Nil resolves to 20.
  var Indent float64?
  /// Accessible tree name. Nil resolves to Tree.
  var AccessibilityName string?
  /// Root fill. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Label color. Nil resolves to #e4e4e7.
  var TextColor Color?
  /// Selected row fill. Nil resolves to #34334c.
  var SelectedColor Color?
  /// Customizes content in the standard row slots.
  var CreateContent Func[TreeViewInput, TreeViewRow, Blob, Blob]?
  /// Customizes the expansion button; required identity and input wiring are reapplied.
  var CreateExpander Func[TreeViewInput, TreeViewRow, Button, Button]?
  /// Customizes the composed Checkbox button; required identity and input wiring are reapplied.
  var CreateCheck Func[TreeViewInput, TreeViewRow, Button, Button]?
  /// Customizes row appearance; standard slots, identity, input, and semantics are reapplied.
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

/// A controlled tree using one stable focus target and an accessible active descendant, including virtual rows.
public open class TreeView : Cell[TreeViewInput] {
  private let rootHandle ElementHandle = ElementHandle()
  private let viewport ElementHandle = ElementHandle()
  private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
  private var nodes Dictionary[string, TreeViewRow] = Dictionary[string, TreeViewRow](StringComparer.Ordinal)
  private var indices Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
  private var rows List[TreeViewRow] = List[TreeViewRow]()
  private var input TreeViewInput
  private var activeId string?
  private var hasFocus bool

  protected override func Build(value TreeViewInput) Blob {
    let defaultHeight Length = 280
    input = value with{Virtualize = value.Virtualize ?? true, Width = value.Width ?? Length.Percent(100), Height = value.Height ?? defaultHeight,
      RowHeight = value.RowHeight ?? 34.0, Indent = value.Indent ?? 20.0, AccessibilityName = value.AccessibilityName ?? "Tree",
      BackgroundColor = value.BackgroundColor ?? Color.Parse("#18181b"), TextColor = value.TextColor ?? Color.Parse("#e4e4e7"), SelectedColor = value.SelectedColor ?? Color.Parse("#34334c")}
    if !Double.IsFinite(input.RowHeight!!) || input.RowHeight!! <= 0.0 || !Double.IsFinite(input.Indent!!) || input.Indent!! < 0.0 { throw ArgumentOutOfRangeException("Tree row height/indent") }
    let previous = nodes
    nodes = Dictionary[string, TreeViewRow](StringComparer.Ordinal)
    indices = Dictionary[string, int32](StringComparer.Ordinal)
    rows = List[TreeViewRow]()
    let expanded = HashSet[string](input.ExpandedIds ?? []string{}, StringComparer.Ordinal)
    let stack = Stack[TreeWalk]()
    Push(stack, input.Nodes ?? []TreeNode{}, nil, 0, true, input.Disabled)
    while stack.Count > 0 {
      let walk = stack.Pop()
      let node = walk.Node
      if String.IsNullOrEmpty(node.Id) || nodes.ContainsKey(node.Id!!) { throw ArgumentException("Tree node IDs must be nonempty and unique; cyclic/shared nodes are not supported.") }
      if node.CheckState != AccessibilityChecked.Unspecified && node.CheckState != AccessibilityChecked.False && node.CheckState != AccessibilityChecked.True && node.CheckState != AccessibilityChecked.Mixed { throw ArgumentOutOfRangeException("Tree check state") }
      let children = node.Children ?? []TreeNode{}
      let row = TreeViewRow{Node: node, ParentId: walk.ParentId, Depth: walk.Depth, Expanded: children.Length > 0 && expanded.Contains(node.Id!!),
        Selected: node.Id == input.SelectedId, Disabled: walk.Disabled || node.Disabled}
      nodes.Add(node.Id!!, row)
      if walk.Visible { indices.Add(node.Id!!, rows.Count)
        rows.Add(row) }
      Push(stack, children, node.Id, walk.Depth + 1, walk.Visible && row.Expanded, row.Disabled)
    }
    if Index(activeId) < 0 {
      var ancestor = activeId
      while ancestor != nil && previous.ContainsKey(ancestor!!) {
        ancestor = previous[ancestor!!].ParentId
        if Index(ancestor) >= 0 { break }
      }
      activeId = Index(ancestor) >= 0 ? ancestor : Index(input.SelectedId) >= 0 ? input.SelectedId : First(false)
    }
    for index in 0 ... rows.Count { rows[index] = rows[index]with{Active = rows[index].Node.Id == activeId} }
    let removed = List[string]()
    for pair in handles { if !nodes.ContainsKey(pair.Key) { removed.Add(pair.Key) } }
    for id in removed { handles.Remove(id) }

    let snapshot = input
    let content = VirtualRows(rows, input.RowHeight!!, (row TreeViewRow) -> row.Node.Id!!,
      (row TreeViewRow) -> BuildRow(snapshot, row))
    content.Key = "rows"
    content.Handle = viewport
    let fullHeight Length = float64(rows.Count) * input.RowHeight!!
    content.Height = input.Virtualize!! ? Length.Percent(100) : fullHeight
    content.FlexShrink = 0
    content.MinWidth = 0
    content.MinHeight = 0
    content.OverflowX = Overflow.Hidden
    content.OverflowY = input.Virtualize!! ? Overflow.Scroll : Overflow.Hidden
    // A full-height provider realizes every row without replacing its retained subtree when the mode changes.
    let scroll = Container{FlexGrow: 1, FlexBasis: 0, MinWidth: 0, MinHeight: 0, OverflowX: Overflow.Hidden,
      OverflowY: input.Virtualize!! ? Overflow.Hidden : Overflow.Scroll, Children: {content}}
    var root = Container{Handle: rootHandle, Width: input.Width!!, Height: input.Height!!, MinWidth: 0, MinHeight: 0, BackgroundColor: input.BackgroundColor!!, BorderRadius: 5}
    if let create = input.CreateRoot { root = create(input, root) }
    root.Handle = rootHandle
    root.Focusable = !input.Disabled
    root.Disabled = input.Disabled
    root.OnKeyDown = KeyDown
    root.OnFocus = (e FocusEvent) -> { hasFocus = true
      RevealActive() }
    root.OnBlur = (e FocusEvent) -> { hasFocus = false }
    var activeHandle ElementHandle?
    if let id = activeId { activeHandle = Handle(id) }
    root.Accessibility = Accessibility{Role: AccessibilityRole.Tree, Name: input.AccessibilityName!!, MultiSelectable: input.MultiSelectable,
      Relationships: AccessibilityRelationships{ActiveDescendant: activeHandle}}
    root.Children.Clear()
    root.Children.Add(scroll)
    return root
  }

  private func Push(stack Stack[TreeWalk], children []TreeNode, parent string?, depth int32, visible bool, disabled bool) {
    for var index = children.Length; index > 0; index-- {
      stack.Push(TreeWalk{Node: children[index - 1], ParentId: parent, Depth: depth, Visible: visible, Disabled: disabled})
    }
  }
  private func Handle(id string) ElementHandle {
    if !handles.ContainsKey(id) { handles.Add(id, ElementHandle()) }
    return handles[id]
  }
  private func Index(id string?) int32 {
    if id == nil || !indices.ContainsKey(id!!) { return -1 }
    let index = indices[id!!]
    return rows[index].Disabled ? -1 : index
  }
  private func First(last bool) string? {
    for step in 0 ... rows.Count {
      let index = last ? rows.Count - step - 1 : step
      if !rows[index].Disabled { return rows[index].Node.Id }
    }
    return nil
  }
  private func Activate(id string) {
    if Index(id) < 0 { return }
    activeId = id
    rootHandle.Focus()
    RevealActive()
  }
  private func RevealActive() {
    if activeId == nil || Index(activeId) < 0 { return }
    let handle = Handle(activeId!!)
    if handle.IsMounted { handle.ScrollIntoView() }
    else if input.Virtualize ?? true { viewport.ScrollToItem(activeId!!) }
  }
  private func Select(id string) {
    if Index(id) < 0 { return }
    Activate(id)
    input.OnSelect?.Invoke(id)
  }
  private func Expand(id string, expanded bool) {
    if Index(id) < 0 { return }
    Activate(id)
    input.OnExpandedChange?.Invoke(id, expanded)
  }
  private func Check(id string) {
    if Index(id) < 0 { return }
    let row = rows[Index(id)]
    if row.Node.CheckState == AccessibilityChecked.Unspecified { return }
    Activate(id)
    input.OnCheckChange?.Invoke(id, row.Node.CheckState == AccessibilityChecked.True ? AccessibilityChecked.False : AccessibilityChecked.True)
  }

  private func BuildRow(snapshot TreeViewInput, row TreeViewRow) Blob {
    let id = row.Node.Id!!
    let children = List[Blob]()
    let branch = (row.Node.Children ?? []TreeNode{}).Length > 0
    if branch {
      var expander = Button{Width: 20, Height: 22, BackgroundColor: Color.Transparent, Padding: 2,
        Children: {MaterialIcons.Create(row.Expanded ? "expand_more" : "chevron_right", 16, snapshot.TextColor)}}
      if let create = snapshot.CreateExpander { expander = create(snapshot, row, expander) }
      expander.Key = "expander"
      expander.Focusable = false
      expander.TabStop = false
      expander.Disabled = row.Disabled || snapshot.OnExpandedChange == nil
      expander.OnClick = () -> Expand(id, !row.Expanded)
      expander.Accessibility = Accessibility{Hidden: true}
      children.Add(expander)
    } else { children.Add(Container{Key: "expander", Width: 20, FlexShrink: 0, Accessibility: Accessibility{Hidden: true}}) }
    if row.Node.CheckState != AccessibilityChecked.Unspecified {
      var check = (Checkbox{State: row.Node.CheckState, Disabled: row.Disabled || snapshot.OnCheckChange == nil,
        Size: 18, OnChange: (state AccessibilityChecked) -> Check(id)}.Build() as Button)!!
      if let create = snapshot.CreateCheck { check = create(snapshot, row, check) }
      check.Key = "check"
      check.Focusable = false
      check.TabStop = false
      check.Disabled = row.Disabled || snapshot.OnCheckChange == nil
      check.OnClick = () -> Check(id)
      check.Accessibility = Accessibility{Hidden: true}
      children.Add(check)
    }
    var label Blob = row.Node.Content ?? Text{Content: row.Node.Label ?? id, Color: snapshot.TextColor!!, TextWrap: TextWrap.NoWrap, FontSize: 14}
    if let create = snapshot.CreateContent { label = create(snapshot, row, label) }
    children.Add(Container{Key: "content", FlexGrow: 1, MinWidth: 0, Children: {label}})
    var root = Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: 6,
      PaddingLeft: 6.0 + float64(row.Depth) * snapshot.Indent!!, PaddingRight: 8,
      BackgroundColor: row.Selected ? snapshot.SelectedColor!! : Color.Transparent,
      Hover: Style{BackgroundColor: snapshot.SelectedColor!!},
      OutlineWidth: row.Active && hasFocus ? 1.0 : 0.0, OutlineColor: "#a5b4fc", OutlineOffset: -1,
      Opacity: row.Disabled ? .45 : 1.0, Overflow: Overflow.Hidden}
    if let create = snapshot.CreateRow { root = create(snapshot, row, root) }
    root.Key = id
    root.Handle = Handle(id)
    root.FlexDirection = FlexDirection.Row
    root.AlignItems = AlignItems.Center
    root.PaddingLeft = 6.0 + float64(row.Depth) * snapshot.Indent!!
    root.MinWidth = 0
    root.Height = snapshot.RowHeight!!
    root.FlexShrink = 0
    root.Disabled = row.Disabled
    root.Focusable = false
    root.TabStop = false
    root.OnClick = () -> Select(id)
    root.OnFocus = (e FocusEvent) -> { activeId = id }
    let actions = List[AccessibilityAction]()
    if !row.Disabled {
      actions.Add(AccessibilityAction.Focus)
      if snapshot.OnSelect != nil { actions.Add(AccessibilityAction.Select) }
      actions.Add(AccessibilityAction.Activate)
      if branch && snapshot.OnExpandedChange != nil { actions.Add(row.Expanded ? AccessibilityAction.Collapse : AccessibilityAction.Expand) }
    }
    let semantics = Accessibility{Role: AccessibilityRole.TreeItem, Name: row.Node.Label ?? id, Level: row.Depth + 1,
      Selected: row.Selected, Checked: row.Node.CheckState, Expanded: branch ? row.Expanded : nil,
      Actions: actions.ToArray()}
    if actions.Count > 0 { semantics.OnAction = (request AccessibilityActionRequest) -> AccessibilityAction(id, request) }
    root.Accessibility = semantics
    root.Children.Clear()
    for child in children { root.Children.Add(child) }
    return root
  }

  private func AccessibilityAction(id string, request AccessibilityActionRequest) bool {
    if Index(id) < 0 { return false }
    let row = rows[Index(id)]
    if request.Action == Goo.AccessibilityAction.Focus { Activate(id)
      return true }
    if request.Action == Goo.AccessibilityAction.Select && input.OnSelect != nil { Select(id)
      return true }
    if request.Action == Goo.AccessibilityAction.Activate {
      if row.Node.CheckState != AccessibilityChecked.Unspecified && input.OnCheckChange != nil { Check(id)
        return true }
      if input.OnSelect != nil { Select(id)
        return true }
      Activate(id)
      return true
    }
    if (request.Action == Goo.AccessibilityAction.Expand || request.Action == Goo.AccessibilityAction.Collapse)
      && input.OnExpandedChange != nil && (row.Node.Children ?? []TreeNode{}).Length > 0 {
        Expand(id, request.Action == Goo.AccessibilityAction.Expand)
        return true
      }
    return false
  }

  private func KeyDown(e KeyEvent) {
    if input.Disabled { return }
    let index = Index(activeId)
    if index < 0 { return }
    let row = rows[index]
    var next = index
    if e.Key == Key.Up || e.Key == Key.Down {
      let direction = e.Key == Key.Up ? -1 : 1
      next += direction
      while next >= 0 && next < rows.Count && rows[next].Disabled { next += direction }
    } else if e.Key == Key.Home { next = Index(First(false)) }
    else if e.Key == Key.End { next = Index(First(true)) }
    else if e.Key == Key.Left {
      if row.Expanded { Expand(row.Node.Id!!, false) }
      else { next = Index(row.ParentId) }
    } else if e.Key == Key.Right {
      if (row.Node.Children ?? []TreeNode {}).Length > 0 {
        if !row.Expanded { Expand(row.Node.Id!!, true) }
        else {
          for child in index + 1 ... rows.Count {
            if rows[child].Depth <= row.Depth { break }
            if rows[child].ParentId == row.Node.Id && !rows[child].Disabled { next = child
              break }
          }
        }
      }
    } else if e.Key == Key.Enter { Select(row.Node.Id!!) }
    else if e.Key == Key.Space {
      if row.Node.CheckState != AccessibilityChecked.Unspecified { Check(row.Node.Id!!) }
      else { Select(row.Node.Id!!) }
    } else { return }
    e.PreventDefault()
    e.StopPropagation()
    if next >= 0 && next < rows.Count { Activate(rows[next].Node.Id!!) }
  }
}
