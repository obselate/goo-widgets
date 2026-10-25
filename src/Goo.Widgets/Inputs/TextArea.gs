package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System

/// Controlled multiline field values, presentation, and optional external editor ownership.
public data struct TextAreaInput {
    /// Controlled string. Nil preserves an external controller's document; an owned document starts empty.
    var Value string?
    /// Optional external controller, fixed for the mounted identity and never disposed by the widget.
    var Controller TextEditorController?
    /// Optional external presentation layers for the same document. Their ownership stays with the caller.
    var Layers[]?TextPresentationLayer
    /// Optional horizontal scrollbar descriptor. Nil uses the theme scrollbar.
    var ScrollbarX Scrollbar?
    /// Optional vertical scrollbar descriptor. Nil uses the theme scrollbar.
    var ScrollbarY Scrollbar?
    /// Receives user/document changes, excluding synchronization from Value.
    var OnChange Action[string]?
    /// Enter submits when enabled. Shift+Enter still inserts a line.
    var SubmitOnEnter bool
    var OnSubmit Action[string]?
    var OnCancel Action?
    /// Optional soft character limit. Text is retained above the limit.
    var MaxLength int32?
    var CounterText string?
    /// Maximum visible rows for automatic growth. Zero keeps a fixed height.
    var MaximumRows int32
    /// Empty-document hint.
    var Placeholder string?
    /// Optional visible label.
    var Label string?
    /// Optional validation text.
    var IssueText string?
    /// Marks the field invalid.
    var Invalid bool
    /// Prevents editing while preserving selection and copy.
    var ReadOnly bool
    /// Prevents all field input.
    var Disabled bool
    /// Nil enables long-press selection and touch editing controls.
    var TouchEditing bool?
    /// Wrapping mode; NoWrap enables horizontal scrolling by default.
    var Wrap TextWrap
    /// Root width. Nil resolves to 280.
    var Width Length?
    /// Optional editor height; otherwise uses the minimum row height.
    var Height Length?
    /// Minimum text rows. Zero resolves to three rows.
    var MinimumRows int32
    /// Optional minimum editor height in logical pixels.
    var MinimumHeight float64?
    /// Font size. Nil uses the nearest theme font size.
    var FontSize float64?
    /// Optional font family.
    var FontFamily string?
    /// Accessible editor name. Nil falls back to label, then placeholder.
    var AccessibilityName string?
    /// Editor background. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Editor foreground. Nil uses the nearest theme.
    var TextColor Color?
    /// Invalid border and issue color. Nil uses the nearest theme.
    var InvalidColor Color?
    /// Focus border color. Nil uses the nearest theme.
    var FocusColor Color?
    /// Base editor style, applied before the field's required layout and behavior.
    var EditorStyle Style?
    /// Base root style.
    var RootStyle Style?
    /// Customizes the prepared editor. It must retain the supplied controller; field behavior is reapplied.
    var CreateEditor Func[TextAreaInput, TextEditor, TextEditor]?
    /// Customizes root appearance; label, editor, and issue children are reapplied.
    var CreateRoot Func[TextAreaInput, Container, Container]?
}

/// A mounted controlled TextEditor field that disposes only its default controller.
public open class TextArea : Cell[TextAreaInput], IDisposable {
    private var controller TextEditorController?
    private var external TextEditorController?
    private var ownsController bool
    private var syncing bool
    private var disposed bool
    private var input TextAreaInput
    private let labelHandle ElementHandle = ElementHandle()
    private let issueHandle ElementHandle = ElementHandle()
    /// Current UTF-16 character count.
    public prop Count int32 {
        get -> controller?.Document.Length ?? 0
    }

