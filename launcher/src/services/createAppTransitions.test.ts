import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { AppTransition } from "../contracts/preferences";
import type { TransitionPlatform } from "../contracts/transitions";

import { createAppTransitions } from "./createAppTransitions";
import { createSettingsService } from "./createSettingsService";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const preferences = () =>
  createSettingsService({
    storage: { getItem: () => null, setItem: () => undefined },
    storageKey: "test",
    legacyStorageKeys: [],
    speedRange: { MIN: 0.25, MAX: 3 },
    locale: { timeFormat: () => "24", tempUnit: () => "C" },
  });
const fresh = (mode: AppTransition) => ({ schema_version: 1, ready: true, mode, updated_at: Date.now() });
const settle = async () => {
  for (let i = 0; i < 8; i++) {
    await Promise.resolve();
  }
};

test("sends the saved mode and reports success only after a fresh matching acknowledgement", async () => {
  const settings = preferences();
  settings.update({ appTransition: "fade" });
  const platform: TransitionPlatform = {
    preview: false,
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(() => Promise.resolve(fresh("none"))),
    dispose: vi.fn(),
  };
  const service = createAppTransitions({ settings, platform, timers: window, now: () => Date.now() });
  await settle();
  expect(platform.write).toHaveBeenCalledWith("fade");
  expect(service.getSnapshot().phase).toBe("unavailable");
  vi.mocked(platform.read).mockResolvedValue(fresh("fade"));
  await vi.advanceTimersByTimeAsync(1500);
  expect(service.getSnapshot()).toEqual({ phase: "ready", mode: "fade" });
  service.dispose();
  settings.dispose();
});

test("rapid changes never publish an older choice as applied and send the latest after an in-flight write", async () => {
  const settings = preferences();
  let release: () => void = () => undefined;
  const writes: AppTransition[] = [];
  const platform: TransitionPlatform = {
    preview: false,
    write: async (mode) => {
      writes.push(mode);
      if (writes.length === 1) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
    },
    read: () => Promise.resolve(fresh(writes[writes.length - 1])),
    dispose: vi.fn(),
  };
  const service = createAppTransitions({ settings, platform, timers: window, now: () => Date.now() });
  settings.update({ appTransition: "fade" });
  settings.update({ appTransition: "standard" });
  release();
  await settle();
  expect(service.getSnapshot().phase).not.toBe("ready");
  await vi.advanceTimersByTimeAsync(50);
  expect(writes).toEqual(["none", "standard"]);
  expect(service.getSnapshot()).toEqual({ phase: "ready", mode: "standard" });
  service.dispose();
  settings.dispose();
});

test("a dead helper's saved status is unavailable and missing files retry without a tight loop", async () => {
  const settings = preferences();
  const platform: TransitionPlatform = {
    preview: false,
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(() => Promise.resolve({ ...fresh("none"), updated_at: Date.now() - 10000 })),
    dispose: vi.fn(),
  };
  const service = createAppTransitions({ settings, platform, timers: window, now: () => Date.now() });
  await settle();
  expect(service.getSnapshot().phase).toBe("unavailable");
  vi.mocked(platform.write).mockRejectedValue(new Error("Storage unavailable"));
  settings.update({ appTransition: "fade" });
  await settle();
  const calls = vi.mocked(platform.write).mock.calls.length;
  await vi.advanceTimersByTimeAsync(1400);
  expect(platform.write).toHaveBeenCalledTimes(calls);
  await vi.advanceTimersByTimeAsync(100);
  expect(platform.write).toHaveBeenCalledTimes(calls + 1);
  service.dispose();
  settings.dispose();
});

test("disposal ignores late acknowledgements and stops polling", async () => {
  const settings = preferences();
  let resolve: (value: unknown) => void = () => undefined;
  const platform: TransitionPlatform = {
    preview: false,
    write: vi.fn(() => Promise.resolve()),
    read: vi.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    ),
    dispose: vi.fn(),
  };
  const service = createAppTransitions({ settings, platform, timers: window, now: () => Date.now() });
  await settle();
  service.dispose();
  resolve(fresh("none"));
  await settle();
  await vi.advanceTimersByTimeAsync(10000);
  expect(platform.read).toHaveBeenCalledTimes(1);
  expect(platform.dispose).toHaveBeenCalledOnce();
  expect(service.getSnapshot().phase).toBe("applying");
  settings.dispose();
});
