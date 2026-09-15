package Goo.Widgets.Gallery.Pages.Charts

import Goo
import Goo.Widgets.Charts
import Goo.Widgets.Gallery

internal class StackedBarPage : GalleryPage {
    override func Title() string -> "Stacked bar"

    override func Build() Blob -> Container{
        Width: 580,
        Gap: 30,
        Text{Content: "Fleet availability", FontSize: 22, Color: "#fafafa"},
        StackedBar{
            Height: 28,
            ShowLegend: true,
            AccessibilityName: "Fleet availability",
            Series: []ChartSeries{
                ChartSeries{Id: "ready", Label: "Ready", Value: 48, Color: "#2dd4bf"},
                ChartSeries{Id: "working", Label: "Working", Value: 27, Color: "#818cf8"},
                ChartSeries{Id: "offline", Label: "Offline", Value: 5, Color: "#fbbf24"},
            }
        }.Build(),
        Text{Content: "Empty totals retain the track", FontSize: 14, Color: "#a1a1aa"},
        StackedBar{
            Height: 16,
            ShowLegend: true,
            Series: []ChartSeries{ChartSeries{Id: "empty", Label: "No samples", Value: 0}}
        }.Build()
    }
}
