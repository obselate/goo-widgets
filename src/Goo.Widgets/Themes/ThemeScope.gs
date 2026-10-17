package Goo.Widgets

import Goo
import System

/// Retained subtree theme. Content must construct widgets inside the deferred callback.
public data struct ThemeScope {
    /// Exact snapshot, or nil to inherit the nearest theme.
    var Value Theme?
    /// Absolute control metrics, or nil to preserve the snapshot's metrics.
    var Density Density?
    /// Deferred content. Replacing factories own their focus and scrolling semantics.
    var Content Func[Blob]

    /// Builds a layout-transparent retained provider without changing window colors.
    public func Build() Blob {
        var value = Value ?? Theme.Read()
        if let density = Density {
            value = value.WithDensity(density)
        }
        return Theme.Key.Scope(value, Content)
    }
}
