import { focusControl } from "../../shared/navigation/focusControl";
import { createStore } from "../../shared/state/createStore";
import type { HomeEnvironment, HomeMenuChoice, HomeState } from "../types";

import { revealHorizontalItem } from "./horizontalScroll";

const HEADER_KEYS = ["gear"] as const;
// Keep focused content below the 96px header with 16px of clearance.
const TOP_SCROLL_CLEARANCE = 112;
const BOTTOM_SCROLL_CLEARANCE = 96;
const HOME_MENU_CHOICES = [
  { action: "move", label: "home.move" },
  { action: "remove", label: "home.removeFromHome" },
] as const;

type Rows = readonly (readonly string[])[];

const getSelectedKey = (rows: Rows, selected: string, started: boolean) => {
  const first = rows[1]?.[0];
  if (!started && first) {
    return first;
  }
  if (rows.some((row) => row.includes(selected))) {
    return selected;
  }
  return first || "gear";
};

const getScrollOffset = ({
  selected,
  rows,
  previous,
  top,
  bottom,
  origin,
  limit,
}: {
  selected: string;
  rows: Rows;
  previous: number;
  top: number;
  bottom: number;
  origin: number;
  limit: number;
}) => {
  if (rows[0].includes(selected) || rows[1]?.includes(selected)) {
    return 0;
  }
  if (bottom - previous > limit) {
    return bottom - limit;
  }
  if (top - previous < origin + TOP_SCROLL_CLEARANCE) {
    return Math.max(0, top - origin - TOP_SCROLL_CLEARANCE);
  }
  return previous;
};

const moveItem = (items: readonly string[], from: number, to: number, item: string) => {
  const remaining = items.filter((_, index) => index !== from);
  return [...remaining.slice(0, to), item, ...remaining.slice(to)];
};

const getVerticalColumn = ({
  rows,
  row,
  target,
  selected,
  nodes,
  getViewport,
}: {
  rows: Rows;
  row: number;
  target: number;
  selected: string;
  nodes: ReadonlyMap<string, HTMLElement>;
  getViewport(key: string): HTMLElement | null;
}) => {
  if (target === 0) {
    return 0;
  }
  if (row === 0) {
    return 0;
  }
  const column = rows[row].indexOf(selected);
  if (!getViewport(selected) && !getViewport(rows[target][0])) {
    return column;
  }
  const from = nodes.get(selected)?.getBoundingClientRect();
  if (!from) {
    return column;
  }
  const bounds = getViewport(rows[target][0])?.getBoundingClientRect();
  const nearest = rows[target].reduce(
    (nearest, key, column) => {
      const rect = nodes.get(key)?.getBoundingClientRect();
      if (!rect || (bounds && (rect.right <= bounds.left || rect.left >= bounds.right))) {
        return nearest;
      }
      const distance = Math.abs(rect.left + rect.right - from.left - from.right);
      return distance < nearest.distance ? { column, distance } : nearest;
    },
    { column, distance: Infinity },
  );
  return nearest.column;
};

