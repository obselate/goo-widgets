package Goo.Widgets.Inputs

import Goo
import System
import System.Collections.Generic
import System.Globalization

/// Date and state passed to a calendar day factory.
public data struct CalendarDay {
    var Date DateOnly
    var CurrentMonth bool
    var Selected bool
    var Today bool
    var Active bool
    var Disabled bool
}

/// A controlled Gregorian date with optional controlled visible month.
public data struct CalendarInput {
    var Value DateOnly?
    var OnChange Action[DateOnly]?
    /// Nil lets the widget own its visible month. Supplied dates are normalized to the first day.
    var Month DateOnly?
    var OnMonthChange Action[DateOnly]?
    var Minimum DateOnly?
    var Maximum DateOnly?
    var IsDateDisabled Func[DateOnly, bool]?
    var Disabled bool
    /// Defaults to local Today; hosts can supply their own civil date.
    var Today DateOnly?
    var Culture CultureInfo?
    var FirstDayOfWeek DayOfWeek?
    var Width Length?
    var DayHeight float64
    var AccessibilityName string?
    var PreviousMonthLabel string?
    var NextMonthLabel string?
    var OnEscape Action?
    /// Optional stable root handle. Focusing the root enters the active eligible date.
    var Handle ElementHandle?
    var CreateDay Func[CalendarInput, CalendarDay, Button, Button]?
    var CreateNavigation Func[CalendarInput, int32, Button, Button]?
    var CreateWeekday Func[CalendarInput, DayOfWeek, Text, Blob]?
    var CreateRoot Func[CalendarInput, Container, Container]?
}

/// A six-week calendar with roving date focus, month navigation, and host-owned selection.
public open class Calendar : Cell[CalendarInput], IDisposable {
    private var current CalendarInput
    private let rootHandle ElementHandle = ElementHandle()
    private let handles Dictionary[int32, ElementHandle] = Dictionary[int32, ElementHandle]()
    private var month DateOnly
    private var ownedMonth DateOnly
    private var active DateOnly?
    private var pending DateOnly?
    private var lastValue DateOnly?
    private var focusedDay DateOnly?
    private var firstWeekday DayOfWeek
    private var initialized bool
    private var disposed bool

    /// Releases subscriptions for mounted day handles.
    public func Dispose() {
        if disposed {
            return
        }
        disposed = true
        for handle in handles.Values {
            handle.MetricsChanged -= DayMetrics
        }
        handles.Clear()
    }

