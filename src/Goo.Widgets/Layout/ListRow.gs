package Goo.Widgets.Layout

import Goo
import Goo.Widgets

import System

/// A semantic list item row with optional slots, typography defaults, and factory customization.
public data struct ListRow {
    /// Optional leading slot element.
    var Leading Blob?
    /// Primary row text. Nil resolves to an empty string.
    var Title string?
    /// Optional secondary caption text.
    var Caption string?
    /// Optional trailing slot element.
    var Trailing Blob?
    /// Whether the row is selected.
    var Selected bool
    var OnClick Action?
    var OnInvoke Action?
    var Disabled bool
    var HoverBackgroundColor Color?
    var PressedBackgroundColor Color?
    var Actions Blob?
    var ShowActionsOnHover bool = true
    /// Accessible name. Nil resolves to the resolved title.
    var AccessibilityName string?
    /// Row width. Nil resolves to 100%.
    var Width Length?
    /// Background color in normal state. Nil uses the nearest theme.
    var BackgroundColor Color?
    /// Background color in selected state. Nil uses the nearest theme.
    var SelectedBackgroundColor Color?
    /// Primary title text color. Nil uses the nearest theme.
    var TextColor Color?
    /// Secondary caption text color. Nil uses the nearest theme.
    var CaptionColor Color?
    /// Authored selected-state shadow. Nil uses an accent border.
    var SelectedBoxShadow BoxShadow?
    /// Minimum row height. Nil sizes to content and density.
    var MinHeight float64?
    /// Horizontal padding. Explicit zero is preserved.
    var PaddingHorizontal float64?
    /// Vertical padding. Explicit zero is preserved.
    var PaddingVertical float64?
    /// Slot gap. Explicit zero is preserved.
    var Gap float64?
    /// Text gap. Explicit zero is preserved.
    var ContentGap float64?
    /// Border radius. Nil uses the nearest theme radius; explicit zero is preserved.
    var BorderRadius float64?
    /// Transition duration. Nil uses theme motion. Explicit zero is preserved.
    var TransitionMs float64?
    /// Transition easing curve. Nil resolves to Easing.EaseOut.
    var TransitionEasing Easing?
    /// Row opacity. Nil resolves to 1.0; explicit zero is preserved.
    var Opacity float64?
    /// Title font size. Zero uses the nearest theme font size.
    var TitleFontSize float64
    /// Title font weight. Zero uses the nearest theme label font weight.
    var TitleFontWeight int32
    /// Caption font size. Zero uses the nearest theme caption font size.
    var CaptionFontSize float64
    /// Caption font weight. Zero uses the nearest theme caption font weight.
    var CaptionFontWeight int32
    /// Optional font family for title and caption.
    var FontFamily string?
    /// Transform applied to the row root. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Custom factory for the title Text. Receives resolved props.
    var CreateTitle Func[ListRow, Text]?
    /// Custom factory for the caption Text. Receives resolved props.
    var CreateCaption Func[ListRow, Text]?
    /// Custom factory for the root Container. Receives resolved props, slots, and content stack.
    var CreateRoot Func[ListRow, Blob?, Container, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        if Actions != nil && ShowActionsOnHover {
            return Cell.Mount[ListRow, InteractiveListRow](nil, this)
        }
        return Render()
    }

