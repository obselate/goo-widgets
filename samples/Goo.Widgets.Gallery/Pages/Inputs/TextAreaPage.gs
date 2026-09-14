package Goo.Widgets.Gallery.Pages.Inputs

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Inputs

internal class TextAreaExample : Cell {
  private var notes string = "A controlled multiline editor.\nSelect text, copy it, or add a new line."
  public override func Build() Blob -> Container {Width: 560, Gap: 20, Children: {
    Cell.Mount[TextAreaInput, TextArea]("notes", TextAreaInput{Label: "Notes", Value: notes, OnChange: (value string) -> { notes = value },
      Width: Length.Percent(100), MinimumRows: 4, ShowFocusHighlight: true}),
    Cell.Mount[TextAreaInput, TextArea]("readonly", TextAreaInput{Label: "Read-only output", Value: "Selection and copy remain available.\nThe document stays under the controller's ownership.",
      Width: Length.Percent(100), ReadOnly: true, MinimumRows: 2, Wrap: TextWrap.NoWrap}),
    Cell.Mount[TextAreaInput, TextArea]("invalid", TextAreaInput{Label: "Required explanation", Value: "", Placeholder: "Add context", Invalid: true,
      IssueText: "An explanation is required.", Width: Length.Percent(100), MinimumRows: 2}),
  }}
}
internal class TextAreaPage : GalleryPage {
  override func Title() string -> "Text area"
  override func Build() Blob -> Cell.Mount[TextAreaExample]("text-area-example")
}
