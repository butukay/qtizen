import type { InstalledApp } from "../../../contracts/launcher";
import type { SettingsSnapshot } from "../../../contracts/preferences";
import { useStoreSelector } from "../../../shared/hooks/useStore";
import type { HomeEnvironment } from "../../types";
import { AppCard } from "../AppCard";
import { HorizontalScroller } from "../HorizontalScroller/HorizontalScroller";

import styles from "./AppGrid.module.css";

export const AppGrid = ({
  env,
  ids,
  apps,
  settings,
  active,
  label,
}: {
  env: HomeEnvironment;
  ids: readonly string[];
  apps: readonly InstalledApp[];
  settings: SettingsSnapshot;
  active: boolean;
  label: string;
}) => {
  const appOffset = useStoreSelector(env.state, (state) => state.appOffset);
  const scroll = settings.homeAppLayout === "scroll";
  return (
    <HorizontalScroller
      id="grid"
      label={label}
      enabled={scroll}
      visible
      trackClass={styles.grid}
      trackData={{ "data-app-grid": "", "data-columns": env.columns(settings), "data-scroll": String(scroll) }}
      trackRef={env.appItems}
      viewportRef={env.appViewport}
      offset={appOffset}
      onOffsetChange={(offset) => env.state.set({ ...env.state.getSnapshot(), appOffset: offset })}
    >
      {ids.map((id) => {
        const app = apps.find((app) => app.id === id) || { id, name: id, icon: "" };
        return <AppCard key={id} env={env} app={app} active={active} />;
      })}
    </HorizontalScroller>
  );
};
