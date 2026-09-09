package Goo.Widgets.Colors

import System
import System.Globalization
import Goo
import Goo.Widgets.Inputs

/// Immutable input for a mounted ColorPicker.
public data struct ColorPickerInput {
  /// Current packed 24-bit sRGB value.
  var Value int32
  /// Color model used by the wheel and tone slider.
  var Mode ColorMode
  /// Accessible name. Nil resolves to Color picker.
  var AccessibilityName string?
  /// Receives preview colors during pointer and keyboard input.
  var OnValueChanged Action[int32]?
  /// Receives the final color after pointer, keyboard, or accessibility input.
  var OnValueCommitted Action[int32]?
  /// Whether the picker rejects input.
  var Disabled bool
  /// Wheel width and height. Zero resolves to 240.0.
  var WheelSize float64
  /// Tone slider height. Zero resolves to 28.0.
  var ToneSliderHeight float64
  /// Gap between the wheel and slider. Nil resolves to 12.0.
  var Gap float64?
  /// Marker diameter. Zero resolves to 22.0.
  var MarkerSize float64
  /// Marker border color. Nil resolves to white.
  var MarkerBorderColor Color?
  /// Enables the visible focus outline. Disabled by default.
  var ShowFocusHighlight bool
  /// Focus outline color. Nil resolves to #a1a1aa.
  var FocusOutlineColor Color?
  /// Optional base style for the picker root.
  var RootStyle Style?
  /// Optional base style for the interactive wheel.
  var WheelStyle Style?
  /// Optional base style for the wheel marker.
  var MarkerStyle Style?
  /// Creates the marker from resolved props and current color coordinates.
  var CreateMarker Func[ColorPickerInput, int32, float64, float64, Blob]?
  /// Creates the final root from resolved props, wheel, and tone slider.
  var CreateRoot Func[ColorPickerInput, Blob, Blob, Container]?
}

/// A single-color HSL, HSV, or OKLCH picker with a retained color-wheel image.
public open class ColorPicker : Cell[ColorPickerInput], IDisposable {
  private let wheelHandle ElementHandle = ElementHandle{}
  private let wheelSource ColorWheelSource = ColorWheelSource(384)
  private var resolved ColorPickerInput
  private var currentRgb int32
  private var lastExternal int32
  private var currentMode ColorMode
  private var hue float64
  private var radius float64
  private var tone float64
  private var initialized bool
  private var dragging bool
  private var pointerId int64 = -1L

  /// Releases the retained wheel image when Goo unmounts this cell.
  public func Dispose() { wheelSource.Dispose() }

  protected override func Build(input ColorPickerInput) Blob {
    resolved = Resolve(input)
    if resolved.Disabled && dragging {
      dragging = false
      pointerId = -1L
    }
    if !initialized || input.Value != lastExternal {
      currentRgb = input.Value
      lastExternal = input.Value
      currentMode = input.Mode
      ReadCoordinates(currentRgb)
      initialized = true
    } else if input.Mode != currentMode {
      currentMode = input.Mode
      ReadCoordinates(currentRgb)
    }
    wheelSource.Update(currentMode, tone)
    let wheel = BuildWheel()
    let slider = Cell.Mount[SliderInput, Slider]("color-tone", SliderInput{
      Value: tone,
      Minimum: 0.0,
      Maximum: 1.0,
      Step: 0.01,
      AccessibilityName: if currentMode == ColorMode.Hsv { "Color value" } else { "Color lightness" },
      OnValueChanged: (value float64) -> ToneChanged(value),
      OnValueCommitted: (value float64) -> ToneCommitted(value),
      Disabled: resolved.Disabled,
      Height: resolved.ToneSliderHeight,
      TrackColor: Color.Transparent,
      FillColor: Color.Transparent,
      ThumbColor: ColorMath.GooColor(currentRgb),
      ThumbBorderColor: resolved.MarkerBorderColor,
      FocusOutlineColor: resolved.FocusOutlineColor,
      ShowFocusHighlight: resolved.ShowFocusHighlight,
      TrackStyle: Style{ BackgroundGradient: ToneGradient() },
    })
    if let createRoot = resolved.CreateRoot {
      return createRoot(resolved, wheel, slider)
    }
    return Container{
      BasedOn: resolved.RootStyle,
      Width: resolved.WheelSize,
      Gap: resolved.Gap!!,
      AlignItems: AlignItems.Stretch,
      Children: { wheel, slider },
    }
  }

