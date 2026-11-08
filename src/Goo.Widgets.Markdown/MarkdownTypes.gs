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

/// Navigation for one mounted Markdown view. Pass the same state on each rebuild.
public class MarkdownViewState {
    internal let Viewport ElementHandle = ElementHandle()
    internal let Headings Dictionary[string, MarkdownHeadingHandle] = Dictionary[string, MarkdownHeadingHandle](
        StringComparer.Ordinal
    )
    internal var Virtualized bool

    /// Reveals a heading by ID, including headings outside the mounted virtual rows.
    /// Returns false when the heading or mounted view is unavailable.
    public func ScrollToHeading(id string) bool {
        if !Headings.TryGetValue(id, out var heading) {
            return false
        }
        return Virtualized ? Viewport.ScrollToItem(heading.BlockKey, ScrollAlignment.Start):
            heading.Handle.ScrollIntoView()
    }
}

/// Optional-parser rich content. Links and images are resolved only through host callbacks.
public data struct MarkdownViewInput {
    var Text string?
    var Width Length?
    /// A bounded viewport height enables virtual rows. Percent heights need a sized parent.
    /// Leave nil or Auto in a content-sized container to render all blocks without an inner scroller.
    var Height Length?
    /// Optional navigation state for this mounted view.
    var State MarkdownViewState?
    var FontSize float64
    var FontFamily string?
    var CodeFontFamily string?
    var Color Color?
    var MutedColor Color?
    /// Color of table row rules and thematic breaks. Nil uses MutedColor.
    var RuleColor Color?
    var LinkColor Color?
    var CodeBackground Color?
    var SelectionColor Color?
    var BlockGap float64?
    /// Minimum measured table-column width before horizontal scrolling is used.
    var MinimumTableColumnWidth float64
    var OnLink Action[string]?
    /// Return an image Blob with its desired size, or nil to keep selectable alternative text.
    /// Hosts must not change state in this callback.
    var ResolveImage Func[MarkdownInline, Blob?]?
    /// Customizes text-only style fields for every inline span.
    /// Hosts must not change state in this callback.
    var CreateInlineStyle Func[MarkdownInline, Style, Style]?
    /// Customizes atomic link, inline-code, and resolved-image content.
    /// Hosts must not change state in this callback.
    var CreateInline Func[MarkdownInline, Blob, Blob]?
    /// Hosts must not change state in this callback.
    var CreateBlock Func[MarkdownBlock, Blob, Blob]?
    /// Customizes a prepared read-only editor; it must retain its supplied controller.
    /// Hosts must not change state in this callback.
    var CreateEditor Func[MarkdownBlock, TextEditor, TextEditor]?
    /// Hosts must not change state in this callback.
    var CreateRoot Func[MarkdownViewInput, Container, Container]?
    /// Runs when the heading list or this callback changes. Only mounted headings have mounted handles.
    /// Use State.ScrollToHeading to reach an off-screen heading in a bounded view.
    var OnHeadings Action[IReadOnlyList[MarkdownHeading]]?
}

internal class MarkdownModel {
    internal var Path string = ""
    internal var Key string = ""
    internal var Block MarkdownBlock
    internal var Runs[]MarkdownInline = []MarkdownInline{}
    internal var Captions Dictionary[int32, IReadOnlyList[MarkdownInline]]?
    internal var Children[]MarkdownModel = []MarkdownModel{}
    internal var Ordered bool
    internal var Start int32 = 1
    internal var Header bool
    internal var Alignments[]TextAlign = []TextAlign{}
}
