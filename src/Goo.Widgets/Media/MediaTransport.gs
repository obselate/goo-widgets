package Goo.Widgets.Media

import System
import Goo
import Goo.Widgets.Inputs

/// Identifies a media transport action slot.
public enum MediaTransportAction { Previous; Play; Pause; Next }

/// Immutable input for a mounted MediaTransport.
public data struct MediaTransportInput {
  /// Current media position in seconds.
  var Position float64
  /// Media duration in seconds.
  var Duration float64
  /// Current volume from zero through one.
  var Volume float64
  /// Whether media is playing.
  var Playing bool
  /// Whether all transport input is disabled.
  var Disabled bool
  /// Whether previous is available. Nil resolves from OnPrevious.
  var CanPrevious bool?
  /// Whether play and pause are available. Nil resolves from OnPlayPause.
  var CanPlayPause bool?
  /// Whether next is available. Nil resolves from OnNext.
  var CanNext bool?
  /// Whether seeking is available. Nil resolves from seek callbacks and positive duration.
  var CanSeek bool?
  /// Whether volume input is available. Nil resolves from volume callbacks.
  var CanSetVolume bool?
  /// Previous action.
  var OnPrevious Action?
  /// Play or pause action.
  var OnPlayPause Action?
  /// Next action.
  var OnNext Action?
  /// Receives preview seek positions.
  var OnSeekChanged Action[float64]?
  /// Receives committed seek positions.
  var OnSeekCommitted Action[float64]?
  /// Receives preview volume values.
  var OnVolumeChanged Action[float64]?
  /// Receives committed volume values.
  var OnVolumeCommitted Action[float64]?
  /// Optional previous action content.
  var PreviousContent Blob?
  /// Optional play action content.
  var PlayContent Blob?
  /// Optional pause action content.
  var PauseContent Blob?
  /// Optional next action content.
  var NextContent Blob?
  /// Root width. Nil resolves to 100 percent.
  var Width Length?
  /// Root padding. Nil resolves to 16.0.
  var Padding float64?
  /// Gap between rows. Nil resolves to 12.0.
  var Gap float64?
  /// Gap between action buttons. Nil resolves to 8.0.
  var ActionGap float64?
  /// Standard action button size. Zero resolves to 40.0.
  var ActionSize float64
  /// Play or pause button size. Zero resolves to 52.0.
  var PrimaryActionSize float64
  /// Root background. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Supporting text color. Nil resolves to #a1a1aa.
  var TextColor Color?
  /// Action background. Nil resolves to #27272a.
  var ActionBackgroundColor Color?
  /// Action hover background. Nil resolves to #3f3f46.
  var ActionHoverBackgroundColor Color?
  /// Primary action background. Nil resolves to #fafafa.
  var PrimaryActionBackgroundColor Color?
  /// Primary action text. Nil resolves to #09090b.
  var PrimaryActionTextColor Color?
  /// Slider track color. Nil resolves to #3f3f46.
  var TrackColor Color?
  /// Slider fill color. Nil resolves to #fafafa.
  var FillColor Color?
  /// Optional base style for the root.
  var RootStyle Style?
  /// Optional base style for standard actions.
  var ActionStyle Style?
  /// Optional base style for the primary action.
  var PrimaryActionStyle Style?
  /// Creates content for an action slot.
  var CreateActionContent Func[MediaTransportInput, MediaTransportAction, Blob]?
  /// Creates an action button from resolved input, slot, content, callback, and disabled state.
  var CreateAction Func[MediaTransportInput, MediaTransportAction, Blob, Action?, bool, Button]?
  /// Wraps the composed transport root.
  var CreateRoot Func[MediaTransportInput, Container, Blob]?
}

