package Goo.Widgets.Inputs

import Goo
import Goo.Gestures
import Goo.Widgets
import System
import System.Collections.Generic

/// Composes touch editing around a text control and its content.
public data struct TouchTextEditingInput {
    /// Content containing the editor. Its declaration stays unchanged.
    var Content Container
    /// Handle authored on the TextEntry or TextEditor inside Content before hand-off.
    var Editor ElementHandle
    /// Styles the gesture wrapper that replaces Content as the parent layout child.
    var RootStyle Style?
    internal var ConfigureRoot Action[Container]?
    /// Nil enables touch editing.
    var Enabled bool?
}

/// Adds long-press selection, endpoint handles and an edit toolbar to a text field.
public open partial class TouchTextEditing : Cell[TouchTextEditingInput], IDisposable {
    private let viewportHandle ElementHandle = ElementHandle()
    private let toolbarHandle ElementHandle = ElementHandle()
    private var viewport ElementRect
    private let hold LongPressGesture
    private let defaultGestures []GestureRecognizer
    private var handle ElementHandle?
    private var window Window?
    private var current TouchTextEditingInput
    private var theme Theme
    private var focused bool
    private var visible bool
    private var disposed bool
    private var moving bool
    private var movingAnchor bool
    private var pressSelection TextSelection?
    private var pointerId int64 = -1
    private var focusId int64
    private var dragPoint Point
    private var autoScroll WindowTimer?
    private var overlayCell TouchTextEditingOverlay?
    private var dragOffset Point
    private var pressedCommand TextCommandKind?
    private var pressedPointer int64 = -1
    private let commandHandles Dictionary[TextCommandKind, ElementHandle] =
        Dictionary[TextCommandKind, ElementHandle]()

    /// Creates a mounted touch-editing composition.
    public init() {
        hold = LongPressGesture(Press)
        defaultGestures = []GestureRecognizer{hold}
        viewportHandle.MetricsChanged += ChromeMetrics
        toolbarHandle.MetricsChanged += ChromeMetrics
    }

    /// Releases subscriptions and ends handle movement.
    public func Dispose() {
        if disposed { return }
        disposed = true
        StopMovement()
        if let previous = handle { previous.MetricsChanged -= Metrics }
        viewportHandle.MetricsChanged -= ChromeMetrics
        toolbarHandle.MetricsChanged -= ChromeMetrics
        BindWindow(nil)
    }

    protected override func Build(input TouchTextEditingInput) Blob {
        let content = input.Content
        if content == nil || input.Editor == nil {
            throw ArgumentException("TouchTextEditing requires Content and an editor handle")
        }
        theme = Theme.Read()
        let owner = Theme.Key.Window
        BindWindow(owner)
        viewport = viewportHandle.IsMounted ? viewportHandle.BorderBox : ElementRect{
            Width: owner.Size.Width,
            Height: owner.Size.Height,
        }
        let next = input.Editor
        if handle != next {
            if let previous = handle { previous.MetricsChanged -= Metrics }
            handle = next
            next.MetricsChanged += Metrics
        }
        current = input
        overlayCell?.Rebuild()
        let root = Container{BasedOn: input.RootStyle, HitTestSelf: false, content}
        input.ConfigureRoot?.Invoke(root)
        if input.Enabled != false {
            if let custom = root.Gestures {
                let gestures = [custom.Count + 1]GestureRecognizer
                for index in 0 ... custom.Count { gestures[index] = custom[index] }
                gestures[custom.Count] = hold
                root.Gestures = gestures
            } else { root.Gestures = defaultGestures }
        }
        let priorFocus = root.OnFocus
        let priorBlur = root.OnBlur
        let priorPointerUp = root.OnPointerUp
        root.OnFocus = (event FocusEvent) -> {
            focused = true
            priorFocus?.Invoke(event)
        }
        root.OnBlur = (event FocusEvent) -> {
            focused = false
            Hide()
            priorBlur?.Invoke(event)
        }
        root.OnPointerUp = (event PointerEvent) -> {
            if current.Enabled != false && event.Device == PointerDevice.Touch && !moving && focused {
                focusId = window?.Focus.Editor?.FocusId ?? 0L
                visible = true
                overlayCell?.Rebuild()
            }
            priorPointerUp?.Invoke(event)
        }
        root.Children.Add(Cell.Mount[TouchTextEditing, TouchTextEditingOverlay]("touch-editing", this))
        return root
    }

