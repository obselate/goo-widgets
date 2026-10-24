package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import System

/// Selects the paint for one card composition.
public enum CardVariant {
    Card;
    Panel;
    Frame;
    Well
}

/// A titled surface. Pressable cards must contain display-only content.
public data struct Card {
    var Variant CardVariant
    var Title string?
    var Subtitle string?
    var HeaderAction Blob?
    var Content Blob?
    var Footer Blob?
    var Padding float64?
    var OnClick Action?
    var Disabled bool
    var AccessibilityName string?
    var CreateRoot Func[Card, Container, Blob]?

    /// Builds a group or a single pressable surface.
    public func Build() Blob {
        let theme = Theme.Read()
        let resolved = this with{Padding = Padding ?? theme.PanelPadding}
        let body = Container{
            Width: Percent(100),
            MinWidth: 0,
            Padding: resolved.Padding!!,
            Gap: theme.ControlGap,
            Color: theme.TextColor,
            FontFamily: theme.FontFamily,
            FontSize: theme.FontSize,
            LineHeight: theme.LineHeight
        }
        if Title != nil || Subtitle != nil || HeaderAction != nil {
            let titles = Container{FlexGrow: 1, MinWidth: 0, Gap: theme.Spacing}
            if let title = Title {
                titles.Children.Add(Text{Content: title, FontWeight: theme.HeadingFontWeight})
            }
            if let subtitle = Subtitle {
                titles.Children.Add(
                    Text{Content: subtitle, Color: theme.MutedTextColor, FontSize: theme.CaptionFontSize}
                )
            }
            let header = Container{
                FlexDirection: FlexDirection.Row,
                AlignItems: AlignItems.Center,
                Gap: theme.ControlGap,
                titles
            }
            if let action = HeaderAction {
                header.Children.Add(action)
            }
            body.Children.Add(header)
        }
        if let content = Content {
            body.Children.Add(content)
        }
        if let footer = Footer {
            body.Children.Add(footer)
        }
        let background = Variant == CardVariant.Well ? theme.SunkenColor: Variant == CardVariant.Frame ? Color.Transparent: theme.PanelColor
        let radius = Variant == CardVariant.Panel ? 0: theme.PanelRadius
        body.BackgroundColor = background
        body.BorderColor = theme.BorderColor
        body.BorderWidth = theme.BorderWidth
        body.BorderRadius = radius
        body.Accessibility = Accessibility{Role: AccessibilityRole.Group, Name: AccessibilityName ?? Title ?? ""}
        if let create = CreateRoot {
            return create(resolved, body)
        }
        if OnClick == nil {
            return body
        }
        RequireDisplayContent(body)
        let root = Button{
            Width: Percent(100),
            MinWidth: 0,
            BackgroundColor: background,
            BorderColor: theme.BorderColor,
            BorderWidth: theme.BorderWidth,
            BorderRadius: radius,
            Opacity: Disabled ? 0.5: 1,
            Disabled: Disabled,
            OnClick: Disabled ? nil: OnClick,
            Focus: theme.FocusStyle,
            Hover: Style{BackgroundColor: theme.HoverColor},
            Cursor: Disabled ? Cursor.Default: Cursor.Pointer,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: AccessibilityName ?? Title ?? ""},
            body
        }
        body.BackgroundColor = Color.Transparent
        body.BorderWidth = 0
        WidgetKeyBindings.BindActivation(root)
        return root
    }

    private func RequireDisplayContent(content Blob) {
        if content is Button || content.Focusable == true || content.OnClick != nil {
            throw ArgumentException("Pressable cards require display-only content.")
        }
        if content is Container {
            for child in content.Children {
                RequireDisplayContent(child)
            }
        }
    }
}
