import { useStore } from "../../../shared/hooks/useStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { useClock } from "../../../status/hooks/useClock";
import type { HomeEnvironment, Page } from "../../types";
import { SolarSystem } from "../SolarSystem/SolarSystem";

import styles from "./NordOverview.module.css";

export const NordOverview = ({
  env,
  page,
  count,
  active,
}: {
  env: HomeEnvironment;
  page: Page;
  count: number;
  active: boolean;
}) => {
  const { t } = useTranslation();
  const settings = useStore(env.settings);
  const value = useClock(env.status.time, env.runtime.clock, settings);
  const home = page === "home";
  return (
    <section class={styles.overview} data-nord-overview data-page={page}>
      <div class={styles.breadcrumb}>
        <span class={styles.prompt} aria-hidden="true">
          ~
        </span>
        <span class={styles.slash} aria-hidden="true">
          /
        </span>
        {t(home ? "home.home" : "home.allApps")}
      </div>
      {home && (
        <div class={styles.hero}>
          <div class={styles.clock}>
            <div class={styles.time} aria-label={value.text} hidden={!settings.showTime} data-nord-time>
              <span>{value.hour}</span>
              <span class={styles.colon} aria-hidden="true">
                :
              </span>
              <span>{value.minute}</span>
              <span class={styles.period}>{value.period}</span>
            </div>
            <div class={styles.date} hidden={settings.dateFormat === "none"} data-nord-date>
              {value.date}
            </div>
          </div>
          <SolarSystem running={active} />
        </div>
      )}
      <div class={styles.section}>
        <h1 class={styles.heading}>{t(home ? "home.homeApps" : "home.allApps")}</h1>
        <span class={styles.rule} aria-hidden="true" />
        <span class={styles.count}>{String(count).padStart(2, "0")}</span>
      </div>
    </section>
  );
};