    internal func BuildOverlay(child TouchTextEditingOverlay) Blob {
        overlayCell = child
        let overlay = Portal{Handle: viewportHandle,
            Width: Percent(100), Height: Percent(100), ZIndex: 40}
        if current.Enabled == false {
            visible = false
            StopMovement()
            return overlay
        }
        if visible && focused && handle!!.IsMounted {
            guard let editor = window?.Focus.Editor, let selection = window?.Focus.Selection else {
                return overlay
            }
            focusId = editor.FocusId
            if moving { overlay.Add(Magnifier()) }
            if selection.Anchor.Offset != selection.Active.Offset || (moving && movingAnchor) {
                AddHandle(overlay, selection.Anchor, true)
            }
            AddHandle(overlay, selection.Active, false)
            if !moving { overlay.Add(Toolbar(editor)) }
        }
        return overlay
    }

    private func BindWindow(next Window?) {
        if window == next { return }
        if let previous = window {
            previous.Focus.EditorChanged -= EditorChanged
            previous.FocusChanged -= WindowFocus
        }
        window = next
        if let next = next {
            next.Focus.EditorChanged += EditorChanged
            next.FocusChanged += WindowFocus
        }
    }

    private func Press(event PressGestureEvent) {
        if disposed || current.Enabled == false || !handle!!.IsMounted || !focused { return }
        guard let window = window else { return }
        if event.Phase == GesturePhase.Started {
            guard let editor = window.Focus.Editor else { return }
            focusId = editor.FocusId
            if handle!!.TryGetTextPositionAt(event.WindowPosition, TextCoordinateSpace.Window, out var position) {
                if !window.Focus.Execute(TextCommand{Kind: TextCommandKind.SelectWord, Position: position})
                    || !ValidEditor() { return }
                pressSelection = window.Focus.Selection
                visible = true
                moving = true
                movingAnchor = false
                dragOffset = Point{}
                dragPoint = event.WindowPosition
                autoScroll = window.Every(16.0, AutoScroll)
            }
        } else if event.Phase == GesturePhase.Changed && moving {
            MoveSelection(event.WindowPosition, false)
        } else if event.Phase == GesturePhase.Canceled {
            Hide()
        } else if event.Phase == GesturePhase.Completed {
            StopMovement()
        }
        overlayCell?.Rebuild()
    }

    private func AddHandle(overlay Portal, position TextPosition, anchor bool) {
        if !handle!!.TryGetTextCaretRect(position, TextCoordinateSpace.Window, out var caret) { return }
        let x = Math.Clamp(caret.X - 20.0, viewport.X, Math.Max(viewport.X, viewport.X + viewport.Width - 40.0))
        let y = Math.Clamp(caret.Y + caret.Height - 6.0, viewport.Y,
            Math.Max(viewport.Y, viewport.Y + viewport.Height - 40.0))
        overlay.Add(Container{
            Key: anchor ? "anchor" : "active", Position: PositionType.Absolute,
            Left: x, Top: y, Width: 40, Height: 40, HitTestSelf: true,
            AlignItems: AlignItems.Center, JustifyContent: JustifyContent.Center,
            OnPointerDown: (event PointerEvent) -> BeginHandle(event, anchor),
            OnPointerMove: (event PointerEvent) -> MoveHandle(event),
            OnPointerUp: (event PointerEvent) -> EndHandle(event),
            OnPointerCancel: (event PointerEvent) -> {
                EndHandle(event)
                Hide()
            },
            Accessibility: Accessibility{
                Role: AccessibilityRole.Slider, Name: theme.Text(anchor ? "Selection start" : "Selection end"),
                Actions: []AccessibilityAction{AccessibilityAction.Increment, AccessibilityAction.Decrement},
                OnAction: (request AccessibilityActionRequest) -> AdjustEndpoint(request, anchor),
            },
            Container{Width: 18, Height: 24, BorderRadius: 9, BackgroundColor: theme.AccentColor,
                HitTestSelf: false, Accessibility: Accessibility{Hidden: true}},
        })
    }

