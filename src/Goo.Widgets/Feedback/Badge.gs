package Goo.Widgets.Feedback

import Goo

/// A placement-neutral status badge. Nil Content renders a dot; non-nil Content renders a pill.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct Badge {
  /// Badge text. Nil selects dot mode; an empty string remains content mode.
  var Content string?
  /// Background color. Nil resolves to #27272a.
  var BackgroundColor Color?
  /// Text color. Nil resolves to #fafafa.
  var TextColor Color?
  /// Border color. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Dot diameter. Zero resolves to 8.
  var DotSize float64
  /// Content-mode height. Zero resolves to 20.
  var Height float64
  /// Content-mode minimum width. Zero resolves to 20.
  var MinWidth float64
  /// Content-mode horizontal padding. Zero resolves to 6.
  var PaddingHorizontal float64
  /// Border width. Zero leaves the border unpainted.
  var BorderWidth float64
  /// Corner radius. Zero resolves to half the active mode height.
  var BorderRadius float64
  /// Transition duration in milliseconds. Nil resolves to 150.0; explicit zero is preserved.
  var TransitionMs float64?
  /// Transition easing curve. Nil resolves to Easing.EaseOut.
  var TransitionEasing Easing?
  /// Font family. Nil inherits Goo's font choice.
  var FontFamily string?
  /// Font size. Zero resolves to 12.
  var FontSize float64
  /// Font weight. Zero resolves to 600.
  var FontWeight int32
  /// Accessible name. Content is the content-mode fallback; a nameless dot is decorative.
  var AccessibilityName string?
  /// Root opacity. Nil resolves to 1.
  var Opacity float64?
  /// Root transform. Nil resolves to the identity transform.
  var Transform PanelTransform?
  /// Creates the final Text from resolved props. Nil uses Badge's composition.
  var CreateText Func[Badge, Text]?
  /// Creates the final Container from resolved props and optional Text. Nil uses Badge's composition.
  var CreateRoot Func[Badge, Text?, Container]?

  /// Builds a fresh Goo tree, resolving props before invoking either primitive factory.
  public func Build() Blob {
    let createText = CreateText
    let createRoot = CreateRoot
    let isDot = Content == nil
    let dotSize = if DotSize == 0.0 { 8.0 } else { DotSize }
    let height = if Height == 0.0 { 20.0 } else { Height }
    let minWidth = if MinWidth == 0.0 { 20.0 } else { MinWidth }
    let padding = if PaddingHorizontal == 0.0 { 6.0 } else { PaddingHorizontal }
    var resolvedName string? = AccessibilityName
    if resolvedName == nil && !isDot {
      resolvedName = Content
    }
    let resolved = this with{
      BackgroundColor = BackgroundColor ?? Color.Parse("#27272a"),
      TextColor = TextColor ?? Color.Parse("#fafafa"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      DotSize = dotSize,
      Height = height,
      MinWidth = minWidth,
      PaddingHorizontal = padding,
      BorderRadius = if BorderRadius == 0.0 {
        if isDot { dotSize / 2.0 } else { height / 2.0 }
      } else {
        BorderRadius
      },
      TransitionMs = TransitionMs ?? 150.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut,
      FontSize = if FontSize == 0.0 { 12.0 } else { FontSize },
      FontWeight = if FontWeight == 0 { 600 } else { FontWeight },
      AccessibilityName = resolvedName,
      Opacity = Opacity ?? 1.0,
      Transform = Transform ?? PanelTransform{},
      CreateText = nil,
      CreateRoot = nil,
    }

    var text Text? = nil
    if !isDot {
      if let createText = createText {
        text = createText(resolved)
      } else {
        text = Text{
          Content: resolved.Content!!,
          Color: resolved.TextColor!!,
          FontSize: resolved.FontSize,
          FontWeight: resolved.FontWeight,
        }
        if let fontFamily = resolved.FontFamily { text.FontFamily = fontFamily }
      }
    }
    if let createRoot = createRoot {
      return createRoot(resolved, text)
    }

    var semantics = Accessibility{Role: AccessibilityRole.None, Hidden: true}
    if let accessibilityName = resolved.AccessibilityName {
      semantics = Accessibility{
        Role: AccessibilityRole.Status,
        Name: accessibilityName,
      }
    }
    if isDot {
      return Container{
        Width: resolved.DotSize,
        Height: resolved.DotSize,
        BorderRadius: resolved.BorderRadius,
        BorderWidth: resolved.BorderWidth,
        BorderColor: resolved.BorderColor!!,
        BackgroundColor: resolved.BackgroundColor!!,
        Opacity: resolved.Opacity!!,
        Transform: resolved.Transform!!,
        TransitionMs: resolved.TransitionMs!!,
        TransitionEasing: resolved.TransitionEasing!!,
        Accessibility: semantics,
      }
    }
    return Container{
      Height: resolved.Height,
      MinWidth: resolved.MinWidth,
      PaddingLeft: resolved.PaddingHorizontal,
      PaddingRight: resolved.PaddingHorizontal,
      BorderRadius: resolved.BorderRadius,
      BorderWidth: resolved.BorderWidth,
      BorderColor: resolved.BorderColor!!,
      BackgroundColor: resolved.BackgroundColor!!,
      Opacity: resolved.Opacity!!,
      Transform: resolved.Transform!!,
      TransitionMs: resolved.TransitionMs!!,
      TransitionEasing: resolved.TransitionEasing!!,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Accessibility: semantics,
      Children: { text!! },
    }
  }
}
