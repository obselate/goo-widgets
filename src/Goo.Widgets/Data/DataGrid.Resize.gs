package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Inputs
import System
import System.Collections.Generic
import System.Globalization

public open partial class DataGrid {
    private func CanResize(index int32) bool -> index >= 0 &&
        (
        input.FitColumnsToViewport ?
        index < columns.Length - 1 && input.OnFittedColumnWidthsChange != nil:
        input.OnColumnWidthChange != nil
    )

    private func ResizeMinimum(index int32) float64 {
        let minimum = columns[index].Minimum ?? 60.0
        if !input.FitColumnsToViewport {
            return minimum
        }
        var capacity float64
        for next in index + 1 ... columns.Length {
            capacity += (columns[next].Maximum ?? 1000000.0) - widths[next]
        }
        return Math.Max(minimum, widths[index] - capacity)
    }

    private func ResizeMaximum(index int32) float64 {
        let maximum = columns[index].Maximum ?? 1000000.0
        if !input.FitColumnsToViewport {
            return maximum
        }
        var capacity float64
        for next in index + 1 ... columns.Length {
            capacity += widths[next] - (columns[next].Minimum ?? 60.0)
        }
        return Math.Min(maximum, widths[index] + capacity)
    }

    private func RequestWidth(id string, width float64, commit bool, source[]float64) {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !(columns[index].Resizable ?? true) || !CanResize(index) || !Double.IsFinite(
            width
        ) {
            return
        }
        if input.FitColumnsToViewport {
            let next = [columns.Length]float64
            for column in 0 ... columns.Length {
                next[column] = source[column]
            }
            let requested = Math.Clamp(width, ResizeMinimum(index), ResizeMaximum(index))
            var delta = requested - source[index]
            next[index] = requested
            for column in index + 1 ... columns.Length {
                if delta > 0.0 {
                    let take = Math.Min(delta, next[column] - (columns[column].Minimum ?? 60.0))
                    next[column] -= take
                    delta -= take
                } else if delta < 0.0 {
                    let give = Math.Min(-delta, (columns[column].Maximum ?? 1000000.0) - next[column])
                    next[column] += give
                    delta += give
                }
            }
            let resolved = Dictionary[string, float64](StringComparer.Ordinal)
            for column in 0 ... columns.Length {
                resolved.Add(columns[column].Id!!, next[column])
            }
            lastWidth = requested
            lastFittedWidths = resolved
            input.OnFittedColumnWidthsChange!!(resolved)
            if commit {
                input.OnFittedColumnWidthsCommit?.Invoke(resolved)
            }
            return
        }
        lastWidth = Clamp(index, width)
        input.OnColumnWidthChange!!(id, lastWidth)
        if commit {
            input.OnColumnWidthCommit?.Invoke(id, lastWidth)
        }
    }

    private func BeginResize(id string, e PointerEvent) {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !CanResize(index) || pointer != -1L || e.Button != PointerButton.Primary {
            return
        }
        pointer = e.PointerId
        resizeId = id
        origin = e.WindowPosition.X
        originWidth = widths[index]
        lastWidth = originWidth
        resizeWidths = [columns.Length]float64
        for column in 0 ... columns.Length {
            resizeWidths[column] = widths[column]
        }
        lastFittedWidths = nil
        e.Capture()
        e.PreventDefault()
        e.StopPropagation()
        Handle(resizeHandles, id).Focus()
        Rebuild()
    }

    private func MoveResize(e PointerEvent) {
        if pointer == e.PointerId && resizeId != nil {
            RequestWidth(resizeId!!, originWidth + e.WindowPosition.X - origin, false, resizeWidths)
        }
    }

    private func EndResize(e PointerEvent) {
        if pointer != e.PointerId {
            return
        }
        e.ReleaseCapture()
        e.PreventDefault()
        e.StopPropagation()
        pointer = -1L
        if resizeId != nil {
            if input.FitColumnsToViewport {
                if let resolved = lastFittedWidths {
                    input.OnFittedColumnWidthsCommit?.Invoke(resolved)
                }
            } else {
                input.OnColumnWidthCommit?.Invoke(resizeId!!, lastWidth)
            }
        }
        resizeId = nil
        lastFittedWidths = nil
        Rebuild()
    }

    private func CancelResize(e PointerEvent) {
        if pointer == e.PointerId {
            e.ReleaseCapture()
            pointer = -1L
            resizeId = nil
            lastFittedWidths = nil
            Rebuild()
        }
    }

    private func ResizeKey(id string, e KeyEvent) {
        let index = ColumnIndex(id)
        if index < 0 {
            return
        }
        if e.Key != Key.Left && e.Key != Key.Right && e.Key != Key.Home && e.Key != Key.End {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        RequestWidth(
            id,
            e.Key == Key.Home ? ResizeMinimum(index): e.Key == Key.End ? (ResizeMaximum(index)): widths[index] +
                (e.Key == Key.Left ? -8.0: 8.0),
            true,
            widths
        )
    }

    private func ResizeAction(id string, request AccessibilityActionRequest) bool {
        let index = ColumnIndex(id)
        if index < 0 || input.Disabled || !CanResize(index) {
            return false
        }
        var width = widths[index]
        if request.Action == AccessibilityAction.Increment {
            width += 8.0
        } else if request.Action == AccessibilityAction.Decrement {
            width -= 8.0
        } else if request.Action == AccessibilityAction.SetValue {
            if !Double.TryParse(request.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out width) ||
                !Double.IsFinite(width) {
                return false
            }
        } else {
            return false
        }
        RequestWidth(id, width, true, widths)
        return true
    }

}
