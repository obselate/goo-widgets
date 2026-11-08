package Goo.Widgets.Actions

import Goo
import System

/// A controlled two-state button with pressed accessibility semantics.
public data struct ToggleButton {
    /// Controlled pressed value. False means released.
    var Value bool
    /// Requests the opposite value after activation. Nil ignores the request.
    var OnChange Action[bool]?
    /// Visible label. Nil leaves the label empty.
    var Content string?
    /// Content before the label. Nil leaves this slot empty.
    var Leading Blob?
    /// Rejects interaction and removes the button from Tab traversal.
    var Disabled bool
    /// Accessible name. Nil uses Content.
    var AccessibilityName string?

    /// Builds a button that retains Value until the host supplies a new value.
    public func Build() Blob {
        let value = Value
        let onChange = OnChange
        return ActionButton{
            Content: Content,
            Leading: Leading,
            Disabled: Disabled,
            AccessibilityName: AccessibilityName,
            Pressed: value,
            OnClick: () -> onChange?.Invoke(!value),
        }.Build()
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w ToggleButton) Blob -> w.Build()
