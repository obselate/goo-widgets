package Goo.Widgets.Gallery.Pages.Media

import Goo
import Goo.Widgets.Gallery
import Goo.Widgets.Media

internal open class MediaTransportExample : Cell {
    private var position float64 = 74.0
    private var volume float64 = 0.72
    private var playing bool
    private var item int32 = 1
    private var status string = "Ready"

    public override func Build() Blob -> Container(){
        .Width: 720.0,
        .Gap: 12.0,
        Text{
            Key: "media-title",
            Content: "Example item " + item.ToString(),
            FontSize: 16.0,
            FontWeight: 700,
            Color: "#fafafa"
        },
        Cell.Mount[MediaTransportInput, MediaTransport](
            "media-transport",
            MediaTransportInput{
                Position: position,
                Duration: 245.0,
                Volume: volume,
                Playing: playing,
                OnPrevious: () -> {
                    item = Math.Max(1, item - 1)
                    position = 0.0
                    status = "Previous"
                    Rebuild()
                },
                OnPlayPause: () -> {
                    playing = !playing
                    status = if playing {
                        "Playing"
                    } else {
                        "Paused"
                    }
                    Rebuild()
                },
                OnNext: () -> {
                    item++
                    position = 0.0
                    status = "Next"
                    Rebuild()
                },
                OnSeekChanged: (value float64) -> {
                    position = value
                    status = "Seeking"
                    Rebuild()
                },
                OnSeekCommitted: (value float64) -> {
                    position = value
                    status = "Seek committed"
                    Rebuild()
                },
                OnVolumeChanged: (value float64) -> {
                    volume = value
                    status = "Volume preview"
                    Rebuild()
                },
                OnVolumeCommitted: (value float64) -> {
                    volume = value
                    status = "Volume committed"
                    Rebuild()
                },
            }
        ),
        Text{Key: "media-status", Content: status, FontSize: 12.0, Color: "#a1a1aa"},
    }
}

internal class MediaTransportPage : GalleryPage {
    override func Title() string -> "Media transport"

    override func Build() Blob -> Cell.Mount[MediaTransportExample]("media-transport-example")
}
