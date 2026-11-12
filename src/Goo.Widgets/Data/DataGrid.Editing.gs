package Goo.Widgets.Data

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import Goo.Widgets.Layout
import System
import System.Collections.Generic

/// Placement of a cell's native editor.
public enum DataGridEditPresentation {
    /// Edits within the existing cell height.
    Inline;
    /// Edits in a nonmodal popup anchored to the cell.
    Popover
}

/// The reason an uncommitted cell edit was discarded.
public enum DataGridEditCancelReason {
    /// The user pressed Escape.
    Escape;
    /// The row, column or original raw value changed or disappeared.
    SourceChanged;
    /// The cell no longer permits editing.
    Unavailable
}

/// The final result of a closed cell edit.
public enum DataGridEditOutcome {
    /// Validation accepted the draft and the host setter ran.
    Commit;
    /// The draft was discarded without calling the setter.
    Cancel
}

/// One physical key chord. Modifiers must match exactly.
public data struct DataGridEditKey {
    /// Physical key, including keys used for ordinary navigation.
    var Key Key
    /// Required modifier state. The default requires no modifiers.
    var Modifiers KeyModifiers
}

/// A host-owned cell value and its current edit draft, identified by stable IDs.
public data struct DataGridEdit {
    /// Stable row ID, not its current display position.
    var RowId string
    /// Stable column ID, not its current display position.
    var ColumnId string
    /// Refreshed source-index hint. Never use this as identity.
    var SourceIndex int32
    /// Raw value captured when editing began.
    var OriginalValue string
    /// Current committed editor text, excluding IME preedit.
    var Draft string
}

/// Synchronous validation result for one commit attempt.
public data struct DataGridEditResult {
    /// Nil accepts. Nonempty text rejects and is announced. Empty text is invalid.
    var ErrorMessage string?
}

/// Draft binding and lifecycle actions supplied to a column's editor factory.
public data struct DataGridEditContext {
    /// Current session snapshot. Replaced when draft or source index changes.
    var Edit DataGridEdit
    /// Retained validation error. Nil means no rejected attempt.
    var ErrorMessage string?
    /// Required native editor handle. Preserve it in custom content.
    var EditorHandle ElementHandle
    /// Updates only the draft, never the host model. DataGrid always supplies this callback.
    var OnDraftChange Action[string]?
    /// Validates and commits on the same cell.
    var Commit Action
    /// Discards this session as an Escape cancellation.
    var Cancel Action
}

internal class DataGridEditSession {
    internal var Value DataGridEdit
    internal var Error string?
    internal let Editor ElementHandle = ElementHandle()
    internal let Anchor ElementHandle = ElementHandle()
    internal let ErrorHandle ElementHandle = ElementHandle()
    internal var FocusPending bool = true
    internal var Focused bool
    internal var Presentation DataGridEditPresentation
    internal var Multiline bool
    internal var RowHeight float64
    internal var Revision int64
    internal var Identity int64
    internal var Controller TextEditorController?
    internal var OnUnmount Action?
}

public open partial class DataGrid {
    private var editSession DataGridEditSession?
    private var editRevision int64
    private var editTransition bool
    private let cellHandles Dictionary[string, Dictionary[string, ElementHandle]] = Dictionary[string, Dictionary[string, ElementHandle]](StringComparer.Ordinal)

    private func CellHandle(rowId string, columnId string) ElementHandle {
        if !cellHandles.TryGetValue(rowId, out var handles) {
            handles = Dictionary[string, ElementHandle](StringComparer.Ordinal)
            cellHandles.Add(rowId, handles)
        }
        return Handle(handles, columnId)
    }

    private func CellValue(row DataGridRow, column DataGridColumn) string {
        if let get = input.GetCellValue { return get(row, column) }
        if let values = row.Values {
            if values.TryGetValue(column.Id!!, out var value) { return value }
        }
        return ""
    }

    private func CanEditCell(row DataGridRow, column DataGridColumn, checkFullWidth bool = true) bool ->
        !input.Disabled && !row.Disabled && !row.IsGroup && input.SetCellValue != nil &&
        (!checkFullWidth || input.CreateFullWidthRow?.Invoke(input, row) == nil) &&
        (input.CanEdit?.Invoke(row, column) ?? row.Editable ?? column.Editable)