    protected override func Build(input CalendarInput) Blob {
        let width Length = 280.0
        let culture = input.Culture ?? CultureInfo.CurrentCulture
        current = input with{
            Culture = culture,
            FirstDayOfWeek = input.FirstDayOfWeek ?? culture.DateTimeFormat.FirstDayOfWeek,
            Width = input.Width ?? width,
            DayHeight = input.DayHeight == 0.0 ? 32.0: input.DayHeight,
            Today = input.Today ?? DateOnly.FromDateTime(DateTime.Today),
            AccessibilityName = input.AccessibilityName ?? "Calendar",
            PreviousMonthLabel = input.PreviousMonthLabel ?? "Previous month",
            NextMonthLabel = input.NextMonthLabel ?? "Next month"
        }
        if !Double.IsFinite(current.DayHeight) || current.DayHeight <= 0.0 {
            throw ArgumentOutOfRangeException("DayHeight")
        }
        if !Enum.IsDefined(current.FirstDayOfWeek!!) {
            throw ArgumentOutOfRangeException("FirstDayOfWeek")
        }
        if input.Minimum != nil && input.Maximum != nil && input.Minimum!!> input.Maximum!! {
            throw ArgumentException("Calendar minimum must not exceed maximum")
        }
        if !(culture.DateTimeFormat.Calendar is GregorianCalendar) {
            throw ArgumentException("Calendar requires a culture using the Gregorian calendar")
        }
        if initialized && firstWeekday != current.FirstDayOfWeek!! {
            if focusedDay != nil {
                pending = focusedDay
            }
            for handle in handles.Values {
                handle.MetricsChanged -= DayMetrics
            }
            handles.Clear()
        }
        firstWeekday = current.FirstDayOfWeek!!
        if !initialized || (input.Month == nil && input.Value != nil && input.Value != lastValue) {
            ownedMonth = Start(input.Value ?? current.Today!!)
            initialized = true
        }
        lastValue = input.Value
        month = Start(input.Month ?? ownedMonth)
        if input.Minimum != nil && month < Start(input.Minimum!!) {
            month = Start(input.Minimum!!)
        }
        if input.Maximum != nil && month > Start(input.Maximum!!) {
            month = Start(input.Maximum!!)
        }
        if input.Month == nil {
            ownedMonth = month
        }
        if active == nil || active!!.Year != month.Year || active!!.Month != month.Month || !Allowed(active!!) {
            let candidate = input.Value != nil && Start(input.Value!!) == month ? input.Value!!.Day: current.Today!!.Day
            active = InMonth(month, candidate)
        }
        let title = month.ToString("MMMM yyyy", culture)
        let heading = Container(){
            .Key: "heading",
            .Height: 32.0,
            .FlexShrink: 0.0,
            .FlexDirection: FlexDirection.Row,
            .AlignItems: AlignItems.Center,
            .Gap: 8.0,
            Navigation(-1),
            Text{
                Key: "month",
                Content: title,
                FlexGrow: 1.0,
                TextAlign: TextAlign.Center,
                FontWeight: 600,
                Color: "#fafafa",
                Accessibility: Accessibility{
                    Role: AccessibilityRole.Heading,
                    Name: title,
                    Level: 2,
                    Live: AccessibilityLive.Polite
                }
            },
            Navigation(1)
        }
        let grid = Container{
            Key: "grid",
            Gap: 2.0,
            Accessibility: Accessibility{Role: AccessibilityRole.Grid, Name: title}
        }
        let weekdays = Container{
            Key: "weekdays",
            Height: 24.0,
            FlexDirection: FlexDirection.Row,
            Accessibility: Accessibility{Role: AccessibilityRole.Row}
        }
        for column in 0 ... 7 {
            let weekday = DayOfWeek((int32(current.FirstDayOfWeek!!) + column) % 7)
            let prepared = Text{
                Content: culture.DateTimeFormat.GetShortestDayName(weekday),
                Color: "#a1a1aa",
                FontSize: 12.0,
                TextAlign: TextAlign.Center
            }
            let label = if let create = current.CreateWeekday {
                create(current, weekday, prepared)
            } else {
                prepared
            }
            label.Key = "weekday-" + column.ToString()
            label.FlexGrow = 1.0
            label.FlexBasis = 0.0
            label.MinWidth = 0.0
            label.Accessibility = Accessibility{
                Role: AccessibilityRole.ColumnHeader,
                Name: culture.DateTimeFormat.GetDayName(weekday)
            }
            weekdays.Children.Add(label)
        }
        grid.Children.Add(weekdays)
        let offset = (int32(month.DayOfWeek) - int32(current.FirstDayOfWeek!!) + 7) % 7
        let first = month.DayNumber - offset
        let visible = HashSet[int32]()
        for week in 0 ... 6 {
            let row = Container{
                Key: "week-" + (first + week * 7).ToString(),
                FlexDirection: FlexDirection.Row,
                Gap: 2.0,
                Accessibility: Accessibility{Role: AccessibilityRole.Row}
            }
            for column in 0 ... 7 {
                let number = first + week * 7 + column
                if number < DateOnly.MinValue.DayNumber || number > DateOnly.MaxValue.DayNumber {
                    row.Children.Add(
                        Container{
                            Key: "empty-" + column.ToString(),
                            FlexGrow: 1.0,
                            FlexBasis: 0.0,
                            Height: current.DayHeight,
                            Accessibility: Accessibility{Hidden: true}
                        }
                    )
                    continue
                }
                let date = DateOnly.FromDayNumber(number)
                visible.Add(number)
                row.Children.Add(
                    Day(
                        CalendarDay{
                            Date: date,
                            CurrentMonth: Start(date) == month,
                            Selected: input.Value == date,
                            Today: current.Today == date,
                            Active: active == date,
                            Disabled: !Allowed(date)
                        }
                    )
                )
            }
            grid.Children.Add(row)
        }
        let removed = List[int32]()
        for pair in handles {
            if !visible.Contains(pair.Key) {
                pair.Value.MetricsChanged -= DayMetrics
                removed.Add(pair.Key)
            }
        }
        for number in removed {
            handles.Remove(number)
        }
        var root = Container{
            Width: current.Width!!,
            MinWidth: 0.0,
            Padding: 8.0,
            Gap: 8.0,
            BackgroundColor: "#18181b",
            BorderRadius: 7.0,
            Color: "#fafafa"
        }
        if let create = current.CreateRoot {
            root = create(current, root)
        }
        root.Handle = current.Handle ?? rootHandle
        root.Focusable = !current.Disabled
        root.TabStop = active == nil && !current.Disabled
        root.Disabled = current.Disabled
        root.OnFocus = (event FocusEvent) -> {
            event.StopPropagation()
            if active != nil {
                Focus(active!!)
            }
        }
        root.OnKeyDown = KeyDown
        root.Accessibility = Accessibility{Role: AccessibilityRole.Group, Name: current.AccessibilityName!!}
        root.Children.Clear()
        root.Children.Add(heading)
        root.Children.Add(grid)
        return root
    }

