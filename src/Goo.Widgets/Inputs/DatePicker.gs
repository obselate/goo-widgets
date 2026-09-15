package Goo.Widgets.Inputs

import Goo
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import System
import System.Globalization

/// Controlled civil-date input; typing is a draft until Enter or blur commits it.
public data struct DatePickerInput {
    var Value DateOnly?
    var OnChange Action[DateOnly?]?
    var Disabled bool
    /// Nil defaults to true. Empty input commits nil; false treats empty input as invalid.
    var AllowEmpty bool?
    var Minimum DateOnly?
    var Maximum DateOnly?
    var IsDateDisabled Func[DateOnly, bool]?
    var Culture CultureInfo?
    var FirstDayOfWeek DayOfWeek?
    var Today DateOnly?
    var Format Func[DateOnly, string]?
    /// Nil result means invalid nonempty input; empty input follows AllowEmpty.
    var Parse Func[string, DateOnly?]?
    /// Invalid submissions retain the draft and committed value, and call this hook.
    var OnInvalid Action[string]?
    var InvalidMessage string?
    var Placeholder string?
    var AccessibilityName string?
    var OverlayHost ElementHandle?
    var Open bool?
    var OnOpenChange Action[bool]?
    var Width float64
    var PopupWidth float64
    var ZIndex int32
    var CreateInput Func[DatePickerInput, TextEntry, TextEntry]?
    var CreateButton Func[DatePickerInput, Button, Button]?
    var CreateCalendar Func[DatePickerInput, CalendarInput, CalendarInput]?
    var CreatePopup Func[DatePickerInput, Container, Container]?
    var CreateRoot Func[DatePickerInput, Container, Container]?
}

/// Composes an editable date field, Calendar, and the shared anchored Popover lifecycle.
public open class DatePicker : Cell[DatePickerInput], IDisposable {
    private var current DatePickerInput
    private let rootHandle ElementHandle = ElementHandle()
    private let entryHandle ElementHandle = ElementHandle()
    private let fieldHandle ElementHandle = ElementHandle()
    private let calendarHandle ElementHandle = ElementHandle()
    private let issueHandle ElementHandle = ElementHandle()
    private var overlay ElementHandle?
    private var overlayBox ElementRect
    private var rootBox ElementRect
    private var draft string = ""
    private var lastValue DateOnly?
    private var initialized bool
    private var dirty bool
    private var invalid bool
    private var ownedOpen bool
    private var disposed bool

    public init() {
        rootHandle.MetricsChanged += RootMetrics
    }

