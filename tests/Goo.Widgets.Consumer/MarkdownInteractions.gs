package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Markdown
import Hexa.NET.SDL3
import System
import System.Collections.Generic

internal class MarkdownProbe : MarkdownView {
    internal func Render(input MarkdownViewInput) Blob -> base.Build(input)
}

func MarkdownContracts() {
    let probe = MarkdownProbe()
    var rejected bool
    try {
        probe.Render(MarkdownViewInput{FontSize: Double.NaN})
    } catch (error ArgumentException) {
        rejected = true
    }
    Require(rejected, "Markdown accepted a nonfinite font size")
    var headings IReadOnlyList[MarkdownHeading]?
    let kinds = HashSet[MarkdownBlockKind]()
    let input = MarkdownViewInput{
        Text: "# Same\n\n# Same\n\n# Same-2\n\n---\n\n> [!WARNING]\n> Check this\n\n| A | B |\n| - | - |\n| x | y |\n\n```gs\ntext\n```\n\n3. first\n4. second",
        OnHeadings: (value IReadOnlyList[MarkdownHeading]) -> {
            headings = value
        },
        CreateBlock: (block MarkdownBlock, prepared Blob) -> {
            kinds.Add(block.Kind)
            return prepared
        }
    }
    probe.Render(input)
    Require(
        headings != nil && headings.Count == 3 && headings[0].Id == "same" && headings[1].Id == "same-2"
        && headings[2].Id == "same-2-2",
        "Markdown heading IDs were not unique"
    )
    for kind in[]MarkdownBlockKind{
        MarkdownBlockKind.Heading,
        MarkdownBlockKind.Alert,
        MarkdownBlockKind.Table,
        MarkdownBlockKind.Code,
        MarkdownBlockKind.List,
        MarkdownBlockKind.Rule
    } {
        Require(kinds.Contains(kind), "Markdown failed to parse " + kind.ToString())
    }
    probe.Render(MarkdownViewInput{Text: "", OnHeadings: input.OnHeadings})
    Require(headings!!.Count == 0, "Empty Markdown retained old headings")
}

internal class MarkdownHost : Cell {
    internal let Viewport ElementHandle = ElementHandle()
    internal let Before ElementHandle = ElementHandle()
    internal let Editors Dictionary[string, TextEditor] = Dictionary[string, TextEditor](StringComparer.Ordinal)
    internal var Headings IReadOnlyList[MarkdownHeading] = []MarkdownHeading{}
    internal var HeadingCalls int32
    internal var Links int32
    internal var LastLink string = ""
    internal var Images int32
    internal var FontSize float64 = 14.0
    internal var Changed bool
    internal var LongLink bool
    internal var LinkContent ElementHandle?
    internal var Show bool = true
    internal var StylePasses int32
    internal var InlinePasses int32
    private func Open(target string) {
        LastLink = target
        Links++
    }

    private func HeadingsChanged(value IReadOnlyList[MarkdownHeading]) {
        Headings = value
        HeadingCalls++
    }

    private func Editor(block MarkdownBlock, prepared TextEditor) TextEditor {
        prepared.Handle = ElementHandle()
        Editors[block.Id!!] = prepared
        return prepared
    }

    private func Style(run MarkdownInline, prepared Style) Style {
        StylePasses++
        return prepared
    }

    private func Inline(run MarkdownInline, prepared Blob) Blob {
        InlinePasses++
        if run.Kind == MarkdownInlineKind.Link {
            prepared.Handle = ElementHandle()
            LinkContent = prepared.Handle
        }
        return prepared
    }

    private func Resolve(run MarkdownInline) Blob? {
        Require(run.Target == "memory:diagram", "Image target changed")
        Images++
        return Container{
            Width: 240.0,
            Height: 56.0,
            BorderRadius: 6.0,
            BackgroundColor: "#312e81",
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Text{Content: "Host-resolved diagram", Color: "#c7d2fe", FontSize: 14.0}
        }
    }

