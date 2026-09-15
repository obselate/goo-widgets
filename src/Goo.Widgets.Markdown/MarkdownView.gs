package Goo.Widgets.Markdown

import Goo
import System
import System.Collections.Generic

internal class MarkdownLeafStamp {
    internal var Text string = ""
    internal var Revision int64
}

internal class MarkdownHeadingHandle {
    internal var Parent string = ""
    internal let Handle ElementHandle = ElementHandle()
}

/// Selectable rich content with retained text controllers, measured height, and host-owned activation.
public open class MarkdownView : Cell[MarkdownViewInput] {
    private let parser MarkdownParser = MarkdownParser()
    private let leaves Dictionary[string, MarkdownLeafStamp] = Dictionary[string, MarkdownLeafStamp](
        StringComparer.Ordinal
    )
    private let handles Dictionary[string, MarkdownHeadingHandle] = Dictionary[string, MarkdownHeadingHandle](
        StringComparer.Ordinal
    )
    private let usedLeaves HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let usedHeadings HashSet[string] = HashSet[string](StringComparer.Ordinal)
    private let headings List[MarkdownHeading] = List[MarkdownHeading]()
    private var models[]MarkdownModel = []MarkdownModel{}
    private var source string?
    private var current MarkdownViewInput
    private var headingCallback Action[IReadOnlyList[MarkdownHeading]]?

    protected override func Build(input MarkdownViewInput) Blob {
        current = input with{
            FontSize = input.FontSize == 0.0 ? 14.0: input.FontSize,
            FontFamily = input.FontFamily ?? "",
            CodeFontFamily = input.CodeFontFamily ?? "monospace",
            Color = input.Color ?? Color.Parse("#e4e4e7"),
            MutedColor = input.MutedColor ?? Color.Parse("#a1a1aa"),
            LinkColor = input.LinkColor ?? Color.Parse("#a5b4fc"),
            CodeBackground = input.CodeBackground ?? Color.Parse("#202024"),
            SelectionColor = input.SelectionColor ?? Color.Parse("#4f46e5"),
            BlockGap = input.BlockGap == 0.0 ? 12.0: input.BlockGap,
            MinimumTableColumnWidth = input.MinimumTableColumnWidth == 0.0 ? 100.0: input.MinimumTableColumnWidth
        }
        if !Double.IsFinite(current.FontSize) || current.FontSize <= 0.0 || !Double.IsFinite(current.BlockGap) ||
            current.BlockGap < 0.0
        || !Double.IsFinite(current.MinimumTableColumnWidth) || current.MinimumTableColumnWidth <= 0.0 {
            throw ArgumentOutOfRangeException("Markdown dimensions")
        }
        let text = input.Text ?? ""
        let changed = source != text
        if changed {
            models = parser.Parse(text)
            source = text
        }
        usedLeaves.Clear()
        usedHeadings.Clear()
        headings.Clear()
        let children = List[Blob]()
        for model in models {
            children.Add(Block(model, 400.0, TextAlign.Left))
        }
        var root = Column(current.BlockGap)
        root.Width = input.Width ?? Length.Percent(100)
        if let create = input.CreateRoot {
            root = create(current, root)
        }
        root.Children.Clear()
        for child in children {
            root.Children.Add(child)
        }
        for key in List[string](leaves.Keys) {
            if !usedLeaves.Contains(key) {
                leaves.Remove(key)
            }
        }
        for key in List[string](handles.Keys) {
            if !usedHeadings.Contains(key) {
                handles.Remove(key)
            }
        }
        if changed || headingCallback != input.OnHeadings {
            headingCallback = input.OnHeadings
            headingCallback?.Invoke(Array.AsReadOnly(headings.ToArray()))
        }
        return root
    }

    private func Column(gap float64 = 0.0) Container -> Container{Gap: gap, MinWidth: 0.0, FlexShrink: 0.0}

