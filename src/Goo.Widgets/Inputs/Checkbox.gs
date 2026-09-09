package Goo.Widgets.Inputs

import Goo
import Goo.Widgets.Icons

/// A controlled checkbox with false, true, and mixed accessibility states.
public data struct Checkbox {
  /// Current checkbox state. Unspecified resolves to false.
  var State AccessibilityChecked
  /// Whether activation cycles from true to mixed before false.
  var AllowMixed bool
  /// Whether the checkbox rejects input.
  var Disabled bool
  /// Called with the next state when the checkbox is activated.
  var OnChange Action[AccessibilityChecked]?
  /// Optional text rendered beside the checkbox mark as one interactive row.
  var Label string?
  /// Label text color. Nil resolves to #fafafa.
  var LabelColor Color?
  /// Label font size. Zero resolves to 14.
  var LabelFontSize float64
  /// Label font weight. Zero resolves to 500.
  var LabelFontWeight int32
  /// Gap between the checkbox mark and label. Nil resolves to 8.
  var LabelGap float64?
  /// Accessible name. Nil resolves to Label or an empty string.
  var AccessibilityName string?
  /// Optional content shown when false.
  var UncheckedContent Blob?
  /// Optional content shown when true.
  var CheckedContent Blob?
  /// Optional content shown when mixed.
  var MixedContent Blob?
  /// Checkbox width and height. Zero resolves to 20.
  var Size float64
  /// Background while false. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Background while true or mixed. Nil resolves to #fafafa.
  var CheckedBackgroundColor Color?
  /// Border while false. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Border while true or mixed. Nil resolves to #fafafa.
  var CheckedBorderColor Color?
  /// Mark color. Nil resolves to #09090b.
  var MarkColor Color?
  /// Disabled opacity. Nil resolves to 0.5 and preserves explicit zero.
  var DisabledOpacity float64?
  /// Border width. Nil resolves to 1 and preserves explicit zero.
  var BorderWidth float64?
  /// Corner radius. Nil resolves to 4 and preserves explicit zero.
  var BorderRadius float64?
  /// Mark icon size. Zero resolves to 14.
  var MarkSize float64
  /// Transition duration. Nil resolves to 150 and preserves explicit zero.
  var TransitionMs float64?
  /// Transition easing. Nil resolves to EaseOut.
  var TransitionEasing Easing?
  /// Creates the final button from resolved values and selected content, replacing the default root composition.
  var CreateRoot Func[Checkbox, Blob?, Button]?

