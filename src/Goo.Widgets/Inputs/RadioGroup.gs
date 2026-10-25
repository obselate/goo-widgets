package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// An identified radio choice with optional descriptive content.
public data struct RadioOption {
    var Id string
    var Label string?
    var Description string?
    var Leading Blob?
    var Disabled bool
}

/// Controlled radio selection and appearance.
public data struct RadioGroupInput {
    var Items[]?RadioOption
    var SelectedId string?
    var OnSelect Action[string]?
    var Orientation AccessibilityOrientation?
    var Card bool
    var Disabled bool
    var AccessibilityName string?
    var CreateItem Func[RadioGroupInput, RadioOption, Button, Button]?
    var CreateRoot Func[RadioGroupInput, Container, Container]?
}

/// One tab stop with arrow-key selection and radio accessibility.
public open class RadioGroup : Cell[RadioGroupInput] {
    private var input RadioGroupInput
    private var rightToLeft bool
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)

    protected override func Build(value RadioGroupInput) Blob {
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        input = value with{
            Items = value.Items ?? []RadioOption{},
            Orientation = value.Orientation ?? AccessibilityOrientation.Vertical,
        }
        let ids = HashSet[string](StringComparer.Ordinal)
        var tabStop string?
        for item in input.Items!! {
            if !input.Disabled && !item.Disabled && (tabStop == nil || item.Id == input.SelectedId) {
                tabStop = item.Id
            }
            if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id) {
                throw ArgumentException("Radio IDs must be nonempty and unique")
            }
        }
        let removed = List[string]()
        for entry in handles {
            if !ids.Contains(entry.Key) {
                removed.Add(entry.Key)
            }
        }
        for id in removed {
            handles.Remove(id)
        }
        var root = Container{Gap: theme.ControlGap}
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.Direction = theme.Direction
        root.FlexDirection = input.Orientation == AccessibilityOrientation.Horizontal ? FlexDirection.Row: FlexDirection.Column
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Group,
            Name: input.AccessibilityName ?? theme.Text("Choices"),
            Orientation: input.Orientation!!,
        }
        root.Children.Clear()
        for item in input.Items!! {
            let id = item.Id
            if !handles.ContainsKey(id) {
                handles.Add(id, ElementHandle())
            }
            let selected = id == input.SelectedId
            let label = item.Label ?? id
            let enabled = !input.Disabled && !item.Disabled
            let mark = Container{
                Width: 18,
                Height: 18,
                FlexShrink: 0,
                BorderRadius: 9,
                BorderWidth: theme.BorderWidth,
                BorderColor: selected ? theme.AccentColor: theme.InputBorderColor,
                BackgroundColor: theme.FieldColor,
                AlignItems: AlignItems.Center,
                JustifyContent: JustifyContent.Center,
            }
            if selected {
                mark.Children.Add(Container{Width: 10, Height: 10, BorderRadius: 5, BackgroundColor: theme.AccentColor})
            }
            let text = Container{
                Gap: theme.Spacing,
                Text{Content: label, FontFamily: theme.FontFamily, FontSize: theme.FontSize}
            }
            if let description = item.Description {
                text.Children.Add(
                    Text{Content: description, Color: theme.MutedTextColor, FontSize: theme.CaptionFontSize}
                )
            }
            var button = Button{
                MinHeight: theme.ControlHeight,
                FlexDirection: FlexDirection.Row,
                JustifyContent: JustifyContent.FlexStart,
                Gap: theme.ControlGap,
                Color: theme.TextColor,
                Focus: theme.FocusStyle,
                BorderWidth: input.Card ? theme.BorderWidth: 0,
                BorderRadius: theme.ControlRadius,
                BorderColor: selected ? theme.AccentColor: theme.InputBorderColor,
                Padding: input.Card ? theme.ControlPadding: 0,
                BackgroundColor: input.Card ? selected ? theme.ActiveColor: theme.PanelColor: Color.Transparent,
                Hover: Style{BackgroundColor: theme.HoverColor},
                Active: Style{BackgroundColor: theme.PressedColor},
                TransitionMs: theme.TransitionMs,
                Opacity: enabled ? 1.0: 0.5,
                mark,
            }
            if let leading = item.Leading {
                button.Children.Add(leading)
            }
            button.Children.Add(text)
            if let create = input.CreateItem {
                button = create(input, item, button)
            }
            button.Key = id
            button.Handle = handles[id]
            button.Disabled = !enabled
            button.Focusable = enabled
            button.TabStop = id == tabStop
            button.OnClick = () -> Select(id)
            button.OnKeyDown = (e KeyEvent) -> Move(id, e)
            button.Accessibility = Accessibility{
                Role: AccessibilityRole.Radio,
                Name: label,
                Description: item.Description ?? "",
                Checked: selected ? AccessibilityChecked.True: AccessibilityChecked.False,
            }
            WidgetKeyBindings.BindActivation(button)
            root.Children.Add(button)
        }
        return root
    }

    private func Enabled(id string) bool {
        for item in input.Items!! {
            if item.Id == id {
                return !input.Disabled && !item.Disabled
            }
        }
        return false
    }

    private func Select(id string) {
        if Enabled(id) {
            input.OnSelect?.Invoke(id)
        }
    }

    private func Move(id string, e KeyEvent) {
        if !Enabled(id) {
            return
        }
        let items = input.Items!!
        var current = -1
        for i in 0 ... items.Length {
            if items[i].Id == id {
                current = i
                break
            }
        }
        let next = RovingFocus.Next[RadioOption](
            items,
            current,
            e.Key,
            input.Orientation!!,
            true,
            (item RadioOption) -> item.Disabled,
            rightToLeft
        )
        if next < 0 {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        let handle = handles[items[next].Id]
        handle.Focus()
        Select(items[next].Id)
    }
}
