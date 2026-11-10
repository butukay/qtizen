import { vi } from "vitest";

import type { AppPresentation, InstalledApp } from "../../contracts/launcher";
import { createSettingsService } from "../../services/createSettingsService";
import { createStore } from "../../shared/state/createStore";
import type { HomeEnvironment, HomeState } from "../types";

export const createCardEnvironment = (selected = "", presentation: Partial<AppPresentation> = {}) => {
  const state = createStore<HomeState>({
    active: true,
    appOffset: 0,
    continueOffset: 0,
    draft: null,
    menu: null,
    moving: null,
    scroll: 0,
    selected,
  });
  const runtime: Pick<HomeEnvironment["runtime"], "inputs"> = {
    inputs: {
      getSnapshot: () => ({ sources: [], visibleSources: [], playback: "idle" }),
      alwaysVisible: () => false,
      hasRecognizedDevice: () => false,
      isVisible: () => true,
      label: (source, defaultLabel) => source.editName ?? defaultLabel ?? runtime.inputs.portName(source),
      portName: (source) => `${source.type} ${source.number}`,
      dispose: () => undefined,
      leave: () => undefined,
      load: () => undefined,
      start: () => undefined,
      show: () => undefined,
      subscribe: () => () => undefined,
    },
  };
  // Isolated cards use only these Home controller fields.
  const environment: Pick<
    HomeEnvironment,
    "settings" | "state" | "nodes" | "activate" | "select" | "runtime" | "describe"
  > = {
    settings: createSettingsService({
      legacyStorageKeys: [],
      locale: { timeFormat: () => "24", tempUnit: () => "C" },
      speedRange: { MIN: 0.25, MAX: 3 },
      storage: { getItem: () => null, setItem: () => undefined },
      storageKey: "aerotizen.card.test",
    }),
    state,
    nodes: new Map<string, HTMLElement>(),
    activate: vi.fn(),
    select: vi.fn(),
    runtime: runtime as HomeEnvironment["runtime"],
    describe: (app: InstalledApp): AppPresentation => ({
      artwork: [],
      background: "black",
      label: app.name,
      largeLogo: false,
      logoColour: "white",
      logoPath: null,
      textColour: "white",
      title: app.name,
      useAppIcon: true,
      ...presentation,
    }),
  };
  return environment as HomeEnvironment;
};
