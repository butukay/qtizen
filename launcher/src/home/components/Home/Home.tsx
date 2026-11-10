import { useLayoutEffect } from "preact/hooks";

import { useStore, useStoreSelector } from "../../../shared/hooks/useStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import type { HomeEnvironment } from "../../types";
import { AppActionsMenu } from "../AppActionsMenu/AppActionsMenu";
import { AppGrid } from "../AppGrid/AppGrid";
import { ContinueWatchingRow } from "../ContinueWatchingRow/ContinueWatchingRow";
import { HomeHeader } from "../HomeHeader/HomeHeader";
import { HomeOverview } from "../HomeOverview/HomeOverview";
import { HomeSectionHeading } from "../HomeSectionHeading/HomeSectionHeading";
import { InputDock } from "../InputDock/InputDock";

import styles from "./Home.module.css";

export const Home = ({ env }: { env: HomeEnvironment }) => {
  const { t } = useTranslation();
  const settings = useStore(env.settings);
  const active = useStoreSelector(env.state, (state) => state.active);
  const draft = useStoreSelector(env.state, (state) => state.draft);
  const scroll = useStoreSelector(env.state, (state) => state.scroll);
  const { apps, inputs, items, ready } = useStore(env.inventory);
  const home = draft || (settings.homeInitialized ? settings.home : [env.runtime.config.FIREPLACE_ID]);
  const visibleHome = home.filter(
    (id) => id === env.runtime.config.FIREPLACE_ID || !ready || apps.some((app) => app.id === id),
  );
  const showContinueWatching = settings.continueWatching && items.length > 0;
  const dockInputs =
    inputs.length > 0 &&
    !showContinueWatching &&
    (settings.homeAppLayout === "scroll" || visibleHome.length <= env.columns(settings));
  useLayoutEffect(
    () => env.bridge.focus(),
    [
      env,
      apps,
      inputs,
      items,
      ready,
      settings.home,
      settings.homeInitialized,
      draft,
      settings.homeCardColumns,
      settings.homeAppLayout,
    ],
  );
  return (
    <div class={styles.home} data-home>
      <HomeHeader env={env} />
      <div class={styles.viewport} data-home-viewport aria-hidden={!active}>
        <div class={styles.mask} data-home-mask data-scrolled={String(scroll > 0)}>
          <div class={styles.maskContent} data-home-mask-content data-scrolled={String(scroll > 0)}>
            <main
              id="rows"
              class={styles.rows}
              data-home-content
              data-docked={String(dockInputs)}
              ref={env.rows}
              style={{ "--home-offset": -scroll + "px" }}
            >
              <div class={styles.page} data-home-page data-docked={String(dockInputs)}>
                <HomeOverview env={env} active={active} />
                <div class={styles.favorites} data-favorites-section>
                  <HomeSectionHeading title={t("home.homeApps")} />
                  <AppGrid
                    env={env}
                    ids={visibleHome}
                    apps={apps}
                    settings={settings}
                    active={active}
                    label={t("home.homeApps")}
                  />
                </div>
                <ContinueWatchingRow env={env} items={items} visible={showContinueWatching} />
                <InputDock env={env} inputs={inputs} />
              </div>
            </main>
          </div>
        </div>
      </div>
      <AppActionsMenu env={env} />
    </div>
  );
};
