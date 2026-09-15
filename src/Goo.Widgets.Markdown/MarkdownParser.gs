package Goo.Widgets.Markdown

import System
import System.Collections.Generic
import System.Text
import Goo
import Markdig
import Markdig.Syntax
import Markdig.Syntax.Inlines
import Markdig.Extensions.Alerts
import Markdig.Extensions.Tables

internal class MarkdownParser {
  private let headings Dictionary[string, int32] = Dictionary[string, int32](StringComparer.Ordinal)
  private let headingIds HashSet[string] = HashSet[string](StringComparer.Ordinal)
  private let pipeline MarkdownPipeline
  internal init() {
    let builder = MarkdownPipelineBuilder()
    MarkdownExtensions.UsePipeTables(builder)
    MarkdownExtensions.UseAlertBlocks(builder)
    MarkdownExtensions.UseAutoLinks(builder)
    MarkdownExtensions.UseEmphasisExtras(builder, Markdig.Extensions.EmphasisExtras.EmphasisExtraOptions.Strikethrough)
    pipeline = builder.Build()
  }
  internal func Parse(text string) []MarkdownModel {
    headings.Clear()
    headingIds.Clear()
    return Children(Markdig.Markdown.Parse(text, pipeline), "root")
  }
  private func Children(parent ContainerBlock, path string) []MarkdownModel {
    let result = List[MarkdownModel]()
    var index = 0
    for block in parent {
      result.Add(Read(block, path + "/" + index.ToString()))
      index++
    }
    return result.ToArray()
  }
  private func Read(block Block, path string) MarkdownModel {
    let result = MarkdownModel()
    result.Path = path
    var info = MarkdownBlock{Id: path, Kind: MarkdownBlockKind.Paragraph, Text: ""}
    if block is HeadingBlock heading { info.Kind = MarkdownBlockKind.Heading
      info.HeadingLevel = heading.Level }
    else if block is CodeBlock code { info.Kind = MarkdownBlockKind.Code
      info.Text = code.Lines.ToString()
      if code is FencedCodeBlock fenced { info.Language = fenced.Info } }
    else if block is AlertBlock alert { info.Kind = MarkdownBlockKind.Alert
      info.AlertKind = alert.Kind.ToString().ToUpperInvariant() }
    else if block is QuoteBlock { info.Kind = MarkdownBlockKind.Quote }
    else if block is ListBlock list { info.Kind = MarkdownBlockKind.List
      result.Ordered = list.IsOrdered
      if Int32.TryParse(list.OrderedStart, out var start) { result.Start = start } }
    else if block is ListItemBlock { info.Kind = MarkdownBlockKind.ListItem }
    else if block is ThematicBreakBlock { info.Kind = MarkdownBlockKind.Rule }
    else if block is Table table { info.Kind = MarkdownBlockKind.Table
      let alignments = List[TextAlign]()
      for column in table.ColumnDefinitions {
        alignments.Add(column.Alignment == TableColumnAlign.Center ? TextAlign.Center : column.Alignment == TableColumnAlign.Right ? TextAlign.Right : TextAlign.Left)
      }
      result.Alignments = alignments.ToArray() }
    else if block is TableRow row { info.Kind = MarkdownBlockKind.TableRow
      result.Header = row.IsHeader }
    else if block is TableCell { info.Kind = MarkdownBlockKind.TableCell }
    if block is LeafBlock leaf && !(block is CodeBlock) {
      let content = StringBuilder()
      let runs = List[MarkdownInline]()
      if leaf.Inline != nil { Append(leaf.Inline!!, MarkdownInline{}, content, runs) }
      else { content.Append(leaf.Lines.ToString()) }
      info.Text = content.ToString()
      result.Runs = runs.ToArray()
    }
    if info.Kind == MarkdownBlockKind.Heading { info.Id = HeadingId(info.Text!!) }
    if block is ContainerBlock container { result.Children = Children(container, path) }
    result.Block = info
    return result
  }
  private func HeadingId(text string) string {
    let name = StringBuilder()
    var separator = false
    for letter in text.ToLowerInvariant() {
      if Char.IsLetterOrDigit(letter) { if separator && name.Length > 0 { name.Append('-') }
        name.Append(letter)
        separator = false }
      else if Char.IsWhiteSpace(letter) || letter == '-' { separator = true }
    }
    let stem = name.Length == 0 ? "heading" : name.ToString()
    headings.TryGetValue(stem, out var count)
    var id = count == 0 ? stem : stem + "-" + (count + 1).ToString()
    while !headingIds.Add(id) { count++
      id = stem + "-" + (count + 1).ToString() }
    headings[stem] = count + 1
    return id
  }
  private func Append(item Inline, state MarkdownInline, text StringBuilder, runs List[MarkdownInline]) {
    if item is LiteralInline literal { Add(literal.Content.ToString() ?? "", state, text, runs)
      return }
    if item is LineBreakInline line { Add(line.IsHard ? "\n" : " ", state, text, runs)
      return }
    if item is CodeInline code { Add(code.Content, state with{Kind = MarkdownInlineKind.Code}, text, runs)
      return }
    if item is AutolinkInline autoLink { Add(autoLink.Url, state with{Kind = MarkdownInlineKind.Link,
      Target = autoLink.IsEmail ? "mailto:" + autoLink.Url : autoLink.Url}, text, runs)
      return }
    if item is HtmlInline html { Add(html.Tag, state, text, runs)
      return }
    if item is EmphasisInline emphasis {
      let next = state with{Bold = state.Bold || emphasis.DelimiterChar != '~' && emphasis.DelimiterCount >= 2,
        Italic = state.Italic || emphasis.DelimiterChar != '~' && emphasis.DelimiterCount == 1,
        Strikethrough = state.Strikethrough || emphasis.DelimiterChar == '~'}
      for child in emphasis { Append(child, next, text, runs) }
      return
    }
    if item is LinkInline link {
      let label = StringBuilder()
      let labelRuns = List[MarkdownInline]()
      for child in link { Append(child, state, label, labelRuns) }
      let caption = label.Length == 0 ? (link.IsImage ? "Image" : link.Url ?? "Link") : label.ToString()
      Add(caption, state with{Kind = link.IsImage ? MarkdownInlineKind.Image : MarkdownInlineKind.Link,
        Target = link.Url ?? "", Title = link.Title ?? ""}, text, runs)
      return
    }
    if item is ContainerInline container { for child in container { Append(child, state, text, runs) } }
  }
  private func Add(value string, state MarkdownInline, text StringBuilder, runs List[MarkdownInline]) {
    if value.Length == 0 { return }
    runs.Add(state with{Text = value, Start = text.Length, Length = value.Length})
    text.Append(value)
  }
}
