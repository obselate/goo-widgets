package Goo.Widgets.Inputs

import Goo

/// A controlled checkbox with false, true, and mixed accessibility states.
public data struct Checkbox {
  /// Current checkbox state.
  var State AccessibilityChecked
  /// Whether activation cycles from true to mixed before false.
  var AllowMixed bool
  /// Whether the checkbox rejects input.
  var Disabled bool
  /// Called with the next state when the checkbox is activated.
  var OnChange Action[AccessibilityChecked]?
  /// Accessible name. Nil resolves to an empty string.
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
  /// Mark font size. Zero resolves to 14.
  var FontSize float64
  /// Transition duration. Nil resolves to 150 and preserves explicit zero.
  var TransitionMs float64?
  /// Transition easing. Nil resolves to EaseOut.
  var TransitionEasing Easing?
  /// Creates the final button from resolved values and selected content.
  var CreateRoot Func[Checkbox, Blob?, Button]?

  /// Builds a fresh Goo checkbox button.
  public func Build() Blob {
    let createRoot = CreateRoot
    let onChange = OnChange
    let state = State
    let active = state != AccessibilityChecked.False
    let resolved = this with{
      AccessibilityName = AccessibilityName ?? "",
      Size = if Size == 0.0 { 20.0 } else { Size },
      BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
      CheckedBackgroundColor = CheckedBackgroundColor ?? Color.Parse("#fafafa"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      CheckedBorderColor = CheckedBorderColor ?? Color.Parse("#fafafa"),
      MarkColor = MarkColor ?? Color.Parse("#09090b"),
      DisabledOpacity = DisabledOpacity ?? 0.5,
      BorderWidth = BorderWidth ?? 1.0,
      BorderRadius = BorderRadius ?? 4.0,
      FontSize = if FontSize == 0.0 { 14.0 } else { FontSize },
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
      content = Text{
        Content: if state == AccessibilityChecked.Mixed { "−" } else { "✓" },
        Color: resolved.MarkColor!!,
        FontSize: resolved.FontSize,
        FontWeight: 700,
        Accessibility: Accessibility{Hidden: true},
      }
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
    if content != nil { root.Children.Add(content!!) }
    return root
  }
}
