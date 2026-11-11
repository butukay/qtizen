import type { AppHandoff, AppsService } from "../../contracts/apps";
import type { BackgroundBridge, BackgroundPreview } from "../../contracts/backgrounds";
import type { ContinueWatchingProvider, ContinueWatchingService } from "../../contracts/continueWatching";
import type { InputsService } from "../../contracts/inputs";
import type {
  AppPresentation,
  ClockService,
  HomeBridge,
  InstalledApp,
  LauncherConfig,
  SettingsBridge,
} from "../../contracts/launcher";
import type { SettingsService } from "../../contracts/preferences";
import type { NetworkService, WeatherService } from "../../contracts/status";
import type { TransitionStatus } from "../../contracts/transitions";
import type { Translate } from "../../shared/i18n/createTranslations";
import type { Store } from "../../shared/state/createStore";

import type { AppsTizen } from "./createAppsPlatform";
import type { InputsTizen } from "./createInputsPlatform";
import type { TransitionTizen } from "./createTransitionPlatform";

// The unmigrated TV services are accessed through this boundary, not a screen's types.
export interface LauncherRuntime {
  applyBackground(): void;
  apps: AppsService;
  catalog: { preloadedStoreId(id: string): string | null };
  clock: ClockService;
  config: LauncherConfig;
  continueWatching: ContinueWatchingService;
  continueWatchingProviders?: readonly ContinueWatchingProvider[];
  hideToast(): void;
  homeScreen?: HomeBridge;
  homewatch: AppHandoff & {
    useSamsungHome(): void;
    openSamsungHome?(): void;
    openNativeViewer?(source: unknown, hdmi: { label: string; fallback(): void } | null): boolean;
  };
  inputs: InputsService;
  network: NetworkService;
  settings: SettingsService;
  settingsUi?: SettingsBridge;
  tiles: { describe(app: InstalledApp): AppPresentation; shortName(name: string): string };
  tizen?: (AppsTizen & InputsTizen & TransitionTizen) | null;
  toast(message: string): void;
  transitions?: Store<TransitionStatus>;
  translate: Translate;
  weather: WeatherService;
}

export interface LauncherPlatform {
  backgrounds: BackgroundBridge;
  previewBackground(preview: BackgroundPreview | null): void;
}

declare global {
  interface Window {
    Backgrounds: LauncherPlatform["backgrounds"];
    Qtizen: LauncherRuntime;
  }
}