/// A compact media transport composed from action buttons and mounted sliders.
public open class MediaTransport : Cell[MediaTransportInput] {
  protected override func Build(input MediaTransportInput) Blob {
    let createRoot = input.CreateRoot
    let resolved = Resolve(input)
    let previous = ActionButton(resolved, MediaTransportAction.Previous, resolved.OnPrevious, !resolved.CanPrevious!!)
    let playbackAction = if resolved.Playing { MediaTransportAction.Pause } else { MediaTransportAction.Play }
    let playback = ActionButton(resolved, playbackAction, resolved.OnPlayPause, !resolved.CanPlayPause!!)
    let next = ActionButton(resolved, MediaTransportAction.Next, resolved.OnNext, !resolved.CanNext!!)
    let root = Container{
      BasedOn: resolved.RootStyle,
      Width: resolved.Width!!,
      Padding: resolved.Padding!!,
      Gap: resolved.Gap!!,
      BackgroundColor: resolved.BackgroundColor!!,
      Children: {
        Container{
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.Center,
          Gap: 12.0,
          Children: {
            TimeText(resolved.Position, resolved.TextColor!!),
            Container{
              Width: 0.0,
              MinWidth: 80.0,
              FlexGrow: 1.0,
              Children: {
                Cell.Mount[SliderInput, Slider]("media-position", SliderInput{
                  Value: resolved.Position,
                  Minimum: 0.0,
                  Maximum: if resolved.Duration > 0.0 { resolved.Duration } else { 1.0 },
                  Step: 1.0,
                  Disabled: !resolved.CanSeek!!,
                  AccessibilityName: "Media position",
                  FormatValue: (value float64) -> FormatTime(value),
                  OnValueChanged: resolved.OnSeekChanged,
                  OnValueCommitted: resolved.OnSeekCommitted,
                  TrackColor: resolved.TrackColor,
                  FillColor: resolved.FillColor,
                  ThumbColor: resolved.FillColor,
                }),
              },
            },
            TimeText(resolved.Duration, resolved.TextColor!!),
          },
        },
        Container{
          FlexDirection: FlexDirection.Row,
          AlignItems: AlignItems.Center,
          Children: {
            Container{ FlexGrow: 1.0 },
            Container{
              FlexDirection: FlexDirection.Row,
              AlignItems: AlignItems.Center,
              Gap: resolved.ActionGap!!,
              Children: { previous, playback, next },
            },
            Container{
              Width: 0.0,
              MinWidth: 120.0,
              FlexGrow: 1.0,
              FlexDirection: FlexDirection.Row,
              AlignItems: AlignItems.Center,
              JustifyContent: JustifyContent.FlexEnd,
              Gap: 8.0,
              Children: {
                Text{ Content: "Volume", FontSize: 12.0, Color: resolved.TextColor!! },
                Container{
                  Width: 120.0,
                  Children: {
                    Cell.Mount[SliderInput, Slider]("media-volume", SliderInput{
                      Value: resolved.Volume,
                      Minimum: 0.0,
                      Maximum: 1.0,
                      Step: 0.05,
                      Disabled: !resolved.CanSetVolume!!,
                      AccessibilityName: "Volume",
                      FormatValue: (value float64) -> Math.Round(value * 100.0).ToString() + "%",
                      OnValueChanged: resolved.OnVolumeChanged,
                      OnValueCommitted: resolved.OnVolumeCommitted,
                      TrackColor: resolved.TrackColor,
                      FillColor: resolved.FillColor,
                      ThumbColor: resolved.FillColor,
                    }),
                  },
                },
              },
            },
          },
        },
      },
    }
    if createRoot != nil { return createRoot(resolved, root) }
    return root
  }

  private func Resolve(input MediaTransportInput) MediaTransportInput {
    if !Double.IsFinite(input.Position) { throw ArgumentOutOfRangeException("Position") }
    if !Double.IsFinite(input.Duration) || input.Duration < 0.0 { throw ArgumentOutOfRangeException("Duration") }
    if !Double.IsFinite(input.Volume) { throw ArgumentOutOfRangeException("Volume") }
    let actionSize = if input.ActionSize == 0.0 { 40.0 } else { input.ActionSize }
    let primarySize = if input.PrimaryActionSize == 0.0 { 52.0 } else { input.PrimaryActionSize }
    if !Double.IsFinite(actionSize) || actionSize <= 0.0 { throw ArgumentOutOfRangeException("ActionSize") }
    if !Double.IsFinite(primarySize) || primarySize <= 0.0 { throw ArgumentOutOfRangeException("PrimaryActionSize") }
    let canSeek = !input.Disabled && input.Duration > 0.0
      && (input.CanSeek ?? (input.OnSeekChanged != nil || input.OnSeekCommitted != nil))
    let canSetVolume = !input.Disabled
      && (input.CanSetVolume ?? (input.OnVolumeChanged != nil || input.OnVolumeCommitted != nil))
    return input with{
      Position = Math.Clamp(input.Position, 0.0, input.Duration),
      Volume = Math.Clamp(input.Volume, 0.0, 1.0),
      CanPrevious = !input.Disabled && (input.CanPrevious ?? input.OnPrevious != nil) && input.OnPrevious != nil,
      CanPlayPause = !input.Disabled && (input.CanPlayPause ?? input.OnPlayPause != nil) && input.OnPlayPause != nil,
      CanNext = !input.Disabled && (input.CanNext ?? input.OnNext != nil) && input.OnNext != nil,
      CanSeek = canSeek,
      CanSetVolume = canSetVolume,
      Width = input.Width ?? Length.Percent(100.0),
      Padding = input.Padding ?? 16.0,
      Gap = input.Gap ?? 12.0,
      ActionGap = input.ActionGap ?? 8.0,
      ActionSize = actionSize,
      PrimaryActionSize = primarySize,
      BackgroundColor = input.BackgroundColor ?? Color.Parse("#18181b"),
      TextColor = input.TextColor ?? Color.Parse("#a1a1aa"),
      ActionBackgroundColor = input.ActionBackgroundColor ?? Color.Parse("#27272a"),
      ActionHoverBackgroundColor = input.ActionHoverBackgroundColor ?? Color.Parse("#3f3f46"),
      PrimaryActionBackgroundColor = input.PrimaryActionBackgroundColor ?? Color.Parse("#fafafa"),
      PrimaryActionTextColor = input.PrimaryActionTextColor ?? Color.Parse("#09090b"),
      TrackColor = input.TrackColor ?? Color.Parse("#3f3f46"),
      FillColor = input.FillColor ?? Color.Parse("#fafafa"),
      CreateRoot = nil,
    }
  }

