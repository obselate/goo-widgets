package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// A command with optional grouping, description and shortcut.
public data struct CommandItem {
    var Id string
    var Label string
    var Detail string?
    var GroupId string?
    var Shortcut KeyBinding?
    var Leading Blob?
    var Disabled bool
}

/// A named section shown when the query is empty.
public data struct CommandGroup {
    var Id string
    var Label string
}

/// Controlled modal commands. Query and Open remain host-owned.
public data struct CommandPaletteInput {
    var Items[]?CommandItem
    var Groups[]?CommandGroup
    var Query string?
    var OnQueryChange Action[string]?
    var RecentIds[]?string
    var Open bool
    var OnDismiss Action?
    var OnActivate Action[string]?
    var AccessibilityName string?
    var Placeholder string?
    var Width float64?
    /// Maximum height. Short result lists use their natural height.
    var Height float64?
    var CreateItem Func[CommandItem, FuzzyMatchResult, Button, Blob]?
}

/// Fuzzy-ranked command search with recent groups and keyboard activation.
public open class CommandPalette : Cell[CommandPaletteInput] {
    private let viewport ElementHandle = ElementHandle()
    private let commands Dictionary[string, CommandItem] = Dictionary[string, CommandItem](StringComparer.Ordinal)
    private let matches Dictionary[string, FuzzyMatchResult] = Dictionary[string, FuzzyMatchResult](
        StringComparer.Ordinal
    )
    private let headers Dictionary[string, string] = Dictionary[string, string](StringComparer.Ordinal)
    private var ordered List[SelectionItem] = List[SelectionItem]()
    private var current CommandPaletteInput
    private var activeId string?
    private var priorQuery string?
    private var wasOpen bool

    protected override func Build(input CommandPaletteInput) Blob {
        current = input
        if !input.Open {
            wasOpen = false
            return Cell.Mount[ModalDialog, ModalDialogHost]("dialog", ModalDialog{})
        }
        let theme = Theme.Read()
        let query = input.Query ?? ""
        commands.Clear()
        matches.Clear()
        headers.Clear()
        ordered = List[SelectionItem]()
        for item in input.Items ?? []CommandItem{} {
            if String.IsNullOrEmpty(item.Id) || item.Id.Contains('\0') || !commands.TryAdd(item.Id, item) {
                throw ArgumentException("Command IDs must be nonempty and unique")
            }
        }
        let ranked = FuzzyMatch.Rank[CommandItem](
            input.Items ?? []CommandItem{},
            query,
            (item CommandItem) -> item.Label
        )
        for match in ranked {
            matches.Add(match.Item.Id, match.Match)
        }
        if query.Length == 0 {
            let seen = HashSet[string](StringComparer.Ordinal)
            AddHeader("recent", "Recent")
            for id in input.RecentIds ?? []string{} {
                if commands.ContainsKey(id) && seen.Add(id) {
                    AddCommand(commands[id])
                }
            }
            RemoveEmptyHeader()
            let groups = HashSet[string](StringComparer.Ordinal)
            for group in input.Groups ?? []CommandGroup{} {
                if String.IsNullOrEmpty(group.Id) || !groups.Add(group.Id) {
                    throw ArgumentException("Command group IDs must be nonempty and unique")
                }
                AddHeader("group-" + group.Id, group.Label)
                for match in ranked {
                    if match.Item.GroupId == group.Id && seen.Add(match.Item.Id) {
                        AddCommand(match.Item)
                    }
                }
                RemoveEmptyHeader()
            }
            AddHeader("commands", "Commands")
            for match in ranked {
                if seen.Add(match.Item.Id) {
                    AddCommand(match.Item)
                }
            }
            RemoveEmptyHeader()
        } else {
            for match in ranked {
                AddCommand(match.Item)
            }
        }
        var active = -1
        for index in 0 ... ordered.Count {
            if ordered[index].Id == activeId && !ordered[index].Disabled {
                active = index
            }
        }
        if !wasOpen || priorQuery != query || active < 0 {
            active = RovingFocus.Next[SelectionItem](
                ordered,
                -1,
                Key.Home,
                AccessibilityOrientation.Vertical,
                false,
                (item SelectionItem) -> item.Disabled
            )
            activeId = active < 0 ? nil: ordered[active].Id
        }
        priorQuery = query
        wasOpen = true
        let search = SearchList{
            Items: ordered.ToArray(),
            SelectedId: activeId,
            OnSelect: Activate,
            Width: input.Width ?? 560,
            Height: Math.Min(input.Height ?? 360, theme.ControlHeight + Math.Max(1, ordered.Count) * 48 + 2),
            RowHeight: 48,
            AccessibilityName: "Commands",
            Placeholder: input.Placeholder ?? "Search commands",
            OnQueryChange: input.OnQueryChange,
            CustomizeEntry: (entry TextEntry) -> {
                entry.Value = query
                entry.Controlled = true
                entry.OnKeyDown = KeyDown
                return entry
            },
            CustomizeRow: (item SelectionItem, button Button) -> Row(input, item, button),
            CustomizeRoot: (root Container) -> {
                if root.Children.Count > 1 && root.Children[1] is Virtual {
                    root.Children[1].Handle = viewport
                }
                root.MaxWidth = Percent(100)
                root.FlexShrink = 1
                return root
            },
        }.Build()
        return Cell.Mount[ModalDialog, ModalDialogHost](
            "dialog",
            ModalDialog{
                Open: true,
                AccessibilityName: input.AccessibilityName ?? "Command palette",
                Width: input.Width ?? 560,
                Padding: 0,
                Gap: 0,
                OnClose: input.OnDismiss,
                OnCancel: input.OnDismiss,
                Content: search,
                Footer: Container{Height: 0, HitTestSelf: false},
                CreateRoot: (dialog ModalDialog, backdrop Button, panel Container) -> {
                    panel.MaxWidth = Percent(100)
                    return Container{
                        Position: PositionType.Absolute,
                        Left: 0,
                        Right: 0,
                        Top: 0,
                        Bottom: 0,
                        Padding: theme.PanelPadding,
                        AlignItems: AlignItems.Center,
                        JustifyContent: JustifyContent.Center,
                    }
                },
            }
        )
    }

