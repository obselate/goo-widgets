package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets
import Goo.Widgets.Gallery

internal class DatePickerExample : Cell {
    private let overlay ElementHandle = ElementHandle()
    private var date DateOnly? = DateOnly(2026, 9, 14)
    private var isoDate DateOnly? = DateOnly(2026, 9, 22)
    private var isOpen bool = true
    private func Select(value DateOnly?) {
        date = value
        Rebuild()
    }

    private func SelectIso(value DateOnly?) {
        isoDate = value
        Rebuild()
    }

    private func Open(value bool) {
        isOpen = value
        Rebuild()
    }

    private func Weekend(value DateOnly) bool -> value.DayOfWeek == DayOfWeek.Saturday ||
        value.DayOfWeek == DayOfWeek.Sunday

    private func Format(value DateOnly) string -> value.ToString(
        "yyyy-MM-dd",
        System.Globalization.CultureInfo.InvariantCulture
    )

    private func Parse(value string) DateOnly? {
        if DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None,
            out var date
        ) {
            return date
        }
        return nil
    }

    public override func Build() Blob {
        var local = DatePickerInput{
            OverlayHost: overlay,
            Width: 290.0,
            Open: isOpen,
            OnOpenChange: Open,
            OnChange: Select,
            Today: DateOnly(2026, 9, 15),
            Culture: System.Globalization.CultureInfo.GetCultureInfo("en-US"),
            AccessibilityName: "Deployment date",
            Minimum: DateOnly(2026, 9, 1),
            Maximum: DateOnly(2026, 10, 31),
            IsDateDisabled: Weekend
        }
        if date != nil {
            local.Value = date!!
        }
        var iso = DatePickerInput{
            OverlayHost: overlay,
            Width: 290.0,
            OnChange: SelectIso,
            Format: Format,
            Parse: Parse,
            Placeholder: "yyyy-mm-dd",
            AccessibilityName: "ISO date",
            Culture: System.Globalization.CultureInfo.InvariantCulture
        }
        if isoDate != nil {
            iso.Value = isoDate!!
        }
        return Container{
            Handle: overlay,
            Width: 720.0,
            Height: 440.0,
            Gap: 14.0,
            Color: "#fafafa",
            Text{Key: "title", Content: "A date field and its calendar", FontSize: 22.0, FontWeight: 700},
            Text{
                Key: "hint",
                Content: "Type and press Enter to commit. Escape reverts. Empty input clears an optional date.",
                Color: "#a1a1aa",
                FontSize: 14.0
            },
            Container{
                Key: "fields",
                FlexDirection: FlexDirection.Row,
                Gap: 50.0,
                Container{
                    Key: "local",
                    Gap: 9.0,
                    Text{Key: "label", Content: "Localized display · weekdays only", FontSize: 13.0, Color: "#a1a1aa"},
                    Cell.Mount[DatePickerInput, DatePicker]("date", local)
                },
                Container{
                    Key: "iso",
                    Gap: 9.0,
                    Text{Key: "label", Content: "Custom formatter and parser", FontSize: 13.0, Color: "#a1a1aa"},
                    Cell.Mount[DatePickerInput, DatePicker]("date", iso),
                    Text{
                        Key: "note",
                        Content: "The host receives DateOnly values.\nDisplay format stays independent of storage.",
                        Color: "#a1a1aa",
                        FontSize: 13.0
                    }
                }
            }
        }
    }
}

internal class DatePickerPage : GalleryPage {
    override func Title() string -> "Date picker"

    override func Build() Blob -> Cell.Mount[DatePickerExample]("date-picker-example")
}