    /// Releases the owned controller once. External controllers and layers remain caller-owned.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        if ownsController {
            controller?.Dispose()
        }
    }

    protected override func Build(value TextAreaInput) Blob {
        if disposed {
            throw ObjectDisposedException("TextArea")
        }
        let theme = Theme.Read()
        let rows = value.MinimumRows == 0 ? 3: value.MinimumRows
        let font = value.FontSize ?? theme.FontSize
        let minimum = value.MinimumHeight ?? (float64(rows) * font * theme.LineHeight + theme.ControlPadding * 2.0)
        if rows < 1 || !Double.IsFinite(font) || font <= 0.0 || !Double.IsFinite(minimum) || minimum < 0.0 {
            throw ArgumentOutOfRangeException("MinimumRows/FontSize/MinimumHeight")
        }
        if value.MaximumRows < 0 || (value.MaximumRows > 0 && value.MaximumRows < rows) || value.MaxLength < 0 {
            throw ArgumentOutOfRangeException("MaximumRows/MaxLength")
        }
        let defaultWidth Length = 280.0
        let defaultHeight Length = minimum
        input = value with{
            MinimumRows = rows,
            MinimumHeight = minimum,
            FontSize = font,
            FontFamily = value.FontFamily ?? theme.FontFamily,
            Width = value.Width ?? defaultWidth,
            Placeholder = value.Placeholder ?? "",
            AccessibilityName = value.AccessibilityName ?? value.Label ?? value.Placeholder ?? "",
            BackgroundColor = value.BackgroundColor ?? theme.FieldColor,
            TextColor = value.TextColor ?? theme.TextColor,
            InvalidColor = value.InvalidColor ?? theme.DangerColor,
            FocusColor = value.FocusColor ?? theme.AccentColor
        }
        if controller == nil {
            external = value.Controller
            ownsController = external == nil
            controller = external ?? TextEditorController(TextDocument(value.Value ?? ""))
        } else if value.Controller != external {
            throw ArgumentException("Controller cannot change within one mounted TextArea identity")
        }
        let editorController = controller!!
        if let next = value.Value {
            Synchronize(next)
        }
        let overLimit = value.MaxLength != nil && Count > value.MaxLength!!
        let invalid = value.Invalid || overLimit
        var editor = TextEditor(editorController, value.Layers ?? []TextPresentationLayer{}){
            Width = Percent(100),
            Height = value.Height ?? defaultHeight,
            MinHeight = minimum,
            Padding = theme.ControlPadding,
            FontSize = font,
            FontWeight = theme.FontWeight,
            BackgroundColor = input.BackgroundColor!!,
            FontFamily = input.FontFamily!!,
            Color = input.TextColor!!,
            CaretColor = input.TextColor!!,
            SelectionColor = theme.AccentColor.WithAlpha(0.35),
            PlaceholderColor = theme.PlaceholderColor,
            Cursor = Cursor.Text,
            BorderWidth = theme.BorderWidth,
            BorderColor = invalid ? input.InvalidColor!!: theme.InputBorderColor,
            BorderRadius = theme.ControlRadius,
            Focus = Style{OutlineWidth: 2.0, OutlineColor: input.FocusColor!!, OutlineOffset: -2.0},
            DisabledStyle = Style{BackgroundColor: theme.PanelColor, Color: theme.FaintTextColor},
            TransitionMs = theme.TransitionMs,
            LineHeight = theme.LineHeight,
            ScrollbarX = value.ScrollbarX ?? theme.Scrollbar,
            ScrollbarY = value.ScrollbarY ?? theme.Scrollbar,
            BasedOn = value.EditorStyle,
            KeyBindings = []KeyBinding{
                KeyBinding{Key: Key.Enter, Action: () -> Enter()},
                KeyBinding{Key: Key.KeypadEnter, Action: () -> Enter()},
                KeyBinding{Key: Key.Escape, Action: () -> Cancel()},
            },
        }
        if let create = input.CreateEditor {
            editor = create(input, editor)
        }
        if editor.Controller != editorController {
            throw ArgumentException("CreateEditor must preserve the TextArea controller")
        }
        editor.Key = "editor"
        editor.ReadOnly = input.ReadOnly
        editor.Disabled = input.Disabled
        editor.Focusable = !input.Disabled
        editor.TextWrap = input.Wrap
        editor.OverflowX = input.Wrap == TextWrap.NoWrap ? Overflow.Scroll: Overflow.Hidden
        editor.OverflowY = Overflow.Scroll
        editor.Placeholder = input.Placeholder!!
        editor.OnChange = Changed
        editor.Accessibility = Accessibility{
            Role: AccessibilityRole.TextEditor,
            Name: input.AccessibilityName!!,
            Invalid: invalid,
            Relationships: AccessibilityRelationships{
                LabelledBy: input.Label != nil ? []ElementHandle{labelHandle}: []ElementHandle{},
                DescribedBy: input.IssueText != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
                ErrorMessage: input.Invalid && input.IssueText != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
            },
        }
        var root = Container{
            LineHeight: theme.LineHeight,
            Width: input.Width!!,
            MinWidth: 0,
            Gap: theme.ControlGap,
            FlexDirection: FlexDirection.Column,
            FontFamily: input.FontFamily!!,
            BasedOn: input.RootStyle,
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.FlexDirection = FlexDirection.Column
        root.Children.Clear()
        if let label = input.Label {
            root.Children.Add(
                Text{
                    Key: "label",
                    Handle: labelHandle,
                    Content: label,
                    Color: theme.MutedTextColor,
                    FontSize: theme.LabelFontSize,
                    FontWeight: theme.LabelFontWeight
                }
            )
        }
        if input.MaximumRows > 0 && input.Height == nil {
            editor.Height = Length.Auto
            editor.MinHeight = 0
            root.Children.Add(
                Container{
                    Width: Percent(100),
                    MinWidth: 0,
                    FlexShrink: 0,
                    Layout: TextAreaGrowth(
                        rows,
                        input.MaximumRows,
                        editorController.Document.LineCount,
                        theme.ControlPadding * 2.0 + theme.BorderWidth * 2.0,
                        minimum
                    ),
                    editor
                }
            )
        } else {
            root.Children.Add(editor)
        }
        if input.MaxLength != nil || input.CounterText != nil {
            let counter = input.CounterText ?? Count.ToString() + " / " + input.MaxLength!!.ToString()
            root.Children.Add(
                Text{
                    Key: "counter",
                    Content: counter,
                    Color: overLimit ? input.InvalidColor!!: theme.MutedTextColor,
                    FontSize: theme.CaptionFontSize,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Text,
                        Name: counter,
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        if let issue = input.IssueText {
            root.Children.Add(
                Text{
                    Key: "issue",
                    Handle: issueHandle,
                    Content: issue,
                    Color: input.InvalidColor!!,
                    FontSize: theme.CaptionFontSize,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Alert,
                        Name: issue,
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        return Cell.Mount[TouchTextEditingInput, TouchTextEditing](
            root.Key,
            TouchTextEditingInput{Content: root, Editor: editor, Enabled: input.TouchEditing}
        )
    }

    private func Changed(change TextDocumentChange) {
        if !syncing && !disposed {
            input.OnChange?.Invoke(controller!!.Document.GetText())
            Rebuild()
        }
    }

    private func Enter() {
        if input.Disabled || input.ReadOnly || controller!!.Composition != nil {
            return
        }
        if input.SubmitOnEnter {
            input.OnSubmit?.Invoke(controller!!.Document.GetText())
        } else {
            controller!!.Execute(TextCommand{Kind: TextCommandKind.Insert, Text: "\n"})
        }
    }

    private func Cancel() {
        if input.Disabled {
            return
        }
        if controller!!.Composition != nil {
            controller!!.Execute(TextCommand{Kind: TextCommandKind.CancelComposition})
        } else {
            input.OnCancel?.Invoke()
        }
    }

    private func Synchronize(next string) {
        let owned = controller!!
        let before = owned.Document.GetText()
        if before == next {
            return
        }
        let selection = owned.Selection
        var prefix int32
        while prefix < before.Length && prefix < next.Length && before[prefix] == next[prefix] {
            prefix++
        }
        if prefix > 0 && prefix < before.Length && Char.IsLowSurrogate(before[prefix]) {
            prefix--
        }
        var suffix int32
        while suffix < before.Length - prefix &&
            suffix < next.Length - prefix &&
            before[before.Length - suffix - 1] == next[next.Length - suffix - 1] {
            suffix++
        }
        if suffix > 0 && Char.IsLowSurrogate(before[before.Length - suffix]) {
            suffix--
        }
        syncing = true
        try {
            owned.Document.Apply(
                TextChange{
                    Range: TextRange{Start: prefix, Length: before.Length - prefix - suffix},
                    InsertedText: next.Substring(prefix, next.Length - prefix - suffix)
                }
            )
            let anchor = Math.Min(selection.Anchor.Offset, next.Length)
            let active = Math.Min(selection.Active.Offset, next.Length)
            try {
                owned.Selection = TextSelection{
                    Anchor: TextPosition{Offset: anchor, Affinity: selection.Anchor.Affinity},
                    Active: TextPosition{Offset: active, Affinity: selection.Active.Affinity}
                }
            } catch (error ArgumentException) {
                // The controller's rebased selection already snaps positions that ceased to be grapheme boundaries.

            }
        } finally {
            syncing = false
        }
    }
}

internal class TextAreaGrowth(
    MinimumRows int32,
    MaximumRows int32,
    Lines int32,
    Chrome float64,
    Minimum float64
) : LayoutAlgorithm {
    public func Measure(context LayoutContext, available LayoutSize) LayoutSize {
        let unwrapped = context.MeasureChild(
            0,
            LayoutSize{Width: Double.PositiveInfinity, Height: Double.PositiveInfinity}
        )
        let pitch = Math.Max(0, unwrapped.Height - Chrome) / float64(Lines)
        let minimum = Math.Max(Minimum, float64(MinimumRows) * pitch + Chrome)
        let maximum = Math.Max(minimum, float64(MaximumRows) * pitch + Chrome)
        let size = context.MeasureChild(0, LayoutSize{Width: available.Width, Height: Double.PositiveInfinity})
        return LayoutSize{
            Width: Double.IsFinite(available.Width) ? available.Width: size.Width,
            Height: Math.Min(available.Height, Math.Clamp(size.Height, minimum, maximum))
        }
    }

    public func Arrange(context LayoutContext, finalSize LayoutSize) {
        context.ArrangeChild(0, ElementRect{Width: finalSize.Width, Height: finalSize.Height})
    }
}