  /// Builds a fresh Goo checkbox button or labeled interactive row.
  public func Build() Blob {
    let createRoot = CreateRoot
    let onChange = OnChange
    let state = if State == AccessibilityChecked.Unspecified { AccessibilityChecked.False } else { State }
    let active = state != AccessibilityChecked.False
    let resolved = this with{
      State = state,
      AccessibilityName = AccessibilityName ?? (Label ?? ""),
      LabelColor = LabelColor ?? Color.Parse("#fafafa"),
      LabelFontSize = if LabelFontSize == 0.0 { 14.0 } else { LabelFontSize },
      LabelFontWeight = if LabelFontWeight == 0 { 500 } else { LabelFontWeight },
      LabelGap = LabelGap ?? 8.0,
      Size = if Size == 0.0 { 20.0 } else { Size },
      BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
      CheckedBackgroundColor = CheckedBackgroundColor ?? Color.Parse("#fafafa"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      CheckedBorderColor = CheckedBorderColor ?? Color.Parse("#fafafa"),
      MarkColor = MarkColor ?? Color.Parse("#09090b"),
      DisabledOpacity = DisabledOpacity ?? 0.5,
      BorderWidth = BorderWidth ?? 1.0,
      BorderRadius = BorderRadius ?? 4.0,
      MarkSize = if MarkSize == 0.0 { 14.0 } else { MarkSize },
      TransitionMs = TransitionMs ?? 150.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut,
      CreateRoot = nil,
    }

    var content Blob? = UncheckedContent
    if state == AccessibilityChecked.True {
      content = CheckedContent
    } else if state == AccessibilityChecked.Mixed {
      content = MixedContent
    }
    if active && content == nil {
      let mark = if state == AccessibilityChecked.Mixed { "remove" } else { "check" }
      content = MaterialIcons.Create(mark, size: resolved.MarkSize, color: resolved.MarkColor!!)
    }

    if let createRoot = createRoot { return createRoot(resolved, content) }
    var onClick Action? = nil
    if !resolved.Disabled {
      if let onChange = onChange {
        let next = if state == AccessibilityChecked.False {
          AccessibilityChecked.True
        } else if state == AccessibilityChecked.True && resolved.AllowMixed {
          AccessibilityChecked.Mixed
        } else {
          AccessibilityChecked.False
        }
        onClick = () -> onChange(next)
      }
    }
    if let label = resolved.Label {
      let markBox = Container{
        Width: resolved.Size,
        Height: resolved.Size,
        BorderWidth: resolved.BorderWidth!!,
        BorderRadius: resolved.BorderRadius!!,
        BorderColor: if active { resolved.CheckedBorderColor!! } else { resolved.BorderColor!! },
        BackgroundColor: if active { resolved.CheckedBackgroundColor!! } else { resolved.BackgroundColor!! },
        TransitionMs: resolved.TransitionMs!!,
        TransitionEasing: resolved.TransitionEasing!!,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.Center,
        HitTestSelf: false,
      }
      if let content = content { markBox.Children.Add(content) }
      return Button{
        Width: Length.Auto,
        Height: resolved.Size,
        Padding: 0.0,
        Gap: resolved.LabelGap!!,
        BorderWidth: 0.0,
        BorderRadius: 0.0,
        BackgroundColor: Color.Transparent,
        Cursor: if resolved.Disabled { Cursor.Default } else { Cursor.Pointer },
        Opacity: if resolved.Disabled { resolved.DisabledOpacity!! } else { 1.0 },
        Focusable: true,
        Disabled: resolved.Disabled,
        OnClick: onClick,
        TransitionMs: resolved.TransitionMs!!,
        TransitionEasing: resolved.TransitionEasing!!,
        FlexDirection: FlexDirection.Row,
        AlignItems: AlignItems.Center,
        JustifyContent: JustifyContent.FlexStart,
        Hover: Style{BackgroundColor: Color.Transparent},
        Active: Style{BackgroundColor: Color.Transparent},
        Accessibility: Accessibility{
          Role: AccessibilityRole.Checkbox,
          Name: resolved.AccessibilityName!!,
          Checked: state,
        },
        Children: {
          markBox,
          Text{
            Content: label,
            Color: resolved.LabelColor!!,
            FontSize: resolved.LabelFontSize,
            FontWeight: resolved.LabelFontWeight,
          },
        },
      }
    }
    let root = Button{
      Width: resolved.Size,
      Height: resolved.Size,
      BorderWidth: resolved.BorderWidth!!,
      BorderRadius: resolved.BorderRadius!!,
      BorderColor: if active { resolved.CheckedBorderColor!! } else { resolved.BorderColor!! },
      BackgroundColor: if active { resolved.CheckedBackgroundColor!! } else { resolved.BackgroundColor!! },
      Opacity: if resolved.Disabled { resolved.DisabledOpacity!! } else { 1.0 },
      Cursor: if resolved.Disabled { Cursor.Default } else { Cursor.Pointer },
      Focusable: true,
      Disabled: resolved.Disabled,
      OnClick: onClick,
      TransitionMs: resolved.TransitionMs!!,
      TransitionEasing: resolved.TransitionEasing!!,
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      Accessibility: Accessibility{
        Role: AccessibilityRole.Checkbox,
        Name: resolved.AccessibilityName!!,
        Checked: state,
      },
    }
    if let content = content { root.Children.Add(content) }
    return root
  }
}
