import { useStore } from "../../../shared/hooks/useStore";
import { useClock } from "../../../status/hooks/useClock";
import type { HomeEnvironment } from "../../types";
import { SolarSystem } from "../SolarSystem/SolarSystem";

import styles from "./HomeOverview.module.css";

export const HomeOverview = ({ env, active }: { env: HomeEnvironment; active: boolean }) => {
  const settings = useStore(env.settings);
  const value = useClock(env.status.time, env.runtime.clock, settings);
  return (
    <section class={styles.hero} data-home-overview>
      <div class={styles.clock}>
        <div class={styles.time} aria-label={value.text} hidden={!settings.showTime} data-clock-part="time">
          <span>{value.hour}</span>
          <span class={styles.colon} aria-hidden="true">
            :
          </span>
          <span>{value.minute}</span>
          <span class={styles.period}>{value.period}</span>
        </div>
        <div class={styles.date} hidden={settings.dateFormat === "none"} data-clock-part="date">
          {value.date}
        </div>
      </div>
      <SolarSystem running={active && !settings.performanceMode} />
    </section>
  );
};
