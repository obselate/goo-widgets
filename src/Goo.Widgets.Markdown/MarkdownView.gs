package Goo.Widgets.Markdown

import Goo
import Goo.Widgets
import Goo.Widgets.Data
import System
import System.Collections.Generic

internal class MarkdownLeafStamp {
    internal var Text string = ""
    internal var Revision int64
    internal var Selection TextSelection
}

internal class MarkdownHeadingHandle {
    internal var Parent string = ""
    internal var BlockKey string = ""
    internal let Handle ElementHandle = ElementHandle()
}

/// Selectable rich content with retained text controllers, measured height, and host-owned activation.
public open class MarkdownView : Cell[MarkdownViewInput] {
    private let parser MarkdownParser = MarkdownParser()
    private let leaves Dictionary[string, MarkdownLeafStamp] = Dictionary[string, MarkdownLeafStamp](
        StringComparer.Ordinal
    )
    private let defaultState MarkdownViewState = MarkdownViewState()
    private var state MarkdownViewState
    private let usedLeaves HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let usedHeadings HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let headings List[MarkdownHeading] = List[MarkdownHeading]()
    private var models[]MarkdownModel = []MarkdownModel{}
    private var source string?
    private var current MarkdownViewInput
    private var theme Theme
    private var headingCallback Action[IReadOnlyList[MarkdownHeading]]?
    private var headingList IReadOnlyList[MarkdownHeading] = []MarkdownHeading{}
    private var buildRow Func[MarkdownModel, Blob]?

    protected override func Build(input MarkdownViewInput) Blob {
        let nextTheme = Theme.Read()
        let options = input with{
            FontSize = input.FontSize == 0.0 ? nextTheme.FontSize: input.FontSize,
            FontFamily = input.FontFamily ?? nextTheme.FontFamily,
            CodeFontFamily = input.CodeFontFamily ?? nextTheme.MonoFontFamily,
            Color = input.Color ?? nextTheme.TextColor,
            MutedColor = input.MutedColor ?? nextTheme.MutedTextColor,
            RuleColor = input.RuleColor ?? input.MutedColor ?? nextTheme.MutedTextColor,
            LinkColor = input.LinkColor ?? nextTheme.LinkColor,
            CodeBackground = input.CodeBackground ?? nextTheme.FieldColor,
            SelectionColor = input.SelectionColor ?? nextTheme.AccentColor.WithAlpha(0.35),
            BlockGap = input.BlockGap ?? nextTheme.Spacing * 3.0,
            MinimumTableColumnWidth = input.MinimumTableColumnWidth == 0.0 ? 100.0: input.MinimumTableColumnWidth
        }
        if buildRow == nil || current != options || theme != nextTheme {
            buildRow = (model MarkdownModel) -> Block(model, 400.0, TextAlign.Left, options, nextTheme)
        }
        current = options
        theme = nextTheme
        if !Double.IsFinite(current.FontSize) || current.FontSize <= 0.0 || !Double.IsFinite(current.BlockGap!!) ||
            current.BlockGap!!< 0.0
        || !Double.IsFinite(current.MinimumTableColumnWidth) || current.MinimumTableColumnWidth <= 0.0 {
            throw ArgumentOutOfRangeException("Markdown dimensions")
        }
        let text = input.Text ?? ""
        let changed = source != text
        if changed {
            models = parser.Parse(text)
            source = text
        }
        let nextState = input.State ?? defaultState
        let registryChanged = changed || state != nextState
        state = nextState
        if registryChanged {
            usedLeaves.Clear()
            usedHeadings.Clear()
            headings.Clear()
            for model in models {
                Register(model, model.Key)
            }
            for key in List[string](leaves.Keys) {
                if !usedLeaves.Contains(key) {
                    leaves.Remove(key)
                }
            }
            for key in List[string](state.Headings.Keys) {
                if !usedHeadings.Contains(key) {
                    state.Headings.Remove(key)
                }
            }
            headingList = Array.AsReadOnly(headings.ToArray())
        }
        state.Virtualized = input.Height?.HasMagnitude ?? false
        var root = Column(state.Virtualized ? 0.0: current.BlockGap!!)
        root.Width = input.Width ?? Percent(100)
        root.Height = input.Height ?? Length.Auto
        if let create = input.CreateRoot {
            root = create(current, root)
        }
        root.Children.Clear()
        if state.Virtualized {
            let rows = VirtualRows(models, current.FontSize * theme.LineHeight, BlockKey, buildRow!!, version: 0)
            rows.Handle = state.Viewport
            rows.Gap = current.BlockGap!!
            rows.FlexGrow = 1.0
            rows.FlexBasis = 0.0
            rows.MinHeight = 0.0
            root.Children.Add(rows)
        } else {
            for model in models {
                root.Children.Add(buildRow!!(model))
            }
        }
        if registryChanged || headingCallback != input.OnHeadings {
            headingCallback = input.OnHeadings
            headingCallback?.Invoke(headingList)
        }
        return root
    }

