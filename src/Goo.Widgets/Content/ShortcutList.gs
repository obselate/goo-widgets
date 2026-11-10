package Goo.Widgets

import Goo
import Goo.Widgets.Inputs
import System
import System.Collections.Generic

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
