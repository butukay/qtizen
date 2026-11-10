import { memo } from "preact/compat";
import { useMemo } from "preact/hooks";

import type { InstalledApp } from "../../contracts/launcher";
import { AppFallback } from "../../shared/components/AppFallback/AppFallback";
import type { HomeEnvironment } from "../types";

import { HomeAppCard } from "./HomeAppCard/HomeAppCard";

export const AppCard = memo(({ env, app, active }: { env: HomeEnvironment; app: InstalledApp; active: boolean }) => {
  const brand = useMemo(() => env.describe(app), [env, app]);
  return (
    <HomeAppCard env={env} id={app.id} registered={active} title={brand.title} background={brand.background}>
      <AppFallback app={app} brand={brand} active={active} hidden={false} variant="rice" />
    </HomeAppCard>
  );
});
