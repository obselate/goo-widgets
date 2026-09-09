package Goo.Widgets.Inputs

import Goo

/// A controlled switch composed from a Goo button track and thumb.
/// Factories receive resolved props and may replace the final Goo primitives.
public data struct ToggleSwitch {
  /// Whether the track displays its on state. Build does not invert this value.
  var Checked bool
  /// Whether the switch rejects input and uses disabled visuals.
  var Disabled bool
  /// Accessible name. Nil resolves to an empty string.
  var AccessibilityName string?
  /// Action forwarded directly to Goo.Button activation.
  var OnClick Action?
  /// Off-state track color. Nil resolves to #27272a.
  var OffTrackColor Color?
  /// On-state track color. Nil resolves to #fafafa.
  var OnTrackColor Color?
  /// Disabled track color. Nil resolves to #3f3f46.
  var DisabledTrackColor Color?
  /// Normal off-state thumb color. Nil resolves to #fafafa.
  var ThumbColor Color?
  /// Normal on-state thumb color. Nil resolves to #09090b.
  var OnThumbColor Color?
  /// Disabled thumb color. Nil resolves to #71717a.
  var DisabledThumbColor Color?
  /// Track border color. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Focus border color. Nil resolves to #d4d4d8.
  var FocusBorderColor Color?
  /// Whether focused state uses the configured focus border color.
  var ShowFocusHighlight bool
  /// Track width. Zero resolves to 44.0.
  var Width float64
  /// Track height. Zero resolves to 24.0.
  var Height float64
  /// Track padding. Zero resolves to 2.0.
  var Padding float64
  /// Thumb width and height. Zero resolves to 20.0.
  var ThumbSize float64
  /// Border width. Nil resolves to 1.0; explicit zero is preserved.
  var BorderWidth float64?
  /// Track corner radius. Nil resolves to 12.0; explicit zero is preserved.
  var BorderRadius float64?
  /// Thumb corner radius. Nil resolves to 10.0; explicit zero is preserved.
  var ThumbRadius float64?
  /// Transition duration. Nil resolves to 150.0; explicit zero is preserved.
  var TransitionMs float64?
  /// Transition easing curve. Nil resolves to Easing.EaseOut.
  var TransitionEasing Easing?
  /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
  var Opacity float64?
  /// Root transform. Nil resolves to the identity transform.
  var Transform PanelTransform?
  /// Active pressed transform. Nil resolves to PanelTransform{Scale: 0.98}.
  var ActiveTransform PanelTransform?
  /// Creates the final thumb from resolved props. Nil uses the default thumb.
  var CreateThumb Func[ToggleSwitch, Container]?
  /// Creates the final Button from resolved props and exact final thumb.
  var CreateRoot Func[ToggleSwitch, Container, Button]?
  /// Builds a fresh Goo switch tree after resolving props and factories.
  public func Build() Blob {
    let createThumb = CreateThumb
    let createRoot = CreateRoot
    let resolved = this with{
      AccessibilityName = AccessibilityName ?? "",
      OffTrackColor = OffTrackColor ?? Color.Parse("#27272a"),
      OnTrackColor = OnTrackColor ?? Color.Parse("#fafafa"),
      DisabledTrackColor = DisabledTrackColor ?? Color.Parse("#3f3f46"),
      ThumbColor = ThumbColor ?? Color.Parse("#fafafa"),
      OnThumbColor = OnThumbColor ?? Color.Parse("#09090b"),
      DisabledThumbColor = DisabledThumbColor ?? Color.Parse("#71717a"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      FocusBorderColor = FocusBorderColor ?? Color.Parse("#d4d4d8"),
      Width = if Width == 0.0 { 44.0 } else { Width }, Height = if Height == 0.0 { 24.0 } else { Height },
      Padding = if Padding == 0.0 { 2.0 } else { Padding }, ThumbSize = if ThumbSize == 0.0 { 20.0 } else { ThumbSize },
      BorderWidth = BorderWidth ?? 1.0, BorderRadius = BorderRadius ?? 12.0,
      ThumbRadius = ThumbRadius ?? 10.0, TransitionMs = TransitionMs ?? 150.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut, Opacity = Opacity ?? 1.0,
      Transform = Transform ?? PanelTransform{},
      ActiveTransform = ActiveTransform ?? PanelTransform{Scale: 0.98},
      CreateThumb = nil, CreateRoot = nil,
    }
    let travel = Math.Max(0.0, resolved.Width - 2.0 * (resolved.Padding + resolved.BorderWidth!!) - resolved.ThumbSize)
    let marginLeft = if resolved.Checked { travel } else { 0.0 }
    let thumb = if let createThumb = createThumb {
      createThumb(resolved)
    } else {
      let thumbColor = if resolved.Disabled {
        resolved.DisabledThumbColor!!
      } else if resolved.Checked {
        resolved.OnThumbColor!!
      } else {
        resolved.ThumbColor!!
      }
      Container{
        Width: resolved.ThumbSize,
        Height: resolved.ThumbSize,
        BackgroundColor: thumbColor,
        BorderRadius: resolved.ThumbRadius!!,
        TransitionMs: resolved.TransitionMs!!,
        TransitionEasing: resolved.TransitionEasing!!,
        MarginLeft: marginLeft,
      }
    }
    if let createRoot = createRoot {
      return createRoot(resolved, thumb)
    }
    let trackColor = if resolved.Disabled {
      resolved.DisabledTrackColor!!
    } else if resolved.Checked {
      resolved.OnTrackColor!!
    } else {
      resolved.OffTrackColor!!
    }
    return Button{
      Width: resolved.Width,
      Height: resolved.Height,
      PaddingLeft: resolved.Padding,
      PaddingRight: resolved.Padding,
      PaddingTop: resolved.Padding,
      PaddingBottom: resolved.Padding,
      BorderWidth: resolved.BorderWidth!!,
      BorderRadius: resolved.BorderRadius!!,
      BorderColor: resolved.BorderColor!!,
      BackgroundColor: trackColor,
      Opacity: resolved.Opacity!!,
      Transform: resolved.Transform!!,
      Cursor: Cursor.Pointer,
      Focusable: true,
      Disabled: resolved.Disabled,
      OnClick: resolved.OnClick,
      TransitionMs: resolved.TransitionMs!!,
      TransitionEasing: resolved.TransitionEasing!!,
      Active: Style{Transform: resolved.ActiveTransform!!},
      Focus: if resolved.ShowFocusHighlight { Style{BorderColor: resolved.FocusBorderColor!!} } else { Style{} },
      DisabledStyle: Style{BackgroundColor: resolved.DisabledTrackColor!!},
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.FlexStart,
      Accessibility: Accessibility{
        Role: AccessibilityRole.Switch,
        Name: resolved.AccessibilityName!!,
        Checked: if resolved.Checked { AccessibilityChecked.True } else { AccessibilityChecked.False },
      },
      Children: { thumb },
    }
  }
}
