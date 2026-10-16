package Goo.Widgets.Navigation

import Goo

/// One selectable entry in a NavigationRail.
public data struct NavigationItem {
    /// Stable value passed to OnSelect. Mounted rails and tab bars require a nonempty, unique ID.
    var Id string?
    /// Visible label. Nil resolves to the item ID.
    var Label string?
    /// Accessible name. Nil resolves to the visible label.
    var AccessibilityName string?
    /// Optional compact content, such as an icon.
    var Content Blob?
    /// Whether this item rejects input.
    var Disabled bool
}
