import System
import System.Linq
import System.Reflection
import Goo
import Goo.Widgets.Icons

func Main() {
    let expected = []string{
        "arrow_downward", "arrow_upward", "calendar_month", "check", "chevron_left", "chevron_right", "close",
        "content_copy", "create_new_folder", "crop_square", "done_all", "expand_less", "expand_more",
        "filter_none", "find_replace", "match_case", "match_word", "pause", "play_arrow",
        "regular_expression", "remove", "skip_next", "skip_previous"
    }
    let names = MaterialIcons.Names()
    if !names.SequenceEqual(expected) {
        throw Exception("Material icon subset does not match the selected names and widget defaults.")
    }
    for name in names {
        MaterialIcons.Create(name, 24.0, Color.Black)
    }
    let embedded = Assembly.GetExecutingAssembly().GetManifestResourceNames()
        .Count(name -> name.StartsWith("Goo.Widgets.MaterialSymbols.", StringComparison.Ordinal)
            && name.EndsWith(".svg", StringComparison.Ordinal))
    if embedded != expected.Length {
        throw Exception("Material icon resources were not embedded in the executable.")
    }
    try {
        MaterialIcons.Create("add")
        throw Exception("An icon outside the selected subset was accepted.")
    } catch (error InvalidOperationException) when error.Message.Contains("Material icon resource not found") {
    }
    Console.WriteLine("PASS: packaged Material icon subset.")
}
