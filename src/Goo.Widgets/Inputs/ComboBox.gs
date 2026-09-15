package Goo.Widgets.Inputs

import System
import System.Collections.Generic
import Goo
import Goo.Widgets.Layout

/// One stable selector option; custom content retains its accessible label.
public data struct ComboBoxOption {
  var Id string?
  var Label string?
  var Content Blob?
  var Disabled bool
}

/// Controlled selection with optional controlled opening and search state.
public data struct ComboBoxInput {
  var Items [] ? ComboBoxOption
  var SelectedId string?
  var OnSelect Action[string]?
  var Disabled bool
  var Placeholder string?
  var AccessibilityName string?
  /// A mounted, unclipped overlay region in the same window. Required when open.
  var OverlayHost ElementHandle?
  /// Nil lets the widget own opening; otherwise update Open in OnOpenChange.
  var Open bool?
  var OnOpenChange Action[bool]?
  var Searchable bool
  /// Nil lets the widget own the query; otherwise update it in OnQueryChange.
  var Query string?
  var OnQueryChange Action[string]?
  var SearchPlaceholder string?
  var EmptyText string?
  var Width float64
  var PopupHeight float64
  var RowHeight float64
  /// Layer of the component while open. Its ancestors must permit visible overflow.
  var ZIndex int32
  var CreateTrigger Func[ComboBoxInput, Button, Button]?
  var CreateSearch Func[ComboBoxInput, TextEntry, TextEntry]?
  var CreateRow Func[ComboBoxInput, ComboBoxOption, Container, Container]?
  var CreatePopup Func[ComboBoxInput, Container, Container]?
  var CreateRoot Func[ComboBoxInput, Container, Container]?
}

internal data struct ComboBoxRow {
  var Item ComboBoxOption
  var Selected bool
  var Active bool
  var Input ComboBoxInput
}

