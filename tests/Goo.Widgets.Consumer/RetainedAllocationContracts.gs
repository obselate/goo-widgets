package Goo.Widgets.Consumer

import Goo
import Goo.Widgets
import Goo.Widgets.Inputs
import System

internal class RetainedAllocationHost : Cell {
    internal var Find bool
    internal var Entry TextEntry?
    internal var Count int32 = 5000
    internal var FieldBuilds int32
    private let tokens[]string = [200]string
    private let captureToken Func[TokenInputInput, TextEntry, TextEntry]
    private let captureFind Func[TextField, TextEntry]

    public init() {
        for index in 0 ... tokens.Length {
            tokens[index] = "token-" + index.ToString()
        }
        captureToken = (input, entry) -> {
            Entry = entry
            return entry
        }
        captureFind = input -> {
            FieldBuilds++
            return TextEntry{Value: input.Value!!, Controlled: true}
        }
    }

    public override func Build() Blob {
        if Find {
            return FindBar{Query: "let", MatchCount: Count, ActiveMatch: 1, CreateEntry: captureFind}.Build()
        }
        return Cell.Mount[TokenInputInput, TokenInput](
            "tokens",
            TokenInputInput{Tokens: tokens, CreateEntry: captureToken, Width: Percent(100),}
        )
    }
}

func RetainedAllocationContracts() {
    for count in[]int32{-1, 10, 5000} {
        let find = count >= 0
        using let embedded = ThemePreferenceHost()
        embedded.Resize(1100, 760, 1100, 760)
        embedded.UpdatePreferences(PlatformPreferences{ReducedMotion: true})
        let root = RetainedAllocationHost(){Find = find, Count = Math.Max(0, count)}
        let window = Window{Root: root}
        Theme.Attach(window)
        window.Attach(embedded)
        ThemeFrames(embedded)
        for index in 0 ... 30 {
            if find {
                root.Rebuild()
            } else {
                root.Entry!!.OnChange!!.Invoke("")
            }
            embedded.RenderFrame(1.0 / 60.0)
        }
        let samples = find ? 40: 20
        let before = GC.GetAllocatedBytesForCurrentThread()
        for index in 0 ... samples {
            if find {
                root.Rebuild()
            } else {
                root.Entry!!.OnChange!!.Invoke("")
            }
            embedded.RenderFrame(1.0 / 60.0)
        }
        let bytes = (GC.GetAllocatedBytesForCurrentThread() - before) / samples
        Console.WriteLine("RETAIN input=" + count.ToString() + " bytes/rebuild=" + bytes.ToString())
        Require(bytes < (find ? 5780: 325000), "Unchanged retained input allocation regressed")
        if count == 5000 {
            let start = GC.GetAllocatedBytesForCurrentThread()
            for index in 0 ... 40 {
                root.Count = 5000 - index
                root.Rebuild()
                embedded.RenderFrame(1.0 / 60.0)
            }
            let changed = (GC.GetAllocatedBytesForCurrentThread() - start) / 40
            Console.WriteLine("RETAIN count bytes/update=" + changed.ToString())
            Require(changed < 7500, "Find count updates rebuilt the toolbar")
            Require(root.FieldBuilds == 1, "Find count updates rebuilt the query field")
        }
    }
}
