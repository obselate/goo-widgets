package Goo.Widgets.Consumer

import Goo.Widgets
import System.Diagnostics

func SearchListBenchmarks() {
    let items = [1000]SelectionItem
    for i in 0 ... items.Length {
        items[i] = SelectionItem{Id: i.ToString(), Label: "Item " + i.ToString()}
    }
    let input = SearchList{Items: items, SelectedId: "0"}
    for i in 0 ... 300 {
        GC.KeepAlive(input.Build())
    }
    let times = [2000]int64
    let before = GC.GetAllocatedBytesForCurrentThread()
    for i in 0 ... times.Length {
        let start = Stopwatch.GetTimestamp()
        GC.KeepAlive(input.Build())
        times[i] = Stopwatch.GetTimestamp() - start
    }
    let allocated = GC.GetAllocatedBytesForCurrentThread() - before
    Array.Sort(times)
    Console.WriteLine(
        "searchlist-build: items=1000 warmup=300 samples=2000 allocated_B_per_build="
        + (allocated / times.Length).ToString()
        + " cpu_p50_ns=" + (times[1000] * 1000000000L / Stopwatch.Frequency).ToString()
        + " cpu_p95_ns=" + (times[1900] * 1000000000L / Stopwatch.Frequency).ToString()
    )
}
