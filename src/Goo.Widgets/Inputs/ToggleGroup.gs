package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// Segmented, toolbar or chip presentation for a toggle group.
public enum ToggleGroupLook {
    Segmented;
    Toolbar;
    Chips
}

/// An identified toggle choice.
public data struct ToggleOption {
    var Id string
    var Label string?
    var Leading Blob?
    var Disabled bool
}

/// Controlled single or multiple selection and appearance.
public data struct ToggleGroupInput {
    var Items[]?ToggleOption
    var SelectedIds[]?string
    var Multiple bool
    var OnChange Action[[]string]?
    var Look ToggleGroupLook
    var Stretch bool
    var Disabled bool
    var Orientation AccessibilityOrientation = AccessibilityOrientation.Horizontal
    var AccessibilityName string?
    var CreateItem Func[ToggleGroupInput, ToggleOption, Button, Button]?
    var CreateRoot Func[ToggleGroupInput, Container, Container]?
}

/// A roving group that selects one choice or toggles several choices.
public open class ToggleGroup : Cell[ToggleGroupInput] {
    private var input ToggleGroupInput
    private var focusedId string?
    private var hasFocus bool
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)

    protected override func Build(value ToggleGroupInput) Blob {
        let theme = Theme.Read()
        input = value with{Items = value.Items ?? []ToggleOption{}, SelectedIds = value.SelectedIds ?? []string{}}
        let items = input.Items!!
        let selected = input.SelectedIds!!
        let activeId string? = hasFocus ? focusedId: selected.Length > 0 ? selected[0]: nil
        var tabStop string?
        let seen = HashSet[string](StringComparer.Ordinal)
        for item in items {
            if String.IsNullOrEmpty(item.Id) || !seen.Add(item.Id) {
                throw ArgumentException("Toggle IDs must be nonempty and unique")
            }
            if !input.Disabled && !item.Disabled && (tabStop == nil || item.Id == activeId) {
                tabStop = item.Id
            }
        }
        let removed = List[string]()
        for entry in handles {
            if !seen.Contains(entry.Key) {
                removed.Add(entry.Key)
            }
        }
        for id in removed {
            handles.Remove(id)
        }
        var root = Container{
            Gap: input.Look == ToggleGroupLook.Segmented ? 0: theme.ControlGap,
            Padding: input.Look == ToggleGroupLook.Segmented ? theme.Spacing: 0,
            BorderRadius: theme.ControlRadius,
            BackgroundColor: input.Look == ToggleGroupLook.Segmented ? theme.SunkenColor: Color.Transparent,
        }
        if let create = input.CreateRoot {
            root = create(input, root)
        }
        root.FlexDirection = input.Orientation == AccessibilityOrientation.Vertical ? FlexDirection.Column: FlexDirection.Row
        root.Accessibility = Accessibility{
            Role: AccessibilityRole.Group,
            Name: input.AccessibilityName ?? "Options",
            Orientation: input.Orientation,
        }
        root.Children.Clear()
        for item in items {
            let id = item.Id
            if !handles.ContainsKey(id) {
                handles.Add(id, ElementHandle())
            }
            let active = Selected(id)
            let enabled = !input.Disabled && !item.Disabled
            var button = Button{
                MinHeight: theme.ControlHeight,
                Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
                FlexGrow: input.Stretch ? 1: 0,
                FlexDirection: FlexDirection.Row,
                Gap: theme.ControlGap,
                BorderWidth: input.Look == ToggleGroupLook.Segmented ? Math.Max(2.0, theme.BorderWidth):
                input.Look == ToggleGroupLook.Chips ? theme.BorderWidth: 0,
                BorderColor: input.Look == ToggleGroupLook.Segmented
                ? active ? theme.StrongBorderColor: Color.Transparent
                : active ? theme.AccentColor: theme.InputBorderColor,
                BorderRadius: input.Look == ToggleGroupLook.Chips ? theme.ControlHeight / 2: theme.ControlRadius,
                BackgroundColor: active
                ? input.Look == ToggleGroupLook.Segmented ? theme.RaisedColor: theme.ActiveColor
                : Color.Transparent,
                BoxShadow: active && input.Look == ToggleGroupLook.Segmented ? theme.ElevationSm: BoxShadow{},
                Color: active ? theme.TextColor: theme.MutedTextColor,
                Hover: Style{BackgroundColor: theme.HoverColor},
                Active: Style{BackgroundColor: theme.PressedColor},
                Focus: theme.FocusStyle,
                TransitionMs: theme.TransitionMs,
                Opacity: enabled ? 1.0: 0.5,
            }
            if let leading = item.Leading {
                button.Children.Add(leading)
            }
            button.Children.Add(Text{Content: item.Label ?? id, FontFamily: theme.FontFamily, FontSize: theme.FontSize})
            if let create = input.CreateItem {
                button = create(input, item, button)
            }
            button.Key = id
            button.Handle = handles[id]
            button.Disabled = !enabled
            button.Focusable = enabled
            button.TabStop = id == tabStop
            button.OnClick = () -> Select(id)
            button.OnFocus = (e FocusEvent) -> {
                focusedId = id
                hasFocus = true
                Rebuild()
            }
            button.OnBlur = (e FocusEvent) -> {
                hasFocus = false
                Rebuild()
            }
            button.OnKeyDown = (e KeyEvent) -> Move(id, e)
            button.Accessibility = Accessibility{
                Role: AccessibilityRole.Button,
                Name: item.Label ?? id,
                Checked: active ? AccessibilityChecked.True: AccessibilityChecked.False,
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

    private func Selected(id string) bool {
        for selected in input.SelectedIds!! {
            if selected == id {
                return true
            }
        }
        return false
    }

    private func Select(id string) {
        if !Enabled(id) {
            return
        }
        if !input.Multiple {
            input.OnChange?.Invoke([]string{id})
            return
        }
        let result = List[string]()
        for item in input.Items!! {
            if item.Id == id ? !Selected(id): Selected(item.Id) {
                result.Add(item.Id)
            }
        }
        input.OnChange?.Invoke(result.ToArray())
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
        let next = RovingFocus.Next[ToggleOption](
            items,
            current,
            e.Key,
            input.Orientation,
            true,
            (item ToggleOption) -> item.Disabled
        )
        if next < 0 {
            return
        }
        e.PreventDefault()
        e.StopPropagation()
        let handle = handles[items[next].Id]
        handle.Focus()
        if !input.Multiple {
            Select(items[next].Id)
        }
    }
}
