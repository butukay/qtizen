import { ArrowUpRight } from "lucide-preact";
import type { ComponentChildren } from "preact";

import { useStoreSelector } from "../../../shared/hooks/useStore";
import { Icon } from "../../../shared/icons/Icon/Icon";
import type { HomeEnvironment } from "../../types";
import { HomeControl } from "../HomeControl/HomeControl";
import { ReorderControls } from "../ReorderControls/ReorderControls";

import styles from "./HomeAppCard.module.css";

export const HomeAppCard = ({
  env,
  id,
  title,
  registered,
  children,
  className = "",
  background,
  ordinal = 1,
}: {
  env: HomeEnvironment;
  id: string;
  title: string;
  registered: boolean;
  children: ComponentChildren;
  className?: string;
  background?: string;
  ordinal?: number;
}) => {
  const isMoving = useStoreSelector(env.state, (state) => state.moving === id);
  const nord = useStoreSelector(env.settings, (settings) => settings.nordRice);
  return (
    <HomeControl
      env={env}
      controlKey={"app:" + id}
      dataId={id}
      moving={isMoving}
      dataAttributes={{ "data-nord": nord ? "true" : "false" }}
      registered={registered}
      className={styles.card + " " + className}
      title={title}
      style={background ? { "--app-background": background } : undefined}
    >
      {children}
      {nord && (
        <>
          <span class={styles.ordinal} aria-hidden="true">
            {String(ordinal).padStart(2, "0")}
          </span>
          <Icon icon={ArrowUpRight} class={styles.arrow} />
        </>
      )}
      {isMoving ? <ReorderControls env={env} id={id} /> : null}
    </HomeControl>
  );
};
