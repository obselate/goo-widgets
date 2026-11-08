package Goo.Widgets.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Icons
import System
import System.Collections.Generic

/// Selectable code with host-supplied syntax styles and controlled folding.
public data struct CodeBlockInput {
    /// Code displayed in the read-only editor. Nil uses an empty document.
    var Code string?
    /// Language label shown in the header. Nil omits it. Highlighting remains host-provided.
    var Language string?
    /// Window used for native clipboard copy. OnCopy can supply host clipboard behavior instead.
    var Window Window?
    /// Receives the full code string when Copy is activated. Nil uses the supplied Window clipboard.
    var OnCopy Action[string]?
    /// Displays one-based line numbers beside the code.
    var ShowLineNumbers bool
    /// Wraps long lines instead of scrolling them horizontally.
    var Wrap bool
    /// Zero shows all lines. Expanded overrides this limit.
    var CollapsedLines int32
    /// Shows all lines despite CollapsedLines.
    var Expanded bool
    /// Receives the requested expanded state when the fold action is activated. Nil ignores the request.
    var OnExpandedChange Action[bool]?
    /// Action content shown with the item. Nil leaves this slot empty.
    var Actions Blob?
    /// Styles the owned presentation layer with the current theme palette. The layer is cleared first.
    /// Runs again only when Code, Language, the theme syntax palette or the delegate instance changes.
    /// Pass a new delegate when the result depends on other state. A new lambda on every build highlights on every build.
    /// Hosts must not change state in this callback.
    var Highlight Action[TextPresentationLayer, SyntaxPalette]?
    /// Precomputed styles for Code. They can be built on any thread. When set, Highlight is not called.
    /// Applied again only when Code, Language, the theme syntax palette or this list reference changes.
    var StyleSpans IReadOnlyList[TextStyleSpan]?
    /// Maximum height of the code area. Nil shows all lines. Taller code scrolls and lays out only the visible lines.
    var MaxHeight Length?
    /// Root layout width. Nil fills the available width.
    var Width Length?
    /// Code font family. Nil uses monospace.
    var FontFamily string?
    /// Receives the input and prepared header, and returns the displayed header. Nil keeps the default header.
    /// Hosts must not change state in this callback.
    var CreateHeader Func[CodeBlockInput, Container, Blob]?
    /// Receives the input and prepared editor, and returns its replacement. Preserve the supplied controller. Read-only state and syntax layers are reapplied. Nil keeps the default editor.
    /// Hosts must not change state in this callback.
    var CreateEditor Func[CodeBlockInput, TextEditor, TextEditor]?
}

/// Owns one read-only core editor and one syntax presentation layer.
public open class CodeBlock : Cell[CodeBlockInput], IDisposable {
    private var controller TextEditorController?
    private var probe TextEditorController?
    private var layer TextPresentationLayer?
    private var layout CodeBlockLayout?
    private var disposed bool
    private var source string?
    private var language string?
    private var palette SyntaxPalette
    private var highlight Action[TextPresentationLayer, SyntaxPalette]?
    private var styleSpans IReadOnlyList[TextStyleSpan]?

