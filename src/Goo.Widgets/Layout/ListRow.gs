package Goo.Widgets.Layout

import Goo
import Goo.Widgets

import System

/// A semantic list item row with optional slots, typography defaults, and factory customization.
/// Configure callbacks edit only the supplied fresh element. Create callbacks return a fresh element or the supplied default.
/// Changing a widget-owned scalar throws. Set its input value instead.
/// Root configuration targets the returned outermost layout element.
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
    /// Runs on a click or Space activation. Nil supplies no click action.
    var OnClick Action?
    /// Runs on double-click or Enter activation. Nil supplies no invocation action.
    var OnInvoke Action?
    /// Rejects user interaction and applies disabled presentation. False permits interaction.
    var Disabled bool
    /// Hovered row fill. Nil uses the theme hover color.
    var HoverBackgroundColor Color?
    /// Pressed row fill. Nil uses the theme pressed color.
    var PressedBackgroundColor Color?
    /// Action content shown with the item. Nil leaves this slot empty.
    var Actions Blob?
    /// Nil shows actions on hover, focus, selection, or touch. False always shows them.
    var ShowActionsOnHover bool?
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
    var MinHeight Length?
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
    /// Title font size. Nil uses the nearest theme font size.
    var TitleFontSize float64?
    /// Title font weight. Nil uses the nearest theme label font weight.
    var TitleFontWeight int32?
    /// Caption font size. Nil uses the nearest theme caption font size.
    var CaptionFontSize float64?
    /// Caption font weight. Nil uses the nearest theme caption font weight.
    var CaptionFontWeight int32?
    /// Optional font family for title and caption.
    var FontFamily string?
    /// Transform applied to the row root. Nil resolves to the identity transform.
    var Transform PanelTransform?
    /// Custom factory for the title Text. Receives resolved props. Nil uses one line that ends with an ellipsis.
    /// Hosts must not change state in this callback.
    /// Return a fresh element or the supplied default.
    var CreateTitle Func[ListRow, Text]?
    /// Custom factory for the caption Text. Receives resolved props.
    /// Hosts must not change state in this callback.
    /// Return a fresh element or the supplied default.
    var CreateCaption Func[ListRow, Text]?
    /// Configures the fresh root before required behavior is applied.
    /// Replace its children for custom content. Edit only the supplied element.
    /// Widget-owned fields: Disabled, Focusable, OnClick, OnKeyDown, OnPointerUp.
    var ConfigureRoot Action[ListRow, Blob?, Container, Blob?, Container]?

    /// Builds a fresh Goo element tree after resolving props and factories.
    public func Build() Blob {
        if Actions != nil && (ShowActionsOnHover ?? true) {
            return Cell.Mount[ListRow, InteractiveListRow](nil, this)
        }
        return Render()
    }

    internal func Render() Blob {
        let theme = Theme.Read()
        let createTitle = CreateTitle
        let createCaption = CreateCaption
        let configureRoot = ConfigureRoot
        let titleText = Title ?? ""
        let text = TextColor ?? theme.TextColor
        let captionColor = CaptionColor ?? theme.MutedTextColor
        let ring = if theme.Selection == SelectionStyle.Tint {
            BoxShadow{Inset: true, Color: theme.AccentColor, Spread: theme.BorderWidth}
        } else {
            BoxShadow{}
        }
        let defaultMinHeight Length = theme.ControlHeight
        let resolved = this with{
            Title = titleText,
            AccessibilityName = AccessibilityName ?? titleText,
            Width = Width ?? Percent(100.0),
            BackgroundColor = BackgroundColor ?? theme.PanelColor,
            SelectedBackgroundColor = SelectedBackgroundColor ?? theme.SelectedFill(theme.ActiveColor),
            HoverBackgroundColor = HoverBackgroundColor ?? theme.HoverColor,
            PressedBackgroundColor = PressedBackgroundColor ?? theme.PressedColor,
            TextColor = Selected ? theme.SelectedText(text, SelectedBackgroundColor): text,
            CaptionColor = Selected ? theme.SelectedText(captionColor, SelectedBackgroundColor): captionColor,
            SelectedBoxShadow = SelectedBoxShadow ?? ring,
            MinHeight = MinHeight ?? defaultMinHeight,
            PaddingHorizontal = PaddingHorizontal ?? theme.ControlPadding,
            PaddingVertical = PaddingVertical ?? theme.Spacing * 2.0,
            Gap = Gap ?? theme.ControlGap,
            ContentGap = ContentGap ?? (theme.Controls == ControlStyle.Fluent ? 0.0: theme.Spacing),
            BorderRadius = BorderRadius ?? theme.PanelRadius!!,
            TransitionMs = theme.ReducedMotion ? 0.0: TransitionMs ?? theme.TransitionMs,
            FontFamily = FontFamily ?? theme.FontFamily,
            TransitionEasing = TransitionEasing ?? Easing.EaseOut,
            Opacity = Opacity ?? 1.0,
            TitleFontSize = TitleFontSize ?? theme.FontSize,
            TitleFontWeight = TitleFontWeight ?? theme.LabelFontWeight,
            CaptionFontSize = CaptionFontSize ?? theme.CaptionFontSize,
            CaptionFontWeight = CaptionFontWeight ?? theme.CaptionFontWeight,
            Transform = Transform ?? PanelTransform{},
            CreateTitle = nil,
            CreateCaption = nil,
            ConfigureRoot = nil,
        }

        let title = if let createTitle = createTitle {
            createTitle(resolved)
        } else {
            let value = Text{
                Content: resolved.Title!!,
                Color: resolved.TextColor!!,
                FontSize: resolved.TitleFontSize!!,
                FontWeight: resolved.TitleFontWeight!!,
                TextWrap: TextWrap.NoWrap,
                TextTrimming: TextTrimming.Ellipsis
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
                    FontSize: resolved.CaptionFontSize!!,
                    FontWeight: resolved.CaptionFontWeight!!
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
            FlexGrow: 1.0,
            FlexShrink: 1.0,
            MinWidth: 0.0
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
            HoverStyle: HoverBackgroundColor == nil ? nil: Style{BackgroundColor: HoverBackgroundColor!!},
            ActiveStyle: PressedBackgroundColor == nil ? nil: Style{BackgroundColor: PressedBackgroundColor!!},
            LineHeight: theme.LineHeight,
            Width: resolved.Width!!,
            MinHeight: resolved.MinHeight!!,
            Padding: Edges(resolved.PaddingVertical!!, resolved.PaddingHorizontal!!),
            BorderRadius: resolved.BorderRadius!!,
            BorderWidth: theme.HighContrast ? theme.BorderWidth: 0,
            BorderColor: Color.Transparent,
            BackgroundColor: background,
            Opacity: resolved.Opacity!!,
            Transform: resolved.Transform!!,
            TransitionMs: resolved.TransitionMs!!,
            TransitionEasing: resolved.TransitionEasing!!,
            TransitionProperties: theme.InteractionTransitions,
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            Gap: resolved.Gap!!,
            Accessibility: Accessibility{
                Role: AccessibilityRole.ListItem,
                Name: resolved.AccessibilityName!!,
                Selected: resolved.Selected
            },
        }

            if let leading = Leading {
                root.Children.Add(leading)
            }
            root.Children.Add(content)
            if let trailing = Trailing {
                root.Children.Add(trailing)
            }
            if resolved.Selected && (theme.Selection == SelectionStyle.Indicator || theme.HighContrast) {
                root.Children.Add(theme.SelectionBar())
            }
        if let configure = configureRoot {
            let originalDisabled = root.Disabled
            let originalFocusable = root.Focusable
            let originalOnClick = root.OnClick
            let originalOnKeyDown = root.OnKeyDown
            let originalOnPointerUp = root.OnPointerUp
            configure.Invoke(resolved, Leading, content, Trailing, root)
            if root.Disabled != originalDisabled {
                throw InvalidOperationException("ListRow owns Disabled; set ListRow.Disabled instead of changing it in ConfigureRoot")
            }
            if root.Focusable != originalFocusable {
                throw InvalidOperationException("ListRow owns Focusable; configure ListRow instead of changing it in ConfigureRoot")
            }
            if root.OnClick != originalOnClick {
                throw InvalidOperationException("ListRow owns OnClick; set ListRow.OnClick instead of changing it in ConfigureRoot")
            }
            if root.OnKeyDown != originalOnKeyDown {
                throw InvalidOperationException("ListRow owns OnKeyDown; configure ListRow instead of changing it in ConfigureRoot")
            }
            if root.OnPointerUp != originalOnPointerUp {
                throw InvalidOperationException("ListRow owns OnPointerUp; configure ListRow instead of changing it in ConfigureRoot")
            }
        }
        if Selected && SelectedBackgroundColor != nil {
            root.HoverStyle = Style{BackgroundColor: resolved.SelectedBackgroundColor!!, BasedOn: root.HoverStyle}
            root.ActiveStyle = Style{BackgroundColor: resolved.SelectedBackgroundColor!!, BasedOn: root.ActiveStyle}
        }
        theme.ApplyInteraction(root, InteractionFamily.Row, Selected, OnClick != nil || OnInvoke != nil)
        if resolved.Disabled {
            root.Disabled = true
        }
        if resolved.OnClick != nil || resolved.OnInvoke != nil {
            root.Focusable = !resolved.Disabled
            var fromChild bool
            var presses int32
            root.OnPointerUp = (e PointerEvent) -> {
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
        if resolved.Selected && configureRoot == nil {
            root.BoxShadow = resolved.SelectedBoxShadow!!
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
        let root = (value with{
            ShowActionsOnHover = false,
            Actions = visible ? value.Actions: nil,
            OnClick = value.OnClick == nil ? nil: () -> InvokeInputCallback(value.OnClick),
            OnInvoke = value.OnInvoke == nil ? nil: () -> InvokeInputCallback(value.OnInvoke),
        }).Render()
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

/// Builds a fresh Goo tree for a Blob slot.
public func operator implicit (w ListRow) Blob -> w.Build()
