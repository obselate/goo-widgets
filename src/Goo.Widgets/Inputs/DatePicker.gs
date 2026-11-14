package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Icons
import Goo.Widgets.Layout
import System
import System.Globalization

/// Controlled civil-date input; typing is a draft until Enter or blur commits it.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
public data struct DatePickerInput {
    /// Controlled selected civil date. Nil means no date is selected.
    var Value DateOnly?
    /// Receives the committed civil date after valid input or calendar selection. A permitted clear emits nil. Nil ignores the request.
    var OnChange Action[DateOnly?]?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Preserves focus, selection and copy while preventing edits and calendar opening.
    var ReadOnly bool
    /// Nil defaults to true. Empty input commits nil; false treats empty input as invalid.
    var AllowEmpty bool?
    /// Inclusive earliest selectable civil date. Nil imposes no lower bound.
    var Minimum DateOnly?
    /// Inclusive latest selectable civil date. Nil imposes no upper bound.
    var Maximum DateOnly?
    /// Tests whether a date is unavailable. Nil imposes no extra restriction.
    /// Hosts must not change state in this callback.
    var IsDateDisabled Func[DateOnly, bool]?
    /// Culture for date labels and formatting. Nil uses the nearest theme locale. The calendar must be Gregorian.
    var Culture CultureInfo?
    /// First weekday column. Nil uses the selected culture calendar settings.
    var FirstDayOfWeek DayOfWeek?
    /// Current civil date for the calendar marker. Nil uses the local date.
    var Today DateOnly?
    /// Formats a civil date for display. Nil uses the selected culture short-date format.
    /// Hosts must not change state in this callback.
    var Format Func[DateOnly, string]?
    /// Nil result means invalid nonempty input; empty input follows AllowEmpty.
    /// Hosts must not change state in this callback.
    var Parse Func[string, DateOnly?]?
    /// Invalid submissions retain the draft and committed value, and call this hook.
    var OnInvalid Action[string]?
    /// Parse-failure message. Nil uses localized invalid-date text.
    var InvalidMessage string?
    /// Hint shown while the entry is empty. Nil uses the widget default text.
    var Placeholder string?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Optional mounted collision viewport. Presentation uses the Window's Portal overlay.
    var OverlayHost ElementHandle?
    /// Controlled calendar visibility. Nil lets the widget own opening, initially closed.
    var Open bool?
    /// Receives the requested open state after user interaction. Nil ignores the request.
    var OnOpenChange Action[bool]?
    /// Editor layout width. Nil uses 280 logical pixels.
    var Width Length?
    /// Finite calendar-popup width in logical pixels, greater than 40. Nil uses 300. The popup is at least as wide as the field.
    var PopupWidth float64?
    /// Popup stacking order. Zero uses layer 20.
    var ZIndex int32
    /// Configures the fresh input before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Invalid, Accessibility.Name, Accessibility.ReadOnly, Accessibility.Relationships.Controls, Accessibility.Relationships.ErrorMessage, Accessibility.Required, Accessibility.Role, Controlled, Disabled, Focusable, Handle, Key, OnBlur, OnChange, OnKeyDown, OnSubmit, ReadOnly, Value.
    var ConfigureInput Action[DatePickerInput, TextEntry]?
    /// Configures the fresh button before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Expanded, Accessibility.HasPopup, Accessibility.Name, Accessibility.Relationships.Controls, Accessibility.Role, Disabled, Focusable, Key, KeyBindings (required entries), OnClick.
    var ConfigureButton Action[DatePickerInput, Button]?
    /// Receives the widget input and the CalendarInput value, and returns the replacement CalendarInput. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateCalendar Func[DatePickerInput, CalendarInput, CalendarInput]?
    /// Configures the fresh popup before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Handle, Key.
    var ConfigurePopup Action[DatePickerInput, Container]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// The widget does not replace configured metadata or children.
    var ConfigureRoot Action[DatePickerInput, Container]?
}

/// Composes an editable date field, Calendar, and the shared anchored Popover lifecycle.
public open class DatePicker : Cell[DatePickerInput], IDisposable {
    private var current DatePickerInput
    private var theme Theme
    private let entryHandle ElementHandle = ElementHandle()
    private let fieldHandle ElementHandle = ElementHandle()
    private let calendarHandle ElementHandle = ElementHandle()
    private let issueHandle ElementHandle = ElementHandle()
    private var overlay ElementHandle?
    private var overlayBox ElementRect
    private var draft string = ""
    private var lastValue DateOnly?
    private var initialized bool
    private var dirty bool
    private var invalid bool
    private var ownedOpen bool
    private var disposed bool

