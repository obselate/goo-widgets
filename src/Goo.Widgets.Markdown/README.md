# Goo.Widgets.Markdown

An optional `MarkdownView` for Goo. This package depends on
[Markdig 1.3.2](https://github.com/xoofx/markdig/tree/1.3.2) and Goo.Widgets;
the base Goo.Widgets package has no Markdown parser dependency.

Version `0.3.0` is unreleased. Build this checkout to use the API shown below.
After publication, install it from NuGet.org:

```sh
dotnet add YourApp.gsproj package Goo.Widgets.Markdown --version 0.3.0
```

```gsharp
import Goo
import Goo.Widgets.Markdown

Cell.Mount[MarkdownViewInput, MarkdownView](
    "article",
    MarkdownViewInput{Text: "# Release notes\n\nRead the **changes** and [guide](app:guide).", OnLink: OpenLink,}
)
```

The parser supports CommonMark blocks plus pipe tables, strikethrough, autolinks,
and GFM alerts. Raw HTML is shown as text. No scripts, URLs, images, or files are
executed or loaded automatically. `OnLink` receives the target verbatim;
`ResolveImage` optionally returns host-owned image content. Unresolved images keep
their selectable alternative text. Returned image Blobs should specify their size.

Each paragraph, heading, code block, and table cell has an owned read-only editor.
Pointer/keyboard selection and copying operate within that editor; selection does
not span separate blocks. Copying returns plain text with Markdown syntax removed.
Inline code, links, and resolved images are atomic selections. Long atomic content
uses the measured leaf width and settles after the geometry notification on resize.
Fenced code and tables can scroll horizontally. Put the view in a bounded container
with `OverflowY: Overflow.Scroll` for long articles.

`CreateBlock` customizes block content. `CreateInlineStyle` supplies text-only Goo
Style fields for every span; `CreateInline` customizes atomic code/link/image content.
`CreateEditor` receives a prepared editor and must keep its controller. Required
read-only state, presentation layers, and accessibility wiring are reapplied.
`CreateRoot` customizes the article container. Font, color, spacing, and minimum
table column width are ordinary input values. Changed text remounts its owned
editor; unchanged blocks retain selection and controllers. Content updates do not
accumulate document undo history.

`OnHeadings` receives heading IDs, labels, levels, and ElementHandles when content
changes. IDs are lower-case slugs with duplicate suffixes. Handles become mounted
after reconciliation; call `ScrollIntoView()` from a table-of-contents action.
Headings expose heading semantics, and inline links expose keyboard-focusable link
semantics when `OnLink` is supplied.
