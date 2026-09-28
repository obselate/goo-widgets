package Goo.Widgets.Consumer

import Goo
import Goo.Widgets.Data
import Goo.Widgets.Inputs
import System
import System.Globalization
import System.Reflection

func LastStyleEntry(style Style) object {
    let flags = BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
    let entries = typeof(Style).GetField("entries", flags)!!.GetValue(style)!!
    let type = entries.GetType()
    let count = int32(type.GetProperty("Count", flags)!!.GetValue(entries)!!)
    return type.GetMethod("At", flags)!!.Invoke(entries, []object? {count - 1})!!
}

func StyleEntryField(entry object) string -> entry.GetType().GetField(
    "Field",
    BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
)!!.GetValue(entry)!!.ToString()!!

func StyleEntryComponent(entry object, field string) float32 -> float32(
    entry.GetType().GetField(field, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)!!.GetValue(
        entry
    )!!
)

func RequireLastColor(style Style, expected Color, name string) {
    let entry = LastStyleEntry(style)
    Require(
        StyleEntryField(entry) == "Color"
        && StyleEntryComponent(entry, "A") == expected.R
        && StyleEntryComponent(entry, "B") == expected.G
        && StyleEntryComponent(entry, "C") == expected.B
        && StyleEntryComponent(entry, "D") == expected.A,
        name + " did not override the default text color"
    )
}

func RequireLastScrollbar(style Style, expected Scrollbar, name string) {
    let entry = LastStyleEntry(style)
    let actual = entry.GetType().GetField(
        "Payload",
        BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
    )!!.GetValue(entry)
    Require(
        StyleEntryField(entry) == "ScrollbarY" && Object.ReferenceEquals(actual, expected),
        name + " did not use the requested vertical scrollbar"
    )
}

func ThemeHookContracts() {
    let accent = Color.Parse("#d16b42")
    using let calendar = CalendarProbe()
    let calendarRoot = (
        calendar.Render(
            CalendarInput{
                Value: DateOnly(2026, 9, 14),
                Culture: CultureInfo.InvariantCulture,
                MonthTextStyle: Style{Color: accent},
                DayTextStyle: Style{Color: accent}
            }
        ) as Container
    )!!
    let heading = (calendarRoot.Children[0] as Container)!!
    RequireLastColor((heading.Children[1] as Text)!!, accent, "Calendar month")
    let grid = (calendarRoot.Children[1] as Container)!!
    let week = (grid.Children[1] as Container)!!
    let day = (week.Children[0] as Button)!!
    RequireLastColor((day.Children[0] as Text)!!, accent, "Calendar day")
    Require(day.Accessibility?.Role == AccessibilityRole.GridCell, "Calendar day lost semantics")

    let scrollbar = Scrollbar{Thickness: 9.0}
    let tree = TreeViewProbe()
    for virtualize in[]bool{true, false} {
        let root = (
            tree.Render(
                TreeViewInput{
                    Nodes: []TreeNode{TreeNode{Id: "one", Label: "One"}},
                    Virtualize: virtualize,
                    ScrollbarY: scrollbar
                }
            ) as Container
        )!!
        let scroller = (root.Children[0] as Container)!!
        let rows = scroller.Children[0]
        RequireLastScrollbar(virtualize ? rows: scroller, scrollbar, virtualize ? "Virtual tree": "Nonvirtual tree")
        Require(root.Accessibility?.Role == AccessibilityRole.Tree, "Tree lost semantics")
    }
}
