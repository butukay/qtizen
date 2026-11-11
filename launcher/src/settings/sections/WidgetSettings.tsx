import { HOME_WIDGETS } from "../../contracts/preferences";
import { useTranslation } from "../../shared/i18n/useTranslation";
import { ChoiceGroup } from "../components/ChoiceGroup";
import { SettingsSection } from "../components/SettingsSection/SettingsSection";
import type { SettingsSectionProps } from "../types";

const WIDGET_LABELS = { solar: "widgets.solar", moon: "widgets.moon", off: "common.off" } as const;
const WIDGET_OPTIONS = HOME_WIDGETS.map((value) => ({ value, labelKey: WIDGET_LABELS[value] }));

export const WidgetSettings = ({ settings, actions }: SettingsSectionProps) => {
  const { t } = useTranslation();
  const label = t("widgets.style");
  return (
    <SettingsSection title={label}>
      <ChoiceGroup
        id="home-widget"
        label={label}
        value={settings.homeWidget}
        options={WIDGET_OPTIONS}
        onSelect={actions.setHomeWidget}
      />
    </SettingsSection>
  );
};
