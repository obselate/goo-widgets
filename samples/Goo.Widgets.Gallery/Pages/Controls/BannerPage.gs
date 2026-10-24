package Goo.Widgets.Gallery.Pages.Controls

import Goo
import Goo.Widgets
import Goo.Widgets.Actions
import Goo.Widgets.Data
import Goo.Widgets.Feedback
import Goo.Widgets.Gallery

class BannerPage : GalleryPage {
    public override func Title() string -> "Banner"

    public override func Build() Blob {
        let root = Container{Width: Percent(100), MaxWidth: 760.0, Gap: 8.0}
        for tone in []Tone{Tone.Neutral, Tone.Info, Tone.Success, Tone.Warning, Tone.Danger} {
            root.Children.Add(Banner{
                Tone: tone,
                Title: tone.ToString(),
                Content: "Two updates are ready to install.",
                TransitionMs: 200.0,
                Action: ActionButton{Content: "Review"}.Build(),
                OnDismiss: () -> Console.WriteLine("Dismissed " + tone.ToString()),
                DismissAccessibilityName: "Dismiss " + tone.ToString(),
            }.Build())
        }
        let badges = Container{FlexDirection: FlexDirection.Row, FlexWrap: FlexWrap.Wrap, Gap: 8.0}
        for tone in []Tone{Tone.Neutral, Tone.Info, Tone.Success, Tone.Warning, Tone.Danger} {
            badges.Children.Add(Badge{Tone: tone, Content: tone.ToString()}.Build())
            badges.Children.Add(Chip{Tone: tone, Label: tone.ToString()}.Build())
        }
        root.Children.Add(badges)
        root.Children.Add(Alert{
            Tone: Tone.Info, Variant: AlertVariant.Rule, Title: "Maintenance",
            Description: "Sunday 02:00 to 04:00", Live: false
        }.Build())
        root.Children.Add(InlineMessage{Tone: Tone.Success, Content: "Saved"}.Build())
        return root
    }
}
