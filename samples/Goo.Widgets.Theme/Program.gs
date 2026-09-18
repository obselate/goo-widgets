package Goo.Widgets.ThemeSample

import Goo
import Goo.Widgets.Inputs
import Goo.Widgets.Theme
import System
import System.IO

class ThemeSample : Cell {
    private var light bool
    private var compact bool
    private var livePreview bool = true
    private var title string = "goo studio"
    private var opacity float64 = 75.0
    private var status string = "Changes saved"

    override func Build() Blob {
        let theme = (
            if light {
                Bone
            } else {
                Ink
            }
        ) with{
            ControlHeight = if compact {
                28.0
            } else {
                32.0
            },
        }
        let field = (
            theme.TextField with{
                Label = "Window title",
                Value = title,
                Width = 300.0,
                OnChange = (value string) -> {
                    title = value
                },
            }
        ).Build()
        let check = (
            theme.Checkbox with{
                Label = "Live preview",
                State = if livePreview {
                    AccessibilityChecked.True
                } else {
                    AccessibilityChecked.False
                },
                OnChange = (value AccessibilityChecked) -> {
                    livePreview = value == AccessibilityChecked.True
                },
            }
        ).Build()
        return Container{
            BasedOn: theme.CanvasStyle,
            Width: Length.Percent(100.0),
            Height: Length.Percent(100.0),
            OverflowY: Overflow.Scroll,
            Container{
                Padding: theme.Spacing * 6.0,
                Gap: theme.Spacing * 6.0,
                FlexShrink: 0.0,
                Container{
                    FlexDirection: FlexDirection.Row,
                    AlignItems: AlignItems.Center,
                    Gap: theme.Spacing * 2.0,
                    Text{Content: "Goo theme", FontFamily: theme.HeadingFontFamily, FontSize: 24.0, FlexGrow: 1.0},
                    (
                        theme.Button with{
                            Content = "Ink",
                            OnClick = () -> {
                                light = false
                            }
                        }
                    ).Build(),
                    (
                        theme.Button with{
                            Content = "Bone",
                            OnClick = () -> {
                                light = true
                            }
                        }
                    ).Build(),
                },
                Container{
                    FlexDirection: FlexDirection.Row,
                    Gap: theme.Spacing * 2.0,
                    Swatch("Ink", "#090b10"),
                    Swatch("Bone", "#eceded"),
                    Swatch("Blue", "#478ad1"),
                    Swatch("Yellow", "#f9a238"),
                    Swatch("Green", "#6cbc5f"),
                    Swatch("Red-orange", "#ef6a4d"),
                },
                Container{
                    BasedOn: theme.PanelStyle,
                    Padding: theme.Spacing * 4.0,
                    Gap: theme.Spacing * 4.0,
                    Text{Content: "Inputs and selection", FontWeight: 600},
                    field,
                    check,
                    (
                        theme.Checkbox with{
                            Label = "Compact controls",
                            State = if compact {
                                AccessibilityChecked.True
                            } else {
                                AccessibilityChecked.False
                            },
                            OnChange = (value AccessibilityChecked) -> {
                                compact = value == AccessibilityChecked.True
                            },
                        }
                    ).Build(),
                    Container{
                        Width: Length.Percent(100.0),
                        Cell.Mount[SliderInput, Slider](
                            "opacity",
                            theme.Slider with{
                                Label = "Opacity",
                                ShowValue = true,
                                Value = opacity,
                                Minimum = 0.0,
                                Maximum = 100.0,
                                Step = 1.0,
                                FormatValue = (value float64) -> "$value%",
                                OnValueChanged = (value float64) -> {
                                    opacity = value
                                    Rebuild()
                                },
                            }
                        ),
                    },
                },
                Container{
                    Gap: theme.Spacing * 3.0,
                    Text{Content: "Actions", FontWeight: 600},
                    Container{
                        FlexDirection: FlexDirection.Row,
                        FlexWrap: FlexWrap.Wrap,
                        Gap: theme.Spacing * 2.0,
                        (
                            theme.PrimaryButton with{
                                Content = "Apply",
                                OnClick = () -> {
                                    status = "Applied $title at $opacity%"
                                }
                            }
                        ).Build(),
                        (
                            theme.Button with{
                                Content = "Duplicate",
                                OnClick = () -> {
                                    status = "Duplicated $title"
                                }
                            }
                        ).Build(),
                        (theme.GhostButton with{Content = "Reset", OnClick = Reset}).Build(),
                        (
                            theme.DangerButton with{
                                Content = "Remove",
                                OnClick = () -> {
                                    status = "Removed $title"
                                }
                            }
                        ).Build(),
                        (theme.Button with{Content = "Unavailable", Disabled = true}).Build(),
                    },
                    (theme.Banner with{Content = status, BorderColor = theme.SuccessColor}).Build(),
                },
                Container{
                    FlexDirection: FlexDirection.Row,
                    FlexWrap: FlexWrap.Wrap,
                    Gap: theme.Spacing * 4.0,
                    Text{Content: "Information", Color: theme.InfoColor, FontSize: 14.0},
                    Text{Content: "Changes saved", Color: theme.SuccessColor, FontSize: 14.0},
                    Text{Content: "Unsaved changes", Color: theme.WarningColor, FontSize: 14.0},
                    Text{Content: "Invalid value", Color: theme.DangerColor, FontSize: 14.0},
                },
                Text{
                    Content: "${theme.ControlHeight}px controls · ${theme.ControlRadius}px corners · ${theme.PanelRadius}px panels",
                    FontFamily: theme.MonoFontFamily,
                    FontSize: 13.0,
                    Color: theme.FaintTextColor,
                },
            },
        }
    }

    private func Swatch(name string, color Color) Blob -> Container{
        FlexGrow: 1.0,
        FlexBasis: 0.0,
        MinWidth: 0.0,
        Gap: 6.0,
        Container{Height: 28.0, BackgroundColor: color, BorderRadius: 12.0},
        Text{Content: name, FontSize: 13.0},
    }

    private func Reset() {
        title = "goo studio"
        opacity = 75.0
        livePreview = true
        status = "Changes saved"
    }
}

func Main() {
    let font = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Fonts", "VendSans.ttf"))
    using let medium = FontSource("Vend Sans", 500, false, font, 0u, []FontVariation{FontVariation("wght", 500.0F)})
    using let semibold = FontSource("Vend Sans", 600, false, font, 0u, []FontVariation{FontVariation("wght", 600.0F)})
    medium.Register()
    semibold.Register()
    Window.ConfigureApplication("Goo theme", "1.0.0", "com.example.goo-theme")
    Window{Title: "Goo Widgets · Goo theme", Width: 720, Height: 700, Root: ThemeSample{}}.Run()
}
