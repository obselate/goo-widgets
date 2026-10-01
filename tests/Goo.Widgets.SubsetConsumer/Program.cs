using System;
using System.Linq;
using System.Reflection;
using Goo.Widgets.Icons;

var expected = new[] {
    "calendar_month", "check", "chevron_right", "close", "create_new_folder",
    "crop_square", "expand_more", "filter_none", "pause", "play_arrow",
    "remove", "skip_next", "skip_previous"
};
var names = MaterialIcons.Names();
if (!names.SequenceEqual(expected)) {
    throw new Exception("Material icon subset does not match the selected names and widget defaults.");
}
foreach (var name in names) {
    MaterialIcons.Create(name);
}
var embedded = Assembly.GetExecutingAssembly().GetManifestResourceNames()
    .Count(name => name.StartsWith("Goo.Widgets.MaterialSymbols.", StringComparison.Ordinal)
        && name.EndsWith(".svg", StringComparison.Ordinal));
if (embedded != expected.Length) {
    throw new Exception("Material icon resources were not embedded in the executable.");
}
try {
    MaterialIcons.Create("add");
    throw new Exception("An icon outside the selected subset was accepted.");
} catch (InvalidOperationException error) when (error.Message.Contains("Material icon resource not found")) {
}
Console.WriteLine("PASS: packaged Material icon subset.");
