package Goo.Widgets

import Goo

/// Shared semantic meaning for messages, badges and chips.
public enum Tone {
    /// Uses the theme neutral color family.
    Neutral;
    /// Uses the theme informational color family.
    Info;
    /// Uses the theme success color family.
    Success;
    /// Uses the theme warning color family.
    Warning;
    /// Uses the theme danger color family.
    Danger
}

/// Text roles for syntax highlighting.
public data struct SyntaxPalette {
    /// Foreground color for language keywords in host-generated syntax styles.
    var Keyword Color
    /// Foreground color for string literals in host-generated syntax styles.
    var String Color
    /// Foreground color for numeric literals in host-generated syntax styles.
    var Number Color
    /// Foreground color for comments in host-generated syntax styles.
    var Comment Color
    /// Foreground color for function names in host-generated syntax styles.
    var Function Color
    /// Foreground color for type names in host-generated syntax styles.
    var Type Color
    /// Foreground color for punctuation in host-generated syntax styles.
    var Punctuation Color
}

/// Foreground and quiet background roles for changes.
public data struct DiffPalette {
    /// Foreground color for added content.
    var Added Color
    /// Foreground color for removed content.
    var Removed Color
    /// Foreground color for changed content.
    var Changed Color
    /// Quiet background color for added content.
    var AddedFill Color
    /// Quiet background color for removed content.
    var RemovedFill Color
    /// Quiet background color for changed content.
    var ChangedFill Color
}

/// Eight standard terminal colors and their bright counterparts.
public data struct AnsiPalette {
    /// Eight standard terminal colors in ANSI index order, from black through white.
    var Colors[]Color
    /// Eight bright terminal colors in ANSI index order, from bright black through bright white.
    var BrightColors[]Color
}