    private func BeginHandle(event PointerEvent, anchor bool) {
        if event.Button != PointerButton.Primary || !ValidEditor() { return }
        pointerId = event.PointerId
        movingAnchor = anchor
        moving = true
        pressSelection = nil
        dragPoint = event.WindowPosition
        dragOffset = Point{}
        if let selection = window!!.Focus.Selection {
            let position = anchor ? selection.Anchor : selection.Active
            if handle!!.TryGetTextCaretRect(position, TextCoordinateSpace.Window, out var caret) {
                dragOffset = Point{X: caret.X - event.WindowPosition.X,
                    Y: caret.Y + caret.Height * 0.5 - event.WindowPosition.Y}
            }
        }
        event.Capture()
        event.PreventDefault()
        event.StopPropagation()
        autoScroll?.Dispose()
        autoScroll = window!!.Every(16.0, AutoScroll)
        overlayCell?.Rebuild()
    }

    private func MoveHandle(event PointerEvent) {
        if !moving || event.PointerId != pointerId { return }
        MoveSelection(Point{X: event.WindowPosition.X + dragOffset.X,
            Y: event.WindowPosition.Y + dragOffset.Y}, movingAnchor)
        event.PreventDefault()
        event.StopPropagation()
    }

    private func EndHandle(event PointerEvent) {
        if event.PointerId != pointerId { return }
        event.ReleaseCapture()
        event.PreventDefault()
        event.StopPropagation()
        StopMovement()
        overlayCell?.Rebuild()
    }

    private func MoveSelection(point Point, anchor bool) {
        dragPoint = point
        if !ValidEditor() { Hide()
            return }
        guard let selection = window!!.Focus.Selection else { return }
        if handle!!.TryGetTextPositionAt(point, TextCoordinateSpace.Window, out var position) {
            var next = TextSelection{
                Anchor: anchor ? position : selection.Anchor,
                Active: anchor ? selection.Active : position,
            }
            if let original = pressSelection {
                next = if position.Offset < original.Anchor.Offset {
                    TextSelection{Anchor: original.Active, Active: position}
                } else if position.Offset > original.Active.Offset {
                    TextSelection{Anchor: original.Anchor, Active: position}
                } else { original }
            }
            window!!.Focus.SetSelection(next)
        }
        overlayCell?.Rebuild()
    }

    private func AutoScroll() {
        if !moving || !ValidEditor() { StopMovement()
            return }
        let box = handle!!.ContentBox
        let x = dragPoint.X < box.X ? -8.0 : dragPoint.X > box.X + box.Width ? 8.0 : 0.0
        let y = dragPoint.Y < box.Y ? -8.0 : dragPoint.Y > box.Y + box.Height ? 8.0 : 0.0
        if x == 0.0 && y == 0.0 { return }
        let before = handle!!.ScrollOffset
        if handle!!.JumpTo(Math.Max(0.0, before.X + x), Math.Max(0.0, before.Y + y)) {
            MoveSelection(dragPoint, movingAnchor)
        }
    }

