package Goo.Widgets

import Goo
import System

internal class FuzzyMatchLabel {
    shared {
        internal func Create(text string, match FuzzyMatchResult, theme Theme) Container {
            let label = Container{
                Direction: RightToLeftText(text) ? Direction.RightToLeft: Direction.LeftToRight,
                FlexDirection: FlexDirection.Row,
                MinWidth: 0,
                FlexShrink: 1
            }
            var position = 0
            for span in match.Ranges {
                if span.Start > position {
                    label.Children.Add(
                        Text{Content: text.Substring(position, span.Start - position), TextWrap: TextWrap.NoWrap, FlexShrink: 0,}
                    )
                }
                label.Children.Add(
                    Text{
                        Content: text.Substring(span.Start, span.Length),
                        FontWeight: theme.HeadingFontWeight,
                        Color: theme.LinkColor,
                        TextWrap: TextWrap.NoWrap,
                        FlexShrink: 0,
                    }
                )
                position = span.Start + span.Length
            }
            if position < text.Length {
                label.Children.Add(Text{Content: text.Substring(position), TextWrap: TextWrap.NoWrap})
            }
            if label.Children.Count > 0 {
                let tail = (label.Children[label.Children.Count - 1] as Text)!!
                tail.MinWidth = 0
                tail.FlexShrink = 1
                tail.TextTrimming = TextTrimming.Ellipsis
            }
            return label
        }

        private func RightToLeftText(text string) bool {
            for c in text {
                if (c >= '\u0590' && c <= '\u08FF') || (c >= '\uFB1D' && c <= '\uFDFF') || (c >= '\uFE70' && c <= '\uFEFF') {
                    return true
                }
                if Char.IsLetter(c) {
                    return false
                }
            }
            return false
        }
    }
}
