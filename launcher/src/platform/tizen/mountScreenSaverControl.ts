interface AppCommon {
  AppCommonScreenSaverState: { SCREEN_SAVER_OFF: number; SCREEN_SAVER_ON: number };
  setScreenSaver(state: number, done: () => void, failed: () => void): void;
}

interface ScreenSaverHost extends Pick<Window, "addEventListener" | "removeEventListener"> {
  document: Document;
  location?: Pick<Location, "protocol">;
  Qtizen: { tizen?: unknown };
  webapis?: { appcommon?: AppCommon };
}

// AppCommon controls this app's screen-saver request, not the panel-care settings.
export const mountScreenSaverControl = (host: ScreenSaverHost) => {
  if (!host.Qtizen.tizen) {
    return () => undefined;
  }
  const document = host.document;
  let disposed = false;
  let restoreNeeded = false;
  let target: boolean | null = null;
  let revision = 0;
  let script: HTMLScriptElement | undefined;
  const sync = () => {
    const api = host.webapis?.appcommon;
    const suppress = !disposed && !document.hidden;
    if (!api || target === suppress || (!suppress && !restoreNeeded)) {
      return;
    }
    const request = ++revision;
    target = suppress;
    if (suppress) {
      restoreNeeded = true;
    }
    const failed = () => {
      if (request === revision) {
        target = null;
      }
    };
    try {
      const state = api.AppCommonScreenSaverState;
      api.setScreenSaver(
        suppress ? state.SCREEN_SAVER_OFF : state.SCREEN_SAVER_ON,
        () => {
          if (request === revision && !suppress) {
            restoreNeeded = false;
          }
        },
        failed,
      );
    } catch {
      failed();
    }
  };
  const resume = () => {
    target = null;
    sync();
  };
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("playing", resume, true);
  host.addEventListener("appcontrol", resume);
  sync();
  if (!host.webapis?.appcommon && host.location?.protocol === "file:") {
    script = document.createElement("script");
    script.src = "$WEBAPIS/webapis/webapis.js";
    script.onload = sync;
    document.head.appendChild(script);
  }
  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    document.removeEventListener("visibilitychange", sync);
    document.removeEventListener("playing", resume, true);
    host.removeEventListener("appcontrol", resume);
    if (script) {
      script.onload = null;
      script.remove();
    }
    sync();
  };
};
