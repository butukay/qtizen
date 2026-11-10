import { AppWindow } from "lucide-preact";

import type { AppPresentation, InstalledApp } from "../../../contracts/launcher";
import { useImageSequence } from "../../hooks/useImageSequence";
import { AppLogoIcon } from "../../icons/AppLogoIcon";
import { Icon } from "../../icons/Icon/Icon";

import styles from "./AppFallback.module.css";

export type AppFallbackVariant = "home" | "favourite" | "source" | "badge" | "rice" | "list";

export const AppFallback = ({
  app,
  brand,
  active,
  hidden,
  variant = "home",
}: {
  app: InstalledApp;
  brand: AppPresentation;
  active: boolean;
  hidden: boolean;
  variant?: AppFallbackVariant;
}) => {
  const labelled = variant === "rice" || variant === "list";
  const icon = useImageSequence(brand.useAppIcon && app.icon ? [app.icon] : [], active);
  return (
    <div
      class={styles.fallback + " " + styles[variant]}
      data-app-fallback
      data-logo-only={!brand.label ? "true" : undefined}
      data-large-logo={brand.largeLogo ? "true" : undefined}
      hidden={hidden}
    >
      {brand.logoPath ? (
        <AppLogoIcon class={styles.logo} path={brand.logoPath} colour={labelled ? "currentColor" : brand.logoColour} />
      ) : null}
      {!brand.logoPath && icon.src ? (
        <img key={icon.src} class={styles.logo} alt="" src={icon.src} onLoad={icon.onLoad} onError={icon.onError} />
      ) : null}
      {variant === "list" && !brand.logoPath && !icon.src ? <Icon icon={AppWindow} class={styles.logo} /> : null}
      {labelled || brand.label || !brand.logoPath ? (
        <div class={styles.label} style={labelled ? undefined : { color: brand.textColour }}>
          {labelled ? brand.title : brand.label || brand.title}
        </div>
      ) : null}
    </div>
  );
};
