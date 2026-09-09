package Goo.Widgets.Icons

import System
import System.Collections.Generic
import System.Reflection
import Goo
import Goo.Svg

/// Loads the Material Symbols SVG assets shipped by Goo Widgets.
public class MaterialIcons {
  shared {
    private const Prefix string = "Goo.Widgets.MaterialSymbols."
    private const Suffix string = ".svg"
    private let assembly Assembly = typeof(MaterialIcons).Assembly
    private let gate object = Object()
    private let assets Dictionary[string, VectorAsset] = Dictionary[string, VectorAsset](StringComparer.Ordinal)

    /// Returns the names of the embedded Material Symbols assets.
    public func Names() []string {
      let names = List[string]()
      for resource in assembly.GetManifestResourceNames() {
        if resource.StartsWith(Prefix, StringComparison.Ordinal)
          && resource.EndsWith(Suffix, StringComparison.Ordinal) {
            names.Add(resource.Substring(Prefix.Length, resource.Length - Prefix.Length - Suffix.Length))
          }
      }
      names.Sort(StringComparer.Ordinal)
      return names.ToArray()
    }

    /// Creates a tinted Material Symbols shape sized to the requested square.
    public func Create(name string, size float64 = 24.0, color Color? = nil) Shape {
      if String.IsNullOrWhiteSpace(name) { throw ArgumentException("Icon name is required.") }
      if !Double.IsFinite(size) || size <= 0.0 { throw ArgumentOutOfRangeException("size") }
      let asset = Asset(name)
      let scale = Math.Min(size / float64(asset.ViewBoxWidth), size / float64(asset.ViewBoxHeight))
      return Shape{
        Path: asset.PathForNode(1),
        Width: size,
        Height: size,
        Fit: ShapeFit.Contain,
        Transform: PanelTransform{
          TranslateX: -float64(asset.ViewBoxX) * scale,
          TranslateY: -float64(asset.ViewBoxY) * scale,
        },
        BackgroundColor: color ?? Color.Parse("#fafafa"),
        Accessibility: Accessibility{ Hidden: true },
      }
    }

    private func Asset(name string) VectorAsset {
      lock gate {
        if assets.TryGetValue(name, out var existing) { return existing }
        let resource = Prefix + name + Suffix
        using let stream = assembly.GetManifestResourceStream(resource)
        if stream == nil { throw InvalidOperationException("Material icon resource not found: " + resource) }
        let asset = Svg.Load(stream!!)
        if asset.NodeCount != 2 || asset.CurveCount == 0 {
          throw InvalidOperationException("Material icon must contain one SVG path: " + resource)
        }
        assets[name] = asset
        return asset
      }
    }
  }
}
