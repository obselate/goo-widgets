package Goo.Widgets.Markdown

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

internal data struct MarkdownLeafInput {
    var Model MarkdownModel?
    var Options MarkdownViewInput
    var Size float64
    var Weight float64
    var Alignment TextAlign
    var Stamp MarkdownLeafStamp?
    var Theme Theme
}

/// A leaf starts from a fresh document and mount key, preserving attached controllers and avoiding accumulated undo history.
internal class MarkdownTextView : Cell[MarkdownLeafInput], IDisposable {
    private var controller TextEditorController?
    private var layer TextPresentationLayer?
    private var current MarkdownLeafInput
    private let handle ElementHandle = ElementHandle()
    private var width float64
    private var disposed bool
    private var presentationTheme Theme
    public init() {
        handle.MetricsChanged += Metrics
    }

    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        handle.MetricsChanged -= Metrics
        if let owned = controller {
            current.Stamp!!.Selection = owned.Selection
        }
        layer?.Dispose()
        controller?.Dispose()
    }

    protected override func InputChanged(input MarkdownLeafInput) {
        let theme = input.Theme
        current = input
        presentationTheme = theme
        if controller == nil {
            let document = TextDocument(input.Model!!.Block.Text ?? "")
            controller = TextEditorController(document)
            controller!!.Selection = input.Stamp!!.Selection
            layer = TextPresentationLayer(document)
        }
        UpdatePresentation(theme)
    }

    private func UpdatePresentation(theme Theme) {
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
                Color: options.Color!!,
                LineHeight: 0.0
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
            if let content = Inline(run, style, theme) {
                if run.Kind == MarkdownInlineKind.Image {
                    layer!!.SetBlockSlot(key, textRange, content)
                } else {
                    layer!!.SetInlineSlot(key, textRange, content)
                }
            }
            index++
        }
    }

    protected override func Build(input MarkdownLeafInput) Blob {
        let theme = Theme.Read()
        let model = input.Model!!
        let options = input.Options
        var editor = TextEditor(){
            Controller = controller!!,
            Layers = []TextPresentationLayer{layer!!},
            LineHeight = theme.LineHeight,
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
            Width = Percent(100),
            TextWrap = model.Block.Kind == MarkdownBlockKind.Code ? TextWrap.NoWrap: TextWrap.Wrap,
            OverflowX = model.Block.Kind == MarkdownBlockKind.Code ? Overflow.Scroll: Overflow.Hidden,
            OverflowY = Overflow.Hidden,
            ScrollbarX = model.Block.Kind == MarkdownBlockKind.Code ? theme.Scrollbar: nil,
        }
        options.ConfigureEditor?.Invoke(model.Block, editor)
        editor.Controller = controller!!
        editor.ReadOnly = true
        if options.ConfigureEditor != nil {
            let layers = editor.Layers
            if Array.IndexOf(layers, layer!!) < 0 {
                let combined = [layers.Length + 1]TextPresentationLayer
                Array.Copy(layers, combined, layers.Length)
                combined[layers.Length] = layer!!
                editor.Layers = combined
            }
        }
        editor.OnChange = nil
        editor.Height = Length.Auto
        editor.FlexShrink = 0.0
        let editorAccessibility = if let configured = editor.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        editorAccessibility.Role = AccessibilityRole.TextEditor
        editorAccessibility.Name = model.Block.Text ?? ""
        editorAccessibility.Multiline = true
        editor.Accessibility = editorAccessibility
        return Container{
            Handle: handle,
            Layout: MarkdownIntrinsicLayout(),
            Width: Percent(100),
            MinWidth: 0.0,
            FlexShrink: 0.0,
            editor
        }
    }

    private func CaptionRanges(spans IReadOnlyList[MarkdownInline])[]TextStyleRange {
        let ranges = [spans.Count]TextStyleRange
        for index in 0 ... spans.Count {
            let span = spans[index]
            let style = Style{}
            if span.Bold {
                style.FontWeight = 700.0
            }
            if span.Italic {
                style.FontStyle = FontStyle.Italic
            }
            if span.Strikethrough {
                style.TextDecoration = TextDecoration.Underline | TextDecoration.LineThrough
            }
            if span.Kind == MarkdownInlineKind.Code {
                style.FontFamily = current.Options.CodeFontFamily!!
            }
            ranges[index] = TextStyleRange(TextRange(span.Start, span.Length), style)
        }
        return ranges
    }

    private func Inline(run MarkdownInline, style Style, theme Theme) Blob? {
        if run.Kind == MarkdownInlineKind.Text {
            return nil
        }
        let options = current.Options
        let text = Text{BasedOn: style, LineHeight: theme.LineHeight, Content: run.Text ?? "", TextWrap: TextWrap.Wrap, MinWidth: 0.0}
        if run.Kind == MarkdownInlineKind.Link {
            if let captions = current.Model!!.Captions {
                if captions.TryGetValue(run.Start, out var spans) {
                    text.StyleRanges = CaptionRanges(spans)
                }
            }
        }
        var content Blob = text
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
                FocusStyle: theme.FocusStyle,
                HoverStyle: Style{BackgroundColor: Color.Transparent},
                ActiveStyle: Style{BackgroundColor: Color.Transparent},
                content
            }
            button.Focusable = options.OnLink != nil
            if options.OnLink == nil {
                button.OnClick = nil
            }
            if width > 0.0 {
                button.MaxWidth = width
            }
            WidgetKeyBindings.BindActivation(button)
        return button
        }
        if run.Kind == MarkdownInlineKind.Code {
            root.Padding = Edges{Left: theme.Spacing * .75, Right: theme.Spacing * .75}
            root.BackgroundColor = options.CodeBackground!!
            root.BorderRadius = theme.ControlRadius!! / 2.0
        } else {
            let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
            rootAccessibility.Role = AccessibilityRole.Image
            rootAccessibility.Name = run.Text ?? ""
            rootAccessibility.Description = run.Title ?? ""
            root.Accessibility = rootAccessibility
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
            UpdatePresentation(presentationTheme)
            Rebuild()
        }
    }
}

/// Measures wrapped lines through the editor with unbounded height.
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
