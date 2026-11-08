package Goo.Widgets.Inputs

import Goo
import Goo.Widgets
import System
import System.Collections.Generic

/// An identified radio choice with optional descriptive content.
public data struct RadioOption {
    /// Stable, nonempty identity. Keep it unique within the collection.
    var Id string
    /// Visible and accessible label. Nil uses the item ID.
    var Label string?
    /// Supporting text shown with the label. Nil omits it.
    var Description string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
}

/// Controlled radio selection and appearance.
public data struct RadioGroupInput {
    /// Radio choices in display order. Nil supplies no choices. IDs must be stable and unique.
    var Items[]?RadioOption
    /// Controlled selected item ID. Nil means no selection.
    var SelectedId string?
    /// Receives the selected item ID after user selection. Nil ignores the request.
    var OnSelect Action[string]?
    /// Direction of layout and arrow-key navigation. Nil uses horizontal layout.
    var Orientation AccessibilityOrientation?
    /// Uses a bordered card presentation for each labeled choice.
    var Card bool
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Accessible name override. Nil uses the widget label or localized default.
    var AccessibilityName string?
    /// Receives the widget input, the radio option, and the prepared button, and returns the replacement button. Nil uses the default composition.
    /// Hosts must not change state in this callback.
    var CreateItem Func[RadioGroupInput, RadioOption, Button, Button]?
    /// Receives the widget input and the prepared container, and returns the replacement container. Nil uses the default composition.
    /// Hosts must not change state in this callback.
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
            let button = (RadioButton{
                Value: selected,
                Label: item.Label ?? id,
                Description: item.Description,
                Leading: item.Leading,
                Card: input.Card,
                Disabled: input.Disabled || item.Disabled,
                OnChange: (value bool) -> Select(id),
                CreateRoot: (value RadioButton, prepared Button) -> {
                    var button = prepared
                    if let create = input.CreateItem {
                        button = create(input, item, button)
                    }
                    button.Handle = handles[id]
                    return button
                },
            }.Build() as Button)!!
            button.Key = id
            button.TabStop = id == tabStop
            button.OnKeyDown = (e KeyEvent) -> Move(id, e)
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
            InvokeInputCallback(input.OnSelect, id)
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
