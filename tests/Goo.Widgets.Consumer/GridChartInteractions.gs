package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Charts
import Goo.Widgets.Layout
import Hexa.NET.SDL3
import System
import System.Collections.Generic

func GridChartContracts() {
    let empty = (Grid{}.Build() as Container)!!
    Require(empty.Layout != nil && empty.Children.Count == 0, "Empty Grid has no layout policy")
    var invalid bool
    try {
        Grid{Items: []GridItem{GridItem{Id: "outside", Column: 1}}}.Build()
    } catch (error ArgumentException) {
        invalid = true
    }
    Require(invalid, "Grid accepted an out-of-bounds slot")
    invalid = false
    try {
        Grid{Columns: []GridTrack{GridTrack.Fraction(0)}}.Build()
    } catch (error ArgumentException) {
        invalid = true
    }
    Require(invalid, "Grid accepted a zero fractional weight")
    invalid = false
    try {
        Grid{Items: []GridItem{GridItem{Id: "same"}, GridItem{Id: "same"}}}.Build()
    } catch (error ArgumentException) {
        invalid = true
    }
    Require(invalid, "Grid accepted duplicate slot identity")
    let source = Grid{ColumnGap: 8}
    let updated = source with{ColumnGap = 0}
    Require(source.ColumnGap == 8.0 && updated.ColumnGap == 0.0, "Grid copy-update mutated its source")

    var activated string?
    var hovered string?
    var fraction = 0.0
    let values = []ChartSeries{
        ChartSeries{Id: "track", Label: "First", Value: Double.MaxValue},
        ChartSeries{Id: "center", Label: "Second", Value: Double.MaxValue},
    }
    let donut = (
        DonutChart{
            Series: values,
            ShowLegend: true,
            OnActivate: (id string) -> {
                activated = id
            },
            OnHover: (id string?) -> {
                hovered = id
            },
            CreateSlice: (input DonutChart, segment ChartSegment, prepared Shape) -> {
                fraction += segment.Fraction
                return Shape{BackgroundColor: "#22d3ee"}
            },
        }.Build() as Container
    )!!
    let plot = (donut.Children[0] as Container)!!
    Require(
        plot.Children.Count == 3 && Math.Abs(fraction - 1.0) < 1e-12,
        "Chart normalization overflowed or collided with internal keys"
    )
    let slice = (plot.Children[1] as Shape)!!
    Require(
        slice.Key == "series:track" && slice.Focusable && slice.Accessibility!!.Name.Contains("50%"),
        "Chart factory lost wiring or accessible values"
    )
    slice.OnClick?.Invoke()
    Require(activated == "track", "Chart slice activation failed")
    slice.OnPointerEnter?.Invoke(PointerEvent{})
    Require(hovered == "track", "Chart hover did not identify the series")
    slice.OnPointerLeave?.Invoke(PointerEvent{})
    Require(hovered == nil, "Chart hover did not clear on leave")
    let zero = (
        DonutChart{
            Series: []ChartSeries{ChartSeries{Id: "zero", Label: "Empty", Value: 0}},
            ShowLegend: true
        }.Build() as Container
    )!!
    Require(
        (zero.Children[0] as Container)!!.Children.Count == 1 && (zero.Children[1] as Container)!!.Children.Count == 1,
        "Zero-valued data lost its track or legend"
    )
    let bar = (
        StackedBar{
            Series: []ChartSeries{
                ChartSeries{Id: "small", Label: "Small", Value: .25},
                ChartSeries{Id: "large", Label: "Large", Value: .75}
            }
        }.Build() as Container
    )!!
    Require(!((bar.Children[0] as Container)!!.Children[0]).Focusable, "Passive chart unexpectedly became focusable")
    invalid = false
    try {
        StackedBar{Series: []ChartSeries{ChartSeries{Id: "bad", Label: "Bad", Value: -1}}}.Build()
    } catch (error ArgumentException) {
        invalid = true
    }
    Require(invalid, "Chart accepted a negative quantity")
}

internal class GridCounter : Cell {
    internal var Count int32
    internal let ButtonHandle ElementHandle = ElementHandle()
    public override func Build() Blob {
        let activate = () -> {
            Count++
        }
        let button = Button{
            Handle: ButtonHandle,
            Height: 32,
            BackgroundColor: "#25636a",
            Color: "#e0ffff",
            Focusable: true,
            Accessibility: Accessibility{Role: AccessibilityRole.Button, Name: "Retained counter"},
            OnClick: activate,
            Text{Content: "Count " + Count.ToString()}
        }
        WidgetKeyBindings.BindActivation(button)
        return button
    }
}

internal class GridChartHost : Cell {
    internal var Counter GridCounter?
    internal var Large bool
    internal var LongLabel bool
    internal var Swap bool
    internal var Selected string?
    internal var Hovered string?
    internal let Paragraph ElementHandle = ElementHandle()
    internal let Label ElementHandle = ElementHandle()
    internal let Fixed ElementHandle = ElementHandle()
    internal let RootHandle ElementHandle = ElementHandle()
    internal let Shapes Dictionary[string, Shape] = Dictionary[string, Shape]()
    internal let Bars Dictionary[string, Container] = Dictionary[string, Container]()
    internal var Alternate bool
    internal var Numeric bool
    internal let Slots[]ElementHandle = []ElementHandle{
        ElementHandle(),
        ElementHandle(),
        ElementHandle(),
        ElementHandle(),
        ElementHandle()
    }

