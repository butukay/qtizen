import { memo } from "preact/compat";

import { useTranslation } from "../../../shared/i18n/useTranslation";
import { FlameIcon } from "../../../shared/icons/FlameIcon";
import type { HomeEnvironment } from "../../types";
import { HomeAppCard } from "../HomeAppCard/HomeAppCard";

import styles from "./FireplaceCard.module.css";

export const FireplaceCard = memo(({ env, registered }: { env: HomeEnvironment; registered: boolean }) => {
  const { t } = useTranslation();
  const id = env.runtime.config.FIREPLACE_ID;
  return (
    <HomeAppCard env={env} id={id} registered={registered} title={t("common.fireplace")}>
      <div class={styles.rice}>
        <FlameIcon class={styles.flame} colour="currentColor" />
        <span class={styles.label}>{t("common.fireplace")}</span>
      </div>
    </HomeAppCard>
  );
});
