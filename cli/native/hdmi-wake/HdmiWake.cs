using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using AeroTizen.Root;

namespace AeroTizen.Hdmi
{
    internal sealed record WakeRequest(string Id, int Port, long RequestedAt);

    internal static class HdmiWakePolicy
    {
        internal static WakeRequest Parse(byte[] bytes, long now)
        {
            if (bytes == null || bytes.Length > 512) return null;
            try
            {
                using var document = JsonDocument.Parse(bytes);
                var value = document.RootElement;
                if (value.ValueKind != JsonValueKind.Object || value.GetProperty("schema_version").GetInt32() != 1) return null;
                string id = value.GetProperty("request_id").GetString();
                int port = value.GetProperty("port").GetInt32();
                long at = value.GetProperty("requested_at").GetInt64();
                if (id == null || !Regex.IsMatch(id, "\\A[a-z0-9-]{1,48}\\z") || port < 1 || port > 4 || at < now - 5000 || at > now) return null;
                return new WakeRequest(id, port, at);
            }
            catch (Exception error) when (error is JsonException || error is KeyNotFoundException || error is InvalidOperationException || error is FormatException || error is OverflowException) { return null; }
        }
    }

    internal sealed class HdmiWake : IDisposable
    {
        private readonly CancellationTokenSource stopping = new CancellationTokenSource();
        private readonly LauncherPrivateFile request = new LauncherPrivateFile("hdmi-wake-request.json");
        private readonly LauncherPrivateFile status = new LauncherPrivateFile("hdmi-wake-status.json");
        private Task worker;
        private FileStream ownership;
        [DllImport("libc.so.6", SetLastError = true)] private static extern int flock(int fd, int operation);

        internal void Start()
        {
            if (worker != null) return;
            RootPaths.RequireTv(true);
            ownership = new FileStream("/run/aerotizen-hdmi-wake.lock", FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite);
            if (flock(ownership.SafeFileHandle.DangerousGetHandle().ToInt32(), 6) != 0) { ownership.Dispose(); ownership = null; return; }
            worker = Task.Run(Run);
        }

        private static bool Wake(int port)
        {
            if (port < 1 || port > 4) throw new ArgumentOutOfRangeException(nameof(port));
            // This fixed call activates one HDMI-CEC stream path; no shell or arbitrary native methods.
            var start = new ProcessStartInfo("/usr/bin/gdbus") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
            foreach (string argument in new[] { "call", "--system", "--dest", "org.tizen.tv.hdmicec", "--object-path", "/org/tizen/tv/hdmicec", "--method", "org.tizen.tv.HdmiCec.SetDeviceStreamPathByHdmiPort", port.ToString(CultureInfo.InvariantCulture) }) start.ArgumentList.Add(argument);
            using var process = Process.Start(start);
            var output = process.StandardOutput.ReadToEndAsync(); var error = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(2000)) { process.Kill(true); process.WaitForExit(); return false; }
            error.GetAwaiter().GetResult();
            return process.ExitCode == 0 && output.GetAwaiter().GetResult().Trim() == "(0,)";
        }

        private async Task Run()
        {
            string id = null;
            int port = 0;
            bool accepted = false;
            long published = 0;
            var seen = new Dictionary<string, long>();
            // Starting the service must never replay an old selection, even during the same boot.
            long started = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            try
            {
                while (!stopping.IsCancellationRequested)
                {
                    long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    try
                    {
                        var command = HdmiWakePolicy.Parse(request.Read(512), now);
                        if (command != null && command.RequestedAt >= started && !seen.ContainsKey(command.Id))
                        {
                            foreach (string old in new List<string>(seen.Keys)) if (seen[old] < now - 10000) seen.Remove(old);
                            if (seen.Count < 64)
                            {
                                seen.Add(command.Id, now);
                                id = command.Id; port = command.Port;
                                accepted = Wake(port);
                                published = 0;
                            }
                        }
                    }
                    catch (Exception error) when (error is IOException || error is UnauthorizedAccessException || error is InvalidOperationException || error is System.ComponentModel.Win32Exception) { accepted = false; }
                    now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    if (now - published >= 1000)
                    {
                        status.Publish(JsonSerializer.SerializeToUtf8Bytes(new { schema_version = 1, ready = true, updated_at = now, request_id = id, port, accepted }));
                        published = now;
                    }
                    await Task.Delay(100, stopping.Token);
                }
            }
            catch (OperationCanceledException) when (stopping.IsCancellationRequested) { }
            finally { status.Remove(); }
        }

        public void Dispose()
        {
            stopping.Cancel();
            try { worker?.GetAwaiter().GetResult(); } finally { ownership?.Dispose(); stopping.Dispose(); }
        }
    }
}
