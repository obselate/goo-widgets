package Goo.Widgets.Inputs

import Goo

/// A semantic single-line text field with label, issue, and primitive factories.
public data struct TextField {
  /// Optional label.
  var Label string?
  /// Initial value. Nil resolves to an empty string.
  var Value string?
  /// Empty-value hint. Nil resolves to an empty string.
  var Placeholder string?
  /// Optional validation issue text.
  var IssueText string?
  /// Whether the field uses invalid styling.
  var Invalid bool
  /// Whether the field rejects input.
  var Disabled bool
  /// Accessible name. Nil falls back to label, placeholder, then empty.
  var AccessibilityName string?
  /// Callback for edited values.
  var OnChange Action[string]?
  /// Callback for submitted values.
  var OnSubmit Action[string]?
  /// Entry background. Nil resolves to #09090b.
  var BackgroundColor Color?
  /// Entry text color. Nil resolves to #fafafa.
  var TextColor Color?
  /// Label text color. Nil resolves to #a1a1aa.
  var MutedTextColor Color?
  /// Entry border color. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Focus color. Nil resolves to #d4d4d8.
  var FocusColor Color?
  /// Whether focused state uses the configured focus border and ring.
  var ShowFocusHighlight bool
  /// Invalid color. Nil resolves to #ef4444.
  var InvalidColor Color?
  /// Disabled entry background. Nil resolves to #18181b.
  var DisabledBackgroundColor Color?
  /// Disabled entry text color. Nil resolves to #71717a.
  var DisabledTextColor Color?
  /// Root width. Zero resolves to 280.0.
  var Width float64
  /// Entry height. Zero resolves to 40.0.
  var EntryHeight float64
  /// Root child gap. Zero resolves to 6.0.
  var Gap float64
  /// Entry horizontal padding. Zero resolves to 12.0.
  var PaddingHorizontal float64
  /// Entry text size. Zero resolves to 14.0.
  var FontSize float64
  /// Label text size. Zero resolves to 11.0.
  var LabelFontSize float64
  /// Issue text size. Zero resolves to 12.0.
  var IssueFontSize float64
  /// Entry border width. Nil resolves to 1.0.
  var BorderWidth float64?
  /// Entry border radius. Nil resolves to 6.0.
  var BorderRadius float64?
  /// Focus ring spread. Nil resolves to 2.0.
  var FocusRingWidth float64?
  /// Entry transition duration. Nil resolves to 150.0.
  var TransitionMs float64?
  /// Entry transition easing curve. Nil resolves to Easing.EaseOut.
  var TransitionEasing Easing?
  /// Root opacity. Nil resolves to 1.0.
  var Opacity float64?
  /// Optional text font family.
  var FontFamily string?
  /// Root transform. Nil resolves to the identity transform.
  var Transform PanelTransform?
  /// Creates the entry from resolved props.
  var CreateEntry Func[TextField, TextEntry]?
  /// Creates the root from resolved props and selected primitives.
  var CreateRoot Func[TextField, Text?, TextEntry, Text?, Container]?
  /// Builds a fresh Goo text field tree after resolving props and factories.
  public func Build() Blob {
    let createEntry = CreateEntry
    let createRoot = CreateRoot
    let value = Value ?? ""
    let placeholder = Placeholder ?? ""
    let labelName = Label ?? placeholder
    let resolved = this with{
      Value = value,
      Placeholder = placeholder,
      AccessibilityName = AccessibilityName ?? labelName,
      BackgroundColor = BackgroundColor ?? Color.Parse("#09090b"),
      TextColor = TextColor ?? Color.Parse("#fafafa"),
      MutedTextColor = MutedTextColor ?? Color.Parse("#a1a1aa"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      FocusColor = FocusColor ?? Color.Parse("#d4d4d8"),
      InvalidColor = InvalidColor ?? Color.Parse("#ef4444"),
      DisabledBackgroundColor = DisabledBackgroundColor ?? Color.Parse("#18181b"),
      DisabledTextColor = DisabledTextColor ?? Color.Parse("#71717a"),
      Width = if Width == 0.0 { 280.0 } else { Width },
      EntryHeight = if EntryHeight == 0.0 { 40.0 } else { EntryHeight },
      Gap = if Gap == 0.0 { 6.0 } else { Gap },
      PaddingHorizontal = if PaddingHorizontal == 0.0 { 12.0 } else { PaddingHorizontal },
      FontSize = if FontSize == 0.0 { 14.0 } else { FontSize },
      LabelFontSize = if LabelFontSize == 0.0 { 11.0 } else { LabelFontSize },
      IssueFontSize = if IssueFontSize == 0.0 { 12.0 } else { IssueFontSize },
      BorderWidth = BorderWidth ?? 1.0,
      BorderRadius = BorderRadius ?? 6.0,
      FocusRingWidth = FocusRingWidth ?? 2.0,
      TransitionMs = TransitionMs ?? 150.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut,
      Opacity = Opacity ?? 1.0,
      Transform = Transform ?? PanelTransform{},
      CreateEntry = nil,
      CreateRoot = nil,
    }
    var label Text? = nil
    if resolved.Label != nil {
      label = Text{Content: resolved.Label!!, Color: resolved.MutedTextColor!!, FontSize: resolved.LabelFontSize, FontWeight: 600, TextTransform: TextTransform.Uppercase}
      if resolved.FontFamily != nil { label!!.FontFamily = resolved.FontFamily!! }
    }
    let accent = if resolved.Invalid { resolved.InvalidColor!! } else { resolved.FocusColor!! }
    var entry TextEntry? = nil
    if let createEntry = createEntry {
      entry = createEntry(resolved)
    } else {
      entry = TextEntry{
        Width: Length.Percent(100.0), Height: resolved.EntryHeight,
        PaddingLeft: resolved.PaddingHorizontal, PaddingRight: resolved.PaddingHorizontal,
        BackgroundColor: resolved.BackgroundColor!!, Color: resolved.TextColor!!,
        BorderColor: if resolved.Invalid { resolved.InvalidColor!! } else { resolved.BorderColor!! },
        BorderWidth: resolved.BorderWidth!!, BorderRadius: resolved.BorderRadius!!,
        FontSize: resolved.FontSize, Value: resolved.Value!!, Placeholder: resolved.Placeholder!!,
        OnChange: resolved.OnChange, OnSubmit: resolved.OnSubmit, Focusable: true,
        Disabled: resolved.Disabled, TransitionMs: resolved.TransitionMs!!, TransitionEasing: resolved.TransitionEasing!!,
        Focus: if resolved.ShowFocusHighlight { Style{BorderColor: accent, BoxShadow: BoxShadow{Color: accent, Spread: resolved.FocusRingWidth!!}} } else { Style{} },
        DisabledStyle: Style{BackgroundColor: resolved.DisabledBackgroundColor!!, Color: resolved.DisabledTextColor!!},
        Accessibility: Accessibility{Role: AccessibilityRole.TextInput, Name: resolved.AccessibilityName!!},
      }
      if resolved.FontFamily != nil { entry!!.FontFamily = resolved.FontFamily!! }
    }

    var issue Text? = nil
    if resolved.IssueText != nil {
      issue = Text{Content: resolved.IssueText!!, Color: resolved.InvalidColor!!, FontSize: resolved.IssueFontSize, FontWeight: 500, Accessibility: Accessibility{Role: AccessibilityRole.Alert, Live: AccessibilityLive.Polite, Name: resolved.IssueText!!}}
      if resolved.FontFamily != nil { issue!!.FontFamily = resolved.FontFamily!! }
    }
    if let createRoot = createRoot { return createRoot(resolved, label, entry!!, issue) }
    let root = Container{Width: resolved.Width, FlexDirection: FlexDirection.Column, Gap: resolved.Gap, Opacity: resolved.Opacity!!, Transform: resolved.Transform!!}
    if label != nil { root.Children.Add(label!!) }
    root.Children.Add(entry!!)
    if issue != nil { root.Children.Add(issue!!) }
    return root
  }
}
