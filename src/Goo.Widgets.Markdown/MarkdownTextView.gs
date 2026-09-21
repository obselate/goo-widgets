package Goo.Widgets.Markdown

import Goo
import Goo.Widgets
import System

internal data struct MarkdownLeafInput {
    var Model MarkdownModel?
    var Options MarkdownViewInput
    var Size float64
    var Weight float64
    var Alignment TextAlign
}

// A leaf always starts from a fresh document. Changed text receives a new mount key,
// so content refresh does not accumulate undo history or invalidate an attached controller.
internal class MarkdownTextView : Cell, IDisposable {
    private var controller TextEditorController?
    private var layer TextPresentationLayer?
    private var current MarkdownLeafInput
    private let handle ElementHandle = ElementHandle()
    private var width float64
    private var disposed bool
    public init() {
        handle.MetricsChanged += Metrics
    }

    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        handle.MetricsChanged -= Metrics
        layer?.Dispose()
        controller?.Dispose()
    }

    internal func Configure(input MarkdownLeafInput) {
        if controller != nil && current.Equals(input) {
            return
        }
        current = input
        if controller == nil {
            let document = TextDocument(input.Model!!.Block.Text ?? "")
            controller = TextEditorController(document)
            layer = TextPresentationLayer(document)
        }
        UpdatePresentation()
        Rebuild()
    }

    private func UpdatePresentation() {
        let input = current
        let model = input.Model!!
        let options = input.Options
        layer!!.Clear()
        var index = 0
        for run in model.Runs {
            let key = "run-" + index.ToString()
            let textRange = TextRange(run.Start, run.Length)
            var style = Style{
                FontSize: input.Size,
                FontWeight: input.Weight,
                FontFamily: options.FontFamily!!,
                Color: options.Color!!
            }
            if run.Bold {
                style.FontWeight = 700.0
            }
            if run.Italic {
                style.FontStyle = FontStyle.Italic
            }
            if run.Strikethrough {
                style.TextDecoration = TextDecoration.LineThrough
            }
            if run.Kind == MarkdownInlineKind.Link {
                style.Color = options.LinkColor!!
                style.TextDecoration = run.Strikethrough ? TextDecoration.Underline | TextDecoration.LineThrough: TextDecoration.Underline
            }
            if run.Kind == MarkdownInlineKind.Code {
                style.FontFamily = options.CodeFontFamily!!
            }
            if let create = options.CreateInlineStyle {
                style = create(run, style)
            }
            layer!!.SetStyle(key, textRange, style)
            if let content = Inline(run, style) {
                if run.Kind == MarkdownInlineKind.Image {
                    layer!!.SetBlockSlot(key, textRange, content)
                } else {
                    layer!!.SetInlineSlot(key, textRange, content)
                }
            }
            index++
        }
    }

    public override func Build() Blob {
        let input = current
        let model = input.Model!!
        let options = input.Options
        var editor = TextEditor(controller!!, []TextPresentationLayer{layer!!}){
            FontSize = input.Size,
            FontWeight = input.Weight,
            FontFamily = model.Block.Kind == MarkdownBlockKind.Code ? options.CodeFontFamily!!: options.FontFamily!!,
            Color = options.Color!!,
            TextAlign = input.Alignment,
            SelectionColor = options.SelectionColor!!,
            CaretColor = Color.Transparent,
            CurrentLineColor = Color.Transparent,
            BackgroundColor = Color.Transparent,
            Padding = 0.0,
            MinWidth = 0.0,
            Width = Length.Percent(100),
            TextWrap = model.Block.Kind == MarkdownBlockKind.Code ? TextWrap.NoWrap: TextWrap.Wrap,
            OverflowX = model.Block.Kind == MarkdownBlockKind.Code ? Overflow.Scroll: Overflow.Hidden,
            OverflowY = Overflow.Hidden,
        }
        if let create = options.CreateEditor {
            editor = create(model.Block, editor)
        }
        if editor.Controller != controller {
            throw ArgumentException("Markdown editor factories must retain the supplied controller")
        }
        editor.ReadOnly = true
        editor.Layers = []TextPresentationLayer{layer!!}
        editor.OnChange = nil
        editor.Height = Length.Auto
        editor.FlexShrink = 0.0
        editor.Accessibility = Accessibility{
            Role: AccessibilityRole.TextEditor,
            Name: model.Block.Text ?? "",
            Multiline: true
        }
        return Container{
            Handle: handle,
            Layout: MarkdownIntrinsicLayout(),
            Width: Length.Percent(100),
            MinWidth: 0.0,
            FlexShrink: 0.0,
            editor
        }
    }

    private func Inline(run MarkdownInline, style Style) Blob? {
        if run.Kind == MarkdownInlineKind.Text {
            return nil
        }
        let options = current.Options
        var content Blob = Text{BasedOn: style, Content: run.Text ?? "", TextWrap: TextWrap.Wrap, MinWidth: 0.0}
        if run.Kind == MarkdownInlineKind.Image {
            guard let image = options.ResolveImage?.Invoke(run) else {
                return nil
            }
            content = image
        }
        if let create = options.CreateInline {
            content = create(run, content)
        }
        var root = Container{MinWidth: 0.0, content}
        if run.Kind == MarkdownInlineKind.Link {
            let button = Button{
                Padding: 0.0,
                MinWidth: 0.0,
                BackgroundColor: Color.Transparent,
                Cursor: Cursor.Pointer,
                OnClick: () -> current.Options.OnLink?.Invoke(run.Target ?? ""),
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Link,
                    Name: run.Text ?? "",
                    Description: run.Title ?? ""
                },
                Focus: Style{OutlineWidth: 1.0, OutlineColor: options.LinkColor!!},
                content
            }
            button.Focusable = options.OnLink != nil
            if options.OnLink == nil {
                button.OnClick = nil
            }
            WidgetKeyBindings.BindActivation(button)
            if width > 0.0 {
                button.MaxWidth = width
            }
            return button
        }
        if run.Kind == MarkdownInlineKind.Code {
            root.PaddingLeft = 3.0
            root.PaddingRight = 3.0
            root.BackgroundColor = options.CodeBackground!!
            root.BorderRadius = 3.0
        } else {
            root.Accessibility = Accessibility{
                Role: AccessibilityRole.Image,
                Name: run.Text ?? "",
                Description: run.Title ?? ""
            }
        }
        if width > 0.0 {
            root.MaxWidth = width
        }
        return root
    }

    private func Metrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted || metrics.ContentBox.Width <= 0.0 {
            return
        }
        if Math.Abs(width - metrics.ContentBox.Width) > .1 {
            width = metrics.ContentBox.Width
            UpdatePresentation()
            Rebuild()
        }
    }
}

// Asking the real editor for unbounded height shapes every wrapped line. No font
// estimates, oversized hidden editor, or end-caret retry loop is required.
internal class MarkdownIntrinsicLayout : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        let size = context.MeasureChild(0, LayoutSize{Width: available.Width, Height: Double.PositiveInfinity})
        return LayoutSize{
            Width: Double.IsFinite(available.Width) ? available.Width: size.Width,
            Height: Math.Min(available.Height, size.Height)
        }
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
    }
}