    private func Toolbar(editor FocusedEditorSnapshot) Container {
        let box = editor.CaretArea
        let width = Math.Min(280.0, viewport.Width)
        let measuredHeight = toolbarHandle.BorderBox.Height
        let height = measuredHeight > 0.0 ? measuredHeight : Math.Min(180.0, viewport.Height)
        let preferredTop = box.Y >= viewport.Y + height + 8.0 ? box.Y - height - 8.0 : box.Y + box.Height + 28.0
        let toolbar = Container{
            Key: "toolbar", Handle: toolbarHandle, Position: PositionType.Absolute,
            Left: Math.Clamp(box.X, viewport.X, Math.Max(viewport.X, viewport.X + viewport.Width - width)),
            Top: Math.Clamp(preferredTop, viewport.Y, Math.Max(viewport.Y, viewport.Y + viewport.Height - height)),
            Width: width, FlexDirection: FlexDirection.Row, FlexWrap: FlexWrap.Wrap,
            Padding: 4, Gap: 2, BackgroundColor: theme.PanelColor, BorderRadius: 6,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: theme.Text("Edit text")},
        }
        let selected = editor.SelectionStart != editor.SelectionEnd
        if selected && !editor.IsPassword {
            if !editor.IsReadOnly { toolbar.Children.Add(Command("Cut", TextCommandKind.Cut)) }
            toolbar.Children.Add(Command("Copy", TextCommandKind.Copy))
        }
        if !editor.IsReadOnly { toolbar.Children.Add(Command("Paste", TextCommandKind.Paste)) }
        toolbar.Children.Add(Command("Select all", TextCommandKind.SelectAll))
        return toolbar
    }

    private func Command(label string, kind TextCommandKind) Button {
        if !commandHandles.ContainsKey(kind) { commandHandles.Add(kind, ElementHandle()) }
        let buttonHandle = commandHandles[kind]
        let activate = () -> {
            if ValidEditor() { window!!.Focus.Execute(TextCommand{Kind: kind}) }
            overlayCell?.Rebuild()
        }
        return Button{
            Key: label,
            Handle: buttonHandle,
            MinWidth: 48, Height: 40, Padding: Edges{Left: 8, Right: 8}, Focusable: false,
            OnPointerDown: (event PointerEvent) -> {
                if event.Button == PointerButton.Primary {
                    pressedCommand = kind
                    pressedPointer = event.PointerId
                    event.Capture()
                    event.PreventDefault()
                }
            },
            OnPointerUp: (event PointerEvent) -> {
                event.ReleaseCapture()
                event.PreventDefault()
                let box = buttonHandle.BorderBox
                let inside = event.WindowPosition.X >= box.X && event.WindowPosition.X <= box.X + box.Width
                    && event.WindowPosition.Y >= box.Y && event.WindowPosition.Y <= box.Y + box.Height
                let activatePressed = pressedCommand == kind && pressedPointer == event.PointerId && inside
                pressedCommand = nil
                pressedPointer = -1
                if activatePressed {
                    activate()
                }
            },
            OnPointerCancel: (event PointerEvent) -> { pressedCommand = nil
                pressedPointer = -1 },
            OnClick: activate,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: theme.Text(label)},
            Text{Content: theme.Text(label), Color: theme.TextColor, FontSize: theme.FontSize},
        }
    }

    private func AdjustEndpoint(request AccessibilityActionRequest, anchor bool) bool {
        if !ValidEditor() { return false }
        if request.Action != AccessibilityAction.Increment && request.Action != AccessibilityAction.Decrement {
            return false
        }
        let input = window!!.Focus
        guard let selection = input.Selection else { return false }
        if anchor {
            input.SetSelection(TextSelection{Anchor: selection.Active, Active: selection.Anchor})
            if !ValidEditor() { return false }
        }
        let moved = input.Execute(TextCommand{
            Kind: request.Action == AccessibilityAction.Increment ? TextCommandKind.MoveRight : TextCommandKind.MoveLeft,
            ExtendSelection: true,
        })
        if anchor {
            if !ValidEditor() { return false }
            if let updated = input.Selection { input.SetSelection(TextSelection{
                Anchor: updated.Active, Active: selection.Active,
            }) }
        }
        overlayCell?.Rebuild()
        return moved
    }

    private func ValidEditor() bool -> !disposed && focused && handle!!.IsMounted
        && window?.Focus.Editor?.FocusId == focusId

    private func EditorChanged(editor FocusedEditorSnapshot?) {
        if !visible { return }
        if editor?.FocusId != focusId || !focused { Hide()
            return }
        overlayCell?.Rebuild()
    }

    private func Metrics(metrics ElementMetrics) {
        if !metrics.IsMounted { Hide() }
        if visible { overlayCell?.Rebuild() }
    }

    private func ChromeMetrics(metrics ElementMetrics) {
        if viewportHandle.IsMounted { viewport = viewportHandle.BorderBox }
        if !disposed && metrics.IsMounted && handle?.IsMounted != true {
            throw InvalidOperationException("TouchTextEditing.Editor must be mounted inside Content")
        }
        if visible && metrics.IsMounted { overlayCell?.Rebuild() }
    }

    private func WindowFocus(value bool) {
        if !value { Hide() }
    }

    private func StopMovement() {
        autoScroll?.Dispose()
        autoScroll = nil
        pointerId = -1
        moving = false
        pressSelection = nil
    }

    private func Hide() {
        let shown = visible
        visible = false
        StopMovement()
        if shown && !disposed { overlayCell?.Rebuild() }
    }
}

internal class TouchTextEditingOverlay : Cell[TouchTextEditing] {
    protected override func Build(input TouchTextEditing) Blob -> input.BuildOverlay(this)
}