    private func Block(model MarkdownModel, weight float64, alignment TextAlign) Blob {
        let info = model.Block
        var content Blob
        if info.Kind == MarkdownBlockKind.Heading {
            let scale = []float64{2.0, 1.7, 1.4, 1.2, 1.1, 1.0}
            content = Leaf(model, current.FontSize * scale[Math.Clamp(info.HeadingLevel, 1, 6) - 1], 700.0, alignment)
        } else if info.Kind == MarkdownBlockKind.Paragraph {
            content = Leaf(model, current.FontSize, weight, alignment)
        } else if info.Kind == MarkdownBlockKind.Code {
            content = Container{
                Padding: 12.0,
                BorderRadius: 5.0,
                MinWidth: 0.0,
                FlexShrink: 0.0,
                BackgroundColor: current.CodeBackground!!,
                Leaf(model, current.FontSize * .93, 400.0, TextAlign.Left)
            }
        } else if info.Kind == MarkdownBlockKind.Rule {
            content = Container{Height: 1.0, FlexShrink: 0.0, BackgroundColor: current.MutedColor!!}
        } else if info.Kind == MarkdownBlockKind.Table {
            content = Table(model)
        } else if info.Kind == MarkdownBlockKind.List {
            content = ListBlockView(model)
        } else {
            let box = Column(current.BlockGap * .6)
            for child in model.Children {
                box.Children.Add(Block(child, weight, alignment))
            }
            if info.Kind == MarkdownBlockKind.Quote || info.Kind == MarkdownBlockKind.Alert {
                box.PaddingLeft = 12.0
                box.BorderLeftWidth = 3.0
                box.BorderLeftColor = current.MutedColor!!
            }
            if info.Kind == MarkdownBlockKind.Alert {
                let kind = info.AlertKind ?? "NOTE"
                let accent = kind == "WARNING" || kind == "CAUTION" ? Color.Parse(
                    "#fbbf24"
                ): kind == "TIP" ? Color.Parse("#86efac"): current.LinkColor!!
                box.BorderLeftColor = accent
                box.Padding = 12.0
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
        let root = Container{Key: info.Id, MinWidth: 0.0, FlexShrink: 0.0, content}
        if info.Kind == MarkdownBlockKind.Heading {
            let id = info.Id!!
            let parent = model.Path.Substring(0, model.Path.LastIndexOf('/'))
            if !handles.TryGetValue(id, out var entry) || entry.Parent != parent {
                entry = MarkdownHeadingHandle{Parent: parent}
                handles[id] = entry
            }
            usedHeadings.Add(id)
            root.Handle = entry.Handle
            root.Accessibility = Accessibility{
                Role: AccessibilityRole.Heading,
                Name: info.Text ?? "",
                Level: info.HeadingLevel
            }
            headings.Add(MarkdownHeading{Id: id, Text: info.Text, Level: info.HeadingLevel, Handle: entry.Handle})
        }
        return root
    }

    private func Leaf(model MarkdownModel, size float64, weight float64, alignment TextAlign) Blob {
        let path = model.Path
        let text = model.Block.Text ?? ""
        if !leaves.TryGetValue(path, out var stamp) {
            stamp = MarkdownLeafStamp{Text: text}
            leaves.Add(path, stamp)
        } else if stamp.Text != text {
            stamp.Text = text
            stamp.Revision++
        }
        usedLeaves.Add(path)
        let input = MarkdownLeafInput{Model: model, Options: current, Size: size, Weight: weight, Alignment: alignment}
        return Cell.Mount[MarkdownTextView](
            path + "@" + stamp.Revision.ToString(),
            (cell MarkdownTextView) -> cell.Configure(input)
        )
    }

    private func ListBlockView(model MarkdownModel) Blob {
        let list = Column(5.0)
        list.Accessibility = Accessibility{Role: AccessibilityRole.List}
        var index = model.Start
        for item in model.Children {
            let row = Container{
                Key: item.Block.Id,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.FlexStart,
                Gap: 8.0,
                MinWidth: 0.0,
                Accessibility: Accessibility{Role: AccessibilityRole.ListItem}
            }
            row.Children.Add(
                Text{
                    Key: "bullet",
                    Content: model.Ordered ? index.ToString() + ".": "•",
                    Width: 28.0,
                    FlexShrink: 0.0,
                    FontSize: current.FontSize,
                    Color: current.MutedColor!!
                }
            )
            let body = Block(item, 400.0, TextAlign.Left)
            body.FlexGrow = 1.0
            body.FlexBasis = 0.0
            row.Children.Add(body)
            list.Children.Add(row)
            index++
        }
        return list
    }

    private func Table(model MarkdownModel) Blob {
        // Markdig may retain a trailing definition without a cell after a closing pipe.
        var columns = 0
        for row in model.Children {
            columns = Math.Max(columns, row.Children.Length)
        }
        let table = Column()
        table.Width = Length.Percent(100)
        table.MinWidth = current.MinimumTableColumnWidth * float64(columns)
        table.Accessibility = Accessibility{Role: AccessibilityRole.Grid, Name: "Table"}
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
                    Padding: 8.0,
                    BorderBottomWidth: 1.0,
                    BorderBottomColor: current.MutedColor!!,
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
                            column < model.Alignments.Length ? model.Alignments[column]: TextAlign.Left
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
        return Container{MinWidth: 0.0, FlexShrink: 0.0, OverflowX: Overflow.Scroll, table}
    }
}
