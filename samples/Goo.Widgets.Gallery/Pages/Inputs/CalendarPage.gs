package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class CalendarExample : Cell {
    private var selected DateOnly = DateOnly(2026, 9, 14)
    private var french DateOnly = DateOnly(2026, 9, 18)
    private func Select(value DateOnly) {
        selected = value
        Rebuild()
    }

    private func French(value DateOnly) {
        french = value
        Rebuild()
    }

    private func Weekend(value DateOnly) bool -> value.DayOfWeek == DayOfWeek.Saturday ||
        value.DayOfWeek == DayOfWeek.Sunday

    public override func Build() Blob -> Container{
        Width: 720.0,
        Gap: 18.0,
        Color: "#fafafa",
        Text{Key: "title", Content: "Dates, with your locale and constraints", FontSize: 22.0, FontWeight: 700},
        Text{
            Key: "hint",
            Content: "Arrow keys move by day/week. Page Up/Down change month; Shift changes year.",
            Color: "#a1a1aa",
            FontSize: 14.0
        },
        Container{
            Key: "calendars",
            FlexDirection: FlexDirection.Row,
            Gap: 40.0,
            Container{
                Key: "english",
                Gap: 10.0,
                Text{Key: "label", Content: "Sunday first · en-US", Color: "#a1a1aa", FontSize: 13.0},
                Cell.Mount[CalendarInput, Calendar](
                    "calendar",
                    CalendarInput{
                        Value: selected,
                        OnChange: Select,
                        Today: DateOnly(2026, 9, 15),
                        Culture: System.Globalization.CultureInfo.GetCultureInfo("en-US")
                    }
                )
            },
            Container{
                Key: "french",
                Gap: 10.0,
                Text{Key: "label", Content: "Monday first · fr-FR · weekdays only", Color: "#a1a1aa", FontSize: 13.0},
                Cell.Mount[CalendarInput, Calendar](
                    "calendar",
                    CalendarInput{
                        Value: french,
                        OnChange: French,
                        Today: DateOnly(2026, 9, 15),
                        Culture: System.Globalization.CultureInfo.GetCultureInfo("fr-FR"),
                        Minimum: DateOnly(2026, 9, 10),
                        Maximum: DateOnly(2026, 10, 20),
                        IsDateDisabled: Weekend,
                        PreviousMonthLabel: "Mois précédent",
                        NextMonthLabel: "Mois suivant"
                    }
                )
            }
        },
        Text{
            Key: "selected",
            Content: "Selected: " + selected.ToString("yyyy-MM-dd") + " · " + french.ToString("yyyy-MM-dd"),
            Color: "#a5b4fc",
            FontSize: 13.0
        }
    }
}

internal class CalendarPage : GalleryPage {
    override func Title() string -> "Calendar"

    override func Build() Blob -> Cell.Mount[CalendarExample]("calendar-example")
}