    internal func Text() string -> "# Deployment notes\n\n"
    + (Changed ? "Updated paragraph. ": "Select this paragraph. ")
    +
        "It contains **bold**, *italic*, ~~old~~, `inline code`, and the [" +
        (LongLink ? MarkdownLongCaption(): "release guide")
    +
        "](app:guide). Text wraps naturally when the window gets narrower, and copying keeps the plain readable content.\n\n"
    + "> [!TIP]\n> This note is selectable and measured using real fonts.\n\n"
    + "## Checklist\n\n3. Review the package.\n4. Resize the article.\n\n> Keep application decisions in the host.\n\n"
    +
        "| Component | Status |\n| :--- | ---: |\n| Date picker | Verified |\n| Markdown | Optional package with selectable content |\n\n"
    + "```gsharp\nlet message = Text{Content: \"Hello, Goo\"}\nmessage.FontSize = 16.0\n```\n\n"
    + "![Build diagram](memory:diagram)\n\n---\n\n## Details\n\nMore information.\n\n## Details\n\nAnother section."

    public override func Build() Blob {
        let root = Container{
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 20.0,
            Gap: 12.0,
            BackgroundColor: "#111318",
            Color: "#fafafa",
            Button{
                Key: "before",
                Handle: Before,
                Height: 32.0,
                Width: 190.0,
                BackgroundColor: "#27272a",
                Text{Content: "Markdown verification"}
            }
        }
        if Show {
            root.Children.Add(
                Container{
                    Key: "scroll",
                    Handle: Viewport,
                    FlexGrow: 1.0,
                    FlexBasis: 0.0,
                    MinHeight: 0.0,
                    OverflowY: Overflow.Scroll,
                    Cell.Mount[MarkdownViewInput, MarkdownView](
                        "view",
                        MarkdownViewInput{
                            Text: Text(),
                            FontSize: FontSize,
                            OnLink: Open,
                            ResolveImage: Resolve,
                            OnHeadings: HeadingsChanged,
                            CreateEditor: Editor,
                            CreateInline: Inline,
                            CreateInlineStyle: Style
                        }
                    )
                }
            )
        }
        return root
    }
}

func MarkdownLongCaption() string -> "complete release guide with all of the details needed to review this deployment and its follow-up changes"