    /// Releases the owned editors and syntax layer once.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        layer?.Dispose()
        controller?.Dispose()
        probe?.Dispose()
    }

    protected override func Build(input CodeBlockInput) Blob {
        if disposed {
            throw ObjectDisposedException("CodeBlock")
        }
        if input.CollapsedLines < 0 {
            throw ArgumentOutOfRangeException("CollapsedLines")
        }
        if input.MaxHeight != nil && input.MaxHeight!!.HasMagnitude && input.MaxHeight!!.Magnitude < 0 {
            throw ArgumentOutOfRangeException("MaxHeight")
        }
        let theme = Theme.Read()
        let code = input.Code ?? ""
        let edited = source != code
        if controller == nil {
            controller = TextEditorController(TextDocument(code))
            layer = TextPresentationLayer(controller!!.Document)
        } else if edited {
            controller!!.Document.Apply(
                TextChange{Range: TextRange(0, controller!!.Document.Length), InsertedText: code}
            )
        }
        source = code
        if edited || language != input.Language || palette != theme.Syntax || !Object.ReferenceEquals(
            highlight,
            input.Highlight
        ) ||
            !Object
            .ReferenceEquals(styleSpans, input.StyleSpans) {
            layer!!.Clear()
            if let spans = input.StyleSpans {
                layer!!.ReplaceStyles(spans)
            } else {
                input.Highlight?.Invoke(layer!!, theme.Syntax)
            }
            language = input.Language
            palette = theme.Syntax
            highlight = input.Highlight
            styleSpans = input.StyleSpans
        }
        let lines = controller!!.Document.LineCount
        let folded = input.CollapsedLines > 0 && lines > input.CollapsedLines
        let collapsed = folded && !input.Expanded
        let scrolls = input.MaxHeight != nil && !collapsed
        let shortest = float64(lines) * theme.FontSize * theme.PlatformTextScaleFactor * theme.LineHeight
        let next = CodeBlockLayout(collapsed, shortest + theme.ControlPadding * 2.0, scrolls ? input.MaxHeight: nil)
        if edited || layout != next {
            layout = next
        }
        if collapsed {
            let end = controller!!.Document.GetLineRange(input.CollapsedLines - 1)
            let preview = code.Substring(0, end.Start + end.Length)
            probe ??= TextEditorController(TextDocument(preview))
            if probe!!.Document.GetText() != preview {
                probe!!.Document.Apply(TextChange{Range: TextRange(0, probe!!.Document.Length), InsertedText: preview})
            }
        }
        let header = Container{
            Padding: Edges{
                Top: theme.ControlGap / 2.0,
                Bottom: theme.ControlGap / 2.0,
                Left: theme.ControlPadding,
                Right: theme.ControlGap / 2.0
            },
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            Text{Content: input.Language ?? theme.Text("Code"), Color: theme.MutedTextColor, FlexGrow: 1},
            IconButton{
                Icon: ControlIcons.Create(ControlIcon.ContentCopy, 16, theme.MutedTextColor),
                AccessibilityName: theme.Text("Copy code"),
                Disabled: input.Window == nil && input.OnCopy == nil,
                OnClick: () -> {
                    if let copy = input.OnCopy {
                        InvokeInputCallback(copy, code)
                    } else {
                        input.Window!!.SetClipboardText(code)
                    }
                },
            }.Build(),
        }
        if let actions = input.Actions {
            header.Children.Add(actions)
        }
        var editor = TextEditor(controller!!, []TextPresentationLayer{layer!!}){
            Width = Percent(100),
            Height = Percent(100),
            MinWidth = 0,
            FlexShrink = 0,
            Padding = theme.ControlPadding,
            FontFamily = input.FontFamily ?? "monospace",
            FontSize = theme.FontSize,
            LineHeight = theme.LineHeight,
            Color = theme.TextColor,
            BackgroundColor = theme.SunkenColor,
            ReadOnly = true,
            ShowLineNumbers = input.ShowLineNumbers,
            LineNumberColor = theme.SubtleTextColor,
            CaretColor = Color.Transparent,
            SelectionColor = theme.AccentColor.WithAlpha(.35),
            TextWrap = input.Wrap ? TextWrap.Wrap: TextWrap.NoWrap,
            OverflowX = input.Wrap ? Overflow.Hidden: Overflow.Scroll,
            OverflowY = scrolls ? Overflow.Scroll: Overflow.Hidden,
            ScrollbarX = theme.Scrollbar,
            ScrollbarY = theme.Scrollbar,
            Accessibility = Accessibility{
                Role: AccessibilityRole.TextEditor,
                Name: input.Language ?? theme.Text("Code"),
                Multiline: true
            },
        }
        if let create = input.CreateEditor {
            editor = create(input, editor)
        }
        if editor.Controller != controller {
            throw ArgumentException("CreateEditor must preserve the CodeBlock controller")
        }
        editor.ReadOnly = true
        editor.Layers = []TextPresentationLayer{layer!!}
        let body = Container{Width: Percent(100), MinWidth: 0, FlexShrink: 0, Layout: layout, editor}
        if collapsed {
            body.Children.Add(
                TextEditor(probe!!){
                    Width = Percent(100),
                    Padding = theme.ControlPadding,
                    FontFamily = input.FontFamily ?? "monospace",
                    FontSize = theme.FontSize,
                    LineHeight = theme.LineHeight,
                    ShowLineNumbers = input.ShowLineNumbers,
                    TextWrap = input.Wrap ? TextWrap.Wrap: TextWrap.NoWrap,
                    ReadOnly = true,
                    Focusable = false,
                    Visibility = Visibility.Hidden,
                    Accessibility = Accessibility{Hidden: true},
                }
            )
        }
        let root = Container{
            Width: input.Width ?? Percent(100),
            MinWidth: 0,
            FlexShrink: 0,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.ControlRadius!!,
            Overflow: Overflow.Hidden,
            input.CreateHeader?.Invoke(input, header) ?? header,
            body,
        }
        if folded {
            let label = input.Expanded ? theme.Text("Show less"): theme.Text("Show all {0} lines", lines)
            let fold = Button{
                Width: Percent(100),
                Height: theme.ControlHeight,
                FlexShrink: 0,
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
                Gap: theme.ControlGap / 2.0,
                BackgroundColor: Color.Transparent,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                Focus: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
                Cursor: Cursor.Pointer,
                Disabled: input.OnExpandedChange == nil,
                OnClick: () -> InvokeInputCallback(input.OnExpandedChange, !input.Expanded),
                Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: label, Expanded: input.Expanded},
                ControlIcons.Create(input.Expanded ? ControlIcon.ExpandLess: ControlIcon.ExpandMore, 16, theme.MutedTextColor),
                Text{Content: label, Color: theme.MutedTextColor},
            }
            theme.ApplyInteraction(fold, InteractionFamily.Button)
            WidgetKeyBindings.BindActivation(fold)
            root.Children.Add(fold)
        }
        return root
    }
}

internal data class CodeBlockLayout(Folded bool, Shortest float64, Limit Length?) : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        let limit = Limit == nil || !Limit!!.HasMagnitude ? available.Height:
            Math.Min(Limit!!.IsPercent ? available.Height * Limit!!.Magnitude / 100.0: Limit!!.Magnitude, available.Height)
        let overflows = !Folded && Shortest > limit
        let size = context.MeasureChild(
            Folded ? 1: 0,
            LayoutSize{Width: available.Width, Height: overflows ? limit: Double.PositiveInfinity}
        )
        return LayoutSize{
            Width: Double.IsFinite(available.Width) ? available.Width: size.Width,
            Height: Math.Min(limit, size.Height)
        }
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
        if Folded {
            context.ArrangeChild(1, ElementRect{})
        }
    }
}
