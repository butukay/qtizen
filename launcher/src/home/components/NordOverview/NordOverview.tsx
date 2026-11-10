import { useStore } from "../../../shared/hooks/useStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { useClock } from "../../../status/hooks/useClock";
import type { HomeEnvironment, Page } from "../../types";

import styles from "./NordOverview.module.css";

export const NordOverview = ({ env, page, count }: { env: HomeEnvironment; page: Page; count: number }) => {
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
          <svg class={styles.landscape} viewBox="0 0 600 230" aria-hidden="true" focusable="false">
            <circle class={styles.sun} cx="450" cy="52" r="27" />
            <path class={styles.back} d="M10 205 135 76 210 140 327 25 498 205Z" />
            <path class={styles.front} d="M110 205 253 100 309 149 410 74 590 205Z" />
            <path class={styles.ridge} d="m10 205 125-129 75 64L327 25l61 64m-135 11 56 49 101-75 180 131" />
            <path class={styles.snow} d="m287 65 40-40 43 48-32-14-12 9-10-14Zm-177 38 25-27 27 23-22-5-9 9-8-9Z" />
            <path class={styles.horizon} d="M0 205h600" />
          </svg>
        </div>
      )}
      <div class={styles.section}>
        <span class={styles.sectionIndex} aria-hidden="true">
          01
        </span>
        <h1 class={styles.heading}>{t(home ? "home.homeApps" : "home.allApps")}</h1>
        <span class={styles.rule} aria-hidden="true" />
        <span class={styles.count}>{String(count).padStart(2, "0")}</span>
      </div>
    </section>
  );
};
