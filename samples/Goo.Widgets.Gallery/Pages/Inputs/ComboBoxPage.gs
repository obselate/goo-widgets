package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class ComboBoxExample : Cell {
    private let overlay ElementHandle = ElementHandle()
    private var environment string = "prod"
    private var region string = "region-347"
    private var fixedOpen bool
    private var regionsOpen bool = true
    private let regions[]ComboBoxOption
    public init() {
        regions = [500]ComboBoxOption
        for index in 0 ... regions.Length {
            regions[index] = ComboBoxOption{
                Id: "region-" + index.ToString(),
                Label: "Region " + index.ToString("D3"),
                Disabled: index % 10 == 0,
            }
        }
    }

    private func Environment(value string) {
        environment = value
        Rebuild()
    }

    private func Region(value string) {
        region = value
        Rebuild()
    }

    private func FixedOpen(value bool) {
        fixedOpen = value
        if value {
            regionsOpen = false
        }
        Rebuild()
    }

    private func RegionsOpen(value bool) {
        regionsOpen = value
        if value {
            fixedOpen = false
        }
        Rebuild()
    }

    public override func Build() Blob -> Container{
        Handle: overlay,
        Width: 720.0,
        Height: 430.0,
        Gap: 12.0,
        Color: "#fafafa",
        Text{Key: "heading", Content: "Choose a deployment target", FontSize: 22.0, FontWeight: 700},
        Text{
            Key: "hint",
            Content: "Arrow keys preview an option. Enter commits; Escape keeps the previous value.",
            Color: "#a1a1aa",
            FontSize: 14.0
        },
        Container{
            Key: "fields",
            FlexDirection: FlexDirection.Row,
            Gap: 40.0,
            Container{
                Key: "fixed",
                Gap: 9.0,
                Width: 290.0,
                Text{Key: "label", Content: "Environment", FontSize: 13.0, Color: "#a1a1aa"},
                Cell.Mount[ComboBoxInput, ComboBox](
                    "environment",
                    ComboBoxInput{
                        OverlayHost: overlay,
                        Width: 290.0,
                        SelectedId: environment,
                        OnSelect: Environment,
                        Open: fixedOpen,
                        OnOpenChange: FixedOpen,
                        AccessibilityName: "Environment",
                        Items: []ComboBoxOption{
                            ComboBoxOption{Id: "dev", Label: "Development"},
                            ComboBoxOption{Id: "stage", Label: "Staging · unavailable", Disabled: true},
                            ComboBoxOption{Id: "prod", Label: "Production"},
                        },
                    }
                ),
                Text{
                    Key: "disabled-label",
                    Content: "Account policy",
                    FontSize: 13.0,
                    Color: "#a1a1aa",
                    MarginTop: 18.0
                },
                Cell.Mount[ComboBoxInput, ComboBox](
                    "disabled",
                    ComboBoxInput{
                        OverlayHost: overlay,
                        Width: 290.0,
                        Disabled: true,
                        Placeholder: "Managed by your administrator",
                        AccessibilityName: "Account policy"
                    }
                )
            },
            Container{
                Key: "search",
                Gap: 9.0,
                Width: 350.0,
                Text{Key: "label", Content: "Region · 500 virtual options", FontSize: 13.0, Color: "#a1a1aa"},
                Cell.Mount[ComboBoxInput, ComboBox](
                    "region",
                    ComboBoxInput{
                        OverlayHost: overlay,
                        Width: 350.0,
                        PopupHeight: 260.0,
                        Items: regions,
                        SelectedId: region,
                        OnSelect: Region,
                        Open: regionsOpen,
                        OnOpenChange: RegionsOpen,
                        Searchable: true,
                        AccessibilityName: "Region"
                    }
                )
            }
        },
    }
}

internal class ComboBoxPage : GalleryPage {
    override func Title() string -> "Combo box"

    override func Build() Blob -> Cell.Mount[ComboBoxExample]("combo-box-example")
}
