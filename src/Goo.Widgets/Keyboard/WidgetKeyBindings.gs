package Goo.Widgets

import Goo
import System

/// Provides explicit primitive activation bindings for Goo Widgets.
public class WidgetKeyBindings {
    shared {
        /// Returns a fresh wrapper with Enter and Space activation for the content.
        /// The content and its existing bindings stay unchanged and take precedence.
        /// @param content The interactive content to activate.
        public func WithActivation(content Blob) Blob {
            let wrapper = Container{HitTestSelf: false, content}
            let action = content.OnClick
            if action != nil {
                let handle ElementHandle? = if content is Button { content.Handle } else { nil }
                wrapper.KeyBindings = []KeyBinding{
                    KeyBinding{Key: Key.Enter, OnPress: () -> {
                        if handle != nil { handle.Activate() } else { action() }
                    }},
                    KeyBinding{Key: Key.Space, OnRelease: () -> {
                        if handle != nil { handle.Activate() } else { action() }
                    }},
                }
            }
            return wrapper
        }

        internal func BindOwnedActivation(button Blob) {
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
    }
}
