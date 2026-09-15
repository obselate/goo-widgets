package Goo.Widgets.Markdown

import Goo
import System
import System.Collections.Generic

/// A rendered Markdown block, independent of parser implementation types.
public enum MarkdownBlockKind {
    Paragraph;
    Heading;
    Code;
    Quote;
    List;
    ListItem;
    Rule;
    Table;
    TableRow;
    TableCell;
    Alert
}

/// Distinguishes ordinary styled text and atomic inline content.
public enum MarkdownInlineKind {
    Text;
    Code;
    Link;
    Image
}

/// Describes a block passed to customization hooks.
public data struct MarkdownBlock {
    var Kind MarkdownBlockKind
    var Id string?
    var Text string?
    var HeadingLevel int32
    var Language string?
    var AlertKind string?
}

/// One source-text span after Markdown syntax is removed.
public data struct MarkdownInline {
    var Kind MarkdownInlineKind
    var Text string?
    var Target string?
    var Title string?
    var Start int32
    var Length int32
    var Bold bool
    var Italic bool
    var Strikethrough bool
}

/// Heading identity and mounted handle for a host-owned table of contents.
public data struct MarkdownHeading {
    var Id string?
    var Text string?
    var Level int32
    var Handle ElementHandle?
}

/// Optional-parser rich content. Links and images are resolved only through host callbacks.
public data struct MarkdownViewInput {
    var Text string?
    var Width Length?
    var FontSize float64
    var FontFamily string?
    var CodeFontFamily string?
    var Color Color?
    var MutedColor Color?
    var LinkColor Color?
    var CodeBackground Color?
    var SelectionColor Color?
    var BlockGap float64
    /// Minimum measured table-column width before horizontal scrolling is used.
    var MinimumTableColumnWidth float64
    var OnLink Action[string]?
    /// Return an image Blob with its desired size, or nil to keep selectable alternative text.
    var ResolveImage Func[MarkdownInline, Blob?]?
    /// Customizes text-only style fields for every inline span.
    var CreateInlineStyle Func[MarkdownInline, Style, Style]?
    /// Customizes atomic link, inline-code, and resolved-image content.
    var CreateInline Func[MarkdownInline, Blob, Blob]?
    var CreateBlock Func[MarkdownBlock, Blob, Blob]?
    /// Customizes a prepared read-only editor; it must retain its supplied controller.
    var CreateEditor Func[MarkdownBlock, TextEditor, TextEditor]?
    var CreateRoot Func[MarkdownViewInput, Container, Container]?
    /// Runs when the heading list or this callback changes. Handles become mounted after reconciliation.
    var OnHeadings Action[IReadOnlyList[MarkdownHeading]]?
}

internal class MarkdownModel {
    internal var Path string = ""
    internal var Block MarkdownBlock
    internal var Runs[]MarkdownInline = []MarkdownInline{}
    internal var Children[]MarkdownModel = []MarkdownModel{}
    internal var Ordered bool
    internal var Start int32 = 1
    internal var Header bool
    internal var Alignments[]TextAlign = []TextAlign{}
}
