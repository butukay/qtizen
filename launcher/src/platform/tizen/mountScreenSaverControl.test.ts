import { afterEach, expect, test, vi } from "vitest";

import { mountScreenSaverControl } from "./mountScreenSaverControl";

const prepare = () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const api = {
    AppCommonScreenSaverState: { SCREEN_SAVER_OFF: 0, SCREEN_SAVER_ON: 1 },
    setScreenSaver: vi.fn((_state: number, done: () => void, _failed: () => void) => done()),
  };
  const host = {
    document,
    location: { protocol: "file:" },
    AeroTizen: { tizen: {} as unknown },
    webapis: { appcommon: api },
    addEventListener: window.addEventListener.bind(window),
    removeEventListener: window.removeEventListener.bind(window),
  };
  return { hidden, api, host };
};
afterEach(() => vi.restoreAllMocks());

test("the visible launcher suppresses the saver and releases its request on hide and teardown", () => {
  const { hidden, api, host } = prepare();
  const dispose = mountScreenSaverControl(host);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(api.setScreenSaver).toHaveBeenCalledTimes(1);
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("appcontrol"));
  document.dispatchEvent(new Event("playing"));
  dispose();
  expect(api.setScreenSaver.mock.calls.map(([state]) => state)).toEqual([0, 1, 0, 0, 0, 1]);
  dispose();
  window.dispatchEvent(new Event("appcontrol"));
  document.dispatchEvent(new Event("playing"));
  expect(api.setScreenSaver).toHaveBeenCalledTimes(6);
});

test("unsupported firmware can reject requests without interrupting the launcher or retrying in a loop", () => {
  const { api, host } = prepare();
  api.setScreenSaver.mockImplementationOnce(() => {
    throw new Error("NotSupportedError");
  });
  const dispose = mountScreenSaverControl(host);
  expect(api.setScreenSaver).toHaveBeenCalledTimes(1);
  api.setScreenSaver.mockImplementationOnce((_state, _done, failed) => failed());
  window.dispatchEvent(new Event("appcontrol"));
  expect(api.setScreenSaver).toHaveBeenCalledTimes(2);
  dispose();
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(1);
});

test("the TV SDK loads only on Tizen and cannot make a late request after disposal", () => {
  const { host } = prepare();
  const absent = { ...host, webapis: undefined };
  const browserDispose = mountScreenSaverControl({ ...absent, AeroTizen: { tizen: null } });
  expect(document.querySelector('script[src*="$WEBAPIS"]')).toBeNull();
  browserDispose();
  const dispose = mountScreenSaverControl(absent);
  const script = document.querySelector<HTMLScriptElement>('script[src*="$WEBAPIS"]');
  expect(script).not.toBeNull();
  dispose();
  script?.dispatchEvent(new Event("load"));
  expect(document.querySelector('script[src*="$WEBAPIS"]')).toBeNull();
});

test("a delayed SDK load does not suppress the saver while the launcher is hidden", () => {
  const { hidden, api, host } = prepare();
  const tv: Parameters<typeof mountScreenSaverControl>[0] = { ...host, webapis: undefined };
  const dispose = mountScreenSaverControl(tv);
  hidden.mockReturnValue(true);
  tv.webapis = host.webapis;
  document.querySelector('script[src*="$WEBAPIS"]')?.dispatchEvent(new Event("load"));
  expect(api.setScreenSaver).not.toHaveBeenCalled();
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(0);
  dispose();
  expect(api.setScreenSaver.mock.lastCall?.[0]).toBe(1);
});
