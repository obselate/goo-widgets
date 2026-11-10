package Goo.Widgets

import Goo

/// Retained subtree theme. Content must construct widgets inside the deferred callback.
public data struct ThemeScope {
    /// Palette and metrics, or nil to inherit. Missing values use Default. Window reduced-motion policy always applies.
    var Value Theme?
    /// Absolute control metrics, or nil to preserve the snapshot's metrics.
    var Density Density?
    /// Deferred content constructed under the retained provider.
    var Content Func[Blob]

    /// Builds a layout-transparent retained provider without changing window colors.
    public func Build() Blob {
        let inherited = Theme.Read()
        var value = Value?.ResolveDefaults() ?? inherited
        if value.Direction == Direction.Auto {
            value.Direction = inherited.Direction
        }
        value.Culture ??= inherited.Culture
        value.Translate ??= inherited.Translate
        if let density = Density {
            value = value.WithDensity(density)
        }
        value = value.WithAccessibility(inherited.HighContrast, inherited.PlatformTextScaleFactor, inherited.ReducedMotion)
        return Theme.Key.Scope(value, Content)
    }
}

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w ThemeScope) Blob -> w.Build()