func MarkdownInteractions() {
    MarkdownContracts()
    let host = MarkdownHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Markdown verification",
        Width: 820,
        Height: 860,
        Root: root,
        AccessibilityAdapter: semantics
    }
    BindApplicationInput(root, window)
    window.Open()
    try {
        PumpFrames(window, 25)
        let id = OnlyNativeWindow()
        Require(
            host.Headings.Count == 4 && host.Headings[3].Id == "details-2" && host.Headings[0].Handle!!.IsMounted,
            "Markdown headings did not mount"
        )
        Require(
            SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.Heading) == 4 &&
                SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.Link) == 1,
            "Markdown heading/link accessibility roles are missing"
        )
        Require(
            host.Images > 0 && host.InlinePasses > 0 && host.StylePasses > 0,
            "Markdown skipped customization hooks"
        )
        let paragraph = host.Editors["root/1"]
        let controller = paragraph.Controller
        let height = paragraph.Handle!!.BorderBox.Height
        Require(height > 30.0 && height < 200.0, "Markdown paragraph lacks intrinsic wrapped height")
        Require(paragraph.Handle!!.Focus(), "Markdown text could not receive keyboard focus")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        PumpFrames(window, 5)
        SelectorKey(id, SDLScancode.C, SDLKeymod.Ctrl)
        PumpFrames(window, 7)
        Require(
            window.GetClipboardText() == controller.Document.GetText(),
            "Markdown keyboard copy did not preserve plain text"
        )
        Require(
            !window.GetClipboardText().Contains("**") && window.GetClipboardText().Contains("release guide"),
            "Markdown copy leaked markup or dropped link text"
        )
        let original = controller.Document.GetText()
        SelectorType(window, id, "must not edit")
        Require(controller.Document.GetText() == original, "Markdown read-only text was editable")
        CaptureIssueProof(window, "markdown-wide")
        Require(
            SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.ColumnHeader) == 2
            && SelectorCountRole(semantics.Tree?.Root, AccessibilityRole.GridCell) == 4,
            "Markdown table added a phantom trailing column"
        )
        let link = FindSemantics(semantics.Tree?.Root, "release guide")!!
        Require(
            window.PerformAccessibilityAction(link.Id, AccessibilityActionRequest(AccessibilityAction.Focus)),
            "Markdown link could not receive accessible focus"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 8)
        Require(host.Links == 1 && host.LastLink == "app:guide", "Markdown keyboard link did not use the host callback")
        Require(
            window.PerformAccessibilityAction(link.Id, AccessibilityActionRequest(AccessibilityAction.Activate)),
            "Markdown accessible activation failed"
        )
        PumpFrames(window, 6)
        Require(host.Links == 2, "Markdown accessible activation was not delivered")
        CompositeClick(window, host.LinkContent!!)
        PumpFrames(window, 8)
        Require(host.Links == 3, "Markdown pointer activation did not reach the link callback")
        window.Width = 460
        PumpFrames(window, 25)
        let narrow = host.Editors["root/1"]
        Require(
            Object.ReferenceEquals(narrow.Controller, controller) && narrow.Handle!!.BorderBox.Height > height + 10.0,
            "Markdown resize lost its controller or failed intrinsic remeasurement"
        )
        let narrowHeight = narrow.Handle!!.BorderBox.Height
        host.FontSize = 18.0
        host.Rebuild()
        PumpFrames(window, 20)
        Require(
            host
                .Editors["root/1"]
                .Handle!!
                .BorderBox
                .Height > narrowHeight &&
                controller
                .Selection
                .Anchor
                .Offset != controller
                .Selection
                .Active
                .Offset,
            "Markdown font change failed measurement or lost selection"
        )
        CaptureIssueProof(window, "markdown-narrow")
        Require(
            host.Headings[3].Handle!!.ScrollIntoView(),
            "Markdown heading handle failed table-of-contents navigation"
        )
        PumpFrames(window, 12)
        Require(host.Viewport.ScrollOffset.Y > 0.0, "Markdown table-of-contents navigation did not scroll the article")
        CaptureIssueProof(window, "markdown-details")
        host.Changed = true
        host.Rebuild()
        PumpFrames(window, 20)
        Require(
            ControllerDisposed(controller) &&
                host
                .Editors["root/1"]
                .Controller
                .Document
                .GetText()
                .StartsWith("Updated paragraph."),
            "Markdown content update leaked the retired controller or retained old text"
        )
        host.LongLink = true
        host.Rebuild()
        PumpFrames(window, 25)
        host.Viewport.JumpTo(0.0, 0.0)
        PumpFrames(window, 8)
        let longLink = FindSemantics(semantics.Tree?.Root, MarkdownLongCaption())!!
        let longEditor = host.Editors["root/1"]
        let nextText = longEditor.Controller.Document.GetText().IndexOf("Text wraps")
        var caret ElementRect
        Require(
            longLink.Bounds.Width <= host.Viewport.ContentBox.Width + .2 && longLink.Bounds.Height > 30.0,
            "Markdown long link did not wrap to the measured paragraph width"
        )
        Require(
            longEditor.Handle!!.TryGetTextCaretRect(
                TextPosition{Offset: nextText, Affinity: TextAffinity.Downstream},
                TextCoordinateSpace.Window,
                out caret
            )
            && caret.Y >= longLink.Bounds.Y + longLink.Bounds.Height - .2,
            "Wrapped link overlapped the following text"
        )
        CaptureIssueProof(window, "markdown-long-link")
        let lastController = longEditor.Controller
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(ControllerDisposed(lastController) && host.Before.Focus(), "Markdown removal leaked its owned editor")
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: native Markdown parsing, intrinsic resize/font measurement, keyboard copy/read-only selection, accessible links/headings, host images, ToC, content refresh and disposal"
    )
}
