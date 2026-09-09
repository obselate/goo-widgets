package Goo.Widgets.Layout

import Goo

/// An application header bar with slots, title/subtitle typography, bottom border, shadow, and custom factories.
public data struct AppBar {
  /// Optional leading slot element (e.g. navigation icon or drawer toggle).
  var Leading Blob?
  /// Primary title text. Nil resolves to an empty string.
  var Title string?
  /// Optional subtitle text displayed beneath the title.
  var Subtitle string?
  /// Optional trailing slot element (e.g. actions or profile menu).
  var Trailing Blob?
  /// Accessible group name. Nil resolves to the resolved Title.
  var AccessibilityName string?
  /// Accessible heading level for the title Text. Zero or default resolves to 1.
  var HeadingLevel int32
  /// Bar width. Nil resolves to Length.Percent(100.0).
  var Width Length?
  /// Bar height. Zero resolves to 56.0.
  var Height float64
  /// Bar background color. Nil resolves to #09090b.
  var BackgroundColor Color?
  /// Inherited title and content text color. Nil resolves to #fafafa.
  var TextColor Color?
  /// Subtitle text color. Nil resolves to #a1a1aa.
  var SubtitleColor Color?
  /// Bottom border color. Nil resolves to #27272a.
  var BorderColor Color?
  /// Horizontal padding on left and right edges. Nil resolves to 16.0; explicit zero is preserved.
  var PaddingHorizontal float64?
  /// Spacing between slots and the title content stack. Nil resolves to 12.0; explicit zero is preserved.
  var Gap float64?
  /// Spacing between title and subtitle inside the content stack. Nil resolves to 2.0; explicit zero is preserved.
  var TitleGap float64?
  /// Title text font size. Zero resolves to 16.0.
  var TitleFontSize float64
  /// Title text font weight. Zero resolves to 600.
  var TitleFontWeight int32
  /// Subtitle text font size. Zero resolves to 12.0.
  var SubtitleFontSize float64
  /// Subtitle text font weight. Zero resolves to 400.
  var SubtitleFontWeight int32
  /// Bottom border width. Nil resolves to 1.0; explicit zero is preserved.
  var BorderWidth float64?
  /// Outer drop shadow. Nil resolves to #000000 offset (0, 2) blur 8.0 spread 0.0.
  var BoxShadow BoxShadow?
  /// Bar opacity. Nil resolves to 1.0; explicit zero is preserved.
  var Opacity float64?
  /// Optional font family applied to default title and subtitle Text elements.
  var FontFamily string?
  /// Transform applied to the root container. Nil resolves to identity.
  var Transform PanelTransform?
  /// Custom factory for the title Text element. Receives resolved props.
  var CreateTitle Func[AppBar, Text]?
  /// Custom factory for the subtitle Text element. Receives resolved props.
  var CreateSubtitle Func[AppBar, Text]?
  /// Custom factory for the root Container. Receives resolved props and slot/text primitives directly.
  var CreateRoot Func[AppBar, Blob?, Text, Text?, Blob?, Container]?

  /// Builds a fresh Goo element tree after resolving props and factories.
  public func Build() Blob {
    let createTitle = CreateTitle
    let createSubtitle = CreateSubtitle
    let createRoot = CreateRoot
    let titleText = Title ?? ""
    let defaultShadow = BoxShadow{Color: Color.Parse("#000000"), OffsetX: 0.0, OffsetY: 2.0, Blur: 8.0, Spread: 0.0}
    let resolved = this with{
      Title = titleText,
      AccessibilityName = AccessibilityName ?? titleText,
      HeadingLevel = if HeadingLevel == 0 { 1 } else { HeadingLevel },
      Width = Width ?? Length.Percent(100.0),
      Height = if Height == 0.0 { 56.0 } else { Height },
      BackgroundColor = BackgroundColor ?? Color.Parse("#09090b"),
      TextColor = TextColor ?? Color.Parse("#fafafa"),
      SubtitleColor = SubtitleColor ?? Color.Parse("#a1a1aa"),
      BorderColor = BorderColor ?? Color.Parse("#27272a"),
      PaddingHorizontal = PaddingHorizontal ?? 16.0,
      Gap = Gap ?? 12.0,
      TitleGap = TitleGap ?? 2.0,
      TitleFontSize = if TitleFontSize == 0.0 { 16.0 } else { TitleFontSize },
      TitleFontWeight = if TitleFontWeight == 0 { 600 } else { TitleFontWeight },
      SubtitleFontSize = if SubtitleFontSize == 0.0 { 12.0 } else { SubtitleFontSize },
      SubtitleFontWeight = if SubtitleFontWeight == 0 { 400 } else { SubtitleFontWeight },
      BorderWidth = BorderWidth ?? 1.0,
      BoxShadow = BoxShadow ?? defaultShadow,
      Opacity = Opacity ?? 1.0,
      Transform = Transform ?? PanelTransform{},
      CreateTitle = nil,
      CreateSubtitle = nil,
      CreateRoot = nil,
    }

    let title = if let createTitle = createTitle {
      createTitle(resolved)
    } else {
      let titleAccessibility = Accessibility{Role: AccessibilityRole.Heading, Name: resolved.Title!!, Level: resolved.HeadingLevel}
      let value = Text{Content: resolved.Title!!, FontSize: resolved.TitleFontSize, FontWeight: resolved.TitleFontWeight, Accessibility: titleAccessibility}
      if let fontFamily = resolved.FontFamily { value.FontFamily = fontFamily }
      value
    }

    let subtitle Text? = if let subtitleText = resolved.Subtitle {
      if let createSubtitle = createSubtitle {
        createSubtitle(resolved)
      } else {
        let value = Text{Content: subtitleText, Color: resolved.SubtitleColor!!, FontSize: resolved.SubtitleFontSize, FontWeight: resolved.SubtitleFontWeight}
        if let fontFamily = resolved.FontFamily { value.FontFamily = fontFamily }
        value
      }
    } else {
      nil
    }

    if let createRoot = createRoot {
      return createRoot(resolved, Leading, title, subtitle, Trailing)
    }

    let content = Container{FlexDirection: FlexDirection.Column, JustifyContent: JustifyContent.Center, Gap: resolved.TitleGap!!, FlexGrow: 1.0}
    content.Children.Add(Container{Children: {title}})
    if let subtitle = subtitle { content.Children.Add(Container{Children: {subtitle}}) }

    let root = Container{
      Width: resolved.Width!!,
      Height: resolved.Height,
      PaddingLeft: resolved.PaddingHorizontal!!,
      PaddingRight: resolved.PaddingHorizontal!!,
      BackgroundColor: resolved.BackgroundColor!!,
      Color: resolved.TextColor!!,
      BorderBottomColor: resolved.BorderColor!!,
      BorderBottomWidth: resolved.BorderWidth!!,
      BoxShadow: resolved.BoxShadow!!,
      Opacity: resolved.Opacity!!,
      Transform: resolved.Transform!!,
      Overflow: Overflow.Hidden,
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: resolved.Gap!!,
      Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!},
    }

    if let leading = Leading { root.Children.Add(Container{Children: {leading}}) }
    root.Children.Add(content)
    if let trailing = Trailing { root.Children.Add(Container{Children: {trailing}}) }
    return root
  }
}
