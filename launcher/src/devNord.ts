// A separate browser-preview profile leaves the normal preview preferences intact.
if (new URLSearchParams(location.search).get("appearance") === "nord" && !("tizen" in window)) {
  const config = window.AeroTizen.config;
  config.STORAGE_KEY += ".nord";
  config.LEGACY_STORAGE_KEYS = [];
  config.DEFAULTS = {
    ...config.DEFAULTS,
    nordRice: true,
    homeCardColumns: 5,
    homeAppLayout: "scroll",
    dateFormat: "long",
    timeFormat: "24",
  };
}
