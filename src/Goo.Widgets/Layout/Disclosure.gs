package Goo.Widgets.Layout

import Goo
import Goo.Widgets.Icons
import System

/// A controlled collapsible section. Collapsed content remains mounted but is hidden from layout and input.
public data struct Disclosure {
    /// Header label when Header is nil.
    var Label string?
    /// Optional decorative header content. Keep interactive controls in Content.
    var Header Blob?
    /// Section body, retained across collapse while the disclosure stays mounted.
    var Content Blob?
    /// Whether the body participates in layout, input, and accessibility.
    var Expanded bool
    /// Whether the header rejects pointer, keyboard, and accessibility activation.
    var Disabled bool
    /// Receives the requested expanded state. Update Expanded in the owning Cell.
    var OnExpandedChange Action[bool]?
    /// Accessible header name. Nil resolves to Label or an empty string.
    var AccessibilityName string?
    /// Section width. Nil resolves to 100%.
    var Width Length?
    /// Minimum header height. Nil resolves to 44 logical pixels.
    var HeaderHeight float64?
    /// Header padding. Nil resolves to 12 and preserves explicit zero.
    var HeaderPadding float64?
    /// Body padding. Nil resolves to 16 and preserves explicit zero.
    var ContentPadding float64?
    /// Gap between indicator and header content. Nil resolves to 8.
    var Gap float64?
    /// Surface color. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Header hover color. Nil resolves to #27272a.
    var HoverColor Color?
    /// Header text and indicator color. Nil resolves to #fafafa.
    var TextColor Color?
    /// Section border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Border width. Nil resolves to 1 and preserves explicit zero.
    var BorderWidth float64?
    /// Corner radius. Nil resolves to 6 and preserves explicit zero.
    var BorderRadius float64?
    /// Disabled header opacity. Nil resolves to 0.5 and preserves explicit zero.
    var DisabledOpacity float64?
    /// Enables a visible header focus outline. Disabled by default.
    var ShowFocusHighlight bool
    /// Creates a decorative indicator from resolved props.
    var CreateIndicator Func[Disclosure, Blob]?
    /// Customizes the prepared header. Preserve its key, action, disabled state, and semantics.
    var CreateHeader Func[Disclosure, Button, Button]?
    /// Customizes the prepared body. Preserve its key, children, and collapsed display state.
    var CreateContent Func[Disclosure, Container, Container]?
    /// Creates the final section from resolved props and its prepared header and body.
    var CreateRoot Func[Disclosure, Button, Container, Container]?

    /// Builds fresh primitives while stable child keys preserve mounted body identity.
    public func Build() Blob {
        let createIndicator = CreateIndicator
        let createHeader = CreateHeader
        let createContent = CreateContent
        let createRoot = CreateRoot
        let resolved = this with{
            Label = Label ?? "",
            AccessibilityName = AccessibilityName ?? (Label ?? ""),
            Width = Width ?? Length.Percent(100),
            HeaderHeight = HeaderHeight ?? 44.0,
            HeaderPadding = HeaderPadding ?? 12.0,
            ContentPadding = ContentPadding ?? 16.0,
            Gap = Gap ?? 8.0,
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            HoverColor = HoverColor ?? Color.Parse("#27272a"),
            TextColor = TextColor ?? Color.Parse("#fafafa"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 6.0,
            DisabledOpacity = DisabledOpacity ?? 0.5,
            CreateIndicator = nil,
            CreateHeader = nil,
            CreateContent = nil,
            CreateRoot = nil,
        }
        let indicator = if let create = createIndicator {
            create(resolved)
        } else {
            MaterialIcons.Create(
                if resolved.Expanded {
                    "expand_more"
                } else {
                    "chevron_right"
                },
                size: 20.0,
                color: resolved.TextColor!!
            )
        }
        let heading = resolved.Header ?? Text{Content: resolved.Label!!, FontWeight: 600, Color: resolved.TextColor!!}
        let onChange = resolved.OnExpandedChange
        let next = !resolved.Expanded
        let action Action? = if resolved.Disabled {
            nil
        } else {
            () -> {
                onChange?.Invoke(next)
            }
        }
        let headerRadius = Math.Max(0.0, resolved.BorderRadius!!- resolved.BorderWidth!!)
        var header = Button{
            Key: "header",
            MinHeight: resolved.HeaderHeight!!,
            FlexShrink: 0,
            Padding: resolved.HeaderPadding!!,
            Gap: resolved.Gap!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.FlexStart,
            BackgroundColor: Color.Transparent,
            Color: resolved.TextColor!!,
            BorderWidth: 0,
            BorderRadius: 0,
            BorderTopLeftRadius: headerRadius,
            BorderTopRightRadius: headerRadius,
            BorderBottomLeftRadius: resolved.Expanded ? 0.0: headerRadius,
            BorderBottomRightRadius: resolved.Expanded ? 0.0: headerRadius,
            Hover: Style{BackgroundColor: resolved.HoverColor!!},
            Focus: if resolved.ShowFocusHighlight {
                Style{OutlineColor: resolved.TextColor!!, OutlineWidth: 1, OutlineOffset: -1}
            } else {
                Style{}
            },
            Opacity: if resolved.Disabled {
                resolved.DisabledOpacity!!
            } else {
                1.0
            },
            Disabled: resolved.Disabled,
            Focusable: !resolved.Disabled,
            Cursor: if resolved.Disabled {
                Cursor.Default
            } else {
                Cursor.Pointer
            },
            OnClick: action,
            Accessibility: Accessibility{
                Role: AccessibilityRole.Button,
                Name: resolved.AccessibilityName!!,
                Expanded: resolved.Expanded,
            },
            indicator,
            heading,
        }
        if let create = createHeader {
            header = create(resolved, header)
        }
        var body = Container{
            Key: "content",
            Padding: resolved.ContentPadding!!,
            MinWidth: 0,
            Display: if resolved.Expanded {
                Display.Flex
            } else {
                Display.None
            },
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Hidden: !resolved.Expanded},
        }
        if let content = resolved.Content {
            body.Children.Add(content)
        }
        if let create = createContent {
            body = create(resolved, body)
        }
        if let create = createRoot {
            return create(resolved, header, body)
        }
        return Container{
            Width: resolved.Width!!,
            MinWidth: 0,
            FlexShrink: 0,
            BackgroundColor: resolved.BackgroundColor!!,
            BorderColor: resolved.BorderColor!!,
            BorderWidth: resolved.BorderWidth!!,
            BorderRadius: resolved.BorderRadius!!,
            Overflow: Overflow.Hidden,
            header,
            body,
        }
    }
}
