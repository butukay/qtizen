import { useMemo } from "preact/hooks";

import type { InstalledApp } from "../../../../contracts/launcher";
import { AppFallback } from "../../../../shared/components/AppFallback/AppFallback";
import { SelectionIndicator } from "../../../components/SelectionIndicator/SelectionIndicator";
import type { SettingsServices } from "../../../types";
import type { SettingsAppRowVariant } from "../SettingsAppRow/SettingsAppRow";
import { SettingsAppRow } from "../SettingsAppRow/SettingsAppRow";

interface Props {
  active: boolean;
  app: InstalledApp;
  describeApp: SettingsServices["describeApp"];
  disabled?: boolean;
  focusKey?: string;
  onSelect(): void;
  selected: boolean;
  variant?: SettingsAppRowVariant;
}

export const AppOption = ({
  app,
  selected,
  active,
  onSelect,
  describeApp,
  focusKey,
  variant = "favourite",
  disabled = false,
}: Props) => {
  const brand = useMemo(() => describeApp(app), [app, describeApp]);
  return (
    <SettingsAppRow
      selected={selected}
      variant={variant}
      data-app-option
      focusKey={focusKey || "app:" + app.id}
      aria-label={brand.title}
      title={brand.title}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (!disabled) {
          onSelect();
        }
      }}
    >
      <AppFallback app={app} brand={brand} active={active} hidden={false} variant="list" />
      {selected ? <SelectionIndicator inline /> : null}
    </SettingsAppRow>
  );
};
