import type { AppPresentation, InstalledApp } from "../../../contracts/launcher";
import { useImageSequence } from "../../hooks/useImageSequence";
import { AppLogoIcon } from "../../icons/AppLogoIcon";

import styles from "./AppFallback.module.css";

export type AppFallbackVariant = "home" | "favourite" | "source" | "badge" | "rice";

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
        <AppLogoIcon
          class={styles.logo}
          path={brand.logoPath}
          colour={variant === "rice" ? "currentColor" : brand.logoColour}
        />
      ) : null}
      {!brand.logoPath && icon.src ? (
        <img key={icon.src} class={styles.logo} alt="" src={icon.src} onLoad={icon.onLoad} onError={icon.onError} />
      ) : null}
      {variant === "rice" || brand.label || !brand.logoPath ? (
        <div class={styles.label} style={variant === "rice" ? undefined : { color: brand.textColour }}>
          {variant === "rice" ? brand.title : brand.label || brand.title}
        </div>
      ) : null}
    </div>
  );
};
