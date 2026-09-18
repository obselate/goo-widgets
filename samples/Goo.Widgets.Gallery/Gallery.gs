package Goo.Widgets.Gallery

import Goo
import Goo.Widgets.Actions
import Goo.Widgets.Gallery.Pages.Actions
import Goo.Widgets.Gallery.Pages.Colors
import Goo.Widgets.Gallery.Pages.Controls
import Goo.Widgets.Gallery.Pages.Feedback
import Goo.Widgets.Gallery.Pages.Inputs
import Goo.Widgets.Gallery.Pages.Layout
import Goo.Widgets.Gallery.Pages.Navigation
import Goo.Widgets.Gallery.Pages.Media
import Goo.Widgets.Gallery.Pages.Graphs
import Goo.Widgets.Gallery.Pages.Charts
import Goo.Widgets.Gallery.Pages.Data
import Goo.Widgets.Gallery.Pages.Content

open class GalleryPage {
    open func Title() string;

    open func Build() Blob;
}

class GalleryCategory(Name string, Pages[]GalleryPage) { }

class GalleryRegistry(Groups[]GalleryCategory) {
    func Count() int32 {
        var count int32 = 0
        for group in Groups {
            count = count + group.Pages.Length
        }
        return count
    }

    func CurrentPage(index int32) GalleryPage {
        let count = Count()
        if count == 0 {
            throw InvalidOperationException("Gallery registry contains no pages.")
        }
        var remaining int32 = ((index % count) + count) % count
        for group in Groups {
            if remaining < group.Pages.Length {
                return group.Pages[remaining]
            }
            remaining = remaining - group.Pages.Length
        }
        return Groups[0].Pages[0]
    }

    func CurrentCategory(index int32) string {
        let count = Count()
        if count == 0 {
            return ""
        }
        var remaining int32 = ((index % count) + count) % count
        for group in Groups {
            if remaining < group.Pages.Length {
                return group.Name
            }
            remaining = remaining - group.Pages.Length
        }
        return Groups[0].Name
    }

    func IndexOf(title string) int32 {
        var index int32
        for group in Groups {
            for page in group.Pages {
                if page.Title() == title {
                    return index
                }
                index++
            }
        }
        throw InvalidOperationException("Unknown gallery page: " + title)
    }
}

class Gallery(Registry GalleryRegistry, InitialIndex int32) : Cell {
    private var currentIndex int32 = InitialIndex

    internal func Show(index int32) {
        currentIndex = index
        Rebuild()
    }

    private func Navigate(delta int32) {
        let count = Registry.Count()
        if count == 0 {
            return
        }
        currentIndex = (currentIndex + delta + count) % count
    }

    private func Back() {
        Navigate(-1)
    }

    private func Forward() {
        Navigate(1)
    }

    public override func Build() Blob ->
    Container{
        Width: Length.Percent(100),
        Height: Length.Percent(100),
        Padding: 32,
        Gap: 24,
        BackgroundColor: "#09090b",
        FlexDirection: FlexDirection.Column,
        Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.SpaceBetween,
            Container{
                Gap: 6,
                Text{Content: "Goo Widgets Gallery", FontSize: 26, FontWeight: 700, Color: "#fafafa",},
                Text{Content: Registry.CurrentCategory(currentIndex), FontSize: 13, Color: "#a1a1aa",},
            },
            Text{Content: Registry.CurrentPage(currentIndex).Title(), FontSize: 16, Color: "#d4d4d8",},
        },
        Container{
            FlexGrow: 1,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.Center,
            Padding: 32,
            BorderRadius: 14,
            BorderWidth: 1,
            BorderColor: "#27272a",
            BackgroundColor: "#18181b",
            TransitionMs: 150.0,
            TransitionEasing: Easing.EaseOut,
            Registry.CurrentPage(currentIndex).Build(),
        },
        Container{
            FlexDirection: FlexDirection.Row,
            AlignItems: AlignItems.Center,
            JustifyContent: JustifyContent.SpaceBetween,
            ActionButton{
                Content: "Back",
                BackgroundColor: Color.Parse("#27272a"),
                TextColor: Color.Parse("#fafafa"),
                BorderColor: Color.Parse("#3f3f46"),
                HoverBackgroundColor: Color.Parse("#3f3f46"),
                ActiveBackgroundColor: Color.Parse("#18181b"),
                BorderRadius: 8.0,
                ShowFocusHighlight: true,
                OnClick: () -> Back(),
            }.Build(),
            ActionButton{
                Content: "Forward",
                BorderRadius: 8.0,
                ShowFocusHighlight: true,
                OnClick: () -> Forward(),
            }.Build(),
        },
    }
}

func CreateRegistry() GalleryRegistry ->
GalleryRegistry(
    []GalleryCategory{
        GalleryCategory("Content", []GalleryPage{MarkdownViewPage{}}),
        GalleryCategory("Actions", []GalleryPage{ActionButtonPage{}, IconButtonPage{},}),
        GalleryCategory(
            "Inputs",
            []GalleryPage{
                CheckboxPage{},
                TextFieldPage{},
                TextAreaPage{},
                ToggleSwitchPage{},
                StepperPage{},
                UploadTilePage{},
                SearchListPage{},
                ComboBoxPage{},
                CalendarPage{},
                DatePickerPage{},
                SliderPage{},
            }
        ),
        GalleryCategory(
            "Feedback",
            []GalleryPage{
                BadgePage{},
                BannerPage{},
                DismissibleContextBarPage{},
                EmptyStatePage{},
                ProgressBarPage{},
                ProgressSummaryPage{},
            }
        ),
        GalleryCategory(
            "Layout",
            []GalleryPage{
                AppBarPage{},
                DrawerPage{},
                SectionHeaderPage{},
                ListRowPage{},
                MasterDetailPage{},
                ModalDialogPage{},
                ModalDialogHostPage{},
                PopoverPage{},
                DisclosurePage{},
                SplitPanePage{},
                GridPage{},
                WindowChromePage{},
            }
        ),
        GalleryCategory("Media", []GalleryPage{AsyncImagePage{}, AvatarPage{}, MediaCardPage{}, MediaTransportPage{},}),
        GalleryCategory("Data", []GalleryPage{ChipPage{}, TimeAxisPage{}, TreeViewPage{}, DataGridPage{},}),
        GalleryCategory("Navigation", []GalleryPage{NavigationRailPage{}, TabBarPage{}, MenuPage{},}),
        GalleryCategory("Colors", []GalleryPage{ColorPickerPage{},}),
        GalleryCategory("Charts", []GalleryPage{DonutChartPage{}, StackedBarPage{}}),
        GalleryCategory("Graphs", []GalleryPage{GraphCanvasPage{}, GraphNodeCardPage{},}),
    }
)
