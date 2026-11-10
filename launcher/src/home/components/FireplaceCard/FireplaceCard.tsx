import { memo } from "preact/compat";

import { useStoreSelector } from "../../../shared/hooks/useStore";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { FlameIcon } from "../../../shared/icons/FlameIcon";
import type { HomeEnvironment } from "../../types";
import { HomeAppCard } from "../HomeAppCard/HomeAppCard";

import styles from "./FireplaceCard.module.css";

export const FireplaceCard = memo(
  ({ env, registered, ordinal = 1 }: { env: HomeEnvironment; registered: boolean; ordinal?: number }) => {
    const { t } = useTranslation();
    const nord = useStoreSelector(env.settings, (settings) => settings.nordRice);
    const id = env.runtime.config.FIREPLACE_ID;
    return (
      <HomeAppCard
        env={env}
        id={id}
        registered={registered}
        className={styles.card}
        title={t("common.fireplace")}
        ordinal={ordinal}
      >
        {nord ? (
          <div class={styles.rice}>
            <FlameIcon class={styles.flame} colour="currentColor" />
            <span class={styles.label}>{t("common.fireplace")}</span>
          </div>
        ) : (
          <FlameIcon class={styles.flame} />
        )}
      </HomeAppCard>
    );
  },
);