    private func AddHeader(id string, label string) {
        let key = "\0" + id
        headers.Add(key, label)
        ordered.Add(SelectionItem{Id: key, Label: label, Disabled: true})
    }

    private func RemoveEmptyHeader() {
        if ordered.Count > 0 && headers.ContainsKey(ordered[ordered.Count - 1].Id!!) {
            ordered.RemoveAt(ordered.Count - 1)
        }
    }

    private func AddCommand(item CommandItem) -> ordered.Add(
        SelectionItem{Id: item.Id, Label: item.Label, Disabled: item.Disabled}
    )

    private func Row(snapshot CommandPaletteInput, item SelectionItem, button Button) Blob {
        let theme = Theme.Read()
        let id = item.Id!!
        if headers.TryGetValue(id, out var header) {
            return Container{
                Height: 48,
                Padding: theme.ControlPadding,
                JustifyContent: JustifyContent.Center,
                Accessibility: Accessibility{Role: AccessibilityRole.Heading, Name: header},
                Text{Content: header, Color: theme.MutedTextColor, FontSize: theme.CaptionFontSize},
            }
        }
        let command = commands[id]
        button.TabStop = false
        button.FontFamily = theme.FontFamily
        button.FontSize = theme.FontSize
        button.FontWeight = theme.FontWeight
        button.Children.Clear()
        if let leading = command.Leading {
            button.Children.Add(leading)
        }
        let label = Container{FlexDirection: FlexDirection.Row, MinWidth: 0}
        var position = 0
        for span in matches[id].Ranges {
            if span.Start > position {
                label.Children.Add(
                    Text{Content: command.Label.Substring(position, span.Start - position), TextWrap: TextWrap.NoWrap}
                )
            }
            label.Children.Add(
                Text{
                    Content: command.Label.Substring(span.Start, span.Length),
                    FontWeight: theme.HeadingFontWeight,
                    Color: theme.AccentColor,
                    TextWrap: TextWrap.NoWrap,
                }
            )
            position = span.Start + span.Length
        }
        if position < command.Label.Length {
            label.Children.Add(Text{Content: command.Label.Substring(position), TextWrap: TextWrap.NoWrap})
        }
        let content = Container{FlexGrow: 1, MinWidth: 0, label}
        if let detail = command.Detail {
            content.Children.Add(Text{Content: detail, FontSize: theme.CaptionFontSize, Color: theme.MutedTextColor})
        }
        button.Children.Add(content)
        if let shortcut = command.Shortcut {
            button.Children.Add(Kbd{Keys: []KeyBinding{shortcut}, Keycaps: false}.Build())
        }
        if let create = snapshot.CreateItem {
            return create(command, matches[id], button)
        }
        return button
    }

    private func Activate(id string) {
        if commands.ContainsKey(id) && !commands[id].Disabled {
            current.OnActivate?.Invoke(id)
            current.OnDismiss?.Invoke()
        }
    }

    private func KeyDown(event KeyEvent) {
        if event.Key == Key.Enter || event.Key == Key.KeypadEnter {
            event.PreventDefault()
            event.StopPropagation()
            if !event.Repeat && activeId != nil {
                Activate(activeId!!)
            }
            return
        }
        if event.Key != Key.Up && event.Key != Key.Down && event.Key != Key.Home && event.Key != Key.End {
            return
        }
        var index = -1
        for i in 0 ... ordered.Count {
            if ordered[i].Id == activeId {
                index = i
                break
            }
        }
        let next = RovingFocus.Next[SelectionItem](
            ordered,
            index,
            event.Key,
            AccessibilityOrientation.Vertical,
            true,
            (item SelectionItem) -> item.Disabled
        )
        event.PreventDefault()
        event.StopPropagation()
        if next >= 0 {
            activeId = ordered[next].Id
            viewport.ScrollToItem(activeId!!)
            Rebuild()
        }
    }
}
