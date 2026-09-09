package Goo.Widgets.Layout

import Goo

/// An animated slide-over container panel docked to the left or right edge of its viewport.
/// Supports caller-owned content, custom container factories, and direction-aware transitions.
public data struct Drawer {
  /// Hosted child element placed directly in the drawer container when non-nil.
  var Content Blob?
  /// Whether the drawer is visible and expanded. Build does not invert or mutate this state.
  var Open bool
  /// Whether the drawer docks to and slides from the right viewport edge instead of the left.
  var FromRight bool
  /// Accessible name for the group container. Nil resolves to "Drawer".
  var AccessibilityName string?
  /// Drawer width in logical pixels. Zero or default resolves to 320.0.
  var Width float64
  /// Drawer height. Nil resolves to Length.Percent(100.0).
  var Height Length?
  /// Background color of the drawer panel. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Border color of the drawer panel. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Horizontal padding on left and right edges. Zero or default resolves to 20.0.
  var PaddingHorizontal float64
  /// Vertical padding on top and bottom edges. Zero or default resolves to 20.0.
  var PaddingVertical float64
  /// Border stroke width. Nil resolves to 1.0; explicit zero is preserved.
  var BorderWidth float64?
  /// Corner radius of the drawer panel. Nil resolves to 12.0; explicit zero is preserved.
  var BorderRadius float64?
  /// Panel opacity when Open is true. Nil resolves to 1.0; explicit zero is preserved.
  var OpenOpacity float64?
  /// Panel opacity when Open is false. Nil resolves to 0.0; explicit zero is preserved.
  var ClosedOpacity float64?
  /// Transition duration in milliseconds. Nil resolves to 220.0; explicit zero is preserved.
  var TransitionMs float64?
  /// Transition easing curve. Nil resolves to Easing.EaseOut.
  var TransitionEasing Easing?
  /// Outer drop shadow applied to the drawer container. Nil resolves to a side-aware black shadow.
  var BoxShadow BoxShadow?
  /// Transform applied when Open is true. Nil resolves to the identity transform.
  var OpenTransform PanelTransform?
  /// Transform applied when Open is false. Nil resolves to a directional slide and 0.98 scale.
  var ClosedTransform PanelTransform?
  /// Custom factory for the root Container. Receives resolved props and caller Content.
  var CreateRoot Func[Drawer, Blob?, Container]?

  /// Builds a fresh Goo element tree after resolving props and factories.
  public func Build() Blob {
    let createRoot = CreateRoot
    let sideShadow = if FromRight {
      BoxShadow{Color: Color.Parse("#000000"), OffsetX: -8.0, OffsetY: 0.0, Blur: 24.0, Spread: 0.0}
    } else {
      BoxShadow{Color: Color.Parse("#000000"), OffsetX: 8.0, OffsetY: 0.0, Blur: 24.0, Spread: 0.0}
    }
    let defaultClosedTransform = if FromRight {
      PanelTransform{TranslateX: Length.Percent(100.0), Scale: 0.98}
    } else {
      PanelTransform{TranslateX: Length.Percent(-100.0), Scale: 0.98}
    }

    let resolved = this with{
      AccessibilityName = AccessibilityName ?? "Drawer",
      Width = if Width == 0.0 { 320.0 } else { Width },
      Height = Height ?? Length.Percent(100.0),
      BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      PaddingHorizontal = if PaddingHorizontal == 0.0 { 20.0 } else { PaddingHorizontal },
      PaddingVertical = if PaddingVertical == 0.0 { 20.0 } else { PaddingVertical },
      BorderWidth = BorderWidth ?? 1.0,
      BorderRadius = BorderRadius ?? 12.0,
      OpenOpacity = OpenOpacity ?? 1.0,
      ClosedOpacity = ClosedOpacity ?? 0.0,
      TransitionMs = TransitionMs ?? 220.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut,
      BoxShadow = BoxShadow ?? sideShadow,
      OpenTransform = OpenTransform ?? PanelTransform{},
      ClosedTransform = ClosedTransform ?? defaultClosedTransform,
      CreateRoot = nil,
    }

    if let createRoot = createRoot {
      return createRoot(resolved, Content)
    }

    let opacity = if resolved.Open { resolved.OpenOpacity!! } else { resolved.ClosedOpacity!! }
    let transform = if resolved.Open { resolved.OpenTransform!! } else { resolved.ClosedTransform!! }

    let root = Container{
      Position: PositionType.Absolute,
      Top: 0.0,
      Width: resolved.Width,
      Height: resolved.Height!!,
      PaddingLeft: resolved.PaddingHorizontal,
      PaddingRight: resolved.PaddingHorizontal,
      PaddingTop: resolved.PaddingVertical,
      PaddingBottom: resolved.PaddingVertical,
      BackgroundColor: resolved.BackgroundColor!!,
      BorderColor: resolved.BorderColor!!,
      BorderWidth: resolved.BorderWidth!!,
      BorderRadius: resolved.BorderRadius!!,
      BoxShadow: resolved.BoxShadow!!,
      Opacity: opacity,
      Transform: transform,
      TransitionMs: resolved.TransitionMs!!,
      TransitionEasing: resolved.TransitionEasing!!,
      Overflow: Overflow.Hidden,
      Disabled: !resolved.Open,
      Accessibility: Accessibility{
        Role: AccessibilityRole.Group,
        Name: resolved.AccessibilityName!!,
        Hidden: !resolved.Open,
      },
    }

    if resolved.FromRight {
      root.Right = 0.0
    } else {
      root.Left = 0.0
    }

    if Content != nil {
      root.Children.Add(Content!!)
    }

    return root
  }
}
