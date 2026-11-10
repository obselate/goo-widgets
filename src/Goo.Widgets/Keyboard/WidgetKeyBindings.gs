package Goo.Widgets

import Goo
import System

/// Provides explicit primitive activation bindings for Goo Widgets.
public class WidgetKeyBindings {
    shared {
        /// Adds explicit Enter and Space activation bindings to an interactive primitive.
        /// Existing bindings take precedence over the appended activation policy.
        /// @param button The primitive whose current handle and click callback are used.
        public func BindActivation(button Blob) {
            let action = button.OnClick
            if action == nil {
                return
            }
            var enter KeyBinding
            var space KeyBinding
            if button is Button {
                let heldPress = button.Handle != nil
                let handle = button.Handle ?? ElementHandle()
                button.Handle = handle
                enter = KeyBinding{
                    Key: Key.Enter,
                    Action: () -> {
                        handle.Activate()
                    }
                }
                space = if heldPress {
                    KeyBinding{
                        Key: Key.Space,
                        Action: () -> {
                            handle.BeginPress()
                        },
                        OnRelease: () -> {
                            handle.EndPress(true)
                        },
                    }
                } else {
                    KeyBinding{Key: Key.Space, OnRelease: action}
                }
            } else {
                enter = KeyBinding{Key: Key.Enter, Action: action}
                space = KeyBinding{Key: Key.Space, OnRelease: action}
            }
            let existing = button.KeyBindings
            if existing == nil || existing.Length == 0 {
                button.KeyBindings = []KeyBinding{enter, space}
                return
            }
            let result = [existing.Length + 2]KeyBinding
            Array.Copy(existing, result, existing.Length)
            result[existing.Length] = enter
            result[existing.Length + 1] = space
            button.KeyBindings = result
        }
    }
}