    private func EditLocation(session DataGridEditSession, out row DataGridRow, out column DataGridColumn) bool {
        row = default(DataGridRow)
        column = default(DataGridColumn)
        let index = input.RowAt == nil ? RawIndex(session.Value.RowId): input.RowIndex!!(session.Value.RowId)
        let columnIndex = ColumnIndex(session.Value.ColumnId)
        if index < 0 || index >= RowCount || columnIndex < 0 { return false }
        row = input.RowAt == nil ? rows[index]: input.RowAt!!(index)
        if row.Id != session.Value.RowId { return false }
        indices[session.Value.RowId] = index
        column = columns[columnIndex]
        session.Value = session.Value with{SourceIndex = index}
        return true
    }

    private func SynchronizeEdit(rebuilding bool = false) {
        guard let session = editSession else { return }
        if editTransition { return }
        if !EditLocation(session, out var row, out var column) || CellValue(row, column) != session.Value.OriginalValue {
            CancelEdit(DataGridEditCancelReason.SourceChanged, session.Focused, !rebuilding)
        } else if !CanEditCell(row, column) {
            CancelEdit(DataGridEditCancelReason.Unavailable, session.Focused, !rebuilding)
        }
    }

    private func BeginEdit(rowId string, columnIndex int32, appended string = "") bool {
        if editSession != nil || editTransition || columnIndex < 0 || columnIndex >= columns.Length { return false }
        let index = input.RowAt == nil ? RawIndex(rowId): input.RowIndex!!(rowId)
        if index < 0 || index >= RowCount { return false }
        let row = input.RowAt == nil ? rows[index]: input.RowAt!!(index)
        if row.Id != rowId { return false }
        indices[rowId] = index
        let column = columns[columnIndex]
        if !CanEditCell(row, column) { return false }
        let original = CellValue(row, column)
        let value = DataGridEdit{RowId: rowId, ColumnId: column.Id!!, SourceIndex: index, OriginalValue: original, Draft: original + appended}
        editTransition = true
        var allowed bool
        try { allowed = InvokeInputCallback(input.OnEditBegin, value, true) }
        finally { editTransition = false }
        if !allowed { return false }
        editRevision++
        let session = DataGridEditSession(){
            Value = value,
            Presentation = input.GetEditPresentation?.Invoke(row, column) ?? column.EditPresentation,
            Multiline = column.Multiline,
            Revision = editRevision, Identity = editRevision
        }
        session.RowHeight = input.RowHeightProvider?.Invoke(row) ?? input.RowHeight!!
        if cellHandles.TryGetValue(rowId, out var handles) {
            for handle in handles.Values {
                if handle.IsMounted { session.RowHeight = Math.Max(session.RowHeight, handle.BorderBox.Height) }
            }
        }
        if !Enum.IsDefined(session.Presentation) { throw ArgumentOutOfRangeException("EditPresentation") }
        session.Editor.MetricsChanged += (metrics ElementMetrics) -> {
            if !metrics.IsMounted {
                if session != editSession {
                    session.Controller?.Dispose()
                    session.Controller = nil
                }
                let complete = session.OnUnmount
                session.OnUnmount = nil
                complete?.Invoke()
            }
            if session == editSession && session.FocusPending && metrics.IsMounted {
                session.Editor.Focus()
            }
        }
        editSession = session
        let activeChanged = activeId != rowId
        activeId = rowId
        SetActiveColumn(columnIndex, false)
        if activeChanged {
            InvokeInputCallback(input.OnActiveRowIndexChange, index)
            InvokeInputCallback(input.OnActiveRowChange, rowId)
        }
        Reveal()
        Rebuild()
        return true
    }

    private func CancelEdit(reason DataGridEditCancelReason, restore bool = true, rebuild bool = true) {
        guard let session = editSession else { return }
        if editTransition { return }
        editTransition = true
        try {
            if rebuild {
                InvokeInputCallback(input.OnEditCancel, session.Value, reason)
            } else {
                input.OnEditCancel?.Invoke(session.Value, reason)
            }
            CloseEdit(session, rebuild)
            if rebuild {
                InvokeInputCallback(input.OnEditEnd, session.Value, DataGridEditOutcome.Cancel)
            } else {
                input.OnEditEnd?.Invoke(session.Value, DataGridEditOutcome.Cancel)
            }
        } finally { editTransition = false }
        if restore { ReturnEditFocus(session, false, true) }
    }

