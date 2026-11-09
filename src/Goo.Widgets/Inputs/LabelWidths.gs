package Goo.Widgets.Inputs

import Goo
import System
import System.Collections.Generic

/// Finds the widest single-line label of an option set. Keeps each label width until the font changes.
/// Measures at most the 1,000 labels with the most characters, about one frame of text shaping.
internal class LabelWidths {
    private let limit int32 = 1000
    private var widths Dictionary[string, float32] = Dictionary[string, float32](StringComparer.Ordinal)
    private var source object?
    private var family string = ""
    private var size float64
    private var weight int32
    private var widest float64

    /// Returns the widest measured label in logical pixels. Measures only labels that are new since the last call with the same font.
    /// Returns the previous result when items is the same array and the font is the same.
    internal func Widest[T](items[]T, label Func[T, string?], family string, size float64, weight int32) float64 {
        let sameFont = family == this.family && size == this.size && weight == this.weight
        if sameFont && Object.ReferenceEquals(items, source) {
            return widest
        }
        let texts = List[string](items.Length)
        for item in items {
            if let text = label(item) {
                texts.Add(text)
            }
        }
        let candidates = texts.ToArray()
        if candidates.Length > limit {
            let lengths = [candidates.Length]int32
            for index in 0 ... candidates.Length {
                lengths[index] = -candidates[index].Length
            }
            Array.Sort(lengths, candidates)
        }
        let style = Text{FontFamily: family, FontSize: size, FontWeight: weight}
        let window = Theme.Key.Window
        let measured = Dictionary[string, float32](StringComparer.Ordinal)
        var result = 0.0F
        for index in 0 ... Math.Min(candidates.Length, limit) {
            let text = candidates[index]
            if !measured.ContainsKey(text) {
                measured.Add(text, sameFont && widths.TryGetValue(text, out var known) ? known: window.MeasureText(text, style))
            }
            result = MathF.Max(result, measured[text])
        }
        widths = measured
        source = items
        this.family = family
        this.size = size
        this.weight = weight
        widest = float64(result)
        return widest
    }
}
