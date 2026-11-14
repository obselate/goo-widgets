package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Markdown
import Hexa.NET.SDL3
import System
import System.Collections.Generic
import System.Diagnostics
import System.Text

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
        ConfigureBlock: (block MarkdownBlock, prepared Blob) -> {
            kinds.Add(block.Kind)
            }}
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
    kinds.Clear()
    let bounded = (probe.Render(input with{Height = 240.0}) as Container)!!
    Require(bounded.Children.Count == 1 && bounded.Children[0] is Virtual && kinds.Count == 0,
        "Bounded Markdown built blocks before virtual realization")
    probe.Render(MarkdownViewInput{Text: "", OnHeadings: input.OnHeadings})
    Require(headings!!.Count == 0, "Empty Markdown retained old headings")
    for text in []string{"```", "x\n```"} {
        var codeBlocks = 0
        probe.Render(MarkdownViewInput{
            Text: text,
            ConfigureBlock: (block MarkdownBlock, prepared Blob) -> {
                if block.Kind == MarkdownBlockKind.Code {
                    codeBlocks++
                    Require(block.Text == "", "Unterminated Markdown fence produced code content")
                }
            }
        })
        Require(codeBlocks == 1, "Unterminated Markdown fence did not render one code block")
    }
}

internal class MarkdownHost : Cell {
    internal let Viewport ElementHandle = ElementHandle()
    internal let State MarkdownViewState = MarkdownViewState()
    internal let Marker ElementHandle = ElementHandle()
    internal var Bounded bool
    internal var ExtraText string = ""
    internal var BlockCalls int32
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
    internal var LinkCaption Text?
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

    private func Block(block MarkdownBlock, prepared Blob) {
        BlockCalls++
        if block.Kind == MarkdownBlockKind.List {
            ((prepared as Container)!!.Children[0] as Container)!!.Children[0].Handle = Marker
        }
    }

