import type { InstalledApp } from "../../../../contracts/launcher";
import { useTranslation } from "../../../../shared/i18n/useTranslation";
import { SettingsSection } from "../../../components/SettingsSection/SettingsSection";
import type { SettingsActions, SettingsServices } from "../../../types";
import { AppOption } from "../AppOption/AppOption";
import { AppStoreOption } from "../AppStoreOption/AppStoreOption";

import styles from "./HomeAppsSettings.module.css";

interface Props {
  actions: SettingsActions;
  active: boolean;
  apps: readonly InstalledApp[];
  describeApp: SettingsServices["describeApp"];
  home: readonly string[];
}

export const HomeAppsSettings = ({ home, apps, actions, describeApp, active }: Props) => {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t("apps.show")} description={t("apps.hint")}>
      <div id="all-apps" class={styles.list}>
        <AppStoreOption onSelect={actions.openStore} />
        {apps.map((app) => (
          <AppOption
            key={app.id}
            app={app}
            selected={home.includes(app.id)}
            active={active}
            onSelect={() => actions.toggleApp(app.id)}
            describeApp={describeApp}
          />
        ))}
      </div>
    </SettingsSection>
  );
};
