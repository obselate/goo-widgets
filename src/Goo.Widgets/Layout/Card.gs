package Goo.Widgets.Layout

import Goo
import Goo.Widgets
import System

/// Selects the paint for one card composition.
public enum CardVariant {
    /// Uses a rounded panel-colored surface.
    Card;
    /// Uses a square-cornered panel surface.
    Panel;
    /// Uses a transparent bordered surface.
    Frame;
    /// Uses a recessed background surface.
    Well
}

/// A titled surface. Pressable cards must contain display-only content.
public data struct Card {
    /// Selects rounded, square, framed, or recessed surface styling.
    var Variant CardVariant
    /// Heading shown above the content. Nil omits the heading.
    var Title string?
    /// Secondary text below the heading. Nil omits it.
    var Subtitle string?
    /// Content aligned beside the heading. Nil omits it.
    var HeaderAction Blob?
    /// Main display content. Nil leaves this slot empty.
    var Content Blob?
    /// Content below the main body. Nil omits the footer.
    var Footer Blob?
    /// Content inset in logical pixels. Nil uses the theme panel padding.
    var Padding float64?
    /// Runs on enabled card activation. Nil renders a noninteractive group. Pressable content must be display-only.
    var OnClick Action?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Accessible name override. Nil uses Title, then an empty string.
    var AccessibilityName string?
    /// Receives the widget input and the prepared container, and returns the replacement content. Nil uses the default composition.
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
        let shadows = Variant == CardVariant.Card || Variant == CardVariant.Panel ? theme.PanelShadows: []BoxShadow{}
        let radius = Variant == CardVariant.Panel ? 0: theme.PanelRadius!!
        body.BackgroundColor = background
        body.BorderColor = theme.BorderColor
        body.BorderWidth = theme.BorderWidth
        body.BorderRadius = radius
        body.BoxShadows = shadows
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
            BoxShadows: shadows,
            Disabled: Disabled,
            OnClick: Disabled ? nil: OnClick,
            TransitionMs: theme.TransitionMs,
            TransitionEasing: Easing.EaseOut,
            TransitionProperties: theme.InteractionTransitions,
            Cursor: Disabled ? Cursor.Default: Cursor.Pointer,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: AccessibilityName ?? Title ?? ""},
            body
        }
        theme.ApplyInteraction(root, InteractionFamily.Button)
        body.BackgroundColor = Color.Transparent
        body.BorderWidth = 0
        body.BoxShadows = []BoxShadow{}
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w Card) Blob -> w.Build()
