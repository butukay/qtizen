using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace AeroTizen.Transitions
{
    internal static class TransitionPolicy
    {
        internal const string Enable = "wm.comp.win.effect.enable", Style = "wm.comp.win.effect.style", Zoom = "wm.monitor.skip.deskzoom";
        internal static readonly HashSet<string> Keys = new HashSet<string> { Enable, Style, Zoom };
        internal static string Parse(byte[] bytes)
        {
            if (bytes == null || bytes.Length > 256) return null;
            try
            {
                using var document = JsonDocument.Parse(bytes);
                var value = document.RootElement;
                if (value.GetProperty("schema_version").GetInt32() != 1) return null;
                string mode = value.GetProperty("mode").GetString();
                return mode == "none" || mode == "fade" || mode == "standard" ? mode : null;
            }
            catch (Exception error) when (error is JsonException || error is KeyNotFoundException || error is InvalidOperationException || error is FormatException) { return null; }
        }
        internal static bool Manage(Window window, string appId) => window.Pid > 0 && window.Layer == 200 && window.Width >= 1280 && window.Height >= 720
            && !string.IsNullOrEmpty(appId) && (appId == "DclHome001.Home" || appId == "com.samsung.tv.cobalt-yt" || appId == "com.samsung.tv.cobalt" ||
                (!appId.StartsWith("org.tizen.", StringComparison.Ordinal) && !appId.StartsWith("com.samsung.", StringComparison.Ordinal) &&
                 !appId.StartsWith("org.aerotizen.", StringComparison.Ordinal) && !appId.StartsWith("adplatform.", StringComparison.Ordinal)));
        internal static Dictionary<string, string> Values(string mode, IReadOnlyDictionary<string, Hint> original)
        {
            if (mode != "none" && mode != "fade" && mode != "standard") throw new ArgumentException("Invalid transition mode");
            return new Dictionary<string, string> {
                [Enable] = mode == "none" ? "0" : mode == "fade" ? "1" : original.GetValueOrDefault(Enable)?.Value ?? "1",
                [Style] = mode == "fade" ? "fade_slow" : original.GetValueOrDefault(Style)?.Value ?? "tension",
                [Zoom] = mode == "fade" ? "1" : original.GetValueOrDefault(Zoom)?.Value ?? "0"
            };
        }
    }
    internal sealed class TransitionController
    {
        private sealed class Tracked
        {
            internal Window Window;
            internal Dictionary<string, Hint> Original;
            internal string Mode;
        }
        private readonly IWindowBus bus;
        private readonly Dictionary<uint, Tracked> windows = new Dictionary<uint, Tracked>();
        internal TransitionController(IWindowBus bus) { this.bus = bus; }
        private static uint HintId(string key) => key == TransitionPolicy.Enable ? 700201u : key == TransitionPolicy.Style ? 700202u : 700203u;
        private void Apply(Tracked item, string mode)
        {
            var values = TransitionPolicy.Values(mode, item.Original);
            // Preserve window visibility handling. Never call effect_control or unload the module.
            foreach (string key in new[] { TransitionPolicy.Zoom, TransitionPolicy.Style, TransitionPolicy.Enable })
            {
                uint id = item.Original.GetValueOrDefault(key)?.Id ?? HintId(key);
                bus.Set(item.Window, id, key, values[key]);
                bool retain = mode == "fade" || (mode == "none" && key == TransitionPolicy.Enable) || item.Original.ContainsKey(key);
                if (!retain) bus.Delete(item.Window, id);
            }
            var observed = bus.Hints(item.Window);
            foreach (string key in TransitionPolicy.Keys)
            {
                string expected = mode == "fade" || (mode == "none" && key == TransitionPolicy.Enable) ? values[key] : item.Original.GetValueOrDefault(key)?.Value;
                if (observed.GetValueOrDefault(key)?.Value != expected) throw new IOException("Transition change was not confirmed");
            }
            item.Mode = mode;
        }
        internal int Tick(string mode)
        {
            var visible = bus.Windows();
            var alive = visible.ToDictionary(window => window.Id);
            foreach (uint id in windows.Keys.ToArray())
                if (!alive.TryGetValue(id, out var current) || current.Pid != windows[id].Window.Pid || current.Resource != windows[id].Window.Resource) windows.Remove(id);
            foreach (var window in visible)
            {
                if (windows.TryGetValue(window.Id, out var tracked))
                {
                    if (tracked.Mode != mode) Apply(tracked, mode);
                    continue;
                }
                if (window.Pid <= 0 || window.Layer != 200 || window.Width < 1280 || window.Height < 720 || !TransitionPolicy.Manage(window, bus.AppId(window.Pid))) continue;
                var item = new Tracked { Window = window, Original = bus.Hints(window) };
                windows.Add(window.Id, item);
                Apply(item, mode);
            }
            return windows.Count;
        }
        internal void Restore()
        {
            var alive = bus.Windows().ToDictionary(window => window.Id);
            foreach (var item in windows.Values)
            {
                if (alive.TryGetValue(item.Window.Id, out var current) && current.Pid == item.Window.Pid && current.Resource == item.Window.Resource)
                    try { Apply(item, "standard"); } catch (IOException) { }
            }
            windows.Clear();
        }
    }
}
