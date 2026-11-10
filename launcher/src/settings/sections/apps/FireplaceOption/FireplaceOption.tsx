import { useTranslation } from "../../../../shared/i18n/useTranslation";
import { FlameIcon } from "../../../../shared/icons/FlameIcon";
import { SelectionIndicator } from "../../../components/SelectionIndicator/SelectionIndicator";
import { SettingsAppRow } from "../SettingsAppRow/SettingsAppRow";

import styles from "./FireplaceOption.module.css";

export const FireplaceOption = ({ id, selected, onSelect }: { id: string; selected: boolean; onSelect(): void }) => {
  const { t } = useTranslation();
  return (
    <SettingsAppRow
      class={styles.fireplace}
      selected={selected}
      focusKey={"app:" + id}
      aria-label={t("common.fireplace")}
      onClick={onSelect}
    >
      <FlameIcon class={styles.icon} />
      <div class={styles.label}>{t("common.fireplace")}</div>
      {selected ? <SelectionIndicator inline /> : null}
    </SettingsAppRow>
  );
};