// Remote transactions publish state synchronously; Preact owns every rendered node.
// No app/service commands are reimplemented here.
export const createHomeController = (
  env: Omit<HomeEnvironment, "bridge" | "state" | "select" | "activate" | "choose" | "dismiss" | "menuChoices">,
  transaction: (action: () => void) => void,
) => {
  const { runtime, settings, inventory, nodes } = env;
  const state = createStore<HomeState>({
    scroll: 0,
    continueOffset: 0,
    selected: "",
    active: true,
    appOffset: 0,
    moving: null,
    draft: null,
    menu: null,
  });
  let timer: number | undefined;
  let enterDown = false;
  let started = false;
  let contentSelection = "";
  const cancelPress = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    timer = undefined;
    enterDown = false;
  };
  const update = (patch: Partial<HomeState>) =>
    transaction(() => {
      const before = state.getSnapshot();
      if (Object.keys(patch).some((key) => before[key as keyof HomeState] !== patch[key as keyof HomeState])) {
        state.set({ ...before, ...patch });
      }
    });
  const homeIds = () => {
    const saved = state.getSnapshot().draft || settings.getSnapshot().home;
    // Movement must address the same visible IDs as the grid, not stale saved apps.
    return saved.filter((id) => !inventory.getSnapshot().ready || runtime.apps.byId(id));
  };
  const scrollApps = () => settings.getSnapshot().homeAppLayout === "scroll";
  const getScroller = (key: string) => {
    if (key.startsWith("continue:")) {
      return {
        track: env.continueItems.current,
        viewport: env.continueViewport.current,
        offset: "continueOffset",
      } as const;
    }
    if (key.startsWith("app:") && scrollApps()) {
      return { track: env.appItems.current, viewport: env.appViewport.current, offset: "appOffset" } as const;
    }
    return null;
  };
  const sourceKey = (source: { type: string; number?: number }) => "input:" + source.type + ":" + source.number;
  const rows = (): readonly (readonly string[])[] => {
    const columns = env.columns(settings.getSnapshot());
    const all = homeIds();
    const rowLength = scrollApps() ? Math.max(1, all.length) : columns;
    const appRows = Array.from({ length: Math.ceil(all.length / rowLength) }, (_, index) =>
      all.slice(index * rowLength, (index + 1) * rowLength).map((id) => "app:" + id),
    );
    const appLayout = [HEADER_KEYS, ...appRows];
    const { items, inputs } = inventory.getSnapshot();
    const continueRows =
      settings.getSnapshot().continueWatching && items.length ? [items.map((item) => "continue:" + item.key)] : [];
    const inputRows = inputs.length ? [inputs.map(sourceKey)] : [];
    return [...appLayout, ...continueRows, ...inputRows];
  };
  const focus = () => {
    if (document.hidden || runtime.settingsUi?.isOpen()) {
      update({ active: false });
      return;
    }
    const pending = state.getSnapshot();
    if (pending.moving && !homeIds().includes(pending.moving)) {
      update({ moving: null, draft: null });
      runtime.hideToast();
      cancelPress();
    }
    if (pending.menu && !homeIds().includes(pending.menu.id)) {
      update({ menu: null });
      cancelPress();
    }
    const list = rows();
    const old = state.getSnapshot().selected;
    const selected = getSelectedKey(list, old, started);
    if (settings.getSnapshot().homeInitialized && list[1]?.length) {
      started = true;
    }
    if (old !== selected) {
      cancelPress();
    }
    if (selected !== "gear") {
      contentSelection = selected;
    }
    update({ selected, active: true });
    const node = nodes.get(selected);
    const main = env.rows.current;
    if (!node || !main || runtime.settingsUi?.isOpen()) {
      return;
    }
    focusControl(node);
    const scroller = getScroller(selected);
    if (scroller?.track && scroller.viewport) {
      const offset = revealHorizontalItem(
        scroller.track,
        node,
        state.getSnapshot()[scroller.offset],
        document.documentElement.dir === "rtl",
      );
      update({ [scroller.offset]: offset });
    }
    // Home's header and first row always use the top position. Avoid style/layout reads for each horizontal move.
    if (list[0].includes(selected) || list[1]?.includes(selected)) {
      update({ scroll: 0 });
      return;
    }
    const mainTop = main.getBoundingClientRect().top;
    const rect = node.getBoundingClientRect();
    const viewportBounds = main.parentElement?.getBoundingClientRect();
    const origin = viewportBounds?.top || 0;
    const scroll = getScrollOffset({
      selected,
      rows: list,
      previous: pending.scroll,
      top: rect.top - mainTop + origin,
      bottom: rect.bottom - mainTop + origin,
      origin,
      limit: (viewportBounds?.bottom || document.documentElement.clientHeight) - BOTTOM_SCROLL_CLEARANCE,
    });
    update({ scroll });
  };
  const select = (selected: string) => {
    started = true;
    if (state.getSnapshot().selected !== selected) {
      cancelPress();
    }
    update({ selected });
    focus();
  };
  const endMove = () => {
    const draft = state.getSnapshot().draft;
    if (draft) {
      settings.update({ home: [...homeIds()] });
    }
    update({ moving: null, draft: null });
    runtime.hideToast();
  };
  const dismiss = () => {
    update({ menu: null });
    focus();
  };
  const activate = (key: string) => {
    if (key === "gear") {
      endMove();
      // Return to the last content item so Settings does not leave its shortcut visible.
      update({ selected: getSelectedKey(rows(), contentSelection, true) });
      runtime.settingsUi?.open();
    } else if (key.startsWith("app:")) {
      const id = key.slice(4);
      const app = runtime.apps.byId(id);
      if (app) {
        runtime.apps.launch(app);
      }
    } else if (key.startsWith("continue:")) {
      // Use the current service record; stale cards must not launch.
      const item = runtime.continueWatching.getSnapshot().items.find((item) => item.key === key.slice(9));
      if (item) {
        runtime.continueWatching.open(item);
      }
    } else {
      const source = inventory.getSnapshot().inputs.find((source) => sourceKey(source) === key);
      if (source) {
        runtime.inputs.show(source);
      }
    }
  };
  const menuChoices = (): readonly HomeMenuChoice[] => HOME_MENU_CHOICES;
  const choose = (index: number) => {
    const menu = state.getSnapshot().menu;
    const choice = menuChoices()[index];
    if (!menu || !choice) {
      return;
    }
    update({ menu: null });
    if (choice.action === "move") {
      update({ moving: menu.id, draft: [...homeIds()] });
      env.showMoveInstructions();
      return;
    }
    const before = homeIds();
    const at = before.indexOf(menu.id);
    const home = [...homeIds()];
    settings.update({
      home: home.filter((id) => id !== menu.id),
    });
    const after = homeIds();
    const nextApp = after[Math.min(Math.max(at, 0), after.length - 1)];
    const firstInput = inventory.getSnapshot().inputs[0];
    const fallback = firstInput ? sourceKey(firstInput) : "gear";
    update({ selected: nextApp ? "app:" + nextApp : fallback });
    focus();
  };
  const K = runtime.config.KEY;
  const keydown = (code: number, event: Pick<KeyboardEvent, "preventDefault">) =>
    transaction(() => {
      const current = state.getSnapshot();
      // Rows run right to left in RTL languages, so Left moves to the next item there.
      const rtl = window.document?.documentElement.dir === "rtl";
      const delta = code === K.UP || (code === K.LEFT && !rtl) || (code === K.RIGHT && rtl) ? -1 : 1;
      if (![K.LEFT, K.RIGHT, K.UP, K.DOWN, K.BACK, K.ESC, K.ENTER].includes(code)) {
        return;
      }
      event.preventDefault();
      started = true;
      if (current.menu) {
        if (code === K.BACK || code === K.ESC) {
          dismiss();
        } else if (code === K.ENTER) {
          if (!enterDown) {
            enterDown = true;
            choose(current.menu.selected);
          }
        } else {
          update({
            menu: {
              ...current.menu,
              selected: Math.max(0, Math.min(menuChoices().length - 1, current.menu.selected + delta)),
            },
          });
        }
        return;
      }
      if (current.moving) {
        if (code === K.ENTER || code === K.BACK || code === K.ESC) {
          if (code !== K.ENTER || !enterDown) {
            enterDown = code === K.ENTER;
            endMove();
          }
          return;
        }
        if (scrollApps() && (code === K.UP || code === K.DOWN)) {
          return;
        }
        const home = [...homeIds()];
        const from = home.indexOf(current.moving);
        const step = code === K.UP || code === K.DOWN ? env.columns(settings.getSnapshot()) : 1;
        const to = Math.max(0, Math.min(home.length - 1, from + delta * step));
        update({ draft: moveItem(home, from, to, current.moving) });
        focus();
        return;
      }
      if (code === K.ENTER) {
        if (enterDown) {
          return;
        }
        enterDown = true;
        const selected = current.selected;
        timer = window.setTimeout(() => {
          timer = undefined;
          if (enterDown && selected.startsWith("app:")) {
            update({ menu: { id: selected.slice(4), selected: 0 } });
          }
        }, runtime.config.LONG_PRESS_MS);
        return;
      }
      if (code === K.BACK || code === K.ESC) {
        return;
      }
      const all = rows();
      const row = all.findIndex((items) => items.includes(current.selected));
      if (row < 0) {
        focus();
        return;
      }
      const horizontal = code === K.LEFT || code === K.RIGHT;
      const target = horizontal ? row : row + delta;
      if (target < 0 || target >= all.length) {
        return;
      }
      const column = horizontal
        ? all[row].indexOf(current.selected) + delta
        : getVerticalColumn({
            rows: all,
            row,
            target,
            selected: current.selected,
            nodes,
            getViewport: (key) => getScroller(key)?.viewport || null,
          });
      select(all[target][Math.max(0, Math.min(all[target].length - 1, column))]);
    });
  const keyup = (code: number) => {
    if (code !== K.ENTER) {
      return;
    }
    enterDown = false;
    if (timer === undefined) {
      return;
    }
    window.clearTimeout(timer);
    timer = undefined;
    if (!state.getSnapshot().menu && !state.getSnapshot().moving) {
      activate(state.getSnapshot().selected);
    }
  };
  const bridge = {
    render: focus,
    buildRows: focus,
    refreshApps: focus,
    focus,
    blur() {
      cancelPress();
      update({ active: false, menu: null });
    },
    keydown,
    keyup,
  };
  return { ...env, state, bridge, select, activate, choose, dismiss, menuChoices };
};