    private func Start(date DateOnly) DateOnly -> DateOnly(date.Year, date.Month, 1)

    private func Allowed(date DateOnly) bool -> !current.Disabled
    && (current.Minimum == nil || date >= current.Minimum!!)
    && (current.Maximum == nil || date <= current.Maximum!!)
    && !(current.IsDateDisabled?.Invoke(date) ?? false)

    private func InMonth(value DateOnly, preferred int32) DateOnly? {
        let count = DateTime.DaysInMonth(value.Year, value.Month)
        let day = Math.Min(count, preferred)
        for distance in 0 ... count {
            if day + distance <= count {
                let date = DateOnly(value.Year, value.Month, day + distance)
                if Allowed(date) {
                    return date
                }
            }
            if distance > 0 && day - distance > 0 {
                let date = DateOnly(value.Year, value.Month, day - distance)
                if Allowed(date) {
                    return date
                }
            }
        }
        return nil
    }

    private func CanMonth(delta int32) bool {
        let number = (month.Year - 1) * 12 + month.Month - 1 + delta
        if current.Disabled || number < 0 || number >= 9999 * 12 {
            return false
        }
        let target = month.AddMonths(delta)
        return (current.Minimum == nil || target >= Start(current.Minimum!!)) &&
            (current.Maximum == nil || target <= Start(current.Maximum!!))
    }