    private func Column(gap float64 = 0.0) Container -> Container{Gap: gap, MinWidth: 0.0, FlexShrink: 0.0}

    private func BlockKey(model MarkdownModel) string -> model.Key

    private func Register(model MarkdownModel, blockKey string) {
        usedLeaves.Add(model.Path)
        let info = model.Block
        if info.Kind == MarkdownBlockKind.Heading {
            let id = info.Id!!
            let parent = model.Path.Substring(0, model.Path.LastIndexOf('/'))
            if !state.Headings.TryGetValue(id, out var entry) || entry.Parent != parent {
                entry = MarkdownHeadingHandle{Parent: parent}
                state.Headings[id] = entry
            }
            entry.BlockKey = blockKey
            usedHeadings.Add(id)
            headings.Add(MarkdownHeading{Id: id, Text: info.Text, Level: info.HeadingLevel, Handle: entry.Handle})
        }
        for child in model.Children {
            Register(child, blockKey)
        }
    }

    private func Block(model MarkdownModel, weight float64, alignment TextAlign, current MarkdownViewInput, theme Theme) Blob {
        let info = model.Block
        var content Blob
        if info.Kind == MarkdownBlockKind.Heading {
            let scale = []float64{2.0, 1.7, 1.4, 1.2, 1.1, 1.0}
            content = Leaf(model, current.FontSize * scale[Math.Clamp(info.HeadingLevel, 1, 6) - 1], 700.0, alignment, current, theme)
        } else if info.Kind == MarkdownBlockKind.Paragraph {
            content = Leaf(model, current.FontSize, weight, alignment, current, theme)
        } else if info.Kind == MarkdownBlockKind.Code {
            content = Container{
                Padding: theme.ControlPadding,
                BorderRadius: theme.ControlRadius!!,
                MinWidth: 0.0,
                FlexShrink: 0.0,
                BackgroundColor: current.CodeBackground!!,
                Leaf(model, current.FontSize * .93, 400.0, TextAlign.Left, current, theme)
            }
        } else if info.Kind == MarkdownBlockKind.Rule {
            content = Container{Height: 1.0, FlexShrink: 0.0, BackgroundColor: current.RuleColor!!}
        } else if info.Kind == MarkdownBlockKind.Table {
            content = Table(model, current, theme)
        } else if info.Kind == MarkdownBlockKind.List {
            content = ListBlockView(model, current, theme)
        } else {
            let box = Column(current.BlockGap!!* .6)
            for child in model.Children {
                box.Children.Add(Block(child, weight, alignment, current, theme))
            }
            if info.Kind == MarkdownBlockKind.Quote || info.Kind == MarkdownBlockKind.Alert {
                box.Padding = Edges{Left: theme.ControlPadding}
                box.BorderWidth = Edges{Left: theme.BorderWidth * 3.0}
                box.BorderColor = Edges[Color]{Left: current.MutedColor!!}
            }
            if info.Kind == MarkdownBlockKind.Alert {
                let kind = info.AlertKind ?? "NOTE"
                let accent = kind == "WARNING" || kind == "CAUTION" ? theme.WarningColor:
                kind == "TIP" ? theme.SuccessColor: current.LinkColor!!
                box.BorderColor = Edges[Color]{Left: accent}
                box.Padding = theme.ControlPadding
                box.BackgroundColor = current.CodeBackground!!
                box.Children.Insert(
                    0,
                    Text{Key: "alert-kind", Content: kind, FontWeight: 700.0, FontSize: current.FontSize, Color: accent}
                )
                box.Accessibility = Accessibility{Role: AccessibilityRole.Group, Name: kind}
            }
            content = box
        }
        if let create = current.CreateBlock {
            content = create(info, content)
        }
        let root = Container{Key: model.Key == "" ? info.Id: model.Key, MinWidth: 0.0, FlexShrink: 0.0, content}
        if info.Kind == MarkdownBlockKind.Heading {
            root.Handle = state.Headings[info.Id!!].Handle
            root.Accessibility = Accessibility{
                Role: AccessibilityRole.Heading,
                Name: info.Text ?? "",
                Level: info.HeadingLevel
            }
        }
        return root
    }

