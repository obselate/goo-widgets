package Goo.Widgets.Gallery.Pages.Charts

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class DonutChartPage : GalleryPage {
    override func Title() string -> "Donut chart"

    override func Build() Blob -> Container{
        Width: 620,
        Gap: 26,
        DonutChart{
            Size: 180,
            Thickness: 28,
            ShowLegend: true,
            AccessibilityName: "Storage capacity",
            Center: Container{
                AlignItems: AlignItems.Center,
                Text{Content: "64%", FontSize: 26, Color: "#fafafa"},
                Text{Content: "available", FontSize: 11, Color: "#a1a1aa"}
            },
            Series: []ChartSeries{
                ChartSeries{Id: "available", Label: "Available", Value: 64, Color: "#2dd4bf"},
                ChartSeries{Id: "used", Label: "Used", Value: 28.5, Color: "#818cf8"},
                ChartSeries{Id: "reserved", Label: "Reserved", Value: 7.5, Color: "#fbbf24"}
            },
        }.Build(),
        Container{
            FlexDirection: FlexDirection.Row,
            JustifyContent: JustifyContent.Center,
            Gap: 50,
            DonutChart{
                Size: 100,
                Thickness: 14,
                Center: Text{Content: "Empty", FontSize: 12, Color: "#a1a1aa"}
            }.Build(),
            DonutChart{
                Size: 100,
                Thickness: 14,
                Center: Text{Content: "100%", FontSize: 16, Color: "#d1fae5"},
                Series: []ChartSeries{ChartSeries{Id: "all", Label: "Complete", Value: .5, Color: "#2dd4bf"}}
            }.Build()
        }
    }
}
