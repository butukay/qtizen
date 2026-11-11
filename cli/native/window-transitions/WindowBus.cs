using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace AeroTizen.Transitions
{
    internal sealed record Window(uint Id, uint Resource, int Pid, string Name, int Width, int Height, int Layer);
    internal sealed record Hint(uint Id, string Value);
    internal interface IWindowBus : IDisposable
    {
        IReadOnlyList<Window> Windows();
        string AppId(int pid);
        Dictionary<string, Hint> Hints(Window window);
        void Set(Window window, uint id, string key, string value);
        void Delete(Window window, uint id);
    }
    internal sealed class WindowBus : IWindowBus
    {
        private const string Gio = "libgio-2.0.so.0", Glib = "libglib-2.0.so.0";
        [DllImport(Gio)] private static extern IntPtr g_bus_get_sync(int kind, IntPtr cancel, out IntPtr error);
        [DllImport(Gio)] private static extern IntPtr g_dbus_connection_call_sync(IntPtr bus, string destination, string path, string iface, string method, IntPtr parameters, IntPtr replyType, int flags, int timeout, IntPtr cancel, out IntPtr error);
        [DllImport(Glib)] private static extern IntPtr g_variant_new_string(string value);
        [DllImport(Glib)] private static extern IntPtr g_variant_new_uint32(uint value);
        [DllImport(Glib)] private static extern IntPtr g_variant_new_tuple(IntPtr[] children, UIntPtr count);
        [DllImport(Glib)] private static extern IntPtr g_variant_ref_sink(IntPtr value);
        [DllImport(Glib)] private static extern void g_variant_unref(IntPtr value);
        [DllImport(Glib)] private static extern IntPtr g_variant_get_child_value(IntPtr value, UIntPtr index);
        [DllImport(Glib)] private static extern UIntPtr g_variant_n_children(IntPtr value);
        [DllImport(Glib)] private static extern IntPtr g_variant_get_type_string(IntPtr value);
        [DllImport(Glib)] private static extern uint g_variant_get_uint32(IntPtr value);
        [DllImport(Glib)] private static extern int g_variant_get_int32(IntPtr value);
        [DllImport(Glib)] private static extern IntPtr g_variant_get_string(IntPtr value, out UIntPtr size);
        [DllImport(Glib)] private static extern void g_error_free(IntPtr error);
        [DllImport("libgobject-2.0.so.0")] private static extern void g_object_unref(IntPtr value);
        [DllImport("libcapi-appfw-app-manager.so.0")] private static extern int app_manager_get_app_id(int pid, out IntPtr id);
        [DllImport("libc.so.6")] private static extern void free(IntPtr value);
        private IntPtr bus;
        private static string Type(IntPtr value) => Marshal.PtrToStringUTF8(g_variant_get_type_string(value));
        private static IntPtr Child(IntPtr value, int index) => g_variant_get_child_value(value, new UIntPtr((uint)index));
        private static long Number(IntPtr tuple, int index)
        {
            IntPtr child = Child(tuple, index);
            try { return Type(child) switch { "u" => g_variant_get_uint32(child), "i" => g_variant_get_int32(child), _ => throw new IOException("Unexpected window value") }; }
            finally { g_variant_unref(child); }
        }
        private static string Text(IntPtr tuple, int index)
        {
            IntPtr child = Child(tuple, index);
            try
            {
                if (Type(child) != "s") throw new IOException("Unexpected window name");
                IntPtr text = g_variant_get_string(child, out UIntPtr length);
                if (length.ToUInt64() > 4096) throw new IOException("Window name too long");
                return Marshal.PtrToStringUTF8(text, (int)length.ToUInt32());
            }
            finally { g_variant_unref(child); }
        }
        private IntPtr Call(string method, params IntPtr[] arguments)
        {
            if (bus == IntPtr.Zero)
            {
                bus = g_bus_get_sync(1, IntPtr.Zero, out IntPtr error);
                if (error != IntPtr.Zero) g_error_free(error);
                if (bus == IntPtr.Zero) throw new IOException("Window service unavailable");
            }
            IntPtr parameters = arguments.Length == 0 ? IntPtr.Zero : g_variant_ref_sink(g_variant_new_tuple(arguments, new UIntPtr((uint)arguments.Length)));
            try
            {
                IntPtr result = g_dbus_connection_call_sync(bus, "org.enlightenment.wm", "/org/enlightenment/wm", "org.enlightenment.wm.info", method, parameters, IntPtr.Zero, 0, 1500, IntPtr.Zero, out IntPtr error);
                if (error != IntPtr.Zero) g_error_free(error);
                if (result == IntPtr.Zero) throw new IOException("Window request failed");
                return result;
            }
            finally { if (parameters != IntPtr.Zero) g_variant_unref(parameters); }
        }
        public IReadOnlyList<Window> Windows()
        {
            IntPtr result = Call("get_window_info");
            try
            {
                if (!Type(result).StartsWith("(") || g_variant_n_children(result).ToUInt64() != 8) throw new IOException("Unsupported window service");
                IntPtr rows = Child(result, 7);
                try
                {
                    if (!Type(rows).StartsWith("a(") || g_variant_n_children(rows).ToUInt64() > 256) throw new IOException("Unexpected window list");
                    var windows = new List<Window>();
                    for (int i = 0; i < (int)g_variant_n_children(rows).ToUInt32(); i++)
                    {
                        IntPtr row = Child(rows, i);
                        try
                        {
                            if (g_variant_n_children(row).ToUInt64() < 9) throw new IOException("Unexpected window fields");
                            windows.Add(new Window(checked((uint)Number(row, 0)), checked((uint)Number(row, 1)), checked((int)Number(row, 2)), Text(row, 3), checked((int)Number(row, 6)), checked((int)Number(row, 7)), checked((int)Number(row, 8))));
                        }
                        finally { g_variant_unref(row); }
                    }
                    return windows;
                }
                finally { g_variant_unref(rows); }
            }
            finally { g_variant_unref(result); }
        }
        public string AppId(int pid)
        {
            IntPtr value = IntPtr.Zero;
            try { return app_manager_get_app_id(pid, out value) == 0 && value != IntPtr.Zero ? Marshal.PtrToStringUTF8(value) : null; }
            finally { if (value != IntPtr.Zero) free(value); }
        }
        internal static Dictionary<string, Hint> ParseHints(string output, Window window)
        {
            if (!Regex.IsMatch(output, @"Window_ID\s*:\s*0x" + window.Id.ToString("x", CultureInfo.InvariantCulture) + @"\s", RegexOptions.IgnoreCase)) throw new IOException("Window identity changed");
            var hints = new Dictionary<string, Hint>();
            foreach (Match match in Regex.Matches(output, @"\[(\d+)\]\[([^\]\r\n]+)\]\[([^\]\r\n]*)\]"))
            {
                string key = match.Groups[2].Value;
                if (TransitionPolicy.Keys.Contains(key) && !hints.TryAdd(key, new Hint(uint.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture), match.Groups[3].Value)))
                    throw new IOException("Ambiguous window hints");
                if (uint.TryParse(match.Groups[1].Value, out uint id) && id >= 700201 && id <= 700203 && !TransitionPolicy.Keys.Contains(key))
                    throw new IOException("Window hint identifier is occupied");
            }
            return hints;
        }
        public Dictionary<string, Hint> Hints(Window window)
        {
            var start = new ProcessStartInfo("/usr/bin/enlightenment_info") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
            start.Environment["DBUS_SESSION_BUS_ADDRESS"] = "kernel:path=/sys/fs/kdbus/5001-user/bus";
            start.ArgumentList.Add("-prop"); start.ArgumentList.Add("0x" + window.Id.ToString("x", CultureInfo.InvariantCulture));
            using var process = Process.Start(start);
            var output = process.StandardOutput.ReadToEndAsync(); var error = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(2000)) { process.Kill(true); throw new IOException("Window inspection timed out"); }
            string text = output.GetAwaiter().GetResult(); error.GetAwaiter().GetResult();
            if (process.ExitCode != 0 || text.Length > 32768) throw new IOException("Window inspection failed");
            return ParseHints(text, window);
        }
        public void Set(Window window, uint id, string key, string value)
        {
            if (!TransitionPolicy.Keys.Contains(key) || value.Length > 128) throw new IOException("Invalid transition hint");
            IntPtr result = Call("aux_hint_add", g_variant_new_string("0x" + window.Id.ToString("x", CultureInfo.InvariantCulture)), g_variant_new_uint32(id), g_variant_new_string(key), g_variant_new_string(value));
            g_variant_unref(result);
        }
        public void Delete(Window window, uint id)
        {
            IntPtr result = Call("aux_hint_del", g_variant_new_string("0x" + window.Id.ToString("x", CultureInfo.InvariantCulture)), g_variant_new_uint32(id));
            g_variant_unref(result);
        }
        public void Dispose() { if (bus != IntPtr.Zero) { g_object_unref(bus); bus = IntPtr.Zero; } }
    }
}