    private func OpenLink(target string) -> InvokeInputCallback(current.OnLink, target)

    private func Leaf(model MarkdownModel, size float64, weight float64, alignment TextAlign, current MarkdownViewInput, theme Theme) Blob {
        let path = model.Path
        let text = model.Block.Text ?? ""
        if !leaves.TryGetValue(path, out var stamp) {
            stamp = MarkdownLeafStamp{Text: text}
            leaves.Add(path, stamp)
        } else if stamp.Text != text {
            stamp = MarkdownLeafStamp{Text: text, Revision: stamp.Revision + 1}
            leaves[path] = stamp
        }
        let input = MarkdownLeafInput{Model: model, Options: current with{OnLink = current.OnLink == nil ? nil: OpenLink}, Size: size, Weight: weight, Alignment: alignment, Stamp: stamp, Theme: theme}
        return Cell.Mount[MarkdownLeafInput, MarkdownTextView](
            path + "@" + stamp.Revision.ToString(),
            input
        )
    }

    private func ListBlockView(model MarkdownModel, current MarkdownViewInput, theme Theme) Blob {
        let list = Column(theme.Spacing)
        list.Accessibility = Accessibility{Role: AccessibilityRole.List}
        var index = model.Start
        let widest = model.Ordered ? (model.Start + model.Children.Length - 1).ToString() + ".": "•"
        for item in model.Children {
            let row = Container{
                Key: item.Block.Id,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.FlexStart,
                Gap: theme.ControlGap,
                MinWidth: 0.0,
                Accessibility: Accessibility{Role: AccessibilityRole.ListItem}
            }
            row.Children.Add(
                Text{
                    Key: "bullet",
                    Content: model.Ordered ? index.ToString() + ".": "•",
                    Width: current.FontSize * (0.2 + 0.6 * float64(widest.Length)),
                    LineHeight: theme.LineHeight,
                    TextAlign: model.Ordered ? TextAlign.Right: TextAlign.Left,
                    FlexShrink: 0.0,
                    FontSize: current.FontSize,
                    Color: current.MutedColor!!
                }
            )
            let body = Block(item, 400.0, TextAlign.Left, current, theme)
            body.FlexGrow = 1.0
            body.FlexBasis = 0.0
            row.Children.Add(body)
            list.Children.Add(row)
            index++
        }
        return list
    }

    private func Table(model MarkdownModel, current MarkdownViewInput, theme Theme) Blob {
        var columns = 0
        for row in model.Children {
            columns = Math.Max(columns, row.Children.Length)
        }
        let table = Column()
        table.Width = Percent(100)
        table.MinWidth = current.MinimumTableColumnWidth * float64(columns)
        table.Accessibility = Accessibility{Role: AccessibilityRole.Grid, Name: theme.Text("Table")}
        for row in model.Children {
            let line = Container{
                Key: row.Block.Id,
                FlexDirection: FlexDirection.Row,
                MinWidth: 0.0,
                BackgroundColor: row.Header ? current.CodeBackground!!: Color.Transparent,
                Accessibility: Accessibility{Role: AccessibilityRole.Row}
            }
            for column in 0 ... columns {
                let box = Container{
                    Key: column.ToString(),
                    Padding: theme.ControlGap,
                    BorderWidth: Edges{Bottom: 1.0},
                    BorderColor: Edges[Color]{Bottom: current.RuleColor!!},
                    MinWidth: current.MinimumTableColumnWidth,
                    FlexGrow: 1.0,
                    FlexBasis: 0.0,
                    Accessibility: Accessibility{
                        Role: row.Header ? AccessibilityRole.ColumnHeader: AccessibilityRole.GridCell
                    }
                }
                if column < row.Children.Length {
                    box.Children.Add(
                        Block(
                            row.Children[column],
                            row.Header ? 700.0: 400.0,
                            column < model.Alignments.Length ? model.Alignments[column]: TextAlign.Left,
                            current,
                            theme
                        )
                    )
                }
                line.Children.Add(box)
            }
            var rowContent Blob = line
            if let create = current.CreateBlock {
                rowContent = create(row.Block, rowContent)
            }
            rowContent.Key = row.Block.Id
            rowContent.Accessibility = Accessibility{Role: AccessibilityRole.Row}
            table.Children.Add(rowContent)
        }
        return Container{
            MinWidth: 0.0,
            FlexShrink: 0.0,
            OverflowX: Overflow.Scroll,
            ScrollbarX: theme.Scrollbar,
            table,
        }
    }
}
