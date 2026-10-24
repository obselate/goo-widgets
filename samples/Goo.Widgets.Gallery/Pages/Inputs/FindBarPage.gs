package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs
import System.Text.RegularExpressions

internal class FindBarExample : Cell {
    private var query string = "widget"
    private var replacement string = "control"
    private var options FindOptions = FindOptions{WholeWord: true}
    private var active int32 = 1
    private var content string = "A widget can find a Widget, replace a widget, or match widgets as a whole word."
    private var isOpen bool = true

    public override func Build() Blob {
        let theme = Theme.Read()
        var issue string? = nil
        var expression Regex? = nil
        var matches MatchCollection? = nil
        if query != "" {
            let pattern = options.Regex ? query: Regex.Escape(query)
            try {
                expression = Regex(
                    options.WholeWord ? "\\b(?:" + pattern + ")\\b": pattern,
                    options.MatchCase ? RegexOptions.None: RegexOptions.IgnoreCase
                )
                matches = expression.Matches(content)
            } catch (error ArgumentException) {
                issue = "Invalid regular expression"
            }
        }
        let count = matches?.Count ?? 0
        active = count == 0 ? 0: Math.Clamp(active, 1, count)
        let bar = FindBar{
            Query: query,
            Options: options,
            MatchCount: count,
            ActiveMatch: active,
            Issue: issue,
            OnQueryChange: value -> {
                query = value
                active = 1
                Rebuild()
            },
            OnOptionsChange: value -> {
                options = value
                Rebuild()
            },
            OnReplacementChange: value -> {
                replacement = value
                Rebuild()
            },
            OnNext: () -> {
                active = active % count + 1
                Rebuild()
            },
            OnPrevious: () -> {
                active = (active + count - 2) % count + 1
                Rebuild()
            },
            OnClose: () -> {
                isOpen = false
                Rebuild()
            },
            OnReplace: () -> {
                content = expression!!.Replace(content, replacement, 1, matches!![active - 1].Index)
                Rebuild()
            },
            OnReplaceAll: () -> {
                content = expression!!.Replace(content, replacement)
                Rebuild()
            },
        }
        let root = Container{
            Width: Percent(100),
            MaxWidth: 680,
            MinWidth: 0,
            Gap: theme.ControlGap,
            Text{Content: content, Color: theme.TextColor, TextWrap: TextWrap.Wrap},
        }
        if isOpen {
            root.Children.Insert(0, bar.Build())
            root.Children.Insert(1, (bar with{Replacement = replacement}).Build())
        } else {
            root.Children.Insert(
                0,
                ActionButton{
                    Content: "Open find",
                    OnClick: () -> {
                        isOpen = true
                        Rebuild()
                    }
                }.Build()
            )
        }
        return root
    }
}

internal class FindBarPage : GalleryPage {
    override func Title() string -> "Find bar"

    override func Build() Blob -> Cell.Mount[FindBarExample]("find-bar-example")
}
