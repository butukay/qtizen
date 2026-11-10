import type { SettingsSnapshot } from "../../contracts/preferences";

interface AppCommon {
  AppCommonScreenSaverState: { SCREEN_SAVER_OFF: number; SCREEN_SAVER_ON: number };
  setScreenSaver(state: number, done: () => void, failed: () => void): void;
}

interface ScreenSaverHost extends Pick<Window, "addEventListener" | "removeEventListener"> {
  AeroTizen: { tizen?: unknown };
  document: Document;
  webapis?: { appcommon?: AppCommon };
}

interface ScreenSaverSettings {
  getSnapshot(): Pick<SettingsSnapshot, "nordRice">;
  subscribe(listener: () => void): () => void;
}

// AppCommon controls this app's screen-saver request, not the panel-care settings.
export const mountScreenSaverControl = (host: ScreenSaverHost, settings: ScreenSaverSettings) => {
  if (!host.AeroTizen.tizen) {
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
    const suppress = !disposed && !document.hidden && settings.getSnapshot().nordRice;
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
  const unsubscribe = settings.subscribe(sync);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("playing", resume, true);
  host.addEventListener("appcontrol", resume);
  sync();
  if (!host.webapis?.appcommon) {
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
    unsubscribe();
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