    private func CommitEdit(restore bool = true, traversal int32 = 0) bool {
        guard let session = editSession else { return false }
        if editTransition { return false }
        SynchronizeEdit()
        if editSession != session { return false }
        editTransition = true
        try {
            let result = InvokeInputCallback(input.OnEditCommit, session.Value, DataGridEditResult{})
            if let error = result.ErrorMessage {
                if error.Length == 0 { throw ArgumentException("Edit ErrorMessage must be nil or nonempty") }
                session.Error = error
                editRevision++
                session.Revision = editRevision
                Rebuild()
                window?.Post(() -> {
                    if editSession == session && window?.IsFocused == true { session.Editor.Focus() }
                })
                return false
            }
            InvokeInputCallback(input.SetCellValue, session.Value)
            CloseEdit(session)
            InvokeInputCallback(input.OnEditEnd, session.Value, DataGridEditOutcome.Commit)
        } finally { editTransition = false }
        if traversal != 0 && MoveEdit(session.Value, traversal) { return true }
        if restore || traversal != 0 { ReturnEditFocus(session, traversal != 0, traversal >= 0) }
        return true
    }

    private func CloseEdit(session DataGridEditSession, rebuild bool = true) {
        editSession = nil
        if !session.Editor.IsMounted { session.Controller?.Dispose() }
        if rebuild { Rebuild() }
    }

    private func ReturnEditFocus(session DataGridEditSession, traverse bool, forward bool) {
        session.OnUnmount = () -> {
            window?.Post(() -> {
                if disposed || editSession != nil { return }
                Reveal()
                if rootHandle.Focus() && traverse { window!!.Focus.Move(forward) }
            })
        }
        if !session.Editor.IsMounted {
            let complete = session.OnUnmount
            session.OnUnmount = nil
            complete?.Invoke()
        }
    }

    private func MoveEdit(value DataGridEdit, direction int32) bool {
        var rowIndex = input.RowAt == nil ? RawIndex(value.RowId): input.RowIndex!!(value.RowId)
        var columnIndex = ColumnIndex(value.ColumnId) + direction
        while rowIndex >= 0 && rowIndex < RowCount {
            if columnIndex < 0 {
                rowIndex--
                columnIndex = columns.Length - 1
            }
            if columnIndex >= columns.Length {
                rowIndex++
                columnIndex = 0
            }
            if rowIndex < 0 || rowIndex >= RowCount || columns.Length == 0 { return false }
            let row = Row(rowIndex)
            if CanEditCell(row, columns[columnIndex]) && BeginEdit(row.Id!!, columnIndex) { return true }
            columnIndex += direction
        }
        return false
    }

    private func IsBeginEditKey(e KeyEvent) bool {
        if let keys = input.BeginEditKeys {
            for chord in keys { if chord.Key == e.Key && chord.Modifiers == e.Modifiers { return true } }
            return false
        }
        return e.Modifiers == KeyModifiers{} &&
            (e.Key == Key.Enter || e.Key == Key.Space && input.Selection != DataGridSelection.Multiple)
    }

    private func EditKeyDown(e KeyEvent) {
        e.StopPropagation()
        if e.IsComposing || (window?.Focus.Editor?.CompositionStart ?? -1) >= 0 { return }
        let commit = input.CommitEditKey ?? DataGridEditKey{Key: Key.Enter}
        if e.Key == Key.Escape || e.Key == Key.Tab || e.Key == commit.Key && e.Modifiers == commit.Modifiers {
            e.PreventDefault()
            if e.Repeat { return }
            if e.Key == Key.Escape { CancelEdit(DataGridEditCancelReason.Escape) }
            else if e.Key == Key.Tab {
                if e.Modifiers.Ctrl || e.Modifiers.Super {
                    let session = editSession
                    if CommitEdit(false) && session != nil { ReturnEditFocus(session, true, !e.Modifiers.Shift) }
                } else { CommitEdit(false, e.Modifiers.Shift ? -1: 1) }
            } else { CommitEdit() }
        }
    }

    private func EditBlur(session DataGridEditSession) {
        session.Focused = false
        window?.Post(() -> {
            if editSession == session && !session.Focused && !editTransition { CommitEdit(false) }
        })
    }

    private func ConfigureEditor(editor Blob, session DataGridEditSession, name string) {
        editor.Handle = session.Editor
        editor.OnKeyDown = EditKeyDown
        editor.OnFocus = (e FocusEvent) -> {
            if session.FocusPending {
                session.FocusPending = false
                window!!.Focus.SetSelection(session.Value.Draft.Length, session.Value.Draft.Length)
            }
        }
        editor.Accessibility = Accessibility{
            Role: AccessibilityRole.TextInput,
            Name: name,
            Multiline: session.Multiline,
            Invalid: session.Error != nil,
            Relationships: AccessibilityRelationships{
                DescribedBy: session.Error != nil ? []ElementHandle{session.ErrorHandle}: []ElementHandle{},
                ErrorMessage: session.Error != nil ? []ElementHandle{session.ErrorHandle}: []ElementHandle{}
            }
        }
    }

