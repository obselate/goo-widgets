package Goo.Widgets

import Goo

/// Retained subtree theme. Content must construct widgets inside the deferred callback.
public data struct ThemeScope {
    /// Palette and metrics, or nil to inherit. Window reduced-motion policy always applies.
    var Value Theme?
    /// Absolute control metrics, or nil to preserve the snapshot's metrics.
    var Density Density?
    /// Deferred content constructed under the retained provider.
    var Content Func[Blob]

    /// Builds a layout-transparent retained provider without changing window colors.
    public func Build() Blob {
        let inherited = Theme.Read()
        var value = Value ?? inherited
        value.ReducedMotion = inherited.ReducedMotion
        if value.ReducedMotion {
            value.TransitionMs = 0.0
        }
        if let density = Density {
            value = value.WithDensity(density)
        }
        return Theme.Key.Scope(value, Content)
    }
}