    /// Releases field and overlay geometry subscriptions.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        rootHandle.MetricsChanged -= RootMetrics
        BindOverlay(nil)
    }

    protected override func Build(input DatePickerInput) Blob {
        current = input with{
            AllowEmpty = input.AllowEmpty ?? true,
            Culture = input.Culture ?? CultureInfo.CurrentCulture,
            Width = input.Width == 0.0 ? 280.0: input.Width,
            PopupWidth = input.PopupWidth == 0.0 ? 300.0: input.PopupWidth,
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex,
            AccessibilityName = input.AccessibilityName ?? "Date",
            Placeholder = input.Placeholder ?? "Choose a date"
        }
        if !Double.IsFinite(current.Width) || current.Width <= 40.0 || !Double.IsFinite(current.PopupWidth) ||
            current.PopupWidth <= 40.0 {
            throw ArgumentOutOfRangeException("DatePicker dimensions")
        }
        if input.Minimum != nil && input.Maximum != nil && input.Minimum!!> input.Maximum!! {
            throw ArgumentException("DatePicker minimum must not exceed maximum")
        }
        if !(current.Culture!!.DateTimeFormat.Calendar is GregorianCalendar) {
            throw ArgumentException("DatePicker requires a culture using the Gregorian calendar")
        }
        if !initialized || input.Value != lastValue {
            draft = Display(input.Value)
            dirty = false
            invalid = input.Value != nil && !Allowed(input.Value!!)
            initialized = true
        } else if !dirty {
            draft = Display(input.Value)
            invalid = input.Value != nil && !Allowed(input.Value!!)
        }
        lastValue = input.Value
        BindOverlay(input.OverlayHost)
        let requestedOpen = !input.Disabled && (input.Open ?? ownedOpen)
        if requestedOpen && overlay == nil {
            throw InvalidOperationException("An open DatePicker requires an OverlayHost")
        }
        let isOpen = requestedOpen && (overlay?.IsMounted ?? false)
        var entry = TextEntry{
            Height: 38.0,
            MinWidth: 0.0,
            PaddingLeft: 10.0,
            PaddingRight: 6.0,
            FlexGrow: 1.0,
            FlexBasis: 0.0,
            BackgroundColor: Color.Transparent,
            Color: "#fafafa"
        }
        if let create = current.CreateInput {
            entry = create(current, entry)
        }
        entry.Key = "entry"
        entry.Handle = entryHandle
        entry.Value = draft
        entry.Controlled = true
        entry.Placeholder = current.Placeholder!!
        entry.Disabled = current.Disabled
        entry.Focusable = !current.Disabled
        entry.OnChange = Edited
        entry.OnSubmit = (value string) -> Submit()
        entry.OnBlur = (event FocusEvent) -> {
            if !(current.Open ?? ownedOpen) {
                Submit()
            }
        }
        entry.OnKeyDown = InputKey
        entry.Accessibility = Accessibility{
            Role: AccessibilityRole.TextInput,
            Name: current.AccessibilityName!!,
            Invalid: invalid,
            Required: !current.AllowEmpty!!,
            Relationships: AccessibilityRelationships{
                Controls: []ElementHandle{calendarHandle},
                ErrorMessage: invalid ? []ElementHandle{issueHandle}: []ElementHandle{}
            }
        }
        var button = Button{Width: 36.0, Height: 38.0, Padding: 8.0, BackgroundColor: Color.Transparent}
        if let create = current.CreateButton {
            button = create(current, button)
        }
        button.Key = "open"
        button.Disabled = current.Disabled
        button.Focusable = !current.Disabled
        button.OnClick = () -> SetOpen(!isOpen)
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.Button,
            Name: current.AccessibilityName!!+ " calendar",
            HasPopup: true,
            Expanded: isOpen,
            Relationships: AccessibilityRelationships{Controls: []ElementHandle{calendarHandle}}
        }
        button.Children.Clear()
        button.Children.Add(MaterialIcons.Create("calendar_month", 18.0, Color.Parse("#a5b4fc")))
        let field = Container{
            Key: "field",
            Handle: fieldHandle,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: "#18181b",
            BorderColor: invalid ? Color.Parse("#f87171"): Color.Parse("#52525b"),
            BorderWidth: 1.0,
            BorderRadius: 6.0,
            entry,
            button
        }
        var root = Container{Width: current.Width, MinWidth: 0.0, Gap: 5.0, Overflow: Overflow.Visible}
        if let create = current.CreateRoot {
            root = create(current, root)
        }
        root.Handle = rootHandle
        root.ZIndex = isOpen ? current.ZIndex: 0
        root.Children.Clear()
        root.Children.Add(field)
        if invalid {
            root.Children.Add(
                Text{
                    Key: "issue",
                    Handle: issueHandle,
                    Content: current.InvalidMessage ?? "Enter a valid date.",
                    Color: "#f87171",
                    FontSize: 12.0,
                    Accessibility: Accessibility{
                        Role: AccessibilityRole.Alert,
                        Name: current.InvalidMessage ?? "Enter a valid date.",
                        Live: AccessibilityLive.Polite
                    }
                }
            )
        }
        var calendar = CalendarInput{}
        if let create = current.CreateCalendar {
            calendar = create(current, calendar)
        }
        calendar = calendar with{
            Value = current.Value,
            OnChange = Selected,
            Minimum = current.Minimum,
            Maximum = current.Maximum,
            IsDateDisabled = current.IsDateDisabled,
            Disabled = current.Disabled,
            Culture = current.Culture,
            Today = current.Today,
            FirstDayOfWeek = current.FirstDayOfWeek,
            Handle = calendarHandle,
            Width = Length.Percent(100),
            OnEscape = Escape,
            AccessibilityName = current.AccessibilityName!!+ " calendar"
        }
        var popup = PopoverInput{
            Open: isOpen,
            Anchor: fieldHandle,
            Width: current.PopupWidth,
            MaxHeight: 360.0,
            Content: Cell.Mount[CalendarInput, Calendar]("calendar", calendar),
            Padding: 0.0,
            AccessibilityName: current.AccessibilityName!!+ " popup",
            InitialFocus: calendarHandle,
            OnDismiss: Dismiss,
            CreateRoot: PopupRoot,
            CreatePanel: PopupPanel
        }
        if isOpen {
            popup.Viewport = overlayBox
        }
        root.Children.Add(Cell.Mount[PopoverInput, Popover]("popup", popup))
        return root
    }

    private func Display(value DateOnly?) string {
        if value == nil {
            return ""
        }
        return if let format = current.Format {
            format(value)
        } else {
            value.ToString("d", current.Culture!!)
        }
    }

    private func Allowed(date DateOnly) bool -> (current.Minimum == nil || date >= current.Minimum!!)
    && (current.Maximum == nil || date <= current.Maximum!!) && !(current.IsDateDisabled?.Invoke(date) ?? false)

    private func Edited(value string) {
        draft = value
        dirty = true
        invalid = false
        Rebuild()
    }

    private func Submit() {
        if current.Disabled || !dirty {
            return
        }
        var parsed DateOnly?
        if String.IsNullOrWhiteSpace(draft) {
            if !current.AllowEmpty!! {
                Reject()
                return
            }
        } else {
            if let parse = current.Parse {
                parsed = parse(draft)
            } else if DateOnly.TryParse(draft, current.Culture!!, DateTimeStyles.None, out var date) {
                parsed = date
            }
            if parsed == nil || !Allowed(parsed!!) {
                Reject()
                return
            }
        }
        Apply(parsed)
    }

    private func Reject() {
        invalid = true
        current.OnInvalid?.Invoke(draft)
        Rebuild()
    }

    private func Apply(value DateOnly?) {
        draft = Display(value)
        dirty = false
        invalid = false
        if value != current.Value {
            current.OnChange?.Invoke(value)
        }
        Rebuild()
    }

    private func Selected(date DateOnly) {
        if !Allowed(date) {
            return
        }
        Apply(date)
        SetOpen(false)
    }

    private func SetOpen(value bool) {
        if current.Disabled {
            return
        }
        ownedOpen = value
        current.OnOpenChange?.Invoke(value)
        Rebuild()
    }

    private func Escape() {
        draft = Display(current.Value)
        dirty = false
        invalid = false
        SetOpen(false)
    }

    private func Dismiss(reason PopoverDismissReason) {
        if reason == PopoverDismissReason.Escape {
            Escape()
        } else {
            SetOpen(false)
        }
    }

    private func InputKey(event KeyEvent) {
        if event.Key == Key.Escape {
            event.PreventDefault()
            event.StopPropagation()
            if !event.Repeat {
                Escape()
            }
        } else if event.Key == Key.F4 || (event.Key == Key.Down && event.Modifiers.Alt) {
            event.PreventDefault()
            event.StopPropagation()
            SetOpen(true)
        }
    }

    private func PopupPanel(input PopoverInput, bounds ElementRect, content Blob) Container {
        let prepared = Container{
            BackgroundColor: "#18181b",
            BorderColor: "#52525b",
            BorderWidth: 1.0,
            BorderRadius: 7.0
        }
        return if let create = current.CreatePopup {
            create(current, prepared)
        } else {
            prepared
        }
    }

    private func PopupRoot(input PopoverInput, backdrop Container, panel Container) Container -> Container{
        Position: PositionType.Absolute,
        Left: overlayBox.X - rootBox.X,
        Top: overlayBox.Y - rootBox.Y,
        Width: overlayBox.Width,
        Height: overlayBox.Height,
    }

    private func BindOverlay(next ElementHandle?) {
        if overlay == next {
            return
        }
        if let previous = overlay {
            previous.MetricsChanged -= OverlayMetrics
        }
        overlay = next
        if let handle = overlay {
            overlayBox = handle.BorderBox
            handle.MetricsChanged += OverlayMetrics
        }
    }

    private func OverlayMetrics(metrics ElementMetrics) {
        if disposed {
            return
        }
        if !metrics.IsMounted {
            if current.Open ?? ownedOpen {
                SetOpen(false)
            }
            return
        }
        if overlayBox != metrics.BorderBox {
            overlayBox = metrics.BorderBox
            Rebuild()
        }
    }

    private func RootMetrics(metrics ElementMetrics) {
        if disposed || !metrics.IsMounted {
            return
        }
        if rootBox != metrics.BorderBox {
            rootBox = metrics.BorderBox
            Rebuild()
        }
    }
}