/// An anchored selector with virtual options and commit/cancel keyboard navigation.
public open class ComboBox : Cell[ComboBoxInput], IDisposable {
  private var current ComboBoxInput
  private let rootHandle ElementHandle = ElementHandle()
  private let trigger ElementHandle = ElementHandle()
  private let listHandle ElementHandle = ElementHandle()
  private let searchHandle ElementHandle = ElementHandle()
  private let viewport ElementHandle = ElementHandle()
  private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)
  private var overlay ElementHandle?
  private var overlayBox ElementRect
  private var rootBox ElementRect
  private var rows List[ComboBoxRow] = List[ComboBoxRow]()
  private var activeId string = ""
  private var ownedOpen bool
  private var ownedQuery string = ""
  private var wasOpen bool
  private var revealPending bool
  private var disposed bool

  public init() { rootHandle.MetricsChanged += RootMetrics
    viewport.MetricsChanged += ListMetrics }

  /// Releases geometry subscriptions; the composed popup owns its focus scope.
  public func Dispose() {
    if disposed { return }
    disposed = true
    rootHandle.MetricsChanged -= RootMetrics
    viewport.MetricsChanged -= ListMetrics
    BindOverlay(nil)
  }

  protected override func Build(input ComboBoxInput) Blob {
    current = input with{Width = input.Width == 0.0 ? 280.0 : input.Width,
      PopupHeight = input.PopupHeight == 0.0 ? 260.0 : input.PopupHeight,
      RowHeight = input.RowHeight == 0.0 ? 34.0 : input.RowHeight,
      Placeholder = input.Placeholder ?? "Choose an option", AccessibilityName = input.AccessibilityName ?? "Choose an option",
      ZIndex = input.ZIndex == 0 ? 20 : input.ZIndex}
    if !Double.IsFinite(current.Width) || current.Width <= 2.0
      || !Double.IsFinite(current.PopupHeight) || current.PopupHeight <= 42.0
      || !Double.IsFinite(current.RowHeight) || current.RowHeight <= 0.0 {
        throw ArgumentOutOfRangeException("ComboBox dimensions")
      }
    let requestedOpen = !input.Disabled && (input.Open ?? ownedOpen)
    BindOverlay(input.OverlayHost)
    if requestedOpen && overlay == nil { throw InvalidOperationException("An open ComboBox requires an OverlayHost") }
    let isOpen = requestedOpen && (overlay?.IsMounted ?? false)
    let query = input.Query ?? ownedQuery
    let ids = HashSet[string](StringComparer.Ordinal)
    var selected ComboBoxOption?
    rows = List[ComboBoxRow]()
    for item in input.Items ?? []ComboBoxOption {} {
      if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) { throw ArgumentException("ComboBox option IDs must be nonempty and unique") }
      if item.Id == input.SelectedId { selected = item }
      if !input.Searchable || query.Length == 0 || (item.Label ?? item.Id!!).IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0 {
        rows.Add(ComboBoxRow{Item: item, Selected: item.Id == input.SelectedId, Input: current})
      }
    }
    let removed = List[string]()
    for id in handles.Keys { if !ids.Contains(id) { removed.Add(id) } }
    for id in removed { handles.Remove(id) }
    if !isOpen { wasOpen = false }
    else if !wasOpen {
      activeId = Index(input.SelectedId ?? "") >= 0 ? input.SelectedId!! : First(false)
      wasOpen = true
      revealPending = true
    }
    if Index(activeId) < 0 { activeId = First(false) }
    for i in 0 ... rows.Count { rows[i] = rows[i]with{Active = rows[i].Item.Id == activeId} }
    let label = selected?.Label ?? selected?.Id ?? current.Placeholder!!
    let valueContent = selected?.Content ?? Text{Content: label, Color: selected == nil ? Color.Parse("#a1a1aa") : Color.Parse("#fafafa"), TextWrap: TextWrap.NoWrap}
    var button = Button{Height: 38.0, PaddingLeft: 12.0, PaddingRight: 10.0, Gap: 12.0,
      FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, BackgroundColor: "#27272a", BorderColor: "#52525b", BorderWidth: 1.0, BorderRadius: 6.0}
    if let create = current.CreateTrigger { button = create(current, button) }
    button.Key = "trigger"
    button.Handle = trigger
    button.Disabled = current.Disabled
    button.Focusable = !current.Disabled
    button.OnClick = () -> SetOpen(!isOpen)
    button.OnKeyDown = TriggerKey
    button.Accessibility = Accessibility{Role: AccessibilityRole.ComboBox, Name: current.AccessibilityName!!,
      Value: label, Expanded: isOpen, HasPopup: true, Relationships: AccessibilityRelationships{Controls: []ElementHandle{listHandle}}}
    button.Children.Clear()
    button.Children.Add(Container{Key: "value", FlexGrow: 1.0, MinWidth: 0.0, Overflow: Overflow.Hidden, Children: {valueContent}})
    button.Children.Add(Text{Key: "arrow", Content: "⌄", Color: "#a1a1aa"})
    var root = Container{Width: current.Width, MinWidth: 0.0, Overflow: Overflow.Visible}
    if let create = current.CreateRoot { root = create(current, root) }
    root.Handle = rootHandle
    root.ZIndex = isOpen ? current.ZIndex : 0
    root.Children.Clear()
    root.Children.Add(button)
    let popupHeight = Math.Min(current.PopupHeight,
      2.0 + (current.Searchable ? 38.0 : 0.0) + Math.Max(44.0, float64(rows.Count) * current.RowHeight))
    var popup = PopoverInput{Open: isOpen, Anchor: trigger, Content: BuildList(query, popupHeight), Width: current.Width,
      MaxHeight: popupHeight, Padding: 0.0, AccessibilityName: current.AccessibilityName,
      InitialFocus: current.Searchable ? searchHandle : listHandle, OnDismiss: Dismiss,
      CreateRoot: PopupRoot, CreatePanel: PopupPanel}
    if isOpen { popup.Viewport = overlayBox }
    root.Children.Add(Cell.Mount[PopoverInput, Popover]("popup", popup))
    return root
  }

  private func BuildList(query string, height float64) Container {
    var activeHandle ElementHandle?
    if activeId != "" { activeHandle = Handle(activeId) }
    let relationships = AccessibilityRelationships{ActiveDescendant: activeHandle}
    let content = Container{Height: height - 2.0, MinHeight: 0.0, MinWidth: 0.0}
    if current.Searchable {
      var entry = TextEntry{Height: 38.0, FlexShrink: 0.0, PaddingLeft: 10.0, PaddingRight: 10.0,
        BackgroundColor: "#202024", Color: "#fafafa"}
      if let create = current.CreateSearch { entry = create(current, entry) }
      entry.Key = "search"
      entry.Handle = searchHandle
      entry.Value = query
      entry.Controlled = true
      entry.Placeholder = current.SearchPlaceholder ?? "Search options"
      entry.Focusable = true
      entry.OnChange = QueryChanged
      entry.OnKeyDown = ListKey
      entry.OnFocus = (event FocusEvent) -> Reveal()
      entry.Accessibility = Accessibility{Role: AccessibilityRole.SearchBox, Name: current.SearchPlaceholder ?? "Search options", Relationships: relationships}
      content.Children.Add(entry)
    }
    let virtualRows = VirtualRows(rows, current.RowHeight, (row ComboBoxRow) -> row.Item.Id!!, BuildRow)
    virtualRows.Key = "rows"
    virtualRows.Handle = viewport
    virtualRows.FlexGrow = 1.0
    virtualRows.FlexBasis = 0.0
    virtualRows.MinHeight = 0.0
    virtualRows.OverflowY = Overflow.Scroll
    virtualRows.OverflowX = Overflow.Hidden
    let list = Container{Key: "list", Handle: listHandle, FlexGrow: 1.0, FlexBasis: 0.0, MinHeight: 0.0,
      Focusable: !current.Searchable, OnKeyDown: ListKey, OnFocus: (event FocusEvent) -> Reveal(),
      Accessibility: Accessibility{Role: AccessibilityRole.List, Name: current.AccessibilityName!!, Relationships: relationships}}
    if rows.Count == 0 { list.Children.Add(Text{Content: current.EmptyText ?? "No matches", Padding: 12.0, Color: "#a1a1aa"}) }
    else { list.Children.Add(virtualRows) }
    content.Children.Add(list)
    return content
  }

  private func BuildRow(row ComboBoxRow) Blob {
    let item = row.Item
    let id = item.Id!!
    var result = Container{PaddingLeft: 10.0, PaddingRight: 10.0, FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center, BackgroundColor: row.Active ? Color.Parse("#34334c") : Color.Transparent,
      Opacity: item.Disabled ? .45 : 1.0, OutlineWidth: row.Active ? 1.0 : 0.0, OutlineColor: "#818cf8", OutlineOffset: -1.0}
    if let create = row.Input.CreateRow { result = create(row.Input, item, result) }
    result.Key = id
    result.Handle = Handle(id)
    result.Height = row.Input.RowHeight
    result.MinHeight = row.Input.RowHeight
    result.MaxHeight = row.Input.RowHeight
    result.Focusable = false
    result.Disabled = item.Disabled
    result.OnClick = () -> Commit(id)
    result.OnPointerEnter = (event PointerEvent) -> { if !item.Disabled { activeId = id
      Rebuild() } }
    result.Accessibility = Accessibility{Role: AccessibilityRole.ListItem, Name: item.Label ?? id, Selected: row.Selected,
      Actions: []AccessibilityAction{AccessibilityAction.Select}, OnAction: (request AccessibilityActionRequest) -> {
        if request.Action != AccessibilityAction.Select || item.Disabled { return false }
        Commit(id)
        return true
      }}
    result.Children.Clear()
    result.Children.Add(item.Content ?? Text{Content: item.Label ?? id, Color: "#fafafa", TextWrap: TextWrap.NoWrap})
    return result
  }

  private func PopupPanel(input PopoverInput, bounds ElementRect, content Blob) Container {
    content.Height = Math.Max(1.0, bounds.Height - 2.0)
    let prepared = Container{BackgroundColor: "#18181b", BorderColor: "#52525b", BorderWidth: 1.0, BorderRadius: 6.0}
    return if let create = current.CreatePopup { create(current, prepared) } else { prepared }
  }
  private func PopupRoot(input PopoverInput, backdrop Container, panel Container) Container -> Container {
    Position: PositionType.Absolute, Left: overlayBox.X - rootBox.X, Top: overlayBox.Y - rootBox.Y,
    Width: overlayBox.Width, Height: overlayBox.Height,
  }
  private func Handle(id string) ElementHandle {
    if !handles.ContainsKey(id) { handles.Add(id, ElementHandle()) }
    return handles[id]
  }
  private func Index(id string) int32 {
    for i in 0 ... rows.Count { if rows[i].Item.Id == id && !rows[i].Item.Disabled { return i } }
    return -1
  }
  private func First(last bool) string {
    for step in 0 ... rows.Count {
      let i = last ? rows.Count - 1 - step : step
      if !rows[i].Item.Disabled { return rows[i].Item.Id!! }
    }
    return ""
  }
  private func Reveal() {
    if activeId == "" { revealPending = false
      return }
    if !viewport.IsMounted { revealPending = true
      return }
    let handle = Handle(activeId)
    revealPending = false
    if handle.IsMounted { handle.ScrollIntoView() } else { viewport.ScrollToItem(activeId) }
  }
  private func SetOpen(value bool) {
    if current.Disabled { return }
    ownedOpen = value
    if !value { ownedQuery = "" }
    current.OnOpenChange?.Invoke(value)
    Rebuild()
  }
  private func Dismiss(reason PopoverDismissReason) { SetOpen(false) }
  private func Commit(id string) {
    if current.Disabled || Index(id) < 0 { return }
    current.OnSelect?.Invoke(id)
    SetOpen(false)
  }
  private func QueryChanged(value string) { ownedQuery = value
    viewport.JumpTo(0.0, 0.0)
    current.OnQueryChange?.Invoke(value)
    Rebuild() }
  private func TriggerKey(event KeyEvent) {
    if event.Key == Key.Down || event.Key == Key.Up || event.Key == Key.Home || event.Key == Key.End {
      event.PreventDefault()
      event.StopPropagation()
      SetOpen(true)
    }
  }
  private func ListKey(event KeyEvent) {
    if event.Key == Key.Enter { event.PreventDefault()
      event.StopPropagation()
      Commit(activeId)
      return }
    if event.Key != Key.Down && event.Key != Key.Up && event.Key != Key.Home && event.Key != Key.End { return }
    event.PreventDefault()
    event.StopPropagation()
    if event.Key == Key.Home || event.Key == Key.End { activeId = First(event.Key == Key.End) }
    else {
      let direction = event.Key == Key.Down ? 1 : -1
      let start = Index(activeId)
      for step in 1 ... rows.Count + 1 {
        let index = (Math.Max(0, start) + direction * step + rows.Count) % rows.Count
        if !rows[index].Item.Disabled { activeId = rows[index].Item.Id!!
          break }
      }
    }
    Reveal()
    Rebuild()
  }
  private func BindOverlay(next ElementHandle?) {
    if overlay == next { return }
    if let previous = overlay { previous.MetricsChanged -= OverlayMetrics }
    overlay = next
    if let handle = overlay { overlayBox = handle.BorderBox
      handle.MetricsChanged += OverlayMetrics }
  }
  private func OverlayMetrics(metrics ElementMetrics) {
    if disposed { return }
    if !metrics.IsMounted { if wasOpen { SetOpen(false) }
      return }
    if overlayBox != metrics.BorderBox { overlayBox = metrics.BorderBox
      Rebuild() }
  }
  private func RootMetrics(metrics ElementMetrics) {
    if disposed || !metrics.IsMounted { return }
    if rootBox != metrics.BorderBox { rootBox = metrics.BorderBox
      Rebuild() }
  }
  private func ListMetrics(metrics ElementMetrics) { if !disposed && metrics.IsMounted && revealPending { Reveal() } }
}
