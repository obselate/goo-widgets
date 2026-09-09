package Goo.Widgets.Inputs
import Goo

/// A square upload tile with body, status strip, action overlay, and custom container factories.
public data struct UploadTile {
  /// Hosted primary body content element.
  var Body Blob?
  /// Hosted status bar content element.
  var Status Blob?
  /// Hosted action element placed at top-right.
  var Action Blob?
  /// Whether the upload is in a failed state.
  var Failed bool
  /// Accessible name for the tile group. Nil resolves to empty string.
  var AccessibilityName string?
  /// Tile width and height in logical pixels. Nil resolves to 160.0.
  var Size float64?
  /// Background color of the tile. Nil resolves to #18181b.
  var BackgroundColor Color?
  /// Border color in normal state. Nil resolves to #3f3f46.
  var BorderColor Color?
  /// Border color when Failed is true. Nil resolves to #ef4444.
  var FailedBorderColor Color?
  /// Background color of the bottom status strip. Nil resolves to #27272a.
  var StatusBackgroundColor Color?
  /// Uniform padding inside the body container. Nil resolves to 12.0.
  var Padding float64?
  /// Horizontal padding inside the status container. Nil resolves to 10.0.
  var StatusPaddingHorizontal float64?
  /// Vertical padding inside the status container. Nil resolves to 8.0.
  var StatusPaddingVertical float64?
  /// Border stroke width. Nil resolves to 1.0.
  var BorderWidth float64?
  /// Corner radius of the tile. Nil resolves to 10.0.
  var BorderRadius float64?
  /// Inset of the action overlay from the top and right edges. Nil resolves to 8.0.
  var ActionInset float64?
  /// Transition duration in milliseconds. Nil resolves to 150.0.
  var TransitionMs float64?
  /// Easing function for tile transitions. Nil resolves to Easing.EaseOut.
  var TransitionEasing Easing?
  /// Tile opacity. Nil resolves to 1.0.
  var Opacity float64?
  /// Transform applied to the tile root. Nil resolves to identity.
  var Transform PanelTransform?
  /// Custom factory for the body container. Receives resolved props and raw Body.
  var CreateBody Func[UploadTile, Blob?, Container]?
  /// Custom factory for the status container. Receives resolved props and raw Status.
  var CreateStatus Func[UploadTile, Blob?, Container]?
  /// Custom factory for the root Container. Receives resolved props, body container, status container, and Action.
  var CreateRoot Func[UploadTile, Container, Container?, Blob?, Container]?

  /// Builds a fresh Goo element tree after resolving props and factories.
  public func Build() Blob {
    let bodySlot = Body
    let statusSlot = Status
    let actionSlot = Action
    let createBody = CreateBody
    let createStatus = CreateStatus
    let createRoot = CreateRoot

    let resolved = this with{
      AccessibilityName = AccessibilityName ?? "",
      Size = Size ?? 160.0,
      BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
      BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
      FailedBorderColor = FailedBorderColor ?? Color.Parse("#ef4444"),
      StatusBackgroundColor = StatusBackgroundColor ?? Color.Parse("#27272a"),
      Padding = Padding ?? 12.0,
      StatusPaddingHorizontal = StatusPaddingHorizontal ?? 10.0,
      StatusPaddingVertical = StatusPaddingVertical ?? 8.0,
      BorderWidth = BorderWidth ?? 1.0,
      BorderRadius = BorderRadius ?? 10.0,
      ActionInset = ActionInset ?? 8.0,
      TransitionMs = TransitionMs ?? 150.0,
      TransitionEasing = TransitionEasing ?? Easing.EaseOut,
      Opacity = Opacity ?? 1.0,
      Transform = Transform ?? PanelTransform{},
      CreateBody = nil, CreateStatus = nil, CreateRoot = nil,
    }

    var bodyContainer Container? = nil
    if let createBody = createBody {
      bodyContainer = createBody(resolved, bodySlot)
    } else {
      bodyContainer = Container{
        Width: Length.Percent(100.0), FlexGrow: 1.0,
        JustifyContent: JustifyContent.Center, AlignItems: AlignItems.Center,
        PaddingLeft: resolved.Padding!!, PaddingRight: resolved.Padding!!,
        PaddingTop: resolved.Padding!!, PaddingBottom: resolved.Padding!!,
      }
      if bodySlot != nil { bodyContainer!!.Children.Add(bodySlot!!) }
    }

    var statusContainer Container? = nil
    if statusSlot != nil {
      if let createStatus = createStatus {
        statusContainer = createStatus(resolved, statusSlot)
      } else {
        statusContainer = Container{
          Width: Length.Percent(100.0),
          BackgroundColor: resolved.StatusBackgroundColor!!,
          PaddingLeft: resolved.StatusPaddingHorizontal!!, PaddingRight: resolved.StatusPaddingHorizontal!!,
          PaddingTop: resolved.StatusPaddingVertical!!, PaddingBottom: resolved.StatusPaddingVertical!!,
        }
        statusContainer!!.Children.Add(statusSlot!!)
      }
    }

    if let createRoot = createRoot {
      return createRoot(resolved, bodyContainer!!, statusContainer, actionSlot)
    }

    let borderColor = if resolved.Failed { resolved.FailedBorderColor!! } else { resolved.BorderColor!! }
    let root = Container{
      Width: resolved.Size!!, Height: resolved.Size!!,
      Position: PositionType.Relative, FlexDirection: FlexDirection.Column,
      BackgroundColor: resolved.BackgroundColor!!, BorderColor: borderColor,
      BorderWidth: resolved.BorderWidth!!, BorderRadius: resolved.BorderRadius!!,
      Opacity: resolved.Opacity!!, Transform: resolved.Transform!!,
      TransitionMs: resolved.TransitionMs!!, TransitionEasing: resolved.TransitionEasing!!,
      Overflow: Overflow.Hidden,
      Accessibility: Accessibility{
        Role: AccessibilityRole.Group, Name: resolved.AccessibilityName ?? "", Invalid: resolved.Failed,
      },
    }

    let wrapBody = Container{Key: "body", Width: Length.Percent(100.0), FlexGrow: 1.0}
    wrapBody.Children.Add(bodyContainer!!)
    root.Children.Add(wrapBody)

    if statusContainer != nil {
      let wrapStatus = Container{Key: "status", Width: Length.Percent(100.0)}
      wrapStatus.Children.Add(statusContainer!!)
      root.Children.Add(wrapStatus)
    }

    if actionSlot != nil {
      let wrapAction = Container{
        Key: "action", Position: PositionType.Absolute,
        Top: resolved.ActionInset!!, Right: resolved.ActionInset!!,
      }
      wrapAction.Children.Add(actionSlot!!)
      root.Children.Add(wrapAction)
    }

    return root
  }
}
