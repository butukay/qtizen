import { afterEach, expect, test, vi } from "vitest";

import { createSettingsService } from "../../services/createSettingsService";

import { createOledRest, OLED_BLANK_AFTER, OLED_DIM_AFTER } from "./createOledRest";

let cleanup = () => undefined;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const prepare = () => {
  vi.useFakeTimers();
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const settings = createSettingsService({
    defaults: { nordRice: true },
    legacyStorageKeys: [],
    locale: { timeFormat: () => "24", tempUnit: () => "C" },
    speedRange: { MIN: 0.25, MAX: 3 },
    storage: { getItem: () => null, setItem: () => undefined },
    storageKey: "oled.test",
  });
  let playing = false;
  const rest = createOledRest(document, settings, () => !playing);
  cleanup = () => {
    rest.dispose();
    settings.dispose();
    return undefined;
  };
  return {
    rest,
    settings,
    hidden,
    setPlaying(value: boolean) {
      playing = value;
      rest.refresh();
    },
  };
};

const key = (type: "keydown" | "keyup", keyCode = 13) => {
  const event = new KeyboardEvent(type, { key: "Enter", keyCode, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
};

test("idle dims and blanks the launcher, then consumes the wake key without launching the selected app", () => {
  prepare();
  vi.advanceTimersByTime(OLED_DIM_AFTER);
  expect(document.body.getAttribute("data-oled-idle")).toBe("dim");
  expect(key("keydown").defaultPrevented).toBe(false);
  key("keyup");
  expect(document.body.getAttribute("data-oled-idle")).toBe("awake");
  vi.advanceTimersByTime(OLED_BLANK_AFTER);
  expect(document.body.getAttribute("data-oled-idle")).toBe("blank");
  expect(key("keydown").defaultPrevented).toBe(true);
  expect(key("keydown").defaultPrevented).toBe(true);
  expect(key("keyup").defaultPrevented).toBe(true);
  expect(document.body.getAttribute("data-oled-idle")).toBe("awake");
  expect(key("keydown").defaultPrevented).toBe(false);
});

test("native playback and a hidden application do not blank or consume playback controls", () => {
  const { setPlaying, hidden } = prepare();
  setPlaying(true);
  vi.advanceTimersByTime(OLED_BLANK_AFTER);
  expect(document.body.hasAttribute("data-oled-idle")).toBe(false);
  expect(key("keydown").defaultPrevented).toBe(false);
  setPlaying(false);
  hidden.mockReturnValue(true);
  document.dispatchEvent(new Event("visibilitychange"));
  expect(vi.getTimerCount()).toBe(0);
  hidden.mockReturnValue(false);
  document.dispatchEvent(new Event("visibilitychange"));
  vi.advanceTimersByTime(OLED_BLANK_AFTER);
  expect(document.body.getAttribute("data-oled-idle")).toBe("blank");
  window.dispatchEvent(new Event("appcontrol"));
  expect(document.body.getAttribute("data-oled-idle")).toBe("awake");
});

test("leaving Nord and disposing remove idle timers and restore ordinary key handling", () => {
  const { rest, settings } = prepare();
  vi.advanceTimersByTime(OLED_BLANK_AFTER);
  settings.update({ nordRice: false });
  expect(vi.getTimerCount()).toBe(0);
  expect(document.body.hasAttribute("data-oled-idle")).toBe(false);
  expect(key("keydown").defaultPrevented).toBe(false);
  settings.update({ nordRice: true });
  rest.dispose();
  vi.advanceTimersByTime(OLED_BLANK_AFTER);
  expect(document.body.hasAttribute("data-oled-idle")).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});
