import Goo.Widgets.Markdown
import System
import System.Collections.Generic
import System.Text

internal class MarkdownFuzz {
    shared {
        internal func Run(input[]uint8) {
            let parser = MarkdownParser()
            let fragments = []string{"# Same\n", "# Same-2\n", "## Same\n", "\n", "**bold** ", "[a *b*](https://example.org) ",
                "![alt](image.png)\n", "> [!NOTE]\n> text\n", "- item\n", "```gs\ncode\n```\n", "a | b\n--|--\nc | d\n", "é👩‍💻é", "<tag>", "\\", "\0", "~~text~~"}
            var text = Encoding.UTF8.GetString(input)
            Fingerprint(parser.Parse(text))
            for value in input {
                let number = int32(value)
                let fragment = fragments[number % fragments.Length]
                switch number % 4 {
                    case 0 { text += fragment }
                    case 1 { text = fragment + text }
                    case 2 { text = text.Substring(0, text.Length == 0 ? 0: number % (text.Length + 1)) }
                    case 3 {
                        let position = text.Length == 0 ? 0: number % (text.Length + 1)
                        text = text.Insert(position, fragment)
                    }
                }
                if text.Length > 4096 { text = text.Substring(0, 4096) }
                let retained = Fingerprint(parser.Parse(text))
                let fresh = Fingerprint(MarkdownParser().Parse(text))
                NavigationFuzz.Require(retained == fresh, "Markdown parser retained state changed the result")
            }
        }

        private func Fingerprint(models[]MarkdownModel) string {
            let output = StringBuilder()
            let keys = HashSet[string](StringComparer.Ordinal)
            let headings = HashSet[string](StringComparer.Ordinal)
            for model in models {
                NavigationFuzz.Require(model.Key.Length > 0 && keys.Add(model.Key), "Markdown block keys are not unique")
                Visit(model, output, headings)
            }
            return output.ToString()
        }

        private func Visit(model MarkdownModel, output StringBuilder, headings HashSet[string]) {
            let block = model.Block
            let text = block.Text ?? ""
            if block.Kind == MarkdownBlockKind.Heading {
                NavigationFuzz.Require(!String.IsNullOrEmpty(block.Id) && headings.Add(block.Id!!), "Markdown heading IDs are not unique")
                NavigationFuzz.Require(block.HeadingLevel >= 1 && block.HeadingLevel <= 6, "Markdown heading level is invalid")
            }
            output.Append(model.Path).Append('\0').Append(model.Key).Append('\0').Append(block.Kind).Append(block.HeadingLevel).Append('\0')
            output.Append(text).Append('\0').Append(block.Id).Append('\0').Append(block.Language).Append('\0').Append(block.AlertKind).Append('\0')
            output.Append(model.Ordered).Append(model.Start).Append(model.Header).Append('\0')
            var end = 0
            for run in model.Runs {
                NavigationFuzz.Require(run.Start == end && run.Length > 0 && run.Start <= text.Length - run.Length,
                    "Markdown inline spans do not partition the block text")
                NavigationFuzz.Require(text.Substring(run.Start, run.Length) == run.Text, "Markdown inline text disagrees with its span")
                end += run.Length
                output.Append(run.Kind).Append(run.Bold).Append(run.Italic).Append(run.Strikethrough).Append('\0')
                output.Append(run.Text).Append('\0').Append(run.Target).Append('\0').Append(run.Title).Append('\0')
            }
            if model.Runs.Length > 0 { NavigationFuzz.Require(end == text.Length, "Markdown inline spans omit text") }
            for child in model.Children { Visit(child, output, headings) }
            output.Append('\n')
        }
    }
}
