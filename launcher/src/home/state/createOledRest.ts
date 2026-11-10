import type { SettingsStore } from "../../contracts/preferences";

export const OLED_DIM_AFTER = 90_000;
export const OLED_BLANK_AFTER = 180_000;

// Own only the launcher's idle presentation; native video and TV panel care stay separate.
export const createOledRest = (document: Document, settings: SettingsStore, canRest: () => boolean) => {
  const host = document.defaultView;
  if (!host) {
    return { refresh: () => undefined, dispose: () => undefined };
  }
  let dimTimer: number | undefined;
  let blankTimer: number | undefined;
  let phase = "awake";
  let wakeKey: number | null = null;
  const eligible = () => settings.getSnapshot().nordRice && !document.hidden && canRest();
  const clearTimers = () => {
    host.clearTimeout(dimTimer);
    host.clearTimeout(blankTimer);
    dimTimer = undefined;
    blankTimer = undefined;
  };
  const publish = (next: string) => {
    phase = next;
    if (document.body.getAttribute("data-oled-idle") !== next) {
      document.body.setAttribute("data-oled-idle", next);
    }
  };
  const refresh = () => {
    clearTimers();
    if (!eligible()) {
      phase = "awake";
      wakeKey = null;
      document.body.removeAttribute("data-oled-idle");
      return;
    }
    publish("awake");
    dimTimer = host.setTimeout(() => {
      if (eligible()) {
        publish("dim");
      } else {
        refresh();
      }
    }, OLED_DIM_AFTER);
    blankTimer = host.setTimeout(() => {
      if (eligible()) {
        publish("blank");
      } else {
        refresh();
      }
    }, OLED_BLANK_AFTER);
  };
  const consume = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const keydown = (event: KeyboardEvent) => {
    if (!settings.getSnapshot().nordRice) {
      return;
    }
    const waking = eligible() && (phase === "blank" || wakeKey === event.keyCode);
    if (waking) {
      wakeKey = event.keyCode;
    }
    refresh();
    if (waking) {
      consume(event);
    }
  };
  const keyup = (event: KeyboardEvent) => {
    if (wakeKey !== null && event.keyCode === wakeKey) {
      wakeKey = null;
      consume(event);
    }
    if (settings.getSnapshot().nordRice) {
      refresh();
    }
  };
  const click = (event: MouseEvent) => {
    if (!settings.getSnapshot().nordRice) {
      return;
    }
    const waking = eligible() && phase === "blank";
    refresh();
    if (waking) {
      consume(event);
    }
  };
  const mousemove = () => {
    if (settings.getSnapshot().nordRice) {
      refresh();
    }
  };
  document.addEventListener("keydown", keydown, true);
  document.addEventListener("keyup", keyup, true);
  document.addEventListener("click", click, true);
  document.addEventListener("mousemove", mousemove, { passive: true });
  document.addEventListener("visibilitychange", refresh);
  host.addEventListener("appcontrol", refresh);
  const unsubscribe = settings.subscribe(refresh);
  refresh();
  return {
    refresh,
    dispose() {
      clearTimers();
      unsubscribe();
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("keyup", keyup, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("visibilitychange", refresh);
      host.removeEventListener("appcontrol", refresh);
      document.body.removeAttribute("data-oled-idle");
    },
  };
};
