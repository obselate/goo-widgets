package Goo.Widgets

import Goo
import System
import System.Collections.Generic

/// A successful case-insensitive subsequence match. Higher scores rank first.
public data struct FuzzyMatchResult {
    var Score int32
    /// Contiguous UTF-16 ranges in the original text.
    var Ranges[]TextRange
}

/// An item and its match, returned in stable score order.
public data struct FuzzyMatchItem[T] {
    var Item T
    var Match FuzzyMatchResult
    internal var Order int32
}

/// Shared matching and highlight ranges for command lists and menus.
public class FuzzyMatch {
    shared {
        /// Returns nil when the query is not a subsequence. Empty queries match every item.
        public func Match(query string, text string) FuzzyMatchResult? {
            if query.Length == 0 {
                return FuzzyMatchResult{Ranges: []TextRange{}}
            }
            if query.Length > text.Length {
                return nil
            }
            let contiguous = text.IndexOf(query, StringComparison.OrdinalIgnoreCase)
            if contiguous >= 0 {
                let score = text.Length == query.Length ? 100000: contiguous == 0 ? 50000: 25000
                return FuzzyMatchResult{
                    Score: score,
                    Ranges: []TextRange{TextRange{Start: contiguous, Length: query.Length}}
                }
            }
            let ranges = List[TextRange]()
            var position = 0
            var score = 0
            var start = -1
            var end = -1
            for letter in 0 ... query.Length {
                var index = position
                while index < text.Length && String.Compare(
                    text,
                    index,
                    query,
                    letter,
                    1,
                    StringComparison.OrdinalIgnoreCase
                ) != 0 {
                    index++
                }
                if index == text.Length {
                    return nil
                }
                if index == end {
                    score += 20
                } else {
                    if start >= 0 {
                        ranges.Add(TextRange{Start: start, Length: end - start})
                    }
                    start = index
                }
                if index == 0 || !Char.IsLetterOrDigit(text[index - 1]) {
                    score += 10
                }
                score -= index - position
                end = index + 1
                position = end
            }
            ranges.Add(TextRange{Start: start, Length: end - start})
            return FuzzyMatchResult{Score: score, Ranges: ranges.ToArray()}
        }

        /// Removes nonmatches and retains source order when scores are equal.
        public func Rank[T](items IReadOnlyList[T], query string, textForItem Func[T, string])[]FuzzyMatchItem[T] {
            let matches = List[FuzzyMatchItem[T]]()
            for index in 0 ... items.Count {
                if let match = Match(query, textForItem(items[index])) {
                    matches.Add(FuzzyMatchItem[T]{Item: items[index], Match: match, Order: index})
                }
            }
            matches.Sort(
                (a FuzzyMatchItem[T], b FuzzyMatchItem[T]) -> {
                    let score = b.Match.Score.CompareTo(a.Match.Score)
                    return score == 0 ? a.Order.CompareTo(b.Order): score
                }
            )
            return matches.ToArray()
        }
    }
}
