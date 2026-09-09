package Goo.Widgets.Layout

import Goo

/// A semantic section header with accent dot, uppercase label, horizontal rule, and optional meta text.
public data struct SectionHeader {
  /// Header text. Nil resolves to an empty string.
  var Label string?
  /// Optional metadata text displayed trailing the rule. Nil omits the meta text element.
  var MetaText string?
  /// Whether to render the leading circular accent dot.
  var ShowAccent bool
  /// Accessible expanded state. Nil leaves Expanded unpopulated in accessibility semantics.
  var Expanded bool?
  /// Accessible name. Nil resolves to the resolved Label.
  var AccessibilityName string?
  /// Heading level for accessibility. Zero or default resolves to 2.
  var HeadingLevel int32
  /// Header width. Nil resolves to 100%.
  var Width Length?
  /// Label text color. Nil resolves to #d4d4d8.
  var LabelColor Color?
  /// Meta text color. Nil resolves to #71717a.
  var MetaColor Color?
  /// Horizontal rule color. Nil resolves to #3f3f46.
  var RuleColor Color?
  /// Accent dot color. Nil resolves to #fafafa.
  var AccentColor Color?
  /// Row layout gap between elements. Nil resolves to 10.0; explicit zero is preserved.
  var Gap float64?
  /// Accent dot diameter. Nil resolves to 6.0; explicit zero is preserved.
  var AccentSize float64?
  /// Horizontal rule height. Nil resolves to 1.0; explicit zero is preserved.
  var RuleHeight float64?
  /// Root opacity. Nil resolves to 1.0; explicit zero is preserved.
  var Opacity float64?
  /// Label font size. Zero resolves to 11.0.
  var LabelFontSize float64
  /// Label font weight. Zero resolves to 700.
  var LabelFontWeight int32
  /// Meta text font size. Zero resolves to 11.0.
  var MetaFontSize float64
  /// Meta text font weight. Zero resolves to 500.
  var MetaFontWeight int32
  /// Optional font family applied to default label and meta text elements.
  var FontFamily string?
  /// Transform applied to the root container. Nil resolves to the identity transform.
  var Transform PanelTransform?
  /// Custom factory for the label Text element. Receives resolved props.
  var CreateLabel Func[SectionHeader, Text]?
  /// Custom factory for the meta Text element. Receives resolved props.
  var CreateMeta Func[SectionHeader, Text]?
  /// Custom factory for the root Container. Receives resolved props and child primitives.
  var CreateRoot Func[SectionHeader, Container?, Text, Container, Text?, Container]?

  /// Builds a fresh Goo element tree after resolving props and factories.
  public func Build() Blob {
    let createLabel = CreateLabel
    let createMeta = CreateMeta
    let createRoot = CreateRoot
    let labelText = Label ?? ""
    let resolved = this with{
      Label = labelText,
      AccessibilityName = AccessibilityName ?? labelText,
      HeadingLevel = if HeadingLevel == 0 { 2 } else { HeadingLevel },
      Width = Width ?? Length.Percent(100.0),
      LabelColor = LabelColor ?? Color.Parse("#d4d4d8"),
      MetaColor = MetaColor ?? Color.Parse("#71717a"),
      RuleColor = RuleColor ?? Color.Parse("#3f3f46"),
      AccentColor = AccentColor ?? Color.Parse("#fafafa"),
      Gap = Gap ?? 10.0,
      AccentSize = AccentSize ?? 6.0,
      RuleHeight = RuleHeight ?? 1.0,
      Opacity = Opacity ?? 1.0,
      LabelFontSize = if LabelFontSize == 0.0 { 11.0 } else { LabelFontSize },
      LabelFontWeight = if LabelFontWeight == 0 { 700 } else { LabelFontWeight },
      MetaFontSize = if MetaFontSize == 0.0 { 11.0 } else { MetaFontSize },
      MetaFontWeight = if MetaFontWeight == 0 { 500 } else { MetaFontWeight },
      Transform = Transform ?? PanelTransform{},
      CreateLabel = nil,
      CreateMeta = nil,
      CreateRoot = nil,
    }

    var accent Container? = nil
    if resolved.ShowAccent {
      let size = resolved.AccentSize!!
      accent = Container{Width: size, Height: size, BorderRadius: size / 2.0, BackgroundColor: resolved.AccentColor!!}
    }

    var label Text? = nil
    if let createLabel = createLabel {
      label = createLabel(resolved)
    } else {
      label = Text{Content: resolved.Label!!, Color: resolved.LabelColor!!, FontSize: resolved.LabelFontSize, FontWeight: resolved.LabelFontWeight, TextTransform: TextTransform.Uppercase}
      if resolved.FontFamily != nil { label!!.FontFamily = resolved.FontFamily!! }
    }

    let rule = Container{Height: resolved.RuleHeight!!, BackgroundColor: resolved.RuleColor!!, FlexGrow: 1.0}

    var meta Text? = nil
    if resolved.MetaText != nil {
      if let createMeta = createMeta {
        meta = createMeta(resolved)
      } else {
        meta = Text{Content: resolved.MetaText!!, Color: resolved.MetaColor!!, FontSize: resolved.MetaFontSize, FontWeight: resolved.MetaFontWeight}
        if resolved.FontFamily != nil { meta!!.FontFamily = resolved.FontFamily!! }
      }
    }

    if let createRoot = createRoot { return createRoot(resolved, accent, label!!, rule, meta) }

    var semantics = Accessibility{Role: AccessibilityRole.Heading, Name: resolved.AccessibilityName!!, Level: resolved.HeadingLevel}
    if resolved.Expanded != nil { semantics.Expanded = resolved.Expanded }

    let root = Container{
      Width: resolved.Width!!,
      Opacity: resolved.Opacity!!,
      Transform: resolved.Transform!!,
      FlexDirection: FlexDirection.Row,
      AlignItems: AlignItems.Center,
      Gap: resolved.Gap!!,
      Accessibility: semantics,
    }
    if accent != nil { root.Children.Add(accent!!) }
    root.Children.Add(label!!)
    root.Children.Add(rule)
    if meta != nil { root.Children.Add(meta!!) }
    return root
  }
}
