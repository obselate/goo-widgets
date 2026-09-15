package Goo.Widgets.Data

import System

/// One item in a searchable selection list. Id must be unique within the list.
public data struct SelectionItem {
    /// Stable application identifier. Nil resolves to an empty identifier.
    var Id string?
    /// Primary display text.
    var Label string?
    /// Optional secondary text, also included in search.
    var Detail string?
    /// Prevents selection while keeping the item visible.
    var Disabled bool
}