  private func Resolve(input ColorPickerInput) ColorPickerInput {
    if input.Value < 0 || input.Value > 0xFFFFFF { throw ArgumentOutOfRangeException("Value") }
    let wheelSize = if input.WheelSize == 0.0 { 240.0 } else { input.WheelSize }
    let markerSize = if input.MarkerSize == 0.0 { 22.0 } else { input.MarkerSize }
    let sliderHeight = if input.ToneSliderHeight == 0.0 { 28.0 } else { input.ToneSliderHeight }
    if !Double.IsFinite(wheelSize) || wheelSize <= 0.0 { throw ArgumentOutOfRangeException("WheelSize") }
    if !Double.IsFinite(markerSize) || markerSize <= 0.0 { throw ArgumentOutOfRangeException("MarkerSize") }
    if !Double.IsFinite(sliderHeight) || sliderHeight <= 0.0 { throw ArgumentOutOfRangeException("ToneSliderHeight") }
    return input with{
      AccessibilityName = input.AccessibilityName ?? "Color picker",
      WheelSize = wheelSize,
      ToneSliderHeight = sliderHeight,
      Gap = input.Gap ?? 12.0,
      MarkerSize = markerSize,
      MarkerBorderColor = input.MarkerBorderColor ?? Color.White,
      FocusOutlineColor = input.FocusOutlineColor ?? Color.Parse("#a1a1aa"),
    }
  }

  private func BuildWheel() Blob {
    let x = Math.Cos(hue * Math.PI / 180.0) * radius
    let y = Math.Sin(hue * Math.PI / 180.0) * radius
    let marker = if let createMarker = resolved.CreateMarker {
      createMarker(resolved, currentRgb, hue, radius)
    } else {
      Container{
        BasedOn: resolved.MarkerStyle,
        Position: PositionType.Absolute,
        Left: Length.Percent(50.0 + x * 50.0),
        Top: Length.Percent(50.0 + y * 50.0),
        MarginLeft: -resolved.MarkerSize / 2.0,
        MarginTop: -resolved.MarkerSize / 2.0,
        Width: resolved.MarkerSize,
        Height: resolved.MarkerSize,
        BorderRadius: resolved.MarkerSize / 2.0,
        BorderWidth: 3.0,
        BorderColor: resolved.MarkerBorderColor!!,
        BackgroundColor: ColorMath.GooColor(currentRgb),
        HitTestSelf: false,
        Accessibility: Accessibility{ Hidden: true },
      }
    }
    let valueText = Math.Round(hue).ToString(CultureInfo.InvariantCulture) + "," + Math.Round(radius * 100.0).ToString(CultureInfo.InvariantCulture)
    let accessibility = if resolved.Disabled {
      Accessibility{
        Role: AccessibilityRole.Generic,
        Name: resolved.AccessibilityName!! +" color wheel",
        Value: valueText,
        ReadOnly: true,
      }
    } else {
      Accessibility{
        Role: AccessibilityRole.Generic,
        Name: resolved.AccessibilityName!! +" color wheel",
        Value: valueText,
        ReadOnly: false,
        Actions: []AccessibilityAction{ AccessibilityAction.SetValue },
        OnAction: (request AccessibilityActionRequest) -> HandleAccessibility(request),
      }
    }
    return Container{
      BasedOn: resolved.WheelStyle,
      Key: "color-wheel",
      Handle: wheelHandle,
      Width: resolved.WheelSize,
      Height: resolved.WheelSize,
      FlexShrink: 0.0,
      Position: PositionType.Relative,
      BorderRadius: resolved.WheelSize / 2.0,
      Cursor: Cursor.Pointer,
      Disabled: resolved.Disabled,
      Focusable: !resolved.Disabled,
      HitTestSelf: !resolved.Disabled,
      Focus: if resolved.ShowFocusHighlight { Style{ OutlineWidth: 2.0, OutlineColor: resolved.FocusOutlineColor!!, OutlineOffset: 4.0 } } else { Style{} },
      Accessibility: accessibility,
      OnPointerDown: (e PointerEvent) -> BeginPointer(e),
      OnPointerMove: (e PointerEvent) -> MovePointer(e),
      OnPointerUp: (e PointerEvent) -> EndPointer(e),
      OnPointerCancel: (e PointerEvent) -> EndPointer(e),
      OnKeyDown: (e KeyEvent) -> KeyDown(e),
      Children: {
        Image{
          Source: wheelSource,
          Fit: ImageFit.Contain,
          Width: resolved.WheelSize,
          Height: resolved.WheelSize,
          Accessibility: Accessibility{ Hidden: true },
        },
        Container{
          Position: PositionType.Absolute,
          Left: 0.0,
          Top: 0.0,
          Width: Length.Percent(100.0),
          Height: Length.Percent(100.0),
          HitTestSelf: false,
          Children: { marker },
        },
      },
    }
  }

