using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using Qtizen.Hdmi;
using Qtizen.Transitions;

namespace Qtizen.Root
{
    internal sealed class LauncherServices : IDisposable
    {
        private readonly WindowTransitions transitions = new WindowTransitions();
        private readonly HdmiWake hdmi = new HdmiWake();
        internal void Start()
        {
            try { transitions.Start(); } catch (IOException) { }
            try { hdmi.Start(); } catch (IOException) { }
        }
        public void Dispose() { try { hdmi.Dispose(); } finally { transitions.Dispose(); } }
        internal static int Serve()
        {
            using var done = new ManualResetEventSlim();
            using var term = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context => { context.Cancel = true; done.Set(); });
            using var interrupt = PosixSignalRegistration.Create(PosixSignal.SIGINT, context => { context.Cancel = true; done.Set(); });
            using var services = new LauncherServices();
            services.Start(); done.Wait(); return 0;
        }
    }
}
