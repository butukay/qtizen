import { afterEach, expect, test, vi } from "vitest";

import { createStore } from "../../shared/state/createStore";

import { mountScreenSaverControl } from "./mountScreenSaverControl";

const prepare = () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const settings = createStore({ nordRice: true });
  const api = {
    AppCommonScreenSaverState: { SCREEN_SAVER_OFF: 0, SCREEN_SAVER_ON: 1 },
    setScreenSaver: vi.fn((_state: number, done: () => void, _failed: () => void) => done()),
  };
  const host = {
    document,
    AeroTizen: { tizen: {} as unknown },
    webapis: { appcommon: api },
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
  };
  return { hidden, settings, api, host };
};

afterEach(() => vi.restoreAllMocks());

test("only visible Nord suppresses the saver, and hiding, switching themes or disposing restores it", () => {
  const { hidden, settings, api, host } = prepare();
  const dispose = mountScreenSaverControl(host, settings);
  expect(api.setScreenSaver.mock.calls.map(([state]) => state)).toEqual([0]);
  settings.set({ nordRice: true });
  expect(api.setScreenSaver).toHaveBeenCalledTimes(1);
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  settings.set({ nordRice: false });
  settings.set({ nordRice: true });
  window.dispatchEvent(new Event("appcontrol"));
  document.dispatchEvent(new Event("playing"));
  dispose();
  const calls = api.setScreenSaver.mock.calls.map(([state]) => state);
  expect(calls).toEqual([0, 1, 0, 1, 0, 0, 0, 1]);
  dispose();
  window.dispatchEvent(new Event("appcontrol"));
  document.dispatchEvent(new Event("playing"));
  settings.set({ nordRice: false });
  expect(api.setScreenSaver).toHaveBeenCalledTimes(calls.length);
});

test("unsupported firmware can reject requests without interrupting the launcher or retrying in a loop", () => {
  const { settings, api, host } = prepare();
  api.setScreenSaver.mockImplementationOnce(() => {
    throw new Error("NotSupportedError");
  });
  const dispose = mountScreenSaverControl(host, settings);
  expect(api.setScreenSaver).toHaveBeenCalledTimes(1);
  api.setScreenSaver.mockImplementationOnce((_state, _done, failed) => failed());
  window.dispatchEvent(new Event("appcontrol"));
  expect(api.setScreenSaver).toHaveBeenCalledTimes(2);
  dispose();
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(1);
});

test("the TV SDK loads only on Tizen and cannot make a late request after disposal", () => {
  const { settings, host } = prepare();
  const absent = { ...host, webapis: undefined };
  const browserDispose = mountScreenSaverControl({ ...absent, AeroTizen: { tizen: null } }, settings);
  expect(document.querySelector('script[src*="$WEBAPIS"]')).toBeNull();
  browserDispose();
  const dispose = mountScreenSaverControl(absent, settings);
  const script = document.querySelector<HTMLScriptElement>('script[src*="$WEBAPIS"]');
  expect(script).not.toBeNull();
  dispose();
  script?.dispatchEvent(new Event("load"));
  expect(document.querySelector('script[src*="$WEBAPIS"]')).toBeNull();
});

test("a delayed SDK load uses the current theme rather than the theme at startup", () => {
  const { settings, api, host } = prepare();
  const tv: Parameters<typeof mountScreenSaverControl>[0] = { ...host, webapis: undefined };
  const dispose = mountScreenSaverControl(tv, settings);
  settings.set({ nordRice: false });
  tv.webapis = host.webapis;
  document.querySelector('script[src*="$WEBAPIS"]')?.dispatchEvent(new Event("load"));
  expect(api.setScreenSaver).not.toHaveBeenCalled();
  settings.set({ nordRice: true });
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(0);
  dispose();
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(1);
});
