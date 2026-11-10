import { createRef, render } from "preact";
import { flushSync } from "preact/compat";

import type { SettingsStore } from "../contracts/preferences";
import type { StatusStores } from "../contracts/status";
import type { LauncherUpdateNotice } from "../contracts/updates";
import type { LauncherRuntime } from "../platform/tizen/launcherRuntime";
import type { Translations } from "../shared/i18n/createTranslations";
import { TranslationContext } from "../shared/i18n/useTranslation";

import { Home } from "./components/Home/Home";
import { createHomeController } from "./state/createHomeController";
import { createHomeInventory } from "./state/createHomeInventory";
import { createOledRest } from "./state/createOledRest";

export const mountHome = (
  runtime: LauncherRuntime,
  settings: SettingsStore,
  mount: HTMLElement,
  status: StatusStores,
  translations: Translations,
  updates: LauncherUpdateNotice,
) => {
  const document = mount.ownerDocument;
  // Apply the shell appearance before any Home focus geometry is measured.
  const syncShell = () => {
    const values = settings.getSnapshot();
    document.body.classList.toggle("glass-ui", values.glassSettings && !values.nordRice);
    document.body.classList.toggle("nord-ui", values.nordRice);
    document.documentElement.setAttribute("data-performance-mode", String(values.performanceMode));
  };
  syncShell();
  const unsubscribeShell = settings.subscribe(syncShell);
  const oledRest = createOledRest(
    document,
    settings,
    () => runtime.inputs.getSnapshot().playback === "idle" && !document.defaultView?.Fireplace?.isOpen(),
  );
  let oledPlayback = runtime.inputs.getSnapshot().playback;
  const unsubscribeOledInputs = runtime.inputs.subscribe(() => {
    const playback = runtime.inputs.getSnapshot().playback;
    if (playback !== oledPlayback) {
      oledPlayback = playback;
      oledRest.refresh();
    }
  });
  const inventory = createHomeInventory(runtime, settings, flushSync);
  const rows = createRef<HTMLElement>();
  const environment = createHomeController(
    {
      runtime,
      settings,
      inventory,
      status,
      updates,
      rows,
      appItems: createRef<HTMLDivElement>(),
      appViewport: createRef<HTMLDivElement>(),
      continueItems: createRef<HTMLDivElement>(),
      continueViewport: createRef<HTMLDivElement>(),
      nodes: new Map(),
      showMoveInstructions: () => runtime.toast(translations.getSnapshot().t("home.moveInstructions")),
      describe: (app) => runtime.tiles.describe(app),
      columns: (values) => values.homeCardColumns,
    },
    flushSync,
  );
  const refresh = () => {
    inventory.refresh();
    environment.bridge.focus();
  };
  const bridge = { ...environment.bridge, render: refresh, buildRows: refresh, refreshApps: refresh };
  const dispose = () => {
    environment.bridge.blur();
    render(null, mount);
    inventory.dispose();
    oledRest.dispose();
    unsubscribeOledInputs();
    unsubscribeShell();
    document.body.classList.remove("glass-ui");
    document.body.classList.remove("nord-ui");
    document.documentElement.removeAttribute("data-performance-mode");
  };
  try {
    render(
      <TranslationContext.Provider value={translations}>
        <Home env={environment} />
      </TranslationContext.Provider>,
      mount,
    );
    return { bridge, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
};
