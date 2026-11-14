import System
import System.Diagnostics
import System.IO
import System.Linq

func Main(args[]string) {
    let target = Environment.GetEnvironmentVariable("INPUT_TARGET") ??
        throw ArgumentException("INPUT_TARGET is required")
    if args.Length == 2 && args[0] == "--replay" {
        Check(File.ReadAllBytes(args[1]), target)
        Console.WriteLine("Replayed $target input.")
        return
    }
    let seeds = Directory.GetFiles(args[0]).OrderBy(path -> path).Select(File.ReadAllBytes).ToArray()
    if seeds.Length == 0 { throw ArgumentException("No seed fixtures") }
    let random = Random(Int32.Parse(Environment.GetEnvironmentVariable("INPUT_SEED") ?? "0"))
    let duration = TimeSpan.FromSeconds(Int32.Parse(Environment.GetEnvironmentVariable("INPUT_SECONDS") ?? "600"))
    let clock = Stopwatch.StartNew()
    var count int64 = 0
    for seed in seeds { Check(seed, target) }
    while clock.Elapsed < duration {
        let seed = seeds[random.Next(seeds.Length)]
        var input[]uint8
        switch random.Next(4) {
            case 0 {
                input = cast[[]uint8](seed.Clone())
                if input.Length > 0 { input[random.Next(input.Length)] ^= uint8(random.Next(1, 256)) }
            }
            case 1 { input = seed.AsSpan(0, random.Next(seed.Length + 1)).ToArray() }
            case 2 {
                let other = seeds[random.Next(seeds.Length)]
                let split = random.Next(seed.Length + 1)
                let start = random.Next(other.Length + 1)
                input = [split + other.Length - start]uint8
                seed.AsSpan(0, split).CopyTo(input)
                other.AsSpan(start).CopyTo(input.AsSpan(split))
            }
            case _ {
                input = [random.Next(1, 257)]uint8
                random.NextBytes(input)
            }
        }
        Check(input, target)
        count++
    }
    Console.WriteLine("Completed $count generated $target inputs in ${clock.Elapsed}.")
}

func Check(input[]uint8, target string) {
    try {
        switch target {
            case "roving-focus" { NavigationFuzz.Roving(input) }
            case "typeahead" { NavigationFuzz.TypeAhead(input) }
            case "markdown" { MarkdownFuzz.Run(input) }
            case _ { throw ArgumentException("Unknown managed input target: $target") }
        }
    } catch {
        let current = Environment.GetEnvironmentVariable("INPUT_CURRENT")
        if current != nil { File.WriteAllBytes(current, input) }
        rethrow
    }
}
