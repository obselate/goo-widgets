package Goo.Widgets.Layout

import Goo

/// A responsive master-detail composition controlled by selection and narrow-layout state.
public data struct MasterDetail {
    /// Master list or navigation content.
    var Master Blob?
    /// Detail content.
    var Detail Blob?
    /// Whether a detail is selected.
    var Selected bool
    /// Whether to show one pane at a time.
    var Narrow bool
    /// Called by the default narrow detail back button.
    var OnBack Action?
    /// Back button label. Nil resolves to "Back".
    var BackLabel string?
    /// Accessible group name. Nil resolves to "Master detail".
    var AccessibilityName string?
    /// Master width in the two-pane layout. Zero resolves to 320.
    var MasterWidth float64
    /// Gap between panes. Nil resolves to 12 and preserves explicit zero.
    var Gap float64?
    /// Pane background. Nil resolves to #18181b.
    var BackgroundColor Color?
    /// Pane border color. Nil resolves to #3f3f46.
    var BorderColor Color?
    /// Pane border width. Nil resolves to 1 and preserves explicit zero.
    var BorderWidth float64?
    /// Pane corner radius. Nil resolves to 6 and preserves explicit zero.
    var BorderRadius float64?
    /// Back bar height. Zero resolves to 44.
    var BackHeight float64
    /// Creates the narrow detail back button from resolved values.
    var CreateBack Func[MasterDetail, Button]?
    /// Creates the final root from resolved values and selected master/detail panes.
    var CreateRoot Func[MasterDetail, Container?, Container?, Container]?

    /// Builds a fresh responsive master-detail tree.
    public func Build() Blob {
        let createBack = CreateBack
        let createRoot = CreateRoot
        let resolved = this with{
            BackLabel = BackLabel ?? "Back",
            AccessibilityName = AccessibilityName ?? "Master detail",
            MasterWidth = if MasterWidth == 0.0 {
                320.0
            } else {
                MasterWidth
            },
            Gap = Gap ?? 12.0,
            BackgroundColor = BackgroundColor ?? Color.Parse("#18181b"),
            BorderColor = BorderColor ?? Color.Parse("#3f3f46"),
            BorderWidth = BorderWidth ?? 1.0,
            BorderRadius = BorderRadius ?? 6.0,
            BackHeight = if BackHeight == 0.0 {
                44.0
            } else {
                BackHeight
            },
            CreateBack = nil,
            CreateRoot = nil,
        }

        var masterPane Container? = nil
        if !resolved.Narrow || !resolved.Selected {
            let pane = Container{
                Width: if resolved.Narrow {
                    Length.Percent(100.0)
                } else {
                    resolved.MasterWidth
                },
                Height: Length.Percent(100.0),
                MinWidth: 0.0,
                MinHeight: 0.0,
                FlexShrink: 0.0,
                BackgroundColor: resolved.BackgroundColor!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderColor: resolved.BorderColor!!,
                BorderRadius: resolved.BorderRadius!!,
                Overflow: Overflow.Hidden,
            }
            if let master = Master {
                pane.Children.Add(master)
            }
            masterPane = pane
        }

        var detailPane Container? = nil
        if !resolved.Narrow || resolved.Selected {
            let pane = Container{
                Width: if resolved.Narrow {
                    Length.Percent(100.0)
                } else {
                    Length.Auto
                },
                Height: Length.Percent(100.0),
                MinWidth: 0.0,
                MinHeight: 0.0,
                FlexGrow: 1.0,
                FlexBasis: 0.0,
                BackgroundColor: resolved.BackgroundColor!!,
                BorderWidth: resolved.BorderWidth!!,
                BorderColor: resolved.BorderColor!!,
                BorderRadius: resolved.BorderRadius!!,
                Overflow: Overflow.Hidden,
            }
            if resolved.Narrow {
                let back = if let createBack = createBack {
                    createBack(resolved)
                } else {
                    Button{
                        Height: resolved.BackHeight,
                        PaddingLeft: 12.0,
                        PaddingRight: 12.0,
                        BackgroundColor: Color.Transparent,
                        Cursor: Cursor.Pointer,
                        Focusable: true,
                        OnClick: resolved.OnBack,
                        Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: resolved.BackLabel!!,},
                        Text{Content: resolved.BackLabel!!},
                    }
                }
                pane.Children.Add(back)
            }
            if let detail = Detail {
                pane.Children.Add(detail)
            }
            detailPane = pane
        }

        if let createRoot = createRoot {
            return createRoot(resolved, masterPane, detailPane)
        }
        let root = Container{
            Width: Length.Percent(100.0),
            Height: Length.Percent(100.0),
            MinWidth: 0.0,
            MinHeight: 0.0,
            Gap: resolved.Gap!!,
            FlexDirection: FlexDirection.Row,
            Overflow: Overflow.Hidden,
            Accessibility: Accessibility{Role: AccessibilityRole.Group, Name: resolved.AccessibilityName!!,},
        }
        if let masterPane = masterPane {
            root.Children.Add(masterPane)
        }
        if let detailPane = detailPane {
            root.Children.Add(detailPane)
        }
        return root
    }
}
