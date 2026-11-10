package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// Selects modifier labels. Auto uses the current operating system.
public enum KbdPlatform {
    /// Uses modifier labels for the current operating system.
    Auto;
    /// Uses Windows modifier labels.
    Windows;
    /// Uses Linux modifier labels.
    Linux;
    /// Uses macOS modifier symbols.
    MacOS
}

/// Displays key chords without installing bindings. Keycaps defaults to true.
public data struct Kbd {
    /// Display-only key chords in order. Nil displays no chords and installs no bindings.
    var Keys[]?KeyBinding
    /// Modifier-label convention. Auto uses the current operating system.
    var Platform KbdPlatform
    /// Displays separate keycap frames. Nil means true.
    var Keycaps bool?
    /// Key label color. Nil uses theme text for keycaps and muted text for plain labels.
    var Color Color?

    /// Creates a row of labeled keycaps.
    public func Build() Blob {
        let theme = Theme.Read()
        let family = theme.MonoFontFamily + ", sans-serif"
        let root = Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: theme.Spacing}
        let labels = List[string]()
        for binding in Keys ?? []KeyBinding{} {
            let label = Label(binding, Platform)
            labels.Add(label)
            if !(Keycaps ?? true) {
                root.Children.Add(
                    Text{
                        Content: label,
                        FontFamily: family,
                        FontSize: theme.CaptionFontSize,
                        Color: Color ?? theme.MutedTextColor
                    }
                )
                continue
            }
            for key in label.Split("+") {
                root.Children.Add(
                    Container{
                        Padding: Edges{Left: theme.Spacing, Right: theme.Spacing, Top: 2, Bottom: 2},
                        BorderWidth: theme.BorderWidth,
                        BorderColor: theme.BorderColor,
                        BorderRadius: theme.ControlRadius!! / 2,
                        BackgroundColor: theme.FieldColor,
                        Text{
                            Content: key,
                            FontFamily: family,
                            FontSize: theme.CaptionFontSize,
                            Color: Color ?? theme.TextColor
                        }
                    }
                )
            }
        }
        root.Accessibility = Accessibility{Role: AccessibilityRole.Text, Name: String.Join(", ", labels)}
        return root
    }

    shared {
        /// Formats a physical key and its exact modifiers for the selected platform.
        public func Label(binding KeyBinding, platform KbdPlatform = KbdPlatform.Auto) string {
            let mac = platform == KbdPlatform.MacOS || platform == KbdPlatform.Auto && OperatingSystem.IsMacOS()
            let parts = List[string]()
            if binding.Modifiers.Ctrl {
                parts.Add(mac ? "⌃": "Ctrl")
            }
            if binding.Modifiers.Alt {
                parts.Add(mac ? "⌥": "Alt")
            }
            if binding.Modifiers.Shift {
                parts.Add(mac ? "⇧": "Shift")
            }
            if binding.Modifiers.Super {
                parts.Add(mac ? "⌘": "Super")
            }
            let key = switch binding.Key {
                case Key.KeypadEnter: "Enter"
                case Key.Space: "Space"
                case Key.Escape: "Esc"
                default: binding.Key.ToString()
            }
            parts.Add(key)
            return String.Join(mac ? "": "+", parts)
        }
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Kbd) Blob -> w.Build()
