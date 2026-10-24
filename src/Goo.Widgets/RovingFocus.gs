package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// One Tab stop with disabled-aware arrow, Home and End navigation.
public data struct RovingFocus {
    var Ids[]?string
    var ActiveId string?
    var Orientation AccessibilityOrientation = AccessibilityOrientation.Horizontal
    var Wrap bool = true
    var RightToLeft bool
    var IsDisabled Func[string, bool]?
    var OnMove Action[string]?

    /// Selects the active enabled ID, or the first enabled ID.
    public func TabStop(id string) bool {
        let ids = Ids ?? []string{}
        var first string?
        for candidate in ids {
            if IsDisabled?.Invoke(candidate) ?? false {
                continue
            }
            if candidate == ActiveId {
                return id == candidate
            }
            first ??= candidate
        }
        return id == first
    }

    /// Requests keyboard movement without retaining caller selection.
    public func Handle(event KeyEvent) bool {
        let ids = Ids ?? []string{}
        var index = -1
        for i in 0 ... ids.Length {
            if ids[i] == ActiveId {
                index = i
                break
            }
        }
        let next = Next[string](ids, index, event.Key, Orientation, Wrap, IsDisabled, RightToLeft)
        if next < 0 {
            return false
        }
        event.PreventDefault()
        event.StopPropagation()
        OnMove?.Invoke(ids[next])
        return true
    }

    shared {
        /// Resolves arrow direction for a row, column or grid.
        public func Step(key Key, orientation AccessibilityOrientation, columns int32 = 1, rightToLeft bool = false) int32 {
            if orientation != AccessibilityOrientation.Vertical {
                if key == Key.Left { return rightToLeft ? 1: -1 }
                if key == Key.Right { return rightToLeft ? -1: 1 }
            }
            if orientation != AccessibilityOrientation.Horizontal {
                if key == Key.Up { return -columns }
                if key == Key.Down { return columns }
            }
            return 0
        }

        /// Finds the next enabled item, or returns -1 without moving.
        public func Next[T](items IReadOnlyList[T], current int32, key Key, orientation AccessibilityOrientation,
            wrap bool, isDisabled Func[T, bool]? = nil, rightToLeft bool = false) int32 {
            var index = current
            var step = Step(key, orientation, 1, rightToLeft)
            if key == Key.Home {
                index = -1
                step = 1
            } else if key == Key.End {
                index = items.Count
                step = -1
            }
            if step == 0 || items.Count == 0 {
                return -1
            }
            for attempt in 0 ... items.Count {
                index += step
                if wrap {
                    index = (index + items.Count) % items.Count
                } else if index < 0 || index >= items.Count {
                    return -1
                }
                if !(isDisabled?.Invoke(items[index]) ?? false) {
                    return index
                }
            }
            return -1
        }
    }
}
