package Goo.Widgets

import Goo

/// Shared semantic meaning for messages, badges and chips.
public enum Tone {
    Neutral;
    Info;
    Success;
    Warning;
    Danger
}

/// Text roles for syntax highlighting.
public data struct SyntaxPalette {
    var Keyword Color
    var String Color
    var Number Color
    var Comment Color
    var Function Color
    var Type Color
    var Punctuation Color
}

/// Foreground and quiet background roles for changes.
public data struct DiffPalette {
    var Added Color
    var Removed Color
    var Changed Color
    var AddedFill Color
    var RemovedFill Color
    var ChangedFill Color
}

/// Eight standard terminal colors and their bright counterparts.
public data struct AnsiPalette {
    var Colors[]Color
    var BrightColors[]Color
}
