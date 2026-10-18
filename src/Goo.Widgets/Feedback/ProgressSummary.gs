package Goo.Widgets.Feedback

import Goo
import Goo.Widgets

/// A labeled progress row that composes ProgressBar with optional detail and accessory slots.
public data struct ProgressSummary {
    /// Main label. Nil resolves to an empty string.
    var Label string?
    /// Optional secondary progress detail.
    var Detail string?
    /// Optional leading content.
    var Leading Blob?
    /// Optional trailing content.
    var Trailing Blob?
    /// Progress bar configuration.
    var Progress ProgressBar
    /// Accessible group name. Nil resolves to the label.
    var AccessibilityName string?
    /// Root width. Nil resolves to 100%.
    var Width Length?
    /// Gap between rows. Nil uses the nearest theme gap and preserves explicit zero.
    var Gap float64?
    /// Header content gap. Nil uses the nearest theme gap and preserves explicit zero.
    var HeaderGap float64?
    /// Label color. Nil uses the nearest theme.
    var LabelColor Color?
    /// Detail color. Nil uses the nearest theme.
    var DetailColor Color?
    /// Label font size. Zero uses the nearest theme font size.
    var LabelFontSize float64
    /// Label font weight. Zero uses the nearest theme label font weight.
    var LabelFontWeight int32
    /// Detail font size. Zero uses the nearest theme caption font size.
    var DetailFontSize float64
    /// Optional font family for default text.
    var FontFamily string?
    /// Creates the progress element from resolved values.
    var CreateProgress Func[ProgressSummary, Blob]?
    /// Creates the final root from resolved values, header, and progress element.
    var CreateRoot Func[ProgressSummary, Container, Blob, Container]?

    /// Builds a fresh labeled progress tree.
    public func Build() Blob {
        let theme = Theme.Read()
        let createProgress = CreateProgress
        let createRoot = CreateRoot
        let label = Label ?? ""
        let resolved = this with{
            Label = label,
            AccessibilityName = AccessibilityName ?? label,
            Width = Width ?? Percent(100.0),
            Gap = Gap ?? theme.ControlGap,
            HeaderGap = HeaderGap ?? theme.ControlGap,
            LabelColor = LabelColor ?? theme.TextColor,
            DetailColor = DetailColor ?? theme.MutedTextColor,
            FontFamily = FontFamily ?? theme.FontFamily,
            LabelFontSize = if LabelFontSize == 0.0 {
                theme.FontSize
            } else {
                LabelFontSize
            },
            LabelFontWeight = if LabelFontWeight == 0 {
                theme.LabelFontWeight
            } else {
                LabelFontWeight
            },
            DetailFontSize = if DetailFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                DetailFontSize
            },
            CreateProgress = nil,
            CreateRoot = nil,
        }

        let labelText = Text{
            Content: label,
            Color: resolved.LabelColor!!,
            FontSize: resolved.LabelFontSize,
            FontWeight: resolved.LabelFontWeight,
        }
        if resolved.FontFamily != nil {
            labelText.FontFamily = resolved.FontFamily!!
        }
        let header = Container{
            Width: Percent(100.0),
            Gap: resolved.HeaderGap!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
        }
        if let leading = Leading {
            header.Children.Add(leading)
        }
        header.Children.Add(labelText)
        header.Children.Add(Container{FlexGrow: 1.0})
        if Detail != nil {
            let detailText = Text{Content: Detail!!, Color: resolved.DetailColor!!, FontSize: resolved.DetailFontSize,}
            if resolved.FontFamily != nil {
                detailText.FontFamily = resolved.FontFamily!!
            }
            header.Children.Add(detailText)
        }
        if let trailing = Trailing {
            header.Children.Add(trailing)
        }

        let progress = if let createProgress = createProgress {
            createProgress(resolved)
        } else {
            resolved.Progress.Build()
        }
        if let createRoot = createRoot {
            return createRoot(resolved, header, progress)
        }
        return Container{
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            Gap: resolved.Gap!!,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!,},
            header,
            progress,
        }
    }
}
