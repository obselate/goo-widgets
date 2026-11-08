package Goo.Widgets

import Goo
import Goo.Widgets.Inputs
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

/// One display-only shortcut in a named group.
public data struct ShortcutEntry {
    /// Optional shortcut identity used when Label is nil. Nil leaves the fallback label empty.
    var Id string?
    /// Display group label. Nil uses an unlabelled group.
    var Group string?
    /// Visible shortcut description. Nil uses Id, then an empty string.
    var Label string?
    /// Display-only key chords for this command. Nil displays no chords.
    var Keys[]?KeyBinding
    /// Extra search terms used with the visible label. Nil supplies no extra terms.
    var Keywords string?
}

/// Controlled shortcut filtering and platform labels.
public data struct ShortcutListInput {
    /// Shortcut descriptions in display order. Nil supplies an empty list.
    var Entries[]?ShortcutEntry
    /// Filter text. Nil uses an empty query.
    var Query string?
    /// Receives the new query string after a user edit. Nil ignores the notification.
    var OnQueryChange Action[string]?
    /// Modifier-label convention. Auto uses the current operating system.
    var Platform KbdPlatform
}

/// Displays grouped shortcuts and an optional search field.
public open class ShortcutList : Cell[ShortcutListInput] {
    protected override func Build(input ShortcutListInput) Blob {
        let theme = Theme.Read()
        let root = Container{Gap: theme.ControlGap, MinWidth: 0}
        if input.OnQueryChange != nil {
            root.Children.Add(
                TextField{
                    Value: input.Query ?? "",
                    Placeholder: theme.Text("Find a shortcut"),
                    OnChange: value -> InvokeInputCallback(input.OnQueryChange, value)
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Kbd) Blob -> w.Build()