    private func NumericGrid() Blob {
        let columns = []GridTrack{
            GridTrack.Fixed(40),
            GridTrack.Auto(30.0, 50.0),
            GridTrack.Fraction(1.0, 20.0, 70.0),
            GridTrack.Fraction(2.0)
        }
        let rows = []GridTrack{GridTrack.Fraction(1.0, 30.0, 50.0), GridTrack.Fraction(1.0, 10.0)}
        let root = (
            Grid{
                Width: 400,
                Height: 200,
                Columns: columns,
                Rows: rows,
                ColumnGap: 10,
                RowGap: 10,
                Items: []GridItem{
                    GridItem{Id: "fixed"},
                    GridItem{Id: "auto", Column: 1, Content: Container{Width: 80}},
                    GridItem{Id: "capped", Column: 2},
                    GridItem{Id: "rest", Column: 3},
                    GridItem{Id: "bottom", Row: 1, ColumnSpan: 4},
                }
            }.Build() as Container
        )!!
        for index in 0 ... root.Children.Count {
            root.Children[index].Handle = Slots[index]
        }
        // The policy must retain its snapshot after the host edits its original arrays.
        columns[0] = GridTrack.Fixed(999)
        rows[0] = GridTrack.Fixed(999)
        return root
    }

    private func GridRoot(input Grid, root Container) Container {
        root.Handle = RootHandle
        root.BackgroundColor = "#202631"
        root.Padding = 14
        return root
    }

    private func Slice(input DonutChart, segment ChartSegment, shape Shape) Shape {
        Shapes[segment.Series.Id!!] = shape
        shape.Handle = ElementHandle()
        return shape
    }

    private func Segment(input StackedBar, segment ChartSegment, bar Container) Container {
        Bars[segment.Series.Id!!] = bar
        bar.Handle = ElementHandle()
        return bar
    }

    public override func Build() Blob {
        if Numeric {
            return NumericGrid()
        }
        let series = Alternate ? []ChartSeries{
            ChartSeries{Id: "one", Label: "Everything", Value: .125, Color: "#2dd4bf"}
        }: []ChartSeries{
            ChartSeries{Id: "one", Label: "Available", Value: 3.5, Color: "#2dd4bf"},
            ChartSeries{Id: "two", Label: "Busy", Value: 1.5, Color: "#a78bfa"}
        }
        let grid = Grid{
            Columns: []GridTrack{GridTrack.Auto(40.0, 155.0), GridTrack.Fraction(1, 80), GridTrack.Fixed(64)},
            Rows: []GridTrack{GridTrack.Auto(), GridTrack.Auto(), GridTrack.Auto()},
            ColumnGap: 12,
            RowGap: 10,
            CreateRoot: GridRoot,
            Items: []GridItem{
                GridItem{
                    Id: "label",
                    Content: Text{
                        Handle: Label,
                        Content: LongLabel ? "Account description": "Name",
                        FontSize: 14,
                        Color: "#99afc2"
                    }
                },
                GridItem{
                    Id: "value",
                    Column: 1,
                    Content: Text{Content: "A measured form", FontSize: 16, Color: "#e4e4e7"}
                },
                GridItem{
                    Id: "fixed",
                    Column: 2,
                    RowSpan: 2,
                    Content: Container{
                        Handle: Fixed,
                        BackgroundColor: "#34334d",
                        Padding: 5,
                        Text{Content: "Fixed\n64px", FontSize: 12, Color: "#cabef1"}
                    }
                },
                GridItem{
                    Id: "paragraph",
                    Row: 1,
                    ColumnSpan: 2,
                    Content: Text{
                        Handle: Paragraph,
                        Content: "This paragraph wraps using the actual font. Resize the window to see its shared row grow while the counter keeps its state and focus.",
                        FontSize: Large ? 22.0: 15.0,
                        Color: "#d4d4d8"
                    }
                },
                GridItem{
                    Id: "counter",
                    Row: 2,
                    Column: Swap ? 0: 1,
                    ColumnSpan: Swap ? 2: 1,
                    Content: Cell.Mount[GridCounter](
                        "counter",
                        (cell GridCounter) -> {
                            Counter = cell
                        }
                    )
                },
            },
        }.Build()
        grid.Key = "grid"
        let donut = DonutChart{
            Series: series,
            Size: 160,
            Thickness: 24,
            ShowLegend: true,
            Center: Text{Content: "5.0", FontSize: 26, Color: "#f4f4f5"},
            AccessibilityName: "Capacity donut",
            OnActivate: (id string) -> {
                Selected = id
            },
            OnHover: (id string?) -> {
                Hovered = id
            },
            CreateSlice: Slice
        }.Build()
        donut.Key = "donut"
        let bar = StackedBar{
            Series: series,
            Height: 20,
            ShowLegend: true,
            AccessibilityName: "Capacity bar",
            CreateSegment: Segment,
            OnActivate: (id string) -> {
                Selected = id
            }
        }.Build()
        bar.Key = "bar"
        return Container{
            Width: Length.Percent(100),
            Height: Length.Percent(100),
            Padding: 22,
            Gap: 20,
            BackgroundColor: "#111318",
            OverflowY: Overflow.Scroll,
            Text{Key: "title", Content: "Measured Grid and quantitative charts", Color: "#fafafa", FontSize: 22},
            grid,
            donut,
            bar
        }
    }
}

