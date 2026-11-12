package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic
import System.Globalization

public open partial class DataGrid {
    private func ValidateWidth(width float64) {
        if !Double.IsFinite(width) || width < 0.0 || width > 1000000.0 {
            throw ArgumentOutOfRangeException("Grid column width")
        }
    }

    private func ColumnIndex(id string?) int32 {
        for index in 0 ... columns.Length {
            if columns[index].Id == id {
                return index
            }
        }
        return -1
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if Math.Abs(metrics.ContentBox.Width - available) > .01 {
            available = metrics.ContentBox.Width
            Rebuild()
        }
    }

    private func HeaderMetrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted || !viewport.IsMounted
        || metrics.ScrollOffset.X == horizontalOffset {
            return
        }
        viewport.JumpTo(metrics.ScrollOffset.X, viewport.ScrollOffset.Y)
        horizontalOffset = viewport.ScrollOffset.X
        if metrics.ScrollOffset.X != horizontalOffset {
            horizontalViewport.JumpTo(horizontalOffset, 0)
        }
        if pinnedCount > 0 {
            Rebuild()
        }
    }

    private func HorizontalMetrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if metrics.ScrollOffset.X != horizontalOffset {
            horizontalOffset = metrics.ScrollOffset.X
            horizontalViewport.JumpTo(horizontalOffset, 0)
            if pinnedCount > 0 {
                Rebuild()
            }
        }
        if !input.VirtualizeColumns {
            return
        }
        let previousFirst = firstColumn
        let previousEnd = endColumn
        ResolveVisibleColumns()
        if previousFirst != firstColumn || previousEnd != endColumn {
            Rebuild()
        }
    }

    private func ResolveVisibleColumns() {
        firstColumn = 0
        endColumn = columns.Length
        beforeColumns = 0.0
        afterColumns = 0.0
        if !input.VirtualizeColumns || !viewport.IsMounted {
            return
        }
        let left = viewport.ScrollOffset.X
        let right = left + viewport.ContentBox.Width
        var position = leading
        for index in 0 ... columns.Length {
            let end = position + widths[index]
            if index >= pinnedCount && end <= left {
                firstColumn = index + 1
                beforeColumns += widths[index]
            } else if index >= pinnedCount && position >= right {
                endColumn = Math.Min(endColumn, index)
                afterColumns += widths[index]
            }
            position = end
        }
    }

    private func Clamp(index int32, width float64) float64 -> Math.Clamp(
        width,
        columns[index].Minimum ?? 60.0,
        columns[index].Maximum ?? 1000000.0
    )

    private func ResolveWidths(verticalGutter float64) {
        widths = [columns.Length]float64
        if input.FitColumnsToViewport {
            ResolveFittedWidths(verticalGutter)
            return
        }
        let flexible = [columns.Length]bool
        tableWidth = leading
        var maxWeight float64 = 1.0
        for index in 0 ... columns.Length {
            let column = columns[index]
            var fixedWidth = column.Width
            if column.AutoWidth && fixedWidth == nil {
                fixedWidth = autoWidths != nil && autoWidths!!.TryGetValue(column.Id!!, out var measured) ?
                measured: (column.Minimum ?? 60.0)
            }
            if let overrides = input.ColumnWidths {
                if overrides.TryGetValue(column.Id!!, out var width) {
                    fixedWidth = width
                }
            }
            flexible[index] = fixedWidth == nil
            widths[index] = Clamp(index, fixedWidth ?? (column.Minimum ?? 60.0))
            tableWidth += widths[index]
            maxWeight = Math.Max(maxWeight, column.Flex ?? 1.0)
        }
        var remaining = Math.Max(0.0, available - verticalGutter - tableWidth)
        for pass in 0 ... columns.Length {
            var weight float64
            var space = remaining
            for index in 0 ... columns.Length {
                if flexible[index] {
                    weight += (columns[index].Flex ?? 1.0) / maxWeight
                    space += widths[index]
                }
            }
            if weight <= 0.0 {
                break
            }
            var violation = 0.0
            for index in 0 ... columns.Length {
                if flexible[index] {
                    let share = space * ((columns[index].Flex ?? 1.0) / maxWeight) / weight
                    violation += Clamp(index, share) - share
                }
            }
            for index in 0 ... columns.Length {
                if !flexible[index] {
                    continue
                }
                let share = space * ((columns[index].Flex ?? 1.0) / maxWeight) / weight
                let width = Clamp(index, share)
                if (violation == 0.0) || (violation < 0.0 && width < share) || (violation > 0.0 && width > share) {
                    remaining -= width - widths[index]
                    widths[index] = width
                    flexible[index] = false
                }
            }
        }
        tableWidth = leading
        for width in widths {
            tableWidth += width
        }
        if !Double.IsFinite(tableWidth) || tableWidth > 1000000000.0 {
            throw ArgumentOutOfRangeException("Grid total width")
        }
    }

    private func ResolveFittedWidths(verticalGutter float64) {
        let flexible = [columns.Length]bool
        var total float64
        for index in 0 ... columns.Length {
            let column = columns[index]
            var requested = column.Width
            if column.AutoWidth && requested == nil {
                requested = autoWidths != nil && autoWidths!!.TryGetValue(column.Id!!, out var measured) ?
                measured: (column.Minimum ?? 60.0)
            }
            if let overrides = input.ColumnWidths {
                if overrides.TryGetValue(column.Id!!, out var width) {
                    requested = width
                }
            }
            flexible[index] = column.Width == nil && !column.AutoWidth
            widths[index] = Clamp(index, requested ?? (column.Minimum ?? 60.0))
            total += widths[index]
        }
        let target = Math.Max(0.0, available - verticalGutter - leading)
        var remaining = target - total
        if remaining > 0.0 {
            remaining = DistributeWidth(remaining, flexible, true, true)
            remaining = DistributeWidth(remaining, flexible, false, true)
        } else {
            remaining = DistributeWidth(remaining, flexible, true, false)
            remaining = DistributeWidth(remaining, flexible, false, false)
        }
        tableWidth = leading
        for width in widths {
            tableWidth += width
        }
        if !Double.IsFinite(tableWidth) || tableWidth > 1000000000.0 {
            throw ArgumentOutOfRangeException("Grid total width")
        }
    }

    private func DistributeWidth(delta float64, flexible[]bool, selected bool, grow bool) float64 {
        var remaining = delta
        for pass in 0 ... columns.Length {
            var weight float64
            for index in 0 ... columns.Length {
                if flexible[index] != selected {
                    continue
                }
                let capacity = if grow {
                    (columns[index].Maximum ?? 1000000.0) - widths[index]
                } else {
                    widths[index] - (columns[index].Minimum ?? 60.0)
                }
                if capacity > .001 {
                    weight += grow ? (selected ? (columns[index].Flex ?? 1.0): 1.0): capacity
                }
            }
            if weight <= 0.0 || Math.Abs(remaining) <= .001 {
                break
            }
            var consumed float64
            for index in 0 ... columns.Length {
                if flexible[index] != selected {
                    continue
                }
                let capacity = if grow {
                    (columns[index].Maximum ?? 1000000.0) - widths[index]
                } else {
                    widths[index] - (columns[index].Minimum ?? 60.0)
                }
                if capacity <= .001 {
                    continue
                }
                let share = grow ? (selected ? (columns[index].Flex ?? 1.0): 1.0): capacity
                let amount = Math.Min(capacity, Math.Abs(remaining) * share / weight)
                widths[index] += grow ? amount: -amount
                consumed += amount
            }
            remaining += grow ? -consumed: consumed
        }
        return remaining
    }

    private func BuildHeader(snapshot DataGridInput, filter bool) Blob {
        let row = Container{
            Key: filter ? "filters": "header",
            Width: tableWidth,
            Height: filter ? snapshot.FilterHeight!!: snapshot.HeaderHeight!!,
            FlexShrink: 0,
            FlexDirection: FlexDirection.Row,
            BackgroundColor: theme.RaisedColor,
            BorderWidth: Edges{Bottom: 1},
            BorderColor: theme.BorderColor,
            BasedOn: snapshot.HeaderStyle,
            Accessibility: Accessibility{Role: AccessibilityRole.Row}
        }
        if leading > 0.0 {
            row.Children.Add(
                Container{
                    Key: "leading",
                    Width: leading,
                    FlexShrink: 0,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.ColumnHeader,
                        Name: theme.Text("Row controls"),
                        ColumnIndex: 0
                    }
                }
            )
        }
        for index in 0 ... columns.Length {
            let column = columns[index]
            let id = column.Id!!
            let label = column.Label ?? id
            let direction = filter ? DataGridSort.None: SortDirection(id)
            var content Blob = filter ? (column.Filter ?? Container{}): (
                column.Header ??
                    Text{
                    Content: label,
                    Color: theme.MutedTextColor,
                    TextWrap: TextWrap.NoWrap,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.LabelFontSize,
                    FontWeight: theme.LabelFontWeight,
                }
            )
            if !filter && column.Header == nil && direction != DataGridSort.None {
                content = Container{
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Gap: theme.Spacing,
                    content,
                    ControlIcons.Create(direction == DataGridSort.Ascending ? ControlIcon.ArrowUpward: ControlIcon.ArrowDownward, 14, theme.MutedTextColor)
                }
            }
            if filter {
                if let create = snapshot.CreateFilter {
                    content = create(snapshot, column, content)
                }
            } else {
                if let create = snapshot.CreateHeader {
                    content = create(snapshot, column, content)
                }
            }
            if !filter && column.AutoWidth && column.Width == nil {
                content = MeasureWidth(id, content, column.AutoWidthContent)
            }
            let slot = Container{
                Key: "column:" + id,
                Width: widths[index],
                FlexShrink: 0,
                MinWidth: 0,
                Position: PositionType.Relative,
                Overflow: Overflow.Hidden,
                OnKeyDown: stopGridKeys,
                BorderWidth: !filter && reorderColumn != nil && reorderTarget == index ?
                    (ColumnIndex(reorderColumn) < index ? Edges{Right: theme.FocusRingWidth}: Edges{Left: theme.FocusRingWidth}): Edges{},
                BorderColor: theme.FocusColor
            }
            if filter {
                slot.Padding = theme.Spacing
                slot.Accessibility = Accessibility{
                    Role: AccessibilityRole.GridCell,
                    Name: theme.Text("Filter {0}", label),
                    ColumnIndex: index + (leading > 0.0 ? 1: 0)
                }
                slot.Children.Add(Container{Key: "content", FlexGrow: 1, MinWidth: 0, content})
            } else {
                let sort = Button{
                    Key: "content",
                    FlexGrow: 1,
                    MinWidth: 0,
                    Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
                    AlignItems: column.Alignment == TextAlign.Right ? AlignItems.FlexEnd: column.Alignment == TextAlign.Center ? AlignItems.Center: AlignItems.FlexStart,
                    TextAlign: column.Alignment,
                    Focus: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                    BackgroundColor: Color.Transparent,
                    Focusable: column.Sortable &&
                        (snapshot.OnSort != nil || snapshot.OnSortsChange != nil) &&
                        !snapshot.Disabled ||
                        snapshot.OnColumnOrderChange != nil &&
                        !snapshot.Disabled,
                    TabStop: false,
                    OnClick: () -> Sort(id, clickModifiers),
                    OnPointerDown: (e PointerEvent) -> {
                        clickModifiers = e.Modifiers
                        reorderOrigin = e.WindowPosition.X
                        reordered = false
                        if snapshot.OnColumnOrderChange != nil &&
                            e.Button == PointerButton.Primary &&
                            !snapshot.Disabled {
                            reorderPointer = e.PointerId
                            e.Capture()
                        }
                    },
                    OnPointerMove: (e PointerEvent) -> MoveReorder(id, e),
                    OnPointerCancel: (e PointerEvent) -> StopReorder(),
                    OnPointerUp: (e PointerEvent) -> Reorder(id, e),
                    OnKeyDown: (e KeyEvent) -> {
                        clickModifiers = e.Modifiers
                        if e.Modifiers.Alt && (e.Key == Key.Left || e.Key == Key.Right) {
                            MoveColumn(id, e.Key == Key.Left ? -1: 1)
                            e.PreventDefault()
                            e.StopPropagation()
                        }
                    },
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.ColumnHeader,
                        Name: label,
                        ColumnIndex: index + (leading > 0.0 ? 1: 0),
                        Description: direction.ToString()
                    },
                    content
                }
                WidgetKeyBindings.BindActivation(sort)
                slot.Children.Add(sort)
                if (column.Resizable ?? true) && CanResize(index) {
                    var handle = Container{
                        BackgroundColor: Color.Transparent,
                        BorderWidth: Edges{Right: 1},
                        BorderColor: resizeId == id ? theme.FocusColor: Color.Transparent,
                        Hover: Style{BorderColor: theme.FocusColor},
                        Focus: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                        BasedOn: snapshot.ResizeHandleStyle
                    }
                    if let create = snapshot.CreateResizeHandle {
                        handle = create(snapshot, column, handle)
                    }
                    handle.Key = "resize"
                    handle.Handle = Handle(resizeHandles, id)
                    handle.Position = PositionType.Absolute
                    handle.Right = 0
                    handle.Top = 0
                    handle.Bottom = 0
                    handle.Width = 7
                    handle.Cursor = Cursor.ResizeHorizontal
                    handle.Focusable = !snapshot.Disabled
                    handle.TabStop = false
                    handle.OnPointerDown = (e PointerEvent) -> BeginResize(id, e)
                    handle.OnPointerMove = moveResize
                    handle.OnPointerUp = endResize
                    handle.OnPointerCancel = cancelResize
                    handle.OnKeyDown = (e KeyEvent) -> ResizeKey(id, e)
                    handle.Accessibility = Accessibility{
                        Role: AccessibilityRole.Slider,
                        Name: theme.Text("Resize {0}", label),
                        Orientation: AccessibilityOrientation.Horizontal,
                        Range: AccessibilityValue{
                            Minimum: ResizeMinimum(index),
                            Maximum: ResizeMaximum(index),
                            Now: widths[index]
                        },
                        Actions: []AccessibilityAction{
                            AccessibilityAction.SetValue,
                            AccessibilityAction.Increment,
                            AccessibilityAction.Decrement
                        },
                        OnAction: (request AccessibilityActionRequest) -> ResizeAction(id, request)
                    }
                    slot.Children.Add(handle)
                }
            }
            if index < pinnedCount {
                slot.Transform = PanelTransform{TranslateX: horizontalOffset}
                slot.ZIndex = 1
                slot.BackgroundColor = theme.RaisedColor
            }
            row.Children.Add(slot)
        }
        return row
    }

    private func SortDirection(id string) DataGridSort {
        if let sorts = input.Sorts {
            for sort in sorts {
                if sort.ColumnId == id {
                    return sort.Direction
                }
            }
            return DataGridSort.None
        }
        return input.SortColumnId == id ? input.SortDirection: DataGridSort.None
    }

    private func Sort(id string, modifiers KeyModifiers) {
        if reordered {
            reordered = false
            return
        }
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !columns[index].Sortable {
            return
        }
        if (modifiers.Ctrl || modifiers.Super) && modifiers.Shift {
            return
        }
        let current = SortDirection(id)
        let clear = (modifiers.Ctrl || modifiers.Super) && !modifiers.Shift
        let next = clear ? DataGridSort.None:
            current == DataGridSort.Ascending ? DataGridSort.Descending: DataGridSort.Ascending
        if let callback = input.OnSortsChange {
            let sorts = List[DataGridSortColumn]()
            var found = false
            for sort in modifiers.Shift ? input.Sorts ?? []DataGridSortColumn{}: []DataGridSortColumn{} {
                if sort.ColumnId == id {
                    found = true
                    if next != DataGridSort.None {
                        sorts.Add(DataGridSortColumn{ColumnId: id, Direction: next})
                    }
                } else {
                    sorts.Add(sort)
                }
            }
            if !found && next != DataGridSort.None {
                sorts.Add(DataGridSortColumn{ColumnId: id, Direction: next})
            }
            InvokeInputCallback(callback, sorts.ToArray())
        } else {
            InvokeInputCallback(input.OnSort, id, next)
        }
    }

    private func MoveColumn(id string, delta int32) {
        let index = ColumnIndex(id)
        let target = index + delta
        if input.Disabled ||
            input.OnColumnOrderChange == nil ||
            index < 0 || target < 0 || target >= columns.Length ||
            (index < pinnedCount) != (target < pinnedCount) {
            return
        }
        let order = [columns.Length]string
        for i in 0 ... columns.Length {
            order[i] = columns[i].Id!!
        }
        order[index] = columns[target].Id!!
        order[target] = id
        InvokeInputCallback(input.OnColumnOrderChange, order)
    }

    private func Reorder(id string, e PointerEvent) {
        e.ReleaseCapture()
        StopReorder()
        if input.Disabled || e.Button != PointerButton.Primary || Math.Abs(e.WindowPosition.X - reorderOrigin) < 8 ||
            input.OnColumnOrderChange == nil {
            return
        }
        let index = ColumnIndex(id)
        let target = ReorderTarget(index, e.WindowPosition.X)
        if index < 0 || target == index {
            return
        }
        let order = List[string](columns.Length)
        for column in columns {
            if column.Id != id {
                order.Add(column.Id!!)
            }
        }
        order.Insert(target, id)
        reordered = true
        if let callback = input.OnColumnOrderChange {
            InvokeInputCallback(callback, order.ToArray())
        }
    }

    private func ReorderTarget(index int32, position float64) int32 {
        let start = index < pinnedCount ? 0: pinnedCount
        let end = index < pinnedCount ? pinnedCount: columns.Length
        var target = start
        var x = rootHandle.ContentBox.X + leading
        for i in 0 ... end {
            let left = x - (i < pinnedCount ? 0.0: horizontalOffset)
            if i >= start && position >= left + widths[i] / 2.0 {
                target = i
            }
            x += widths[i]
        }
        return Math.Clamp(target, start, Math.Max(start, end - 1))
    }

    private func MoveReorder(id string, e PointerEvent) {
        if reorderPointer != e.PointerId || input.Disabled || input.OnColumnOrderChange == nil ||
            Math.Abs(e.WindowPosition.X - reorderOrigin) < 8.0 {
            return
        }
        let index = ColumnIndex(id)
        if index < 0 {
            return
        }
        reorderColumn = id
        reorderTarget = ReorderTarget(index, e.WindowPosition.X)
        reorderPosition = e.WindowPosition.X
        if index >= pinnedCount {
            ScrollReorder()
        }
        Rebuild()
    }

    private func StopReorder() {
        reorderScroll?.Dispose()
        reorderScroll = nil
        reorderPointer = -1L
        reorderColumn = nil
        reorderTarget = -1
    }

    private func ScrollReorder() {
        if reorderColumn == nil || reorderPointer < 0L || input.Disabled || !viewport.IsMounted ||
            input.OnColumnOrderChange == nil || ColumnIndex(reorderColumn) < pinnedCount {
            StopReorder()
            return
        }
        let view = viewport.ContentBox
        let offset = viewport.ScrollOffset
        var left = view.X + leading
        for index in 0 ... pinnedCount {
            left += widths[index]
        }
        let delta = reorderPosition < left + theme.ControlHeight ? -theme.ControlHeight:
            reorderPosition > view.X + view.Width - theme.ControlHeight ? theme.ControlHeight: 0.0
        let next = Math.Clamp(offset.X + delta, 0.0, viewport.ScrollRange.X)
        if next == offset.X {
            reorderScroll?.Dispose()
            reorderScroll = nil
            return
        }
        reorderScroll ??= window!!.Every(16.0, ScrollReorder)
        viewport.JumpTo(next, offset.Y)
        reorderTarget = ReorderTarget(ColumnIndex(reorderColumn), reorderPosition)
        Rebuild()
    }

    private func MeasureWidth(id string, content Blob, measurement Blob? = nil) Blob {
        let handle = ElementHandle()
        handle.MetricsChanged += (metrics ElementMetrics) -> {
            if disposed || !metrics.IsMounted {
                return
            }
            let index = ColumnIndex(id)
            if index < 0 || !columns[index].AutoWidth {
                return
            }
            let width = Clamp(index, metrics.BorderBox.Width + theme.ControlPadding * 2.0)
            autoWidths ??= Dictionary[string, float64](StringComparer.Ordinal)
            let values = autoWidths!!
            let previous = values.TryGetValue(id, out var known) ? known: (columns[index].Minimum ?? 60.0)
            if width > previous + .1 || measurement != nil && width < previous - .1 {
                values[id] = width
                Rebuild()
            }
        }
        autoWidthLayout ??= DataGridAutoWidthLayout()
        let wrapper = Container{
            Width: Percent(100),
            MinWidth: 0,
            FlexGrow: 1,
            Layout: autoWidthLayout,
            Container{Width: Percent(100), MinWidth: 0, JustifyContent: JustifyContent.Center, content},
            Container{Handle: handle}
        }
        if measurement != nil {
            wrapper.Children.Add(
                Container{Overflow: Overflow.Hidden, Accessibility: Accessibility{Hidden: true}, measurement}
            )
        }
        return wrapper
    }
}

internal class DataGridAutoWidthLayout : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize -> context.MeasureChild(0, available)

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        let natural = context.MeasureChild(
            context.ChildCount == 3 ? 2: 0,
            LayoutSize{Width: Double.PositiveInfinity, Height: Double.PositiveInfinity}
        )
        context.MeasureChild(0, finalSize)
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
        context.ArrangeChild(1, ElementRect{Width: natural.Width, Height: 0})
        if context.ChildCount == 3 {
            context.ArrangeChild(2, ElementRect{Width: natural.Width, Height: 0})
        }
    }
}
