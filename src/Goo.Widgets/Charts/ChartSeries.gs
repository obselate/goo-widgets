package Goo.Widgets.Charts

import System
import System.Collections.Generic
import System.Globalization
import Goo

/// A stable, labeled nonnegative quantity. The host owns metric and color policy.
public data struct ChartSeries {
  /// Required unique identity.
  var Id string?
  /// Required human-readable label.
  var Label string?
  /// Finite, nonnegative quantity.
  var Value float64
  /// Series fill. Nil resolves to #818cf8.
  var Color Color?
}

/// Resolved data passed to chart customization factories.
public data struct ChartSegment {
  /// Source entry with resolved color.
  var Series ChartSeries
  /// Fraction of the total, or zero for an empty total.
  var Fraction float64
  /// Original series index.
  var Index int32
  /// Accessible label containing name, value, and percentage.
  var Summary string?
}

internal class ChartParts {
  shared {
    internal func Resolve(series []ChartSeries) []ChartSegment {
      let ids = HashSet[string](StringComparer.Ordinal)
      var scale = 0.0
      for item in series {
        if String.IsNullOrEmpty(item.Id) || !ids.Add(item.Id!!) || String.IsNullOrWhiteSpace(item.Label) { throw ArgumentException("Chart series require unique IDs and nonempty labels.") }
        if !Double.IsFinite(item.Value) || item.Value < 0.0 { throw ArgumentOutOfRangeException("Chart series value") }
        scale = Math.Max(scale, item.Value)
      }
      var total = 0.0
      if scale > 0.0 { for item in series { total += item.Value / scale } }
      let result = [series.Length]ChartSegment
      for index in 0 ... series.Length {
        let item = series[index]with{Color = series[index].Color ?? Color.Parse("#818cf8")}
        let fraction = total > 0.0 ? (item.Value / scale) / total : 0.0
        result[index] = ChartSegment{Series: item, Fraction: fraction, Index: index,
          Summary: item.Label + ": " + item.Value.ToString("G6", CultureInfo.InvariantCulture) + " (" + (fraction * 100.0).ToString("0.#", CultureInfo.InvariantCulture) + "%)"}
      }
      return result
    }

    internal func Wire(blob Blob, segment ChartSegment, activate Action[string]?, hover Action[string?]?) {
      let id = segment.Series.Id!!
      blob.Key = id
      blob.Focusable = activate != nil
      blob.OnClick = activate == nil ? nil : () -> activate?.Invoke(id)
      blob.OnPointerEnter = hover == nil ? nil : (e PointerEvent) -> hover?.Invoke(id)
      blob.OnPointerLeave = hover == nil ? nil : (e PointerEvent) -> hover?.Invoke(nil)
      blob.OnKeyDown = activate == nil ? nil : (e KeyEvent) -> {
        if e.Key == Key.Enter || e.Key == Key.Space { e.PreventDefault()
          activate?.Invoke(id) }
      }
      blob.Accessibility = Accessibility{Role: activate == nil ? AccessibilityRole.Image : AccessibilityRole.Button, Name: segment.Summary!!}
    }

    internal func Legend(segments []ChartSegment, label Func[ChartSegment, Text, Text]?) Container {
      let root = Container{FlexDirection: FlexDirection.Row, FlexWrap: FlexWrap.Wrap, Gap: 12}
      for segment in segments {
        var text = Text{Content: segment.Summary!!, Color: "#d4d4d8", FontSize: 12}
        if let create = label { text = create(segment, text) }
        root.Children.Add(Container{Key: segment.Series.Id!!, FlexDirection: FlexDirection.Row, AlignItems: AlignItems.Center, Gap: 6,
          Children: {Container{Width: 9, Height: 9, BorderRadius: 3, BackgroundColor: segment.Series.Color!!, Accessibility: Accessibility{Hidden: true}}, text}})
      }
      return root
    }

    internal func Summary(segments []ChartSegment) string {
      let labels = List[string]()
      for segment in segments { labels.Add(segment.Summary!!) }
      return labels.Count == 0 ? "No data" : String.Join("; ", labels)
    }
  }
}
