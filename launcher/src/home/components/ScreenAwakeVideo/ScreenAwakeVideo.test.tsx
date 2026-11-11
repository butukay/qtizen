import { act, render } from "@testing-library/preact";
import { afterEach, expect, test, vi } from "vitest";

import type { InputsSnapshot } from "../../../contracts/inputs";
import { createStore } from "../../../shared/state/createStore";

import { ScreenAwakeVideo } from "./ScreenAwakeVideo";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("the local loop plays only while the launcher is visible and no embedded input is using video", async () => {
  const visibility = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  const idle: InputsSnapshot = { playback: "idle", sources: [], visibleSources: [] };
  const inputs = createStore<InputsSnapshot>(idle);
  const view = render(<ScreenAwakeVideo inputs={inputs} />);
  expect(play).toHaveBeenCalledTimes(1);

  const changeVisibility = (hidden: boolean) => {
    visibility.mockReturnValue(hidden);
    document.dispatchEvent(new Event("visibilitychange"));
  };
  changeVisibility(true);
  expect(pause).toHaveBeenCalled();
  changeVisibility(false);
  expect(play).toHaveBeenCalledTimes(2);

  await act(() => inputs.set({ ...idle, playback: "opening" }));
  changeVisibility(false);
  expect(play).toHaveBeenCalledTimes(2);
  await act(() => inputs.set(idle));
  expect(play).toHaveBeenCalledTimes(3);

  pause.mockClear();
  view.unmount();
  expect(pause).toHaveBeenCalledTimes(1);
  changeVisibility(false);
  expect(play).toHaveBeenCalledTimes(3);
});

test("a temporary decoder failure is retried once", async () => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockRejectedValue(new Error("Decoder busy"));
  const inputs = createStore<InputsSnapshot>({ playback: "idle", sources: [], visibleSources: [] });
  const view = render(<ScreenAwakeVideo inputs={inputs} />);
  expect(play).toHaveBeenCalledTimes(1);

  await vi.advanceTimersByTimeAsync(1000);
  expect(play).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(5000);
  expect(play).toHaveBeenCalledTimes(2);
  view.unmount();
});
