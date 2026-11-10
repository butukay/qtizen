import { Settings } from "lucide-preact";

import { useStore, useStoreSelector } from "../../../shared/hooks/useStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { Icon } from "../../../shared/icons/Icon/Icon";
import type { HomeEnvironment } from "../../types";
import { HomeControl } from "../HomeControl/HomeControl";

import styles from "./HomeHeader.module.css";

export const HomeHeader = ({ env }: { env: HomeEnvironment }) => {
  const { t } = useTranslation();
  const active = useStoreSelector(env.state, (state) => state.active);
  const { unread } = useStore(env.updates);
  const title = t(unread ? "settings.about.homeNotice" : "common.settings");
  return (
    <header class={styles.header} data-home-header aria-hidden={!active}>
      <HomeControl env={env} id="gear" controlKey="gear" className={styles.shortcut} preserveSelection title={title}>
        <Icon icon={Settings} />
        {unread && <span class={styles.notice} data-home-update-notice aria-hidden="true" />}
      </HomeControl>
    </header>
  );
};
