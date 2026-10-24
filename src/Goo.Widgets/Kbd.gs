package Goo.Widgets

import Goo
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

/// Selects modifier labels. Auto uses the current operating system.
public enum KbdPlatform {
    Auto;
    Windows;
    Linux;
    MacOS
}

/// Displays key chords without installing bindings. Keycaps defaults to true.
public data struct Kbd {
    var Keys[]?KeyBinding
    var Platform KbdPlatform
    var Keycaps bool?
    var Color Color?

    /// Creates a row of labeled keycaps.
    public func Build() Blob {
        let theme = Theme.Read()
        let root = Container{FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: theme.Spacing}
        let labels = List[string]()
        for binding in Keys ?? []KeyBinding{} {
            let label = Label(binding, Platform)
            labels.Add(label)
            if !(Keycaps ?? true) {
                root.Children.Add(
                    Text{
                        Content: label,
                        FontFamily: theme.MonoFontFamily,
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
                        BorderRadius: theme.ControlRadius / 2,
                        BackgroundColor: theme.FieldColor,
                        Text{
                            Content: key,
                            FontFamily: theme.MonoFontFamily,
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
                parts.Add("Ctrl")
            }
            if binding.Modifiers.Alt {
                parts.Add(mac ? "Option": "Alt")
            }
            if binding.Modifiers.Shift {
                parts.Add("Shift")
            }
            if binding.Modifiers.Super {
                parts.Add(mac ? "Cmd": "Super")
            }
            let key = switch binding.Key {
                case Key.KeypadEnter: "Enter"
                case Key.Space: "Space"
                case Key.Escape: "Esc"
                default: binding.Key.ToString()
            }
            parts.Add(key)
            return String.Join("+", parts)
        }
    }
}

/// One display-only shortcut in a named group.
public data struct ShortcutEntry {
    var Id string?
    var Group string?
    var Label string?
    var Keys[]?KeyBinding
    var Keywords string?
}

/// Controlled shortcut filtering and platform labels.
public data struct ShortcutListInput {
    var Entries[]?ShortcutEntry
    var Query string?
    var OnQueryChange Action[string]?
    var Platform KbdPlatform
}

/// Displays grouped shortcuts and an optional search field.
public class ShortcutList : Cell[ShortcutListInput] {
    protected override func Build(input ShortcutListInput) Blob {
        let theme = Theme.Read()
        let root = Container{Gap: theme.ControlGap, MinWidth: 0}
        if input.OnQueryChange != nil {
            root.Children.Add(
                TextField{
                    Value: input.Query ?? "",
                    Placeholder: "Find a shortcut",
                    OnChange: input.OnQueryChange
                }.Build()
            )
        }
        let groups = Dictionary[string, Container](StringComparer.Ordinal)
        let query = input.Query ?? ""
        for entry in input.Entries ?? []ShortcutEntry{} {
            if query.Length > 0 &&
                !((entry.Label ?? "") + " " + (entry.Group ?? "") + " " + (entry.Keywords ?? "")).Contains(
                query,
                StringComparison.OrdinalIgnoreCase
            ) {
                continue
            }
            let group = entry.Group ?? ""
            if !groups.TryGetValue(group, out var rows) {
                rows = Container{
                    Gap: theme.ControlGap,
                    Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: group}
                }
                groups.Add(group, rows)
                root.Children.Add(rows)
                if group.Length > 0 {
                    rows.Children.Add(Typography{Content: group, Variant: TextVariant.Label}.Build())
                }
            }
            rows.Children.Add(
                Container{
                    Key: entry.Id,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Gap: theme.ControlGap,
                    Text{
                        Content: entry.Label ?? entry.Id ?? "",
                        FlexGrow: 1,
                        FontSize: theme.FontSize,
                        Color: theme.TextColor
                    },
                    Kbd{Keys: entry.Keys, Platform: input.Platform}.Build()
                }
            )
        }
        return root
    }
}
