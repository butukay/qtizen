import { afterEach, expect, test, vi } from "vitest";

import { createTransitionPlatform } from "./createTransitionPlatform";
import { wakeHdmiSource } from "./wakeHdmiSource";

const harness = () => {
  vi.useFakeTimers();
  const values = new Map<string, string>();
  const file = (name: string) => ({
    get fileSize() {
      return values.get(name)?.length ?? 0;
    },
    fullPath: name ? "wgt-private/" + name : "wgt-private",
    resolve: (child: string) => file(child),
    createFile: (child: string) => file(child),
    moveTo: (from: string, to: string, _: boolean, done: () => void) => {
      values.set(to.slice(12), values.get(from.slice(12)) ?? "");
      done();
    },
    openStream: (_: string, done: (stream: { close(): void; read(): string; write(value: string): void }) => void) =>
      done({ close: () => {}, read: () => values.get(name) ?? "", write: (value) => values.set(name, value) }),
  });
  const tizen = {
    filesystem: {
      resolve: (path: string, done: (value: ReturnType<typeof file>) => void) => done(file(path.slice(12))),
    },
  };
  const status = (extra: Record<string, unknown> = {}) =>
    values.set(
      "hdmi-wake-status.json",
      JSON.stringify({ schema_version: 1, ready: true, updated_at: Date.now(), ...extra }),
    );
  return { values, tizen, status };
};
afterEach(() => vi.useRealTimers());

test("wake waits for the matching source reply and ignores another request or port", async () => {
  const h = harness();
  h.status();
  const done = vi.fn();
  wakeHdmiSource(h.tizen, window, 1, done);
  await vi.advanceTimersByTimeAsync(0);
  const request = JSON.parse(h.values.get("hdmi-wake-request.json") ?? "null") as { request_id: string; port: number };
  expect(request.port).toBe(1);
  h.status({ request_id: "another", port: 1 });
  await vi.advanceTimersByTimeAsync(150);
  h.status({ request_id: request.request_id, port: 2 });
  await vi.advanceTimersByTimeAsync(150);
  expect(done).not.toHaveBeenCalled();
  h.status({ request_id: request.request_id, port: 1, accepted: true });
  await vi.advanceTimersByTimeAsync(150);
  expect(done).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

test("an unavailable or stale root service falls back without leaving a delayed wake request", async () => {
  const h = harness();
  h.status({ updated_at: Date.now() - 6000 });
  const done = vi.fn();
  wakeHdmiSource(h.tizen, window, 1, done);
  await vi.advanceTimersByTimeAsync(0);
  expect(done).toHaveBeenCalledOnce();
  expect(h.values.has("hdmi-wake-request.json")).toBe(false);
});

test("cancelling before storage resolves prevents a write and a later handoff", async () => {
  const h = harness();
  h.status();
  const done = vi.fn();
  const cancel = wakeHdmiSource(h.tizen, window, 1, done);
  cancel();
  await vi.advanceTimersByTimeAsync(5000);
  expect(done).not.toHaveBeenCalled();
  expect(h.values.has("hdmi-wake-request.json")).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

test("a missing acknowledgement times out once and does not block source selection", async () => {
  const h = harness();
  h.status();
  const done = vi.fn();
  wakeHdmiSource(h.tizen, window, 1, done);
  await vi.advanceTimersByTimeAsync(5000);
  expect(done).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

test("the shared private storage preserves transition writes and status reads", async () => {
  const h = harness();
  const platform = createTransitionPlatform(h.tizen, window);
  await platform.write("fade");
  expect(JSON.parse(h.values.get("window-transitions.json") ?? "null")).toEqual({ schema_version: 1, mode: "fade" });
  h.values.set("window-transitions-status.json", '{"ready":true,"mode":"fade"}');
  expect(await platform.read()).toEqual({ ready: true, mode: "fade" });
  platform.dispose();
  expect(vi.getTimerCount()).toBe(0);
});
