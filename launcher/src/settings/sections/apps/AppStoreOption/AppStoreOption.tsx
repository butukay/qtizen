import { CirclePlus } from "lucide-preact";

import { useTranslation } from "../../../../shared/i18n/useTranslation";
import { Icon } from "../../../../shared/icons/Icon/Icon";
import { SettingsAppRow } from "../SettingsAppRow/SettingsAppRow";

import styles from "./AppStoreOption.module.css";

export const AppStoreOption = ({ onSelect }: { onSelect(): void }) => {
  const { t } = useTranslation();
  return (
    <SettingsAppRow class={styles.store} focusKey="add" onClick={onSelect}>
      <Icon icon={CirclePlus} class={styles.icon} />
      <div class={styles.label}>
        {t("apps.add")}
        <div class={styles.subtitle}>{t("apps.store")}</div>
      </div>
    </SettingsAppRow>
  );
};