    private func Navigation(delta int32) Button {
        var button = Button{Width: 30.0, Height: 30.0, Padding: 0.0, BackgroundColor: "#27272a", BorderRadius: 5.0}
        if let create = current.CreateNavigation {
            button = create(current, delta, button)
        }
        button.Key = delta < 0 ? "previous": "next"
        button.Disabled = !CanMonth(delta)
        button.Focusable = !button.Disabled
        button.OnClick = () -> MoveMonth(delta)
        button.OnFocus = (event FocusEvent) -> event.StopPropagation()
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.Button,
            Name: delta < 0 ? current.PreviousMonthLabel!!: current.NextMonthLabel!!
        }
        button.Children.Clear()
        button.Children.Add(Text{Content: delta < 0 ? "‹": "›", FontSize: 22.0})
        return button
    }

    private func Day(day CalendarDay) Button {
        let date = day.Date
        var button = Button{
            Padding: 0.0,
            BorderRadius: 4.0,
            BackgroundColor: day.Selected ? Color.Parse("#4f46e5"): Color.Transparent,
            BorderWidth: day.Today ? 1.0: 0.0,
            BorderColor: "#818cf8",
            Focus: Style{OutlineWidth: 1.0, OutlineColor: "#c7d2fe", OutlineOffset: -2.0},
            Opacity: day.Disabled ? .35: 1.0
        }
        if let create = current.CreateDay {
            button = create(current, day, button)
        }
        button.Key = date.DayNumber.ToString()
        button.Handle = Handle(date)
        button.FlexGrow = 1.0
        button.FlexBasis = 0.0
        button.MinWidth = 0.0
        button.Height = current.DayHeight
        button.Disabled = day.Disabled
        button.Focusable = !day.Disabled
        button.TabStop = day.Active && !day.Disabled
        button.OnClick = () -> Select(date)
        button.OnFocus = (event FocusEvent) -> {
            event.StopPropagation()
            active = date
            focusedDay = date
            Rebuild()
        }
        button.OnBlur = (event FocusEvent) -> {
            if focusedDay == date {
                focusedDay = nil
            }
        }
        button.Accessibility = Accessibility{
            Role: AccessibilityRole.GridCell,
            Name: date.ToString("D", current.Culture!!),
            Selected: day.Selected,
            Description: day.Today ? "Today": ""
        }
        button.Children.Clear()
        button.Children.Add(
            Text{
                Content: date.Day.ToString(current.Culture!!),
                FontSize: 13.0,
                Color: day.Selected || day.CurrentMonth ? Color.Parse("#fafafa"): Color.Parse("#71717a")
            }
        )
        return button
    }

    private func Handle(date DateOnly) ElementHandle {
        if !handles.TryGetValue(date.DayNumber, out var handle) {
            handle = ElementHandle()
            handle.MetricsChanged += DayMetrics
            handles.Add(date.DayNumber, handle)
        }
        return handle
    }

    private func Focus(date DateOnly) {
        active = date
        let handle = Handle(date)
        pending = handle.Focus() ? nil: date
        if pending == nil {
            handle.ScrollIntoView()
        }
        Rebuild()
    }

    private func DayMetrics(metrics ElementMetrics) {
        if disposed || pending == nil || !metrics.IsMounted {
            return
        }
        let target = pending!!
        if handles.TryGetValue(target.DayNumber, out var handle) && handle.IsMounted {
            pending = nil
            handle.Focus()
            handle.ScrollIntoView()
        }
    }

    private func ShowMonth(value DateOnly) {
        ownedMonth = Start(value)
        current.OnMonthChange?.Invoke(ownedMonth)
        Rebuild()
    }

    private func MoveMonth(delta int32) {
        if !CanMonth(delta) {
            return
        }
        let target = month.AddMonths(delta)
        let date = InMonth(target, active?.Day ?? 1)
        ShowMonth(target)
        if date != nil {
            Focus(date)
        }
    }

    private func Select(date DateOnly) {
        if !Allowed(date) {
            return
        }
        if Start(date) != month {
            ShowMonth(date)
        }
        current.OnChange?.Invoke(date)
    }

    private func KeyDown(event KeyEvent) {
        if event.Key == Key.Escape && current.OnEscape != nil {
            event.PreventDefault()
            event.StopPropagation()
            if !event.Repeat {
                current.OnEscape!!()
            }
            return
        }
        if event.Key == Key.PageUp || event.Key == Key.PageDown {
            event.PreventDefault()
            event.StopPropagation()
            MoveMonth((event.Key == Key.PageUp ? -1: 1) * (event.Modifiers.Shift ? 12: 1))
            return
        }
        let origin = active ?? month
        var step = 0
        var number = origin.DayNumber
        var attempts = 42
        if event.Key == Key.Left {
            step = -1
        } else if event.Key == Key.Right {
            step = 1
        } else if event.Key == Key.Up {
            step = -7
        } else if event.Key == Key.Down {
            step = 7
        } else if event.Key == Key.Home || event.Key == Key.End {
            let offset = (int32(origin.DayOfWeek) - int32(current.FirstDayOfWeek!!) + 7) % 7
            number -= offset
            if event.Key == Key.End {
                number += 6
            }
            step = event.Key == Key.Home ? 1: -1
            number -= step
            attempts = 7
        } else {
            return
        }
        event.PreventDefault()
        event.StopPropagation()
        for attempt in 0 ... attempts {
            number += step
            if number < DateOnly.MinValue.DayNumber || number > DateOnly.MaxValue.DayNumber {
                return
            }
            let date = DateOnly.FromDayNumber(number)
            if Allowed(date) {
                if Start(date) != month {
                    ShowMonth(date)
                }
                Focus(date)
                return
            }
        }
    }
}