    internal func Render() Blob {
        let theme = Theme.Read()
        let createTitle = CreateTitle
        let createCaption = CreateCaption
        let createRoot = CreateRoot
        let titleText = Title ?? ""
        let resolved = this with{
            Title = titleText,
            AccessibilityName = AccessibilityName ?? titleText,
            Width = Width ?? Percent(100.0),
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            SelectedBackgroundColor = SelectedBackgroundColor ?? theme.AccentColor.WithAlpha(0.15),
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            PressedBackgroundColor = PressedBackgroundColor ?? theme.PressedColor,
            TextColor = TextColor ?? theme.TextColor,
            CaptionColor = CaptionColor ?? theme.MutedTextColor,
            SelectedBoxShadow = SelectedBoxShadow ?? BoxShadow{Color: theme.AccentColor, Spread: theme.BorderWidth},
            MinHeight = MinHeight ?? theme.ControlHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            PaddingVertical = PaddingVertical ?? theme.Spacing * 2.0,
            Gap = Gap ?? theme.ControlGap,
            ContentGap = ContentGap ?? theme.Spacing,
            BorderRadius = BorderRadius ?? theme.PanelRadius,
            TransitionMs = TransitionMs ?? theme.TransitionMs,
            FontFamily = FontFamily ?? theme.FontFamily,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = if TitleFontSize == 0.0 {
                theme.FontSize
            } else {
                TitleFontSize
            },
            TitleFontWeight = if TitleFontWeight == 0 {
                theme.LabelFontWeight
            } else {
                TitleFontWeight
            },
            CaptionFontSize = if CaptionFontSize == 0.0 {
                theme.CaptionFontSize
            } else {
                CaptionFontSize
            },
            CaptionFontWeight = if CaptionFontWeight == 0 {
                theme.CaptionFontWeight
            } else {
                CaptionFontWeight
            },
            Transform = Transform ?? PanelTransform{},
            CreateTitle = nil,
            CreateCaption = nil,
            CreateRoot = nil,
        }

        let title = if let createTitle = createTitle {
            createTitle(resolved)
        } else {
            let value = Text{
                Content: resolved.Title!!,
                Color: resolved.TextColor!!,
                FontSize: resolved.TitleFontSize,
                FontWeight: resolved.TitleFontWeight
            }
            if let fontFamily = resolved.FontFamily {
                value.FontFamily = fontFamily
            }
            value
        }

        let caption Text? = if let captionText = resolved.Caption {
            if let createCaption = createCaption {
                createCaption(resolved)
            } else {
                let value = Text{
                    Content: captionText,
                    Color: resolved.CaptionColor!!,
                    FontSize: resolved.CaptionFontSize,
                    FontWeight: resolved.CaptionFontWeight
                }
                if let fontFamily = resolved.FontFamily {
                    value.FontFamily = fontFamily
                }
                value
            }
        } else {
            nil
        }

        let content = Container{
            FlexDirection: FlexDirection.Column,
            JustifyContent: JustifyContent.Center,
            Gap: resolved.ContentGap!!,
            FlexGrow: 1.0
        }
        content.Children.Add(title)
        if let caption = caption {
            content.Children.Add(caption)
        }

        let background = if resolved.Selected {
            resolved.SelectedBackgroundColor!!
        } else {
            resolved.BackgroundColor!!
        }
        var root = Container{
            Disabled: resolved.Disabled,
            Focusable: !resolved.Disabled && (resolved.OnClick != nil || resolved.OnInvoke != nil),
            Hover: resolved.OnClick != nil ||
                resolved.OnInvoke != nil ? Style{BackgroundColor: resolved.HoverBackgroundColor!!}: nil,
            Active: resolved.OnClick != nil ||
                resolved.OnInvoke != nil ? Style{BackgroundColor: resolved.PressedBackgroundColor!!}: nil,
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BorderRadius: resolved.BorderRadius!!,
            BackgroundColor: background,
            Focus: theme.FocusStyle,
            Opacity: resolved.Opacity!!* (resolved.Disabled ? .45: 1),
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap!!,
            Accessibility: Accessibility{
                Role: AccessibilityRole.ListItem,
                Name: resolved.AccessibilityName!!,
                Selected: resolved.Selected
            },
        }
        if let create = createRoot {
            root = create(resolved, Leading, content, Trailing)
        }
        if resolved.Disabled {
            root.Disabled = true
        }
        if resolved.OnClick != nil || resolved.OnInvoke != nil {
            root.Focusable = !resolved.Disabled
            var fromChild bool
            var presses int32
            root.OnPointerDown = (e PointerEvent) -> {
                fromChild = e.IsFromInteractiveChild
                presses = e.ClickCount
            }
            root.OnClick = () -> {
                if !resolved.Disabled && !fromChild {
                    resolved.OnClick?.Invoke()
                    if presses == 2 {
                        resolved.OnInvoke?.Invoke()
                    }
                }
            }
            root.OnKeyDown = (e KeyEvent) -> {
                if !resolved.Disabled && (e.Key == Key.Enter || e.Key == Key.Space) {
                    if e.Key == Key.Enter && resolved.OnInvoke != nil {
                        resolved.OnInvoke?.Invoke()
                    } else {
                        resolved.OnClick?.Invoke()
                    }
                    e.PreventDefault()
                    e.StopPropagation()
                }
            }
        }
        if resolved.Selected && createRoot == nil {
            root.BoxShadow = resolved.SelectedBoxShadow!!
        }
        if createRoot == nil {
            if let leading = Leading {
                root.Children.Add(leading)
            }
            root.Children.Add(content)
            if let trailing = Trailing {
                root.Children.Add(trailing)
            }
        }
        if let actions = resolved.Actions {
            root.Children.Add(
                Container{
                    FlexDirection: FlexDirection.Row,
                    OnKeyDown: (e KeyEvent) -> {
                        if e.Key == Key.Enter || e.Key == Key.Space {
                            e.StopPropagation()
                        }
                    },
                    actions
                }
            )
        }
        return root
    }
}

internal class InteractiveListRow : Cell[ListRow] {
    private var hovered bool
    private var focused bool
    private var touch bool

    protected override func Build(value ListRow) Blob {
        let visible = value.Selected || hovered || focused || touch
        let root = (value with{ShowActionsOnHover = false, Actions = visible ? value.Actions: nil}).Render()
        root.Focusable = !value.Disabled
        root.OnPointerEnter = (e PointerEvent) -> {
            hovered = true
            Rebuild()
        }
        root.OnPointerLeave = (e PointerEvent) -> {
            hovered = false
            Rebuild()
        }
        let down = root.OnPointerDown
        root.OnPointerDown = (e PointerEvent) -> {
            down?.Invoke(e)
            if e.Device == PointerDevice.Touch {
                touch = true
                Rebuild()
            }
        }
        root.OnFocus = (e FocusEvent) -> {
            focused = true
            Rebuild()
        }
        root.OnBlur = (e FocusEvent) -> {
            focused = false
            Rebuild()
        }
        return root
    }
}
