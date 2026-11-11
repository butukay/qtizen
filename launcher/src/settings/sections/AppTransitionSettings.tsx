import type { TransitionStatus } from "../../contracts/transitions";
import { useStore } from "../../shared/hooks/useStore";
import { useTranslation } from "../../shared/i18n/useTranslation";
import type { Store } from "../../shared/state/createStore";
import { ChoiceGroup } from "../components/ChoiceGroup";
import { SettingsSection } from "../components/SettingsSection/SettingsSection";
import type { SettingsSectionProps } from "../types";

const OPTIONS = [
  { value: "none", labelKey: "transitions.none" },
  { value: "fade", labelKey: "transitions.fade" },
  { value: "standard", labelKey: "transitions.standard" },
] as const;

export const AppTransitionSettings = ({
  settings,
  actions,
  transitions,
}: SettingsSectionProps & { transitions: Store<TransitionStatus> }) => {
  const { t } = useTranslation();
  const status = useStore(transitions);
  const description =
    status.phase === "ready"
      ? undefined
      : t(status.phase === "applying" ? "transitions.applying" : "transitions.unavailable");
  return (
    <SettingsSection title={t("transitions.title")} description={description}>
      <ChoiceGroup
        id="app-transition"
        label={t("transitions.title")}
        value={settings.appTransition}
        options={OPTIONS}
        onSelect={actions.setAppTransition}
      />
    </SettingsSection>
  );
};
