import { ACCENT_COLOURS } from "../../../shared/appearance";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { ChoiceOption } from "../../components/ChoiceOption/ChoiceOption";
import { ControlGroup } from "../../components/ControlGroup/ControlGroup";
import { SettingsSection } from "../../components/SettingsSection/SettingsSection";
import type { SettingsSectionProps } from "../../types";

import styles from "./AccentSettings.module.css";

export const AccentSettings = ({ settings, actions }: SettingsSectionProps) => {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("appearance.accent")}>
      <ControlGroup id="accent-colours">
        {ACCENT_COLOURS.map((accent) => (
          <ChoiceOption
            key={accent.value}
            id={"accent:" + accent.value}
            inline
            selected={settings.accentColour === accent.value}
            onSelect={() => actions.setAccentColour(accent.value)}
          >
            <span class={styles.swatch} style={{ background: accent.colour }} aria-hidden="true" />
            {t(accent.labelKey)}
          </ChoiceOption>
        ))}
      </ControlGroup>
    </SettingsSection>
  );
};
