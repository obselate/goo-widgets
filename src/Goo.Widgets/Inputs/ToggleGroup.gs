package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// Segmented, toolbar or chip presentation for a toggle group.
public enum ToggleGroupVariant {
    /// Joins choices inside one segmented frame.
    Segmented;
    /// Shows choices as separate toolbar buttons.
    Toolbar;
    /// Shows choices as rounded selectable chips.
    Chips
}

/// An identified toggle choice.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
public data struct ToggleOption {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
}

/// Controlled single or multiple selection and appearance.
public data struct ToggleGroupInput {
    /// Toggle choices in display order. Nil supplies no choices. IDs must be nonempty and unique.
    var Items[]?ToggleOption
    /// Controlled selected item IDs. Nil means an empty selection.
    var SelectedIds[]?string
    /// Enables set selection instead of single selection. False limits selection to one item.
    var Multiple bool
    /// Receives a new selected-ID array after activation. Single mode still emits an array. Nil ignores the request.
    var OnSelectionChange Action[[]string]?
    /// Selects the visual presentation without changing selection.
    var Variant ToggleGroupVariant
    /// Lets each option grow to share the available row space.
    var Stretch bool
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Direction of layout and arrow-key navigation. Nil uses horizontal layout.
    var Orientation AccessibilityOrientation?
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Configures the fresh item before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Checked, Accessibility.Name, Accessibility.Role, Disabled, Focusable, Handle, Key, KeyBindings (required entries), OnBlur, OnClick, OnFocus, OnKeyDown, TabStop.
    var ConfigureItem Action[ToggleGroupInput, ToggleOption, Button]?
    /// Configures the fresh root before required behavior is applied.
    /// Edit only the supplied element. Use content slots for custom child trees.
    /// Widget-owned fields: Accessibility.Name, Accessibility.Orientation, Accessibility.Role.
    var ConfigureRoot Action[ToggleGroupInput, Container]?
}

/// A roving group that selects one choice or toggles several choices.
public open class ToggleGroup : Cell[ToggleGroupInput] {
    private var input ToggleGroupInput
    private var rightToLeft bool
    private var focusedId string?
    private var hasFocus bool
    private let handles Dictionary[string, ElementHandle] = Dictionary[string, ElementHandle](StringComparer.Ordinal)

    protected override func Build(value ToggleGroupInput) Blob {
        let theme = Theme.Read()
        rightToLeft = theme.RightToLeft
        input = value with{
            Items = value.Items ?? []ToggleOption{},
            SelectedIds = value.SelectedIds ?? []string{},
            Orientation = value.Orientation ?? AccessibilityOrientation.Horizontal,
        }
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
            Gap: input.Variant == ToggleGroupVariant.Segmented ? 0: theme.ControlGap,
            Padding: input.Variant == ToggleGroupVariant.Segmented ? theme.Spacing: 0,
            BorderRadius: theme.ControlRadius!!,
            BackgroundColor: input.Variant == ToggleGroupVariant.Segmented ? theme.SunkenColor: Color.Transparent,
        }
        root.Children.Clear()
        for item in items {
            let id = item.Id
            if !handles.ContainsKey(id) {
                handles.Add(id, ElementHandle())
            }
            let active = Selected(id)
            let enabled = !input.Disabled && !item.Disabled
            let selectedFill = input.Variant == ToggleGroupVariant.Segmented && !theme.HighContrast ? theme.RaisedColor: theme.SelectedFill(theme.ActiveColor)
            var button = Button{
                MinHeight: theme.ControlHeight,
                Padding: Edges{Left: theme.ControlPadding, Right: theme.ControlPadding},
                FlexGrow: input.Stretch ? 1: 0,
                FlexShrink: 1,
                MinWidth: 0,
                FlexDirection: FlexDirection.Row,
                Gap: theme.ControlGap,
                BorderWidth: input.Variant == ToggleGroupVariant.Segmented ? Math.Max(2.0, theme.BorderWidth):
                input.Variant == ToggleGroupVariant.Chips || theme.HighContrast ? theme.BorderWidth: 0,
                BorderColor: input.Variant == ToggleGroupVariant.Segmented
                ? active ? theme.StrongBorderColor: Color.Transparent
                : active ? theme.AccentColor: theme.InputBorderColor,
                BorderRadius: input.Variant == ToggleGroupVariant.Chips ? theme.ControlHeight / 2: theme.ControlRadius!!,
                BackgroundColor: active ? selectedFill: Color.Transparent,
                BoxShadow: active && input.Variant == ToggleGroupVariant.Segmented ? theme.ElevationSm: BoxShadow{},
                Color: active ? theme.SelectedText(theme.TextColor, selectedFill): theme.MutedTextColor,
                HoverStyle: active ? Style{BackgroundColor: selectedFill}: nil,
                ActiveStyle: active ? Style{BackgroundColor: selectedFill}: nil,
                TransitionMs: theme.TransitionMs,
                TransitionEasing: Easing.EaseOut,
                TransitionProperties: theme.InteractionTransitions,
                DisabledStyle: Style{BackgroundColor: theme.PanelColor},
            }
            if let leading = item.Leading {
                button.Children.Add(leading)
            }
            button.Children.Add(
                Text{
                    Content: item.Label ?? id,
                    FontFamily: theme.FontFamily,
                    FontSize: theme.FontSize,
                    TextWrap: TextWrap.NoWrap,
                    TextTrimming: TextTrimming.Ellipsis,
                    MinWidth: 0,
                    FlexShrink: 1,
                }
            )
            input.ConfigureItem?.Invoke(input, item, button)
            theme.ApplyInteraction(button, InteractionFamily.Toggle, active)
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
            let buttonAccessibility = if let configured = button.Accessibility { Accessibility{...configured} } else { Accessibility{} }
            buttonAccessibility.Role = AccessibilityRole.Button
            buttonAccessibility.Name = item.Label ?? id
            buttonAccessibility.Checked = active ? AccessibilityChecked.True: AccessibilityChecked.False
            button.Accessibility = buttonAccessibility
            WidgetKeyBindings.BindActivation(button)
            root.Children.Add(button)
        }
        input.ConfigureRoot?.Invoke(input, root)
        root.Direction = theme.Direction
        root.FlexDirection = input.Orientation == AccessibilityOrientation.Vertical ? FlexDirection.Column: FlexDirection.Row
        let rootAccessibility = if let configured = root.Accessibility { Accessibility{...configured} } else { Accessibility{} }
        rootAccessibility.Role = AccessibilityRole.Group
        rootAccessibility.Name = input.AccessibilityName ?? theme.Text("Options")
        rootAccessibility.Orientation = input.Orientation!!
        root.Accessibility = rootAccessibility
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
            if let callback = input.OnSelectionChange {
                InvokeInputCallback(callback, []string{id})
            }
            return
        }
        let result = List[string]()
        for item in input.Items!! {
            if item.Id == id ? !Selected(id): Selected(item.Id) {
                result.Add(item.Id)
            }
        }
        if let callback = input.OnSelectionChange {
            InvokeInputCallback(callback, result.ToArray())
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
        let next = RovingFocus.Next[ToggleOption](
            items,
            current,
            e.Key,
            input.Orientation!!,
            true,
            (item ToggleOption) -> item.Disabled,
            rightToLeft
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
