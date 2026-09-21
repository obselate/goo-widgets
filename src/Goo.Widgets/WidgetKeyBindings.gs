package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// Provides explicit application and primitive bindings for Goo Widgets.
public class WidgetKeyBindings {
    shared {
        /// Creates text editing and focus traversal bindings for an application root.
        /// @param input The owning window input service, or nil before attachment.
        /// @returns Explicit application-root bindings, or an empty array before attachment.
        public func Editing(input PlatformInput?)[]KeyBinding {
            if input == nil {
                return []KeyBinding{}
            }
            let result = List[KeyBinding]()
            let mac = OperatingSystem.IsMacOS()
            for shift in[]bool{false, true} {
                let plain = KeyModifiers{Shift: shift}
                let primary = KeyModifiers{Shift: shift, Ctrl: !mac, Super: mac}
                let word = KeyModifiers{Shift: shift, Ctrl: !mac, Alt: mac}
                Add(result, input, Key.Left, plain, TextCommandKind.MoveLeft, true)
                Add(result, input, Key.Right, plain, TextCommandKind.MoveRight, true)
                Add(result, input, Key.Home, plain, TextCommandKind.MoveLineStart, true)
                Add(result, input, Key.End, plain, TextCommandKind.MoveLineEnd, true)
                Add(result, input, Key.Backspace, plain, TextCommandKind.DeleteBackward, true)
                Add(result, input, Key.Delete, plain, TextCommandKind.DeleteForward, true)
                Add(result, input, Key.Left, word, TextCommandKind.MoveWordLeft, true)
                Add(result, input, Key.Right, word, TextCommandKind.MoveWordRight, true)
                Add(result, input, Key.Backspace, word, TextCommandKind.DeleteWordBackward, true)
                Add(result, input, Key.Delete, word, TextCommandKind.DeleteWordForward, true)
                result.Add(
                    KeyBinding{
                        Key: Key.Tab,
                        Modifiers: plain,
                        Action: () -> {
                            let editor = input.Editor
                            if editor?.IsMultiline == true && editor?.IsReadOnly == false {
                                input.Execute(
                                    TextCommand{Kind: shift ? TextCommandKind.Outdent: TextCommandKind.InsertTab}
                                )
                            } else {
                                input.MoveFocus(!shift)
                            }
                        }
                    }
                )
                AddSubmit(result, input, Key.Enter, plain)
                AddSubmit(result, input, Key.KeypadEnter, plain)
                Add(result, input, Key.A, primary, TextCommandKind.SelectAll, false)
                Add(result, input, Key.C, primary, TextCommandKind.Copy, false)
                Add(result, input, Key.X, primary, TextCommandKind.Cut, false)
                Add(result, input, Key.V, primary, TextCommandKind.Paste, false)
            }
            result.Add(
                KeyBinding{
                    Key: Key.Escape,
                    Action: () -> {
                        if !input.CancelDrag() && !input.CancelComposition() {
                            input.Execute(TextCommand{Kind: TextCommandKind.CancelEdit})
                        }
                    }
                }
            )
            return result.ToArray()
        }

        /// Adds explicit Enter and Space activation bindings to an interactive primitive.
        /// Buttons use handle activation and held Space press state. Other primitives activate on release.
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
                let handle = button.Handle ?? ElementHandle()
                button.Handle = handle
                enter = KeyBinding{
                    Key: Key.Enter,
                    Action: () -> {
                        handle.Activate()
                    }
                }
                space = KeyBinding{
                    Key: Key.Space,
                    Action: () -> {
                        handle.BeginPress()
                    },
                    OnRelease: () -> {
                        handle.EndPress(true)
                    },
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

        private func AddSubmit(result List[KeyBinding], input PlatformInput, key Key, modifiers KeyModifiers) {
            result.Add(
                KeyBinding{
                    Key: key,
                    Modifiers: modifiers,
                    Action: () -> {
                        let editor = input.Editor
                        if editor?.IsMultiline == true && editor?.IsReadOnly == false {
                            input.Execute(TextCommand{Kind: TextCommandKind.Insert, Text: "\n"})
                        } else {
                            input.Execute(TextCommand{Kind: TextCommandKind.Submit})
                        }
                    }
                }
            )
        }

        private func Add(
            result List[KeyBinding],
            input PlatformInput,
            key Key,
            modifiers KeyModifiers,
            kind TextCommandKind,
            repeat bool
        ) {
            result.Add(
                KeyBinding{
                    Key: key,
                    Modifiers: modifiers,
                    Repeat: repeat,
                    Action: () -> {
                        input.Execute(TextCommand{Kind: kind, ExtendSelection: modifiers.Shift})
                    }
                }
            )
        }
    }
}