    /// Releases the optional collision-viewport subscription.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        BindOverlay(nil)
    }

    protected override func Build(input DatePickerInput) Blob {
        theme = Theme.Read()
        let defaultWidth Length = 280.0
        current = input with{
            AllowEmpty = input.AllowEmpty ?? true,
            Culture = input.Culture ?? theme.Locale,
            Width = input.Width ?? defaultWidth,
            PopupWidth = input.PopupWidth ?? 300.0,
            ZIndex = input.ZIndex == 0 ? 20: input.ZIndex,
            AccessibilityName = input.AccessibilityName ?? theme.Text("Date"),
            Placeholder = input.Placeholder ?? theme.Text("Choose a date")
        }
        if (current.Width!!.HasMagnitude && !current.Width!!.IsPercent && (!Double.IsFinite(current.Width!!.Magnitude) || current.Width!!.Magnitude <= 40.0)) || !Double.IsFinite(current.PopupWidth!!) ||
            current.PopupWidth!! <= 40.0 {
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
        let requestedOpen = !input.Disabled && !input.ReadOnly && (input.Open ?? ownedOpen)
        let isOpen = requestedOpen && (overlay?.IsMounted ?? true)
        var entry = TextEntry{
            Height: theme.ControlHeight,
            MinWidth: 0.0,
            Padding: Edges{Right: theme.ControlPadding, Left: theme.ControlPadding},
            FlexGrow: 1.0,
            FlexBasis: 0.0,
            BackgroundColor: Color.Transparent,
            Color: theme.TextColor,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            FontWeight: theme.FontWeight,
            SelectionColor: theme.AccentColor.WithAlpha(0.35),
            PlaceholderColor: theme.PlaceholderColor,
            Cursor: Cursor.Text,
            FocusStyle: Style{BasedOn: theme.FocusStyle, OutlineOffset: -theme.FocusRingWidth},
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
        }
        if let configure = current.ConfigureInput {
            let originalAccessibilityInvalid = entry.Accessibility?.Invalid
            let originalAccessibilityName = (entry.Accessibility?.Name ?? "")
            let originalAccessibilityReadOnly = entry.Accessibility?.ReadOnly
            let originalAccessibilityRequired = entry.Accessibility?.Required
            let originalAccessibilityRole = (entry.Accessibility?.Role ?? AccessibilityRole(0))
            let originalControlled = entry.Controlled
            let originalDisabled = entry.Disabled
            let originalFocusable = entry.Focusable
            let originalHandle = entry.Handle
            let originalKey = entry.Key
            let originalOnBlur = entry.OnBlur
            let originalOnChange = entry.OnChange
            let originalOnKeyDown = entry.OnKeyDown
            let originalOnSubmit = entry.OnSubmit
            let originalReadOnly = entry.ReadOnly
            let originalValue = entry.Value
            configure.Invoke(current, entry)
            if entry.Accessibility?.Invalid != originalAccessibilityInvalid {
                throw InvalidOperationException("DatePicker owns Accessibility.Invalid; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if (entry.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("DatePicker owns Accessibility.Name; set DatePickerInput.AccessibilityName instead of changing it in ConfigureInput")
            }
            if entry.Accessibility?.ReadOnly != originalAccessibilityReadOnly {
                throw InvalidOperationException("DatePicker owns Accessibility.ReadOnly; set DatePickerInput.ReadOnly instead of changing it in ConfigureInput")
            }
            if entry.Accessibility?.Required != originalAccessibilityRequired {
                throw InvalidOperationException("DatePicker owns Accessibility.Required; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if (entry.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("DatePicker owns Accessibility.Role; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.Controlled != originalControlled {
                throw InvalidOperationException("DatePicker owns Controlled; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.Disabled != originalDisabled {
                throw InvalidOperationException("DatePicker owns Disabled; set DatePickerInput.Disabled instead of changing it in ConfigureInput")
            }
            if entry.Focusable != originalFocusable {
                throw InvalidOperationException("DatePicker owns Focusable; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.Handle != originalHandle {
                throw InvalidOperationException("DatePicker owns Handle; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.Key != originalKey {
                throw InvalidOperationException("DatePicker owns Key; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.OnBlur != originalOnBlur {
                throw InvalidOperationException("DatePicker owns OnBlur; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.OnChange != originalOnChange {
                throw InvalidOperationException("DatePicker owns OnChange; set DatePickerInput.OnChange instead of changing it in ConfigureInput")
            }
            if entry.OnKeyDown != originalOnKeyDown {
                throw InvalidOperationException("DatePicker owns OnKeyDown; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.OnSubmit != originalOnSubmit {
                throw InvalidOperationException("DatePicker owns OnSubmit; configure DatePickerInput instead of changing it in ConfigureInput")
            }
            if entry.ReadOnly != originalReadOnly {
                throw InvalidOperationException("DatePicker owns ReadOnly; set DatePickerInput.ReadOnly instead of changing it in ConfigureInput")
            }
            if entry.Value != originalValue {
                throw InvalidOperationException("DatePicker owns Value; set DatePickerInput.Value instead of changing it in ConfigureInput")
            }
        }
        theme.ApplyInteraction(entry, InteractionFamily.Field)
        entry.Key = "entry"
        entry.Handle = entryHandle
        entry.Value = draft
        entry.Controlled = true
        entry.Placeholder = current.Placeholder!!
        entry.Disabled = current.Disabled
        entry.ReadOnly = current.ReadOnly
        entry.Focusable = !current.Disabled
        entry.OnChange = Edited
        entry.OnSubmit = (value string) -> Submit()
        entry.OnBlur = (event FocusEvent) -> {
            if !(current.Open ?? ownedOpen) {
                Submit()
            }
        }
        entry.OnKeyDown = InputKey
        let entryAccessibility = if let configured = entry.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        entryAccessibility.Role = AccessibilityRole.TextInput
        entryAccessibility.Name = current.AccessibilityName!!
        entryAccessibility.Invalid = invalid
        entryAccessibility.Required = !current.AllowEmpty!!
        entryAccessibility.ReadOnly = current.ReadOnly
        let entryRelationships = if let configured = entryAccessibility.Relationships { AccessibilityRelationships{...configured} } else { AccessibilityRelationships{} }
        entryRelationships.Controls = []ElementHandle{calendarHandle}
        entryRelationships.ErrorMessage = invalid ? []ElementHandle{issueHandle}: []ElementHandle{}
        entryAccessibility.Relationships = entryRelationships
        entry.Accessibility = entryAccessibility
        var button = Button{
            Width: theme.ControlHeight,
            Height: theme.ControlHeight,
            Padding: theme.Spacing * 2.0,
            BackgroundColor: Color.Transparent,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
        }
        button.Children.Clear()
        button.Children.Add(ControlIcons.Create(ControlIcon.CalendarMonth, 18.0, theme.AccentColor))
        if let configure = current.ConfigureButton {
            let originalAccessibilityExpanded = button.Accessibility?.Expanded
            let originalAccessibilityHasPopup = button.Accessibility?.HasPopup
            let originalAccessibilityName = (button.Accessibility?.Name ?? "")
            let originalAccessibilityRole = (button.Accessibility?.Role ?? AccessibilityRole(0))
            let originalDisabled = button.Disabled
            let originalFocusable = button.Focusable
            let originalKey = button.Key
            let originalOnClick = button.OnClick
            configure.Invoke(current, button)
            if button.Accessibility?.Expanded != originalAccessibilityExpanded {
                throw InvalidOperationException("DatePicker owns Accessibility.Expanded; configure DatePickerInput instead of changing it in ConfigureButton")
            }
            if button.Accessibility?.HasPopup != originalAccessibilityHasPopup {
                throw InvalidOperationException("DatePicker owns Accessibility.HasPopup; configure DatePickerInput instead of changing it in ConfigureButton")
            }
            if (button.Accessibility?.Name ?? "") != originalAccessibilityName {
                throw InvalidOperationException("DatePicker owns Accessibility.Name; set DatePickerInput.AccessibilityName instead of changing it in ConfigureButton")
            }
            if (button.Accessibility?.Role ?? AccessibilityRole(0)) != originalAccessibilityRole {
                throw InvalidOperationException("DatePicker owns Accessibility.Role; configure DatePickerInput instead of changing it in ConfigureButton")
            }
            if button.Disabled != originalDisabled {
                throw InvalidOperationException("DatePicker owns Disabled; set DatePickerInput.Disabled instead of changing it in ConfigureButton")
            }
            if button.Focusable != originalFocusable {
                throw InvalidOperationException("DatePicker owns Focusable; configure DatePickerInput instead of changing it in ConfigureButton")
            }
            if button.Key != originalKey {
                throw InvalidOperationException("DatePicker owns Key; configure DatePickerInput instead of changing it in ConfigureButton")
            }
            if button.OnClick != originalOnClick {
                throw InvalidOperationException("DatePicker owns OnClick; configure DatePickerInput instead of changing it in ConfigureButton")
            }
        }
        theme.ApplyInteraction(button, InteractionFamily.Button)
        button.Key = "open"
        button.Disabled = current.Disabled || current.ReadOnly
        button.Focusable = !current.Disabled && !current.ReadOnly
        button.OnClick = () -> SetOpen(!isOpen)
        WidgetKeyBindings.BindActivation(button)
        let buttonAccessibility = if let configured = button.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        buttonAccessibility.Role = AccessibilityRole.Button
        buttonAccessibility.Name = current.AccessibilityName!!+ " calendar"
        buttonAccessibility.HasPopup = true
        buttonAccessibility.Expanded = isOpen
        let buttonRelationships = if let configured = buttonAccessibility.Relationships { AccessibilityRelationships{...configured} } else { AccessibilityRelationships{} }
        buttonRelationships.Controls = []ElementHandle{calendarHandle}
        buttonAccessibility.Relationships = buttonRelationships
        button.Accessibility = buttonAccessibility
        let field = Container{
            Key: "field",
            Handle: fieldHandle,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            BackgroundColor: theme.FieldColor,
            BorderColor: invalid ? theme.DangerColor: theme.InputBorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: theme.ControlRadius!!,
            entry,
            button
        }
        let root = Container{
            Width: current.Width!!,
            MinWidth: 0.0,
            Gap: theme.ControlGap,
            Overflow: Overflow.Visible,
            LineHeight: theme.LineHeight,
        }
        root.Children.Clear()
        root.Children.Add(field)
        if invalid {
            root.Children.Add(
                Text{
                    Key: "issue",
                    Handle: issueHandle,
                    Content: current.InvalidMessage ?? "Enter a valid date.",
                    Color: theme.DangerColor,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.CaptionFontSize,
                    FontWeight: theme.CaptionFontWeight,
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
            Width = Percent(100),
            OnEscape = Escape,
            AccessibilityName = current.AccessibilityName!!+ " calendar"
        }
        var popup = PopoverInput{
            Open: isOpen,
            Anchor: fieldHandle,
            Width: Math.Max(current.PopupWidth!!, fieldHandle.IsMounted ? fieldHandle.BorderBox.Width: 0.0),
            Content: Cell.Mount[CalendarInput, Calendar]("calendar", calendar),
            Padding: 0.0,
            AccessibilityName: current.AccessibilityName!!+ " popup",
            InitialFocus: calendarHandle,
            OnDismiss: Dismiss,
            ConfigurePanel: PopupPanel,
            ZIndex: current.ZIndex,
        }
        if isOpen && overlay != nil {
            popup.Viewport = overlayBox
        }
        root.Children.Add(Cell.Mount[PopoverInput, Popover]("popup", popup))
        current.ConfigureRoot?.Invoke(current, root)
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
        if current.Disabled || current.ReadOnly || !dirty {
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
        InvokeInputCallback(current.OnInvalid, draft)
        Rebuild()
    }

    private func Apply(value DateOnly?) {
        draft = Display(value)
        dirty = false
        invalid = false
        if value != current.Value {
            InvokeInputCallback(current.OnChange, value)
        }
        Rebuild()
    }

    private func Selected(date DateOnly) {
        if current.Disabled || current.ReadOnly || !Allowed(date) {
            return
        }
        Apply(date)
        SetOpen(false)
    }

    private func SetOpen(value bool) {
        if current.Disabled || current.ReadOnly {
            return
        }
        ownedOpen = value
        InvokeInputCallback(current.OnOpenChange, value)
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
        if current.Disabled || current.ReadOnly {
            return
        }
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

    private func PopupPanel(input PopoverInput, bounds ElementRect, content Blob, prepared Container) {
        prepared.BasedOn = theme.OverlayStyle
        prepared.BackgroundColor = theme.PanelColor
        prepared.BorderColor = theme.InputBorderColor
        prepared.BorderWidth = theme.BorderWidth
        prepared.BorderRadius = theme.PanelRadius!!
        if let configure = current.ConfigurePopup {
            let originalHandle = prepared.Handle
            let originalKey = prepared.Key
            configure.Invoke(current, prepared)
            if prepared.Handle != originalHandle {
                throw InvalidOperationException("DatePicker owns Handle; configure DatePickerInput instead of changing it in ConfigurePopup")
            }
            if prepared.Key != originalKey {
                throw InvalidOperationException("DatePicker owns Key; configure DatePickerInput instead of changing it in ConfigurePopup")
            }
        }
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
}
