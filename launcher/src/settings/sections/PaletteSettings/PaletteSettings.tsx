import { APPEARANCE_PALETTES } from "../../../shared/appearance";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { ChoiceOption } from "../../components/ChoiceOption/ChoiceOption";
import { ControlGroup } from "../../components/ControlGroup/ControlGroup";
import { SettingsSection } from "../../components/SettingsSection/SettingsSection";
import type { SettingsSectionProps } from "../../types";

import styles from "./PaletteSettings.module.css";

export const PaletteSettings = ({ settings, actions }: SettingsSectionProps) => {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("appearance.accent")}>
      <ControlGroup id="accent-colours">
        {APPEARANCE_PALETTES.map((palette) => (
          <ChoiceOption
            key={palette.value}
            id={"accent:" + palette.value}
            inline
            selected={settings.accentColour === palette.value}
            onSelect={() => actions.setAccentColour(palette.value)}
          >
            <span class={styles.swatch} data-palette={palette.value} aria-hidden="true" />
            {t(palette.labelKey)}
          </ChoiceOption>
        ))}
      </ControlGroup>
    </SettingsSection>
  );
};
