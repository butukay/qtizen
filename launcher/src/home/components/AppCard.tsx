import { memo } from "preact/compat";
import { useMemo } from "preact/hooks";

import type { InstalledApp } from "../../contracts/launcher";
import { AppFallback } from "../../shared/components/AppFallback/AppFallback";
import { useStoreSelector } from "../../shared/hooks/useStore";
import type { HomeEnvironment } from "../types";

import { AppArtwork } from "./AppArtwork/AppArtwork";
import { HomeAppCard } from "./HomeAppCard/HomeAppCard";

export const AppCard = memo(
  ({
    env,
    app,
    active,
    ordinal = 1,
  }: {
    env: HomeEnvironment;
    app: InstalledApp;
    active: boolean;
    ordinal?: number;
  }) => {
    const brand = useMemo(() => env.describe(app), [env, app]);
    const nord = useStoreSelector(env.settings, (settings) => settings.nordRice);
    return (
      <HomeAppCard
        env={env}
        id={app.id}
        registered={active}
        title={brand.title}
        background={brand.background}
        ordinal={ordinal}
      >
        {nord ? (
          <AppFallback app={app} brand={brand} active={active} hidden={false} variant="rice" />
        ) : (
          <AppArtwork app={app} brand={brand} active={active} />
        )}
      </HomeAppCard>
    );
  },
);
