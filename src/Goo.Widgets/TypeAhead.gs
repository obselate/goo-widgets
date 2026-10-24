package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// Retains a timed prefix while selection remains owned by the caller.
public class TypeAhead {
    /// Enabled item IDs in display order.
    public var Items IReadOnlyList[string]?
    /// Resolves labels. Nil uses the IDs.
    public var TextForId Func[string, string]?
    /// Current focus or active descendant, owned by the caller.
    public var ActiveId string?
    /// Idle time before starting a new prefix, in milliseconds.
    public var TimeoutMs int32 = 700
    /// Requests focus movement without changing selection.
    public var OnMatch Action[string]?
    private var prefix string = ""
    private var lastKey int64

    /// Clears the prefix when focus or the item scope changes.
    public func Reset() {
        prefix = ""
        lastKey = 0
    }

    /// Handles physical printable keys, excluding shortcuts and composition.
    public func HandleKey(event KeyEvent) bool {
        if event.IsComposing || event.Modifiers.Ctrl || event.Modifiers.Alt || event.Modifiers.Super {
            return false
        }
        let key = event.Key
        let now = Environment.TickCount64
        if now - lastKey > TimeoutMs {
            prefix = ""
        }
        if key == Key.Space && prefix.Length == 0 {
            return false
        }
        var text string = ""
        if key >= Key.A && key <= Key.Z {
            text = char(int32('a') + int32(key) - int32(Key.A)).ToString()
        } else if key >= Key.Number0 && key <= Key.Number9 {
            text = (event.Modifiers.Shift ? ")!@#$%^&*(": "0123456789")[int32(key) - int32(Key.Number0)].ToString()
        } else {
            text = switch key {
                case Key.Space: " "
                case Key.Apostrophe: event.Modifiers.Shift ? "\"": "'"
                case Key.Comma: event.Modifiers.Shift ? "<": ","
                case Key.Minus: event.Modifiers.Shift ? "_": "-"
                case Key.Period: event.Modifiers.Shift ? ">": "."
                case Key.Slash: event.Modifiers.Shift ? "?": "/"
                case Key.Semicolon: event.Modifiers.Shift ? ":": ";"
                case Key.Equal: event.Modifiers.Shift ? "+": "="
                case Key.LeftBracket: event.Modifiers.Shift ? "{": "["
                case Key.BackSlash: event.Modifiers.Shift ? "|": "\\"
                case Key.RightBracket: event.Modifiers.Shift ? "}": "]"
                case Key.GraveAccent: event.Modifiers.Shift ? "~": "`"
                default: ""
            }
        }
        if text.Length == 0 {
            Reset()
            return false
        }
        lastKey = now
        let cycling = prefix == text
        prefix = cycling ? text: prefix + text
        let items = Items
        if items == nil || items.Count == 0 {
            return false
        }
        var active = -1
        for i in 0 ... items.Count {
            if items[i] == ActiveId {
                active = i
                break
            }
        }
        let start = prefix.Length == 1 ? active + 1: Math.Max(0, active)
        for offset in 0 ... items.Count {
            let id = items[(start + offset) % items.Count]
            if (TextForId?.Invoke(id) ?? id).StartsWith(prefix, StringComparison.OrdinalIgnoreCase) {
                event.PreventDefault()
                event.StopPropagation()
                OnMatch?.Invoke(id)
                return true
            }
        }
        return false
    }
}