func GridChartInteractions() {
    GridChartContracts()
    let host = GridChartHost()
    let semantics = SearchListSemantics()
    let window = Window{
        Title: "Grid and chart verification",
        Width: 700,
        Height: 700,
        Root: host,
        AccessibilityAdapter: semantics
    }
    window.Open()
    try {
        PumpFrames(window, 20)
        let id = OnlyNativeWindow()
        let counter = host.Counter!!
        CompositeClick(window, counter.ButtonHandle)
        Require(counter.Count == 1, "Grid child did not receive a native pointer click")
        let wideHeight = host.Paragraph.BorderBox.Height
        let shortLabel = host.Label.BorderBox.Width
        Require(Math.Abs(host.Fixed.BorderBox.Width - 64.0) < .2, "Fixed Grid column did not retain its declared width")
        host.LongLabel = true
        host.Rebuild()
        PumpFrames(window, 8)
        Require(
            host.Label.BorderBox.Width > shortLabel + 10.0 && host.Label.BorderBox.Width <= 155.2,
            "Auto Grid column failed to remeasure changed text or respect its maximum"
        )
        CaptureIssueProof(window, "grid-charts-wide")
        window.Width = 400
        PumpFrames(window, 15)
        Require(host.Paragraph.BorderBox.Height > wideHeight, "Grid did not remeasure wrapping at a narrower width")
        Require(
            host.Counter == counter &&
                counter.Count == 1 &&
                FindSemantics(semantics.Tree!!.Root, "Retained counter")!!.Focused,
            "Grid resize remounted the child or lost its focused state"
        )
        let narrowHeight = host.Paragraph.BorderBox.Height
        host.Large = true
        host.Swap = true
        host.Rebuild()
        PumpFrames(window, 10)
        Require(
            host.Paragraph.BorderBox.Height > narrowHeight && host.Counter == counter,
            "Font or span change failed to relayout while preserving identity"
        )
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(counter.Count == 2, "Moved Grid child lost keyboard input")
        CaptureIssueProof(window, "grid-charts-narrow")
        window.Width = 700
        host.Large = false
        host.Rebuild()
        PumpFrames(window, 12)
        let box = host.Shapes["one"].Handle!!.BorderBox
        // First slice starts at twelve o'clock and covers 70%; the right edge is inside it.
        MouseMove(id, float32(box.X + box.Width - 8.0), float32(box.Y + box.Height / 2.0))
        PumpFrames(window, 6)
        Require(host.Hovered == "one", "Donut slice geometry did not receive pointer hover")
        MouseButton(id, float32(box.X + box.Width - 8.0), float32(box.Y + box.Height / 2.0), true)
        MouseButton(id, float32(box.X + box.Width - 8.0), float32(box.Y + box.Height / 2.0), false)
        PumpFrames(window, 6)
        Require(host.Selected == "one", "Donut slice geometry did not receive pointer activation")
        host.Shapes["two"].Handle!!.Focus()
        SendKey(id, SDLScancode.Return)
        PumpFrames(window, 6)
        Require(host.Selected == "two", "Donut keyboard activation failed")
        CompositeClick(window, host.Bars["one"].Handle!!)
        Require(host.Selected == "one", "Stacked bar native activation failed")
        host.Alternate = true
        host.Rebuild()
        PumpFrames(window, 10)
        CaptureIssueProof(window, "grid-charts-full-circle")
        Require(
            FindSemantics(semantics.Tree!!.Root, "Everything: 0.125 (100%)") != nil,
            "Full-circle chart lost its accessible quantity"
        )
        host.Numeric = true
        host.Rebuild()
        PumpFrames(window, 8)
        let widths = []float64{40.0, 50.0, 70.0, 210.0}
        for index in 0 ... 4 {
            Require(
                Math.Abs(host.Slots[index].BorderBox.Width - widths[index]) < .2,
                "Grid failed fixed/auto/capped fractional width distribution"
            )
            Require(Math.Abs(host.Slots[index].BorderBox.Height - 50.0) < .2, "Grid failed a fractional row maximum")
        }
        Require(
            Math.Abs(host.Slots[4].BorderBox.Height - 140.0) < .2 && Math.Abs(
                host.Slots[4].BorderBox.Width - 400.0
            ) < .2,
            "Grid lost remaining row space, spanning gaps, or immutable track definitions"
        )
    } finally {
        window.RequestClose()
        PumpFrames(window, 5)
    }
    Console.WriteLine(
        "PASS: Grid real-font tracks/spans/wrap/min-max/focus/identity and chart normalization/pointer/keyboard/semantics/full circle"
    )
}
