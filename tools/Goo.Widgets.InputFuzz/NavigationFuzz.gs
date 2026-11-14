import Goo
import Goo.Widgets
import System
import System.Collections.Generic
import System.Linq

internal class NavigationFuzz {
    shared {
        internal func Roving(input[]uint8) {
            var ids = Enumerable.Range(0, 8).Select(i -> i.ToString()).ToArray()
            let disabled = HashSet[string]()
            var active string? = nil
            var orientation = AccessibilityOrientation.Horizontal
            var wrap = true
            var rtl = false
            let keys = []Key{Key.Left, Key.Right, Key.Up, Key.Down, Key.Home, Key.End, Key.Enter}
            for value in input {
                let number = int32(value)
                switch number % 5 {
                    case 0 { ids = Enumerable.Range(0, number % 17).Select(i -> i.ToString()).ToArray() }
                    case 1 {
                        let id = (number % 17).ToString()
                        if !disabled.Add(id) { disabled.Remove(id) }
                    }
                    case 2 { active = (number % 17).ToString() }
                    case 3 {
                        orientation = number % 2 == 0 ? AccessibilityOrientation.Horizontal: AccessibilityOrientation.Vertical
                        wrap = (number & 8) != 0
                        rtl = (number & 16) != 0
                    }
                    case 4 { ids = ids.Reverse().ToArray() }
                }
                let enabled = ids.Where(id -> !disabled.Contains(id)).ToArray()
                let tab = enabled.Contains(active ?? "") ? active: enabled.FirstOrDefault()
                var moved string? = nil
                var callbacks = 0
                let focus = RovingFocus{
                    Ids: ids, ActiveId: active, Orientation: orientation, Wrap: wrap, RightToLeft: rtl,
                    IsDisabled: id -> disabled.Contains(id),
                    OnMove: id -> {
                        moved = id
                        callbacks++
                    }
                }
                for id in ids {
                    Require(focus.TabStop(id) == (id == tab), "roving tab stop is not the active or first enabled item")
                }
                let key = keys[number % keys.Length]
                var expected string? = nil
                if key == Key.Home { expected = enabled.FirstOrDefault() }
                else if key == Key.End { expected = enabled.LastOrDefault() }
                else {
                    let backwards = orientation == AccessibilityOrientation.Horizontal ?
                        key == (rtl ? Key.Right: Key.Left): key == Key.Up
                    let forwards = orientation == AccessibilityOrientation.Horizontal ?
                        key == (rtl ? Key.Left: Key.Right): key == Key.Down
                    if backwards || forwards {
                        let current = Array.IndexOf(ids, active)
                        let candidates = enabled.Where(id -> backwards ? Array.IndexOf(ids, id) < current:
                            Array.IndexOf(ids, id) > current).ToArray()
                        expected = backwards ? candidates.LastOrDefault(): candidates.FirstOrDefault()
                        if expected == nil && wrap { expected = backwards ? enabled.LastOrDefault(): enabled.FirstOrDefault() }
                    }
                }
                let handled = focus.Handle(KeyEvent{Key: key})
                if active != nil && ids.Contains(active) || key == Key.Home || key == Key.End {
                    Require(handled == (expected != nil) && moved == expected,
                        "roving navigation did not select the nearest enabled item")
                }
                Require(callbacks == (handled ? 1: 0) && (moved == nil || enabled.Contains(moved)),
                    "roving navigation selected a disabled or absent item")
                if moved != nil { active = moved }
            }
        }

        internal func TypeAhead(input[]uint8) {
            let labels = []string{"alpha", "alpine", "beta", "bravo", "apple", "1 item", "-entry", "a b"}
            var items = labels
            var active string? = nil
            var prefix = ""
            var matched string? = nil
            var callbacks = 0
            let model = Goo.Widgets.TypeAhead{TimeoutMs: Int32.MaxValue,
                OnMatch: id -> {
                    matched = id
                    callbacks++
                }}
            let keys = []Key{Key.A, Key.B, Key.L, Key.P, Key.Space, Key.Number1, Key.Minus, Key.Escape}
            let texts = []string{"a", "b", "l", "p", " ", "1", "-", ""}
            for value in input {
                let number = int32(value)
                if number % 11 == 0 {
                    items = labels.Take(number % (labels.Length + 1)).Reverse().ToArray()
                    model.Reset()
                    prefix = ""
                }
                if number % 13 == 0 { active = nil }
                let index = number % keys.Length
                let blocked = (number & 32) != 0
                let composing = (number & 64) != 0
                let expired = (number & 128) != 0
                model.TimeoutMs = expired ? -1: Int32.MaxValue
                model.Items = items
                model.ActiveId = active
                matched = nil
                callbacks = 0
                var expected string? = nil
                if !blocked && !composing {
                    if expired { prefix = "" }
                    let text = texts[index]
                    if text != " " || prefix != "" {
                        prefix = text == "" ? "": prefix == text ? text: prefix + text
                        if text != "" {
                            let current = Array.IndexOf(items, active)
                            let start = prefix.Length == 1 ? current + 1: Math.Max(0, current)
                            for offset in 0 ... items.Length {
                                let id = items[(start + offset) % items.Length]
                                if expected == nil && id.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) { expected = id }
                            }
                        }
                    }
                }
                let handled = model.HandleKey(KeyEvent{Key: keys[index], IsComposing: composing,
                    Modifiers: KeyModifiers{Ctrl: blocked}})
                Require(handled == (expected != nil) && matched == expected && callbacks == (handled ? 1: 0),
                    "typeahead prefix, cycling, reset or shortcut isolation failed")
                if matched != nil { active = matched }
            }
        }

        internal func Require(condition bool, message string) {
            if !condition { throw InvalidOperationException(message) }
        }
    }
}