  private func ActionButton(input MediaTransportInput, slot MediaTransportAction, action Action?, disabled bool) Blob {
    var content = SlotContent(input, slot)
    if content == nil && input.CreateActionContent != nil {
      content = input.CreateActionContent!! (input, slot)
    }
    if content == nil {
      content = Text{
        Content: ActionLabel(slot),
        FontSize: if slot == MediaTransportAction.Play || slot == MediaTransportAction.Pause { 13.0 } else { 12.0 },
        FontWeight: 600,
        Color: if slot == MediaTransportAction.Play || slot == MediaTransportAction.Pause { input.PrimaryActionTextColor!! } else { input.TextColor!! },
        Accessibility: Accessibility{ Hidden: true },
      }
    }
    if input.CreateAction != nil { return input.CreateAction!! (input, slot, content!!, action, disabled) }
    let primary = slot == MediaTransportAction.Play || slot == MediaTransportAction.Pause
    return Button{
      BasedOn: if primary { input.PrimaryActionStyle } else { input.ActionStyle },
      Width: if primary { input.PrimaryActionSize } else { input.ActionSize },
      Height: if primary { input.PrimaryActionSize } else { input.ActionSize },
      Padding: 0.0,
      BorderRadius: if primary { input.PrimaryActionSize / 2.0 } else { input.ActionSize / 2.0 },
      AlignItems: AlignItems.Center,
      JustifyContent: JustifyContent.Center,
      BackgroundColor: if primary { input.PrimaryActionBackgroundColor!! } else { input.ActionBackgroundColor!! },
      Hover: Style{ BackgroundColor: input.ActionHoverBackgroundColor!! },
      Cursor: Cursor.Pointer,
      Disabled: disabled,
      Opacity: if disabled { 0.4 } else { 1.0 },
      Accessibility: Accessibility{ Role: AccessibilityRole.Button, Name: ActionName(slot) },
      OnClick: if disabled { nil } else { action },
      Children: { content!! },
    }
  }

  private func TimeText(value float64, color Color) Blob -> Text {
    Content: FormatTime(value),
    FontSize: 12.0,
    Color: color,
  }

  private func SlotContent(input MediaTransportInput, slot MediaTransportAction) Blob ? -> switch slot {
    case MediaTransportAction.Previous: input.PreviousContent
    case MediaTransportAction.Play: input.PlayContent
    case MediaTransportAction.Pause: input.PauseContent
    case MediaTransportAction.Next: input.NextContent
    default: nil
  }

  shared {
    /// Formats nonnegative seconds as minutes and zero-padded seconds.
    public func FormatTime(value float64) string {
      let finite = if Double.IsFinite(value) { value } else { 0.0 }
      let seconds = int32(Math.Min(float64(Int32.MaxValue), Math.Max(0.0, finite)))
      return (seconds / 60).ToString() + ":" + (seconds % 60).ToString("D2")
    }

    private func ActionLabel(slot MediaTransportAction) string -> switch slot {
      case MediaTransportAction.Previous: "Prev"
      case MediaTransportAction.Play: "Play"
      case MediaTransportAction.Pause: "Pause"
      case MediaTransportAction.Next: "Next"
      default: ""
    }

    private func ActionName(slot MediaTransportAction) string -> switch slot {
      case MediaTransportAction.Previous: "Previous media"
      case MediaTransportAction.Play: "Play"
      case MediaTransportAction.Pause: "Pause"
      case MediaTransportAction.Next: "Next media"
      default: "Media action"
    }
  }
}
