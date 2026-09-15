package Goo.Widgets.Inputs

import Goo
import System

/// Controlled multiline field values, presentation, and optional external editor ownership.
public data struct TextAreaInput {
    /// Controlled string. Nil preserves an external controller's document; an owned document starts empty.
    var Value string?
    /// Optional external controller, fixed for the mounted identity and never disposed by the widget.
    var Controller TextEditorController?
    /// Optional external presentation layers for the same document. Their ownership stays with the caller.
    var Layers[]?TextPresentationLayer
    /// Receives user/document changes, excluding synchronization from Value.
    var OnChange Action[string]?
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
    /// Font size. Nil resolves to 14.
    var FontSize float64?
    /// Optional font family.
    var FontFamily string?
    /// Accessible editor name. Nil falls back to label, then placeholder.
    var AccessibilityName string?
    /// Editor background. Nil resolves to #09090b.
    var BackgroundColor Color?
    /// Editor foreground. Nil resolves to #fafafa.
    var TextColor Color?
    /// Invalid border and issue color. Nil resolves to #ef4444.
    var InvalidColor Color?
    /// Focus border color. Nil resolves to #d4d4d8.
    var FocusColor Color?
    /// Enables a visible focus border.
    var ShowFocusHighlight bool
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
        let rows = value.MinimumRows == 0 ? 3: value.MinimumRows
        let font = value.FontSize ?? 14.0
        let minimum = value.MinimumHeight ?? (float64(rows) * font * 1.4 + 24.0)
        if rows < 1 || !Double.IsFinite(font) || font <= 0.0 || !Double.IsFinite(minimum) || minimum < 0.0 {
            throw ArgumentOutOfRangeException("MinimumRows/FontSize/MinimumHeight")
        }
        let defaultWidth Length = 280.0
        let defaultHeight Length = minimum
        input = value with{
            MinimumRows = rows,
            MinimumHeight = minimum,
            FontSize = font,
            Width = value.Width ?? defaultWidth,
            Placeholder = value.Placeholder ?? "",
            AccessibilityName = value.AccessibilityName ?? value.Label ?? value.Placeholder ?? "",
            BackgroundColor = value.BackgroundColor ?? Color.Parse("#09090b"),
            TextColor = value.TextColor ?? Color.Parse("#fafafa"),
            InvalidColor = value.InvalidColor ?? Color.Parse("#ef4444"),
            FocusColor = value.FocusColor ?? Color.Parse("#d4d4d8")
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
        var editor = TextEditor(editorController, value.Layers ?? []TextPresentationLayer{}){
            BasedOn = value.EditorStyle,
            Width = Length.Percent(100),
            Height = value.Height ?? defaultHeight,
            MinHeight = minimum,
            Padding = 12,
            FontSize = font,
            BackgroundColor = input.BackgroundColor!!,
            Color = input.TextColor!!,
            BorderWidth = 1,
            BorderColor = value.Invalid ? input.InvalidColor!!: Color.Parse("#3f3f46"),
            BorderRadius = 6,
            Focus = value.ShowFocusHighlight ? Style{BorderColor: input.FocusColor!!}: Style{},
            DisabledStyle = Style{BackgroundColor: "#18181b", Color: "#71717a"},
        }
        if let family = input.FontFamily {
            editor.FontFamily = family
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
            Invalid: input.Invalid,
            Relationships: AccessibilityRelationships{
                LabelledBy: input.Label != nil ? []ElementHandle{labelHandle}: []ElementHandle{},
                DescribedBy: input.IssueText != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
                ErrorMessage: input.Invalid && input.IssueText != nil ? []ElementHandle{issueHandle}: []ElementHandle{},
            },
        }
        var root = Container{
            BasedOn: input.RootStyle,
            Width: input.Width!!,
            MinWidth: 0,
            Gap: 6,
            FlexDirection: FlexDirection.Column
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.FlexDirection = FlexDirection.Column
        if let family = input.FontFamily {
            root.FontFamily = family
        }
        root.Children.Clear()
        if let label = input.Label {
            root.Children.Add(
                Text{Key: "label", Handle: labelHandle, Content: label, Color: "#a1a1aa", FontSize: 11, FontWeight: 600}
            )
        }
        root.Children.Add(editor)
        if let issue = input.IssueText {
            root.Children.Add(
                Text{
                    Key: "issue",
                    Handle: issueHandle,
                    Content: issue,
                    Color: input.InvalidColor!!,
                    FontSize: 12,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Alert,
                        Name: issue,
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        return root
    }

    private func Changed(change TextDocumentChange) {
        if !syncing && !disposed {
            input.OnChange?.Invoke(controller!!.Document.GetText())
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
