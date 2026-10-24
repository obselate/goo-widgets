package Goo.Widgets.Content

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import System

/// Selectable code with host-supplied syntax styles and controlled folding.
public data struct CodeBlockInput {
    var Code string?
    var Language string?
    /// Window used for native clipboard copy. OnCopy can supply host clipboard behavior instead.
    var Window Window?
    var OnCopy Action[string]?
    var ShowLineNumbers bool
    var Wrap bool
    /// Zero shows all lines. Expanded overrides this limit.
    var CollapsedLines int32
    var Expanded bool
    var OnExpandedChange Action[bool]?
    var Actions Blob?
    /// Called after styles are cleared, with the owned presentation layer and current theme palette.
    var Highlight Action[TextPresentationLayer, SyntaxPalette]?
    var Width Length?
    var FontFamily string?
    var CreateHeader Func[CodeBlockInput, Container, Blob]?
    var CreateEditor Func[CodeBlockInput, TextEditor, TextEditor]?
}

/// Owns one read-only core editor and one syntax presentation layer.
public class CodeBlock : Cell[CodeBlockInput], IDisposable {
    private var controller TextEditorController?
    private var layer TextPresentationLayer?
    private var disposed bool
    private var source string?

    /// Releases the owned editor and syntax layer once.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        layer?.Dispose()
        controller?.Dispose()
    }

    protected override func Build(input CodeBlockInput) Blob {
        if disposed {
            throw ObjectDisposedException("CodeBlock")
        }
        if input.CollapsedLines < 0 {
            throw ArgumentOutOfRangeException("CollapsedLines")
        }
        let theme = Theme.Read()
        let code = input.Code ?? ""
        if controller == nil {
            controller = TextEditorController(TextDocument(code))
            layer = TextPresentationLayer(controller!!.Document)
        } else if source != code {
            controller!!.Document.Apply(
                TextChange{Range: TextRange(0, controller!!.Document.Length), InsertedText: code}
            )
        }
        source = code
        layer!!.Clear()
        input.Highlight?.Invoke(layer!!, theme.Syntax)
        let lines = controller!!.Document.LineCount
        let folded = input.CollapsedLines > 0 && lines > input.CollapsedLines
        let header = Container{
            Padding: theme.ControlPadding,
            FlexDirection: FlexDirection.Row,
            FlexWrap: FlexWrap.Wrap,
            AlignItems: AlignItems.Center,
            Gap: theme.ControlGap,
            Text{Content: input.Language ?? "Code", Color: theme.MutedTextColor, FlexGrow: 1},
            ActionButton{
                Content: "Copy",
                AccessibilityName: "Copy code",
                Disabled: input.Window == nil && input.OnCopy == nil,
                OnClick: () -> {
                    if let copy = input.OnCopy {
                        copy(code)
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
            Height = Length.Auto,
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
            OverflowY = Overflow.Hidden,
            ScrollbarX = theme.Scrollbar,
            Accessibility = Accessibility{
                Role: AccessibilityRole.TextEditor,
                Name: input.Language ?? "Code",
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
        let root = Container{
            Width: input.Width ?? Percent(100),
            MinWidth: 0,
            FlexShrink: 0,
            BorderWidth: theme.BorderWidth,
            BorderColor: theme.BorderColor,
            BorderRadius: theme.ControlRadius,
            Overflow: Overflow.Hidden,
            input.CreateHeader?.Invoke(input, header) ?? header,
            Container{
                Width: Percent(100),
                MinWidth: 0,
                FlexShrink: 0,
                Layout: CodeBlockLayout(
                    folded && !input.Expanded ? input.CollapsedLines: 0,
                    lines,
                    theme.ControlPadding * 2.0
                ),
                editor
            },
        }
        if folded {
            root.Children.Add(
                ActionButton{
                    Content: input.Expanded ? "Show less": "Show all " + lines.ToString() + " lines",
                    Pressed: input.Expanded,
                    Disabled: input.OnExpandedChange == nil,
                    OnClick: () -> input.OnExpandedChange?.Invoke(!input.Expanded),
                }.Build()
            )
        }
        return root
    }
}

internal class CodeBlockLayout(Rows int32, Lines int32, Chrome float64) : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        var maximum = Double.PositiveInfinity
        if Rows > 0 {
            let unwrapped = context.MeasureChild(
                0,
                LayoutSize{Width: Double.PositiveInfinity, Height: Double.PositiveInfinity}
            )
            maximum = float64(Rows) * Math.Max(0, unwrapped.Height - Chrome) / float64(Lines) + Chrome
        }
        let size = context.MeasureChild(0, LayoutSize{Width: available.Width, Height: Double.PositiveInfinity})
        return LayoutSize{
            Width: Double.IsFinite(available.Width) ? available.Width: size.Width,
            Height: Math.Min(available.Height, Math.Min(maximum, size.Height))
        }
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
    }
}
