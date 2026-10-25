package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Layout
import System

/// Typed trigger completion for a TextEditor, such as @ mentions or / commands.
public data struct TriggerMenuInput {
    /// Content that contains Editor. Keys from Editor pass through it.
    var Content Blob?
    /// Handle of the mounted TextEditor in Content. The menu opens at its trigger.
    var Editor ElementHandle?
    /// Controller of Editor.
    var Controller TextEditorController?
    /// Nil uses @.
    var Triggers[]?string
    /// Opens only when the trigger starts its line.
    var AtLineStartOnly bool
    /// Characters to type after the trigger before the menu opens.
    var MinQueryLength int32
    /// Candidates for a trigger. The typed query ranks them with FuzzyMatch.
    var Items Func[string, []string]?
    /// Receives the trigger, the picked item and the typed range. Nil replaces the range with trigger, item and a space.
    var OnPick Action[string, string, TextRange]?
    /// Zero uses 240.
    var MaxHeight float64
}

/// Lists ranked items at a typed trigger in a non-focusing Popover. Editor keeps focus.
/// Up and Down move, Enter and Tab pick, Escape closes and keeps the typed text.
public open class TriggerMenu : Cell[TriggerMenuInput], IDisposable {
    private let listHandle ElementHandle = ElementHandle()
    private var current TriggerMenuInput
    private var document TextDocument?
    private var editor ElementHandle?
    private var trigger string = ""
    private var typed TextRange
    private var anchorRect ElementRect?
    private var matches[]FuzzyMatchItem[string] = []FuzzyMatchItem[string]{}
    private var active int32
    private var visible bool
    private var dismissed int32 = -1
    private var postedVersion int64 = -1
    private var rowHeight float64

    /// Releases document and editor subscriptions.
    public func Dispose() {
        if let previous = document {
            previous.Changed -= DocumentChanged
        }
        if let previous = editor {
            previous.MetricsChanged -= EditorMetrics
        }
        document = nil
        editor = nil
    }

    protected override func Build(input TriggerMenuInput) Blob {
        if input.Content == nil || input.Editor == nil || input.Controller == nil {
            throw ArgumentException("TriggerMenu requires Content, Editor and Controller")
        }
        if input.MinQueryLength < 0 || !Double.IsFinite(input.MaxHeight) || input.MaxHeight < 0.0 {
            throw ArgumentOutOfRangeException("input", "TriggerMenu MinQueryLength and MaxHeight must be finite and nonnegative")
        }
        let theme = Theme.Read()
        current = input
        Bind(input.Controller!!.Document, input.Editor!!)
        let previousTrigger = trigger
        let previousRange = typed
        let found = Detect()
        if trigger != previousTrigger || typed.Start != previousRange.Start {
            anchorRect = nil
        }
        if trigger != previousTrigger || typed != previousRange || active >= matches.Length {
            active = 0
        }
        if found {
            if editor!!.TryGetTextCaretRect(TextPosition{Offset: typed.Start}, TextCoordinateSpace.Element, out var rect) {
                anchorRect = rect
            } else if postedVersion != document!!.Version {
                postedVersion = document!!.Version
                Theme.Key.Window.TryPost(() -> Rebuild())
            }
        }
        visible = found && anchorRect != nil
        rowHeight = theme.ControlHeight
        let height = input.MaxHeight == 0.0 ? 240.0: input.MaxHeight
        let list = Container{
            Handle: listHandle,
            MaxHeight: height,
            OverflowY: Overflow.Scroll,
            ScrollbarY: theme.Scrollbar,
            Accessibility: Accessibility{Role: AccessibilityRole.List, SizeOfSet: matches.Length},
        }
        if visible {
            for index in 0 ... matches.Length {
                list.Children.Add(Row(index, theme))
            }
        }
        return Container{
            MinWidth: 0,
            OnKeyDown: KeyDown,
            OnPointerUp: (event PointerEvent) -> Rebuild(),
            OnFocus: (event FocusEvent) -> Rebuild(),
            OnBlur: (event FocusEvent) -> Rebuild(),
            input.Content!!,
            Cell.Mount[PopoverInput, Popover](
                "menu",
                PopoverInput{
                    Open: visible,
                    Anchor: editor,
                    AnchorRect: anchorRect,
                    TakeFocus: false,
                    DismissOnOutsideClick: false,
                    Content: list,
                    MaxHeight: height + 8.0,
                    Padding: 4.0,
                    AccessibilityName: theme.Text("Suggestions"),
                    OnDismiss: Dismiss,
                }
            ),
        }
    }