  private func ReadCoordinates(rgb int32) {
    if currentMode == ColorMode.Hsl {
      let color = HslColor.FromRgb(rgb)
      hue = color.Hue
      radius = color.Saturation
      tone = color.Lightness
    } else if currentMode == ColorMode.Hsv {
      let color = HsvColor.FromRgb(rgb)
      hue = color.Hue
      radius = color.Saturation
      tone = color.Value
    } else {
      let color = OklchColor.FromRgb(rgb)
      hue = color.Hue
      tone = color.Lightness
      let maximum = OklchColor.MaxChroma(tone, hue)
      radius = if maximum <= 0.000001 { 0.0 } else { Math.Clamp(color.Chroma / maximum, 0.0, 1.0) }
    }
  }

  private func UpdateColor(commit bool) {
    let next = ColorWheelSource.Sample(currentMode, hue, radius, tone)
    if next != currentRgb {
      currentRgb = next
      resolved.OnValueChanged?.Invoke(next)
    }
    if commit { resolved.OnValueCommitted?.Invoke(currentRgb) }
  }

  private func ToneChanged(value float64) {
    tone = value
    UpdateColor(false)
    Rebuild()
  }

  private func ToneCommitted(value float64) {
    tone = value
    UpdateColor(true)
    Rebuild()
  }

  private func CoordinatesFromPointer(e PointerEvent) {
    let box = wheelHandle.BorderBox
    if box.Width <= 0.0 || box.Height <= 0.0 { return }
    let x = 2.0 * (e.WindowPosition.X - box.X) / box.Width - 1.0
    let y = 2.0 * (e.WindowPosition.Y - box.Y) / box.Height - 1.0
    let nextRadius = Math.Min(1.0, Math.Sqrt(x * x + y * y))
    if nextRadius >= 0.000001 { hue = WrapHue(Math.Atan2(y, x) * 180.0 / Math.PI) }
    radius = nextRadius
    UpdateColor(false)
  }

  private func BeginPointer(e PointerEvent) {
    if resolved.Disabled || e.Button != PointerButton.Primary || dragging { return }
    dragging = true
    pointerId = e.PointerId
    e.Capture()
    e.PreventDefault()
    CoordinatesFromPointer(e)
  }

  private func MovePointer(e PointerEvent) {
    if resolved.Disabled { return }
    if dragging && e.PointerId == pointerId { CoordinatesFromPointer(e) }
  }

  private func EndPointer(e PointerEvent) {
    if resolved.Disabled || !dragging || e.PointerId != pointerId { return }
    e.ReleaseCapture()
    dragging = false
    pointerId = -1L
    UpdateColor(true)
  }

  private func KeyDown(e KeyEvent) {
    if resolved.Disabled { return }
    var handled = true
    if e.Key == Key.Left {
      hue = WrapHue(hue - 1.0)
    } else if e.Key == Key.Right {
      hue = WrapHue(hue + 1.0)
    } else if e.Key == Key.Up {
      radius = Math.Clamp(radius + 0.01, 0.0, 1.0)
    } else if e.Key == Key.Down {
      radius = Math.Clamp(radius - 0.01, 0.0, 1.0)
    } else if e.Key == Key.Home {
      radius = 0.0
    } else if e.Key == Key.End {
      radius = 1.0
    } else {
      handled = false
    }
    if !handled { return }
    e.PreventDefault()
    UpdateColor(true)
  }

  private func HandleAccessibility(request AccessibilityActionRequest) bool {
    if resolved.Disabled { return false }
    if request.Action != AccessibilityAction.SetValue { return false }
    let parts = request.Value.Split(',')
    if parts.Length != 2 { return false }
    if !Double.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var nextHue) || !Double.IsFinite(nextHue) {
      return false
    }
    if !Double.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var percentage) || !Double.IsFinite(percentage) {
      return false
    }
    hue = WrapHue(nextHue)
    radius = Math.Clamp(percentage / 100.0, 0.0, 1.0)
    UpdateColor(true)
    Rebuild()
    return true
  }

  private func ToneGradient() LinearGradient {
    let stops = [17]GradientStop
    for index in 0 ... 17 {
      let offset = float64(index) / 16.0
      stops[index] = GradientStop{
        Offset: offset,
        Color: ColorMath.GooColor(ColorWheelSource.Sample(currentMode, hue, radius, offset)),
      }
    }
    return LinearGradient(90.0, stops)
  }
}
