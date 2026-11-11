using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Qtizen.Root;

namespace Qtizen.Transitions
{
    internal sealed class WindowTransitions : IDisposable
    {
        private readonly CancellationTokenSource stopping = new CancellationTokenSource();
        private readonly LauncherPrivateFile preference = new LauncherPrivateFile("window-transitions.json");
        private readonly LauncherPrivateFile status = new LauncherPrivateFile("window-transitions-status.json");
        private Task worker;
        private FileStream ownership;
        [DllImport("libc.so.6", SetLastError = true)] private static extern int flock(int fd, int operation);
        internal void Start()
        {
            if (worker != null) return;
            RootPaths.RequireTv(true);
            ownership = new FileStream("/run/qtizen-window-transitions.lock", FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.ReadWrite);
            if (flock(ownership.SafeFileHandle.DangerousGetHandle().ToInt32(), 6) != 0) { ownership.Dispose(); ownership = null; return; }
            worker = Task.Run(Run);
        }
        private async Task Run()
        {
            using var bus = new WindowBus();
            var controller = new TransitionController(bus);
            string mode = null;
            long published = 0;
            string lastState = null;
            string boot = RootPaths.Boot();
            try
            {
                while (!stopping.IsCancellationRequested)
                {
                    bool ready = false;
                    int count = 0;
                    string failure = null;
                    try
                    {
                        mode = TransitionPolicy.Parse(preference.Read(256)) ?? mode;
                        if (mode != null) { count = controller.Tick(mode); ready = count > 0; }
                    }
                    catch (Exception error) when (error is IOException || error is UnauthorizedAccessException || error is InvalidOperationException || error is DllNotFoundException || error is EntryPointNotFoundException) { failure = error.GetType().Name + ": " + error.Message; }
                    long now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    string state = mode + ":" + ready + ":" + count;
                    if (now - published >= 2000 || state != lastState)
                    {
                        status.Publish(JsonSerializer.SerializeToUtf8Bytes(new { schema_version = 1, ready, mode, updated_at = now, boot_id = boot, windows = count, error = failure }));
                        published = now; lastState = state;
                    }
                    await Task.Delay(250, stopping.Token);
                }
            }
            catch (OperationCanceledException) when (stopping.IsCancellationRequested) { }
            finally
            {
                try { controller.Restore(); } catch (Exception) { }
                status.Remove();
            }
        }
        public void Dispose()
        {
            stopping.Cancel();
            try { worker?.GetAwaiter().GetResult(); } finally { ownership?.Dispose(); stopping.Dispose(); }
        }
    }
}
