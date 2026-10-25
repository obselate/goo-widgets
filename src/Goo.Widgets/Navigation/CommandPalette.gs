package Goo.Widgets.Navigation

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
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
    private let ranked List[FuzzyMatchItem[int32]] = List[FuzzyMatchItem[int32]]()
    private let indices List[int32] = List[int32]()
    private let priorIds List[string] = List[string]()
    private let headers Dictionary[string, string] = Dictionary[string, string](StringComparer.Ordinal)
    private let ordered List[string] = List[string]()
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
        let items = input.Items ?? []CommandItem{}
        var changedIds = priorIds.Count != items.Length
        if !changedIds {
            for index in 0 ... items.Length {
                if priorIds[index] != items[index].Id {
                    changedIds = true
                    break
                }
            }
        }
        if changedIds {
            commands.Clear()
            priorIds.Clear()
            for item in items {
                if String.IsNullOrEmpty(item.Id) || item.Id.Contains('\0') || !commands.TryAdd(item.Id, item) {
                    throw ArgumentException("Command IDs must be nonempty and unique")
                }
                priorIds.Add(item.Id)
            }
        } else {
            for item in items {
                commands[item.Id] = item
            }
        }
        headers.Clear()
        ordered.Clear()
        ranked.Clear()
        indices.Clear()
        for index in 0 ... items.Length {
            if let match = FuzzyMatch.Match(query, items[index].Label, false) {
                ranked.Add(FuzzyMatchItem[int32]{Item: index, Match: match, Order: index})
            }
        }
        ranked.Sort((a FuzzyMatchItem[int32], b FuzzyMatchItem[int32]) -> {
            let score = b.Match.Score.CompareTo(a.Match.Score)
            return score == 0 ? a.Order.CompareTo(b.Order): score
        })
        for match in ranked {
            indices.Add(match.Item)
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
                    if items[match.Item].GroupId == group.Id && seen.Add(items[match.Item].Id) {
                        AddCommand(items[match.Item])
                    }
                }
                RemoveEmptyHeader()
            }
            if ordered.Count > 0 {
                AddHeader("commands", "Commands")
            }
            for match in ranked {
                if seen.Add(items[match.Item].Id) {
                    AddCommand(items[match.Item])
                }
            }
            RemoveEmptyHeader()
        } else {
            for match in ranked {
                AddCommand(items[match.Item])
            }
        }
        var active = -1
        for index in 0 ... ordered.Count {
            let id = ordered[index]
            if id == activeId && !headers.ContainsKey(id) && !commands[id].Disabled {
                active = index
            }
        }
        if !wasOpen || priorQuery != query || active < 0 {
            active = RovingFocus.Next[string](
                ordered,
                -1,
                Key.Home,
                AccessibilityOrientation.Vertical,
                false,
                (id string) -> headers.ContainsKey(id) || commands[id].Disabled
            )
            activeId = active < 0 ? nil: ordered[active]
        }
        priorQuery = query
        wasOpen = true
        let inputHeight = theme.ControlHeight + theme.Spacing * 2
        let resultIndices = indices.ToArray()
        let grouped = List[SelectionItem]()
        if query.Length == 0 {
            for id in ordered {
                let header = headers.TryGetValue(id, out var label)
                grouped.Add(SelectionItem{
                    Id: id,
                    Label: header ? label: commands[id].Label,
                    Disabled: header || commands[id].Disabled,
                })
            }
        }
        let search = SearchList{
            ItemCount: ordered.Count,
            ItemAt: (index int32) -> {
                if query.Length == 0 {
                    return grouped[index]
                }
                let item = items[resultIndices[index]]
                return SelectionItem{Id: item.Id, Label: item.Label, Disabled: item.Disabled}
            },
            SelectedId: activeId,
            OnSelect: Activate,
            Width: input.Width ?? 560,
            Height: Math.Min(
                input.Height ?? 360,
                inputHeight + theme.BorderWidth * 3 + Math.Max(1, ordered.Count) * theme.ControlHeight
            ),
            RowHeight: theme.ControlHeight,
            AccessibilityName: "Commands",
            Placeholder: input.Placeholder ?? "Search commands",
            OnQueryChange: input.OnQueryChange,
            CustomizeEntry: (entry TextEntry) -> {
                entry.Value = query
                entry.Controlled = true
                entry.OnKeyDown = KeyDown
                entry.FlexGrow = 1
                entry.Padding = 0
                entry.PaddingEnd = theme.ControlPadding
                entry.BackgroundColor = Color.Transparent
                entry.Focus = Style{}
                return entry
            },
            CustomizeRow: (item SelectionItem, button Button) -> Row(input, item, button),
            CustomizeRoot: (root Container) -> {
                root.Children[0] = Container{
                    Height: inputHeight,
                    FlexShrink: 0,
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Gap: theme.ControlGap,
                    PaddingStart: theme.ControlPadding,
                    MaterialIcons.Create("search", 18, theme.MutedTextColor),
                    root.Children[0],
                }
                root.Children.Insert(
                    1,
                    Container{Height: theme.BorderWidth, FlexShrink: 0, BackgroundColor: theme.BorderColor}
                )
                if root.Children[2] is Virtual {
                    root.Children[2].Handle = viewport
                }
                root.BorderColor = Color.Transparent
                root.BorderRadius = theme.PanelRadius - theme.BorderWidth
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
        ordered.Add(key)
    }

    private func RemoveEmptyHeader() {
        if ordered.Count > 0 && headers.ContainsKey(ordered[ordered.Count - 1]) {
            ordered.RemoveAt(ordered.Count - 1)
        }
    }

    private func AddCommand(item CommandItem) -> ordered.Add(item.Id)

    private func Row(snapshot CommandPaletteInput, item SelectionItem, button Button) Blob {
        let theme = Theme.Read()
        let id = item.Id!!
        if headers.TryGetValue(id, out var header) {
            return Container{
                Height: theme.ControlHeight,
                Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
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
        let match = FuzzyMatch.Match(snapshot.Query ?? "", command.Label)!!
        let label = FuzzyMatch.Label(command.Label, match, theme)
        let content = Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            FlexGrow: 1,
            MinWidth: 0,
            label,
        }
        if let detail = command.Detail {
            content.Children.Add(
                Text{
                    Content: detail,
                    FontSize: theme.CaptionFontSize,
                    Color: theme.MutedTextColor,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                    MinWidth: 0,
                    FlexShrink: 1,
                }
            )
        }
        button.Children.Add(content)
        if let shortcut = command.Shortcut {
            let keys = Kbd{Keys: []KeyBinding{shortcut}}.Build()
            keys.FlexShrink = 0
            button.Children.Add(keys)
        }
        if let create = snapshot.CreateItem {
            return create(command, match, button)
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
            if ordered[i] == activeId {
                index = i
                break
            }
        }
        let next = RovingFocus.Next[string](
            ordered,
            index,
            event.Key,
            AccessibilityOrientation.Vertical,
            true,
            (id string) -> headers.ContainsKey(id) || commands[id].Disabled
        )
        event.PreventDefault()
        event.StopPropagation()
        if next >= 0 {
            activeId = ordered[next]
            viewport.ScrollToItem(activeId!!)
            Rebuild()
        }
    }
}
