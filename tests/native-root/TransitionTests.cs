using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AeroTizen.Transitions;

internal static class TransitionTests
{
    private sealed class FakeBus : IWindowBus
    {
        internal readonly List<Window> List = new List<Window>();
        internal readonly Dictionary<uint, Dictionary<string, Hint>> Data = new Dictionary<uint, Dictionary<string, Hint>>();
        internal readonly List<string> Calls = new List<string>();
        internal bool IgnoreWrites;
        public IReadOnlyList<Window> Windows() => List;
        public string AppId(int pid) => pid == 99 ? "org.tizen.volume-app" : "DclHome001.Home";
        public Dictionary<string, Hint> Hints(Window window) => new Dictionary<string, Hint>(Data[window.Id]);
        public void Set(Window window, uint id, string key, string value)
        { Calls.Add("set:" + window.Id + ":" + key); if (!IgnoreWrites) Data[window.Id][key] = new Hint(id, value); }
        public void Delete(Window window, uint id)
        { Calls.Add("delete:" + window.Id); if (!IgnoreWrites) foreach (var key in Data[window.Id].Where(pair => pair.Value.Id == id).Select(pair => pair.Key).ToArray()) Data[window.Id].Remove(key); }
        public void Dispose() { }
    }
    internal static void Run(Action<bool, string> check, Action<Action, string> reject)
    {
        foreach (string mode in new[] { "none", "fade", "standard" })
            check(TransitionPolicy.Parse(Encoding.UTF8.GetBytes("{\"schema_version\":1,\"mode\":\"" + mode + "\"}")) == mode, "Valid transition mode rejected");
        foreach (string value in new[] { "{}", "{", "null", "{\"schema_version\":2,\"mode\":\"none\"}", "{\"schema_version\":1,\"mode\":\"shell\"}" })
            check(TransitionPolicy.Parse(Encoding.UTF8.GetBytes(value)) == null, "Invalid transition preference accepted");
        var home = new Window(10, 20, 30, "AeroTizen", 1920, 1080, 200);
        check(TransitionPolicy.Manage(home, "DclHome001.Home"), "Home excluded");
        check(TransitionPolicy.Manage(home, "rJeHak5zRg.Spotify"), "Spotify excluded");
        check(!TransitionPolicy.Manage(home, "org.tizen.volume-app"), "System overlay included");
        check(!TransitionPolicy.Manage(home with { Layer = 650 }, "DclHome001.Home"), "Notification window included");
        check(!TransitionPolicy.Manage(home with { Width = 1 }, "DclHome001.Home"), "Media subsurface included");
        var bus = new FakeBus(); bus.List.Add(home); bus.Data.Add(home.Id, new Dictionary<string, Hint>());
        var controller = new TransitionController(bus);
        check(controller.Tick("none") == 1 && bus.Data[home.Id].Count == 1 && bus.Data[home.Id][TransitionPolicy.Enable].Value == "0", "No-animation did not disable only the client");
        int calls = bus.Calls.Count; controller.Tick("none"); check(bus.Calls.Count == calls, "Unchanged windows were rewritten");
        controller.Tick("fade"); check(bus.Data[home.Id][TransitionPolicy.Style].Value == "fade_slow" && bus.Data[home.Id][TransitionPolicy.Zoom].Value == "1" && bus.Data[home.Id][TransitionPolicy.Enable].Value == "1", "Fade did not enable completion handling");
        controller.Tick("standard"); check(bus.Data[home.Id].Count == 0, "Standard left injected hints behind");
        var second = home with { Id = 11, Resource = 21, Pid = 31 };
        bus.List.Add(second); bus.Data.Add(second.Id, new Dictionary<string, Hint> { [TransitionPolicy.Style] = new Hint(4, "keyboard") });
        controller.Tick("fade"); check(bus.Data[second.Id][TransitionPolicy.Style].Id == 4, "Original hint identity changed");
        controller.Restore(); check(bus.Data[second.Id].Count == 1 && bus.Data[second.Id][TransitionPolicy.Style].Value == "keyboard", "Original app hints were not restored");
        controller.Tick("none"); bus.List[0] = home with { Resource = 50, Pid = 51 }; bus.Data[home.Id].Clear();
        controller.Restore(); check(bus.Data[home.Id].Count == 0, "Restoration changed a recycled window id");
        bus.IgnoreWrites = true;
        reject(() => controller.Tick("none"), "Failed native write was reported applied");
        check(WindowBus.ParseHints("Window_ID : 0xa\n[1][wm.comp.win.effect.enable][0]\n", home)[TransitionPolicy.Enable].Value == "0", "Native hint parser failed");
        reject(() => WindowBus.ParseHints("Window_ID : 0xb\n", home), "Different window accepted");
        reject(() => WindowBus.ParseHints("Window_ID : 0xa\n[1][wm.comp.win.effect.enable][0]\n[2][wm.comp.win.effect.enable][1]", home), "Ambiguous original state accepted");
        Console.WriteLine("TRANSITION_POLICY_CHECKS_PASSED");
    }
}
