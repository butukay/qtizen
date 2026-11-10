import { createRef, render } from "preact";
import { flushSync } from "preact/compat";

import type { SettingsStore } from "../contracts/preferences";
import type { StatusStores } from "../contracts/status";
import type { LauncherUpdateNotice } from "../contracts/updates";
import type { LauncherRuntime } from "../platform/tizen/launcherRuntime";
import { ACCENT_COLOURS } from "../shared/appearance";
import type { Translations } from "../shared/i18n/createTranslations";
import { TranslationContext } from "../shared/i18n/useTranslation";

import { Home } from "./components/Home/Home";
import { createHomeController } from "./state/createHomeController";
import { createHomeInventory } from "./state/createHomeInventory";

export const mountHome = (
  runtime: LauncherRuntime,
  settings: SettingsStore,
  mount: HTMLElement,
  status: StatusStores,
  translations: Translations,
  updates: LauncherUpdateNotice,
) => {
  const document = mount.ownerDocument;
  const previousAccent = document.documentElement.style.getPropertyValue("--focus");
  const previousAccentPriority = document.documentElement.style.getPropertyPriority("--focus");
  // Apply the shell appearance before any Home focus geometry is measured.
  const syncShell = () => {
    const values = settings.getSnapshot();
    const accent = ACCENT_COLOURS.find((accent) => accent.value === values.accentColour) || ACCENT_COLOURS[0];
    document.documentElement.style.setProperty("--focus", accent.colour);
    document.documentElement.setAttribute("data-theme", "default");
    document.documentElement.setAttribute("data-performance-mode", String(values.performanceMode));
  };
  syncShell();
  const unsubscribeShell = settings.subscribe(syncShell);
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
    unsubscribeShell();
    if (previousAccent) {
      document.documentElement.style.setProperty("--focus", previousAccent, previousAccentPriority);
    } else {
      document.documentElement.style.removeProperty("--focus");
    }
    document.documentElement.removeAttribute("data-theme");
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