    private func BuildEditor(session DataGridEditSession, column DataGridColumn, height float64) Blob {
        let name = theme.Text("Edit {0}", column.Label ?? column.Id!!)
        let change Action[string] = (value string) -> {
            if editSession == session && !editTransition { session.Value = session.Value with{Draft = value} }
        }
        var editor Blob
        if session.Multiline {
            session.Controller ??= TextEditorController(TextDocument(session.Value.Draft))
            var prepared TextEditor?
            editor = Cell.Mount[TextAreaInput, TextArea]("cell-editor", TextAreaInput{
                Controller: session.Controller,
                Width: Percent(100), Height: height, MinHeight: 0, MinimumRows: 1,
                AccessibilityName: name, Invalid: session.Error != nil, OnChange: change,
                CreateEditor: (input TextAreaInput, value TextEditor) -> {
                    if session.Presentation == DataGridEditPresentation.Inline {
                        value.Padding = Edges{Left: theme.ControlPadding, Right: theme.ControlPadding}
                    }
                    prepared = value
                    return value
                },
                CreateRoot: (input TextAreaInput, root Container) -> {
                    ConfigureEditor(prepared!!, session, name)
                    return root
                }
            })
        } else {
            editor = TextField{
                Value: session.Value.Draft, Width: Percent(100), EntryHeight: height,
                AccessibilityName: name, Invalid: session.Error != nil, OnChange: change,
                CreateRoot: (input TextField, label Text?, value TextEntry, error Text?) -> {
                    ConfigureEditor(value, session, name)
                    return Container{Width: Percent(100), MinWidth: 0, value}
                }
            }.Build()
        }
        if let create = column.CreateEditor {
            editor = create(column, DataGridEditContext{
                Edit: session.Value, ErrorMessage: session.Error, EditorHandle: session.Editor,
                OnDraftChange: change,
                Commit: () -> {
                    if editSession != session { return }
                    CommitEdit()
                },
                Cancel: () -> {
                    if editSession == session { CancelEdit(DataGridEditCancelReason.Escape) }
                }
            }, editor)
        }
        return Container{
            Width: Percent(100), MinWidth: 0, MinHeight: 0,
            OnKeyDown: EditKeyDown,
            OnFocus: (e FocusEvent) -> {
                session.Focused = true
                e.StopPropagation()
            },
            OnBlur: (e FocusEvent) -> {
                EditBlur(session)
                e.StopPropagation()
            },
            editor
        }
    }

    private func EditError(session DataGridEditSession) Blob -> Container{
        Key: "edit-error", MaxHeight: theme.ControlHeight * 2.0, FlexShrink: 0, OverflowY: Overflow.Scroll,
        Text{
            Handle: session.ErrorHandle, Content: session.Error!!, TextWrap: TextWrap.Wrap,
            Color: theme.DangerColor, FontSize: theme.CaptionFontSize,
            Accessibility: Accessibility{Role: AccessibilityRole.Alert, Name: session.Error!!, Live: AccessibilityLive.Polite}
        }
    }

    private func BuildEditPopover(session DataGridEditSession) Blob {
        let index = ColumnIndex(session.Value.ColumnId)
        let editor = BuildEditor(session, columns[index], session.Multiline ? theme.ControlHeight * 4.0: theme.ControlHeight)
        let content = Container{
            Width: Percent(100), MinWidth: 0, FlexDirection: FlexDirection.Column, Gap: theme.ControlGap,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Group, Name: theme.Text("Cell editor"), Modal: false,
                Relationships: AccessibilityRelationships{LabelledBy: []ElementHandle{session.Anchor}}
            },
            editor
        }
        if session.Error != nil { content.Children.Add(EditError(session)) }
        return Cell.Mount[PopoverInput, Popover]("grid-editor:" + session.Identity.ToString(), PopoverInput{
            Open: true, Anchor: session.Anchor, Content: content, InitialFocus: session.Editor, DismissOnOutsideClick: false,
            Width: 280.0, AccessibilityName: theme.Text("Cell editor popup"),
            OnDismiss: (reason PopoverDismissReason) -> {
                if reason == PopoverDismissReason.Escape { CancelEdit(DataGridEditCancelReason.Escape) }
                else if reason == PopoverDismissReason.AnchorRemoved { CancelEdit(DataGridEditCancelReason.Unavailable) }
                else { CommitEdit(false) }
                return
            },
        })
    }
}