    private func Row(index int32, theme Theme) Container {
        let match = matches[index]
        return Container{
            Key: index.ToString(),
            Height: rowHeight,
            FlexShrink: 0,
            PaddingStart: theme.ControlPadding,
            PaddingEnd: theme.ControlPadding,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BorderRadius: theme.ControlRadius,
            BackgroundColor: index == active ? theme.AccentColor.WithAlpha(0.15): Color.Transparent,
            Color: theme.TextColor,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            OnPointerEnter: (event PointerEvent) -> {
                active = index
                Rebuild()
            },
            OnPointerDown: (event PointerEvent) -> {
                event.PreventDefault()
                Pick(index)
            },
            Accessibility: Accessibility{
                Role: AccessibilityRole.ListItem,
                Name: match.Item,
                Selected: index == active,
                Actions: []AccessibilityAction{AccessibilityAction.Select},
                OnAction: (request AccessibilityActionRequest) -> {
                    if request.Action != AccessibilityAction.Select {
                        return false
                    }
                    Pick(index)
                    return true
                }
            },
            FuzzyMatch.Label(match.Item, match.Match, theme),
        }
    }

    private func Detect() bool {
        matches = []FuzzyMatchItem[string]{}
        let controller = current.Controller!!
        let caret = controller.Selection.Active.Offset
        if !controller.IsFocused || controller.Composition != nil || controller.Selection.Anchor.Offset != caret {
            return false
        }
        let line = document!!.GetLineRange(document!!.GetLineIndex(caret))
        let text = document!!.GetText(TextRange{Start: line.Start, Length: caret - line.Start})
        var start = text.Length
        while start > 0 && !Char.IsWhiteSpace(text[start - 1]) {
            start--
        }
        let word = text.Substring(start)
        for value in current.Triggers ?? []string{"@"} {
            if value.Length == 0 || !word.StartsWith(value, StringComparison.Ordinal)
            || word.Length - value.Length < current.MinQueryLength
            || current.AtLineStartOnly && !String.IsNullOrWhiteSpace(text.Substring(0, start)) {
                continue
            }
            trigger = value
            typed = TextRange{Start: line.Start + start, Length: word.Length}
            if typed.Start == dismissed {
                return false
            }
            matches = FuzzyMatch.Rank[string](
                current.Items?.Invoke(value) ?? []string{},
                word.Substring(value.Length),
                (item string) -> item
            )
            return matches.Length > 0
        }
        dismissed = -1
        return false
    }

    private func KeyDown(event KeyEvent) {
        let modifiers = event.Modifiers
        if !visible || event.IsComposing || modifiers.Alt || modifiers.Ctrl || modifiers.Shift || modifiers.Super {
            return
        }
        if event.Key == Key.Down || event.Key == Key.Up {
            active = (active + (event.Key == Key.Down ? 1: matches.Length - 1)) % matches.Length
            Reveal()
        } else if event.Key == Key.Enter || event.Key == Key.KeypadEnter || event.Key == Key.Tab {
            Pick(active)
        } else {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
    }

    private func Reveal() {
        let top = float64(active) * rowHeight
        let offset = listHandle.ScrollOffset.Y
        let view = listHandle.ContentBox.Height
        if top < offset {
            listHandle.ScrollTo(0.0, top)
        } else if top + rowHeight > offset + view {
            listHandle.ScrollTo(0.0, top + rowHeight - view)
        }
    }

    private func Pick(index int32) {
        let item = matches[index].Item
        if let pick = current.OnPick {
            pick(trigger, item, typed)
        } else {
            let controller = current.Controller!!
            controller.Selection = TextSelection{
                Anchor: TextPosition{Offset: typed.Start},
                Active: TextPosition{Offset: typed.Start + typed.Length}
            }
            controller.Execute(TextCommand{Kind: TextCommandKind.Insert, Text: trigger + item + " "})
        }
        Rebuild()
    }

    private func Dismiss(reason PopoverDismissReason) {
        dismissed = typed.Start
        Rebuild()
    }

    private func Bind(next TextDocument, handle ElementHandle) {
        if document != next {
            if let previous = document {
                previous.Changed -= DocumentChanged
            }
            document = next
            next.Changed += DocumentChanged
        }
        if editor != handle {
            if let previous = editor {
                previous.MetricsChanged -= EditorMetrics
            }
            editor = handle
            handle.MetricsChanged += EditorMetrics
        }
    }

    private func DocumentChanged(change TextDocumentChange) {
        Rebuild()
    }

    private func EditorMetrics(metrics ElementMetrics) {
        if visible {
            Rebuild()
        }
    }
}
