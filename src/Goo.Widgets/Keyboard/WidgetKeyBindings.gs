package Goo.Widgets

import Goo
import System

/// Provides explicit primitive activation bindings for Goo Widgets.
public class WidgetKeyBindings {
    shared {
        /// Adds Enter and Space activation to an element you created.
        /// Call before returning it from Build or a Configure callback. Goo rejects edits to frozen declarations.
        /// Existing bindings take precedence.
        /// @param button The owned primitive to configure before hand-off.
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
                    OnPress: () -> {
                        handle.Activate()
                    }
                }
                space = if heldPress {
                    KeyBinding{
                        Key: Key.Space,
                        OnPress: () -> {
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
                enter = KeyBinding{Key: Key.Enter, OnPress: action}
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
        internal func AppendBindings(element Blob, bindings[]KeyBinding) {
            let existing = element.KeyBindings
            if existing == nil || existing.Length == 0 {
                element.KeyBindings = bindings
                return
            }
            var additions int32
            for binding in bindings { if Array.IndexOf(existing, binding) < 0 { additions++ } }
            if additions == 0 { return }
            let combined = [existing.Length + additions]KeyBinding
            Array.Copy(existing, combined, existing.Length)
            var index = existing.Length
            for binding in bindings {
                if Array.IndexOf(existing, binding) < 0 {
                    combined[index] = binding
                    index++
                }
            }
            element.KeyBindings = combined
        }
    }
}