    private func Editor(block MarkdownBlock, prepared TextEditor) {
        prepared.Handle = ElementHandle()
        Editors[block.Id!!] = prepared
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
            LinkCaption = prepared as Text
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
            BackgroundColor: Color.Parse("#312e81"),
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Text{Content: "Host-resolved diagram", Color: Color.Parse("#c7d2fe"), FontSize: 14.0}
        }
    }

    internal func Text() string -> "# Deployment notes\n\n"
    + (Changed ? "Updated paragraph. ": "Select this paragraph. ")
    +
        "It contains **bold**, *italic*, ~~old~~, `inline code`, and the [" +
        (LongLink ? MarkdownLongCaption(): "**release** *guide* `code` ~~old~~")
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
            Width: Percent(100),
            Height: Percent(100),
            Padding: 20.0,
            Gap: 12.0,
            BackgroundColor: Color.Parse("#111318"),
            Color: Color.Parse("#fafafa"),
            Button{
                Key: "before",
                Handle: Before,
                Height: 32.0,
                Width: 190.0,
                BackgroundColor: Color.Parse("#27272a"),
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
                    OverflowY: Bounded ? Overflow.Hidden: Overflow.Scroll,
                    Cell.Mount[MarkdownViewInput, MarkdownView](
                        "view",
                        MarkdownViewInput{
                            Text: Text() + ExtraText,
                            Height: Bounded ? Percent(100): nil,
                            State: State,
                            FontSize: FontSize,
                            OnLink: Open,
                            ResolveImage: Resolve,
                            OnHeadings: HeadingsChanged,
                            ConfigureEditor: Editor,
                            CreateInline: Inline,
                            CreateInlineStyle: Style,
                            ConfigureBlock: Block
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
    RunContracts(MarkdownContracts)
    let host = MarkdownHost()
    let root = ApplicationRoot(host)
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Markdown verification",
        Size: LayoutSize(820, 860),
        Root: root,
        AccessibilityAdapter: semantics
    }
    RunNativeWindow(window, () -> {
        window.Open()
        PumpFrames(window, 25)
        let caption = host.LinkCaption!!
        Require(
            caption.Handle!!.IsMounted &&
                caption.Content == "release guide code old" &&
                caption
                .StyleRanges
                .Length == 4 &&
                caption
                .StyleRanges[0]
                .Range == TextRange(0, 7) &&
                caption
                .StyleRanges[1]
                .Range == TextRange(8, 5) &&
                caption
                .StyleRanges[2]
                .Range == TextRange(14, 4) &&
                caption
                .StyleRanges[3]
                .Range == TextRange(19, 3),
            "Markdown link lost its nested caption styles"
        )
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
        var item ElementRect
        for editor in host.Editors.Values {
            if editor.Controller.Document.GetText() == "Review the package." {
                item = editor.Handle!!.BorderBox
            }
        }
        let marker = host.Marker.BorderBox
        Require(
            item.Height > 0.0 && Math.Abs(marker.Y + marker.Height / 2.0 - item.Y - item.Height / 2.0) < 1.5,
            "Markdown list marker is not centered on its first text line"
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
            window.Clipboard.ReadText().Text == controller.Document.GetText(),
            "Markdown keyboard copy did not preserve plain text"
        )
        Require(
            !window.Clipboard.ReadText().Text.Contains("**") && window.Clipboard.ReadText().Text.Contains("release guide"),
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
        let link = FindSemantics(semantics.Tree?.Root, "release guide code old")!!
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
        window.Size = LayoutSize(float64(460) / window.UiScale, window.Size.Height)
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
            host.State.ScrollToHeading(host.Headings[3].Id!!),
            "Markdown navigation state failed table-of-contents navigation"
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
            host.LinkCaption!!
                .StyleRanges
                .Length == 0 &&
                longLink
                .Bounds
                .Width <= host
                .Viewport
                .ContentBox
                .Width +
                .2 &&
                longLink
                .Bounds
                .Height > 30.0,
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
        host.Before.Focus()
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        let extra = StringBuilder()
        for index in 0 ... 200 {
            extra.Append("\n\nParagraph ").Append(index).Append(" with selectable text.")
        }
        extra.Append("\n\n## Final section\n\n")
        for index in 0 ... 20 {
            extra.Append("\n\nFollowing paragraph ").Append(index).Append(".")
        }
        host.ExtraText = extra.ToString()
        host.Bounded = true
        host.Show = true
        host.Rebuild()
        PumpFrames(window, 30)
        let finalHeading = host.Headings[4]
        Require(host.Headings.Count == 5 && finalHeading.Id == "final-section" && !finalHeading.Handle!!.IsMounted,
            "Virtual Markdown did not retain the off-screen heading registry")
        var mounted = 0
        for editor in host.Editors.Values {
            if editor.Handle!!.IsMounted {
                mounted++
            }
        }
        Require(mounted > 0 && mounted < 30, "Bounded Markdown mounted the whole document")
        let blockCalls = host.BlockCalls
        host.Rebuild()
        PumpFrames(window, 8)
        Require(host.BlockCalls == blockCalls, "Unchanged virtual Markdown rebuilt its blocks")
        let virtualEditor = host.Editors["root/1"]
        Require(virtualEditor.Handle!!.Focus(), "Virtual Markdown text could not receive focus")
        SelectorKey(id, SDLScancode.A, SDLKeymod.Ctrl)
        PumpFrames(window, 5)
        let selection = virtualEditor.Controller.Selection
        host.Before.Focus()
        Require(host.State.ScrollToHeading(finalHeading.Id!!), "Virtual Markdown could not navigate to an off-screen heading")
        PumpFrames(window, 30)
        Require(finalHeading.Handle!!.IsMounted && finalHeading.Handle!!.ScrollIntoView(),
            "Virtual Markdown did not mount the requested heading")
        Require(ControllerDisposed(virtualEditor.Controller), "Virtual Markdown retained an off-screen text controller")
        Require(!host.State.ScrollToHeading("missing-heading"), "Markdown accepted an unknown heading ID")
        Require(host.State.ScrollToHeading(host.Headings[0].Id!!), "Virtual Markdown could not return to the first heading")
        let remount = Stopwatch.StartNew()
        while !host.Editors["root/1"].Handle!!.IsMounted && window.IsOpen && remount.Elapsed.TotalSeconds < 10.0 {
            window.Pump(0.016)
        }
        let restored = host.Editors["root/1"]
        Require(restored.Handle!!.IsMounted && restored.Controller.Selection.Equals(selection),
            "Virtual Markdown lost per-block selection after remounting: mounted=" + restored.Handle!!.IsMounted.ToString() +
            " expected=" + selection.ToString() + " actual=" + restored.Controller.Selection.ToString())
        PumpFrames(window, 30)
        let links = host.Links
        CompositeClick(window, host.LinkContent!!)
        PumpFrames(window, 8)
        Require(host.Links == links + 1 && host.LastLink == "app:guide", "Virtual Markdown lost link activation")
        let lastController = host.Editors["root/1"].Controller
        host.Show = false
        host.Rebuild()
        PumpFrames(window, 8)
        Require(ControllerDisposed(lastController) && host.Before.Focus(), "Markdown removal leaked its owned editor")
    })
    Console.WriteLine(
        "PASS: native Markdown parsing, intrinsic resize/font measurement, keyboard copy/read-only selection, accessible links/headings, host images, ToC, content refresh, virtual block mounting/navigation/selection and disposal"
    )
}
