import { DEFAULT_CUSTOM_COLOUR } from "../../backgrounds/colours";
import { DEFAULT_CUSTOM_GRADIENT } from "../../backgrounds/gradients";
import type { SettingsDefaults } from "../../contracts/preferences";

export const DEFAULT_SETTINGS: SettingsDefaults = {
  accentColour: "ice",
  appearanceMode: "dark",
  appTransition: "none",
  home: null, // null selects first-launch defaults; [] retains an empty Home.
  performanceMode: false,
  homeCardColumns: 3,
  homeAppLayout: "grid",
  homeWidget: "solar",
  background: "black",
  customColour: DEFAULT_CUSTOM_COLOUR,
  customGradient: DEFAULT_CUSTOM_GRADIENT,
  weatherPhoto: false,
  speed: 1,
  showWeather: false,
  showTime: true,
  showNetwork: false,
  tempUnit: null,
  weatherLocation: null,
  weatherShowLocation: true,
  dateFormat: "short",
  language: "auto",
  numerals: "latn",
  timeFormat: null,
  continueWatching: false,
  continueWatchingApps: [],
  showLiveTv: true,
  hideDisconnectedHdmi: false,
  hdmiNativeViewer: false,
  hdmiKeepVisible: {},
  inputNames: {},
};
