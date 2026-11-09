package Goo.Widgets.Inputs

import Goo
import System
import System.Collections.Generic
import System.Linq

/// Finds the widest single-line label of an option set. Keeps label widths until the font changes.
internal class LabelWidths {
    private var widths Dictionary[string, float32] = Dictionary[string, float32](StringComparer.Ordinal)
    private var source object?
    private var family string = ""
    private var size float64
    private var weight int32
    private var widest float64

    /// Returns the widest label in logical pixels, or the first measured width that fills the popup width cap.
    /// Measures each distinct label once, longest first, so that long labels reach the cap early.
    /// Returns the previous result when items is the same array and the font is the same.
    internal func Widest[T](items[]T, label Func[T, string?], theme Theme, weight int32, chrome float64) float64 {
        let window = Theme.Key.Window
        let sameFont = theme.FontFamily == family && theme.FontSize * theme.PlatformTextScaleFactor == size && weight == this.weight
        if sameFont && Object.ReferenceEquals(items, source) {
            return widest
        }
        let distinct = HashSet[string](StringComparer.Ordinal)
        for item in items {
            if let text = label(item) {
                distinct.Add(text)
            }
        }
        let texts = distinct.ToArray()
        let lengths = texts.Select((text string) -> -text.Length).ToArray()
        Array.Sort(lengths, texts)
        let style = Text{FontFamily: theme.FontFamily, FontSize: theme.FontSize, FontWeight: weight}
        let cap = Math.Min(32.5 * theme.FontSize * theme.PlatformTextScaleFactor, float64(window.Width)) - chrome
        let measured = Dictionary[string, float32](StringComparer.Ordinal)
        var result = 0.0
        for text in texts {
            if result >= cap {
                break
            }
            let width = sameFont && widths.TryGetValue(text, out var known) ? known: window.MeasureText(text, style)
            measured.Add(text, width)
            result = Math.Max(result, float64(width))
        }
        widths = measured
        source = items
        family = theme.FontFamily
        size = theme.FontSize * theme.PlatformTextScaleFactor
        this.weight = weight
        widest = result
        return widest
    }
}
