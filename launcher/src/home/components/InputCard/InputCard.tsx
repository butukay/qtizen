import type { LucideIcon } from "lucide-preact";
import { Gamepad2, HdmiPort, Monitor, RectangleEllipsis, Tv } from "lucide-preact";

import type { InputSource } from "../../../contracts/launcher";
import { useTranslation } from "../../../shared/i18n/useTranslation";
import { Icon } from "../../../shared/icons/Icon/Icon";
import text from "../../../shared/styles/text.module.css";
import type { InputKind } from "../../presentation/inputs";
import { getInputPresentation } from "../../presentation/inputs";
import type { HomeEnvironment } from "../../types";
import { HomeControl } from "../HomeControl/HomeControl";

import styles from "./InputCard.module.css";

const INPUT_ICONS = { tv: Tv, game: Gamepad2, pc: Monitor, box: RectangleEllipsis, hdmi: HdmiPort } satisfies Record<
  InputKind,
  LucideIcon
>;

export const InputCard = ({ env, source }: { env: HomeEnvironment; source: InputSource }) => {
  const { t } = useTranslation();
  const port = env.runtime.inputs.portName(source);
  const television = source.type === "TV";
  const label = env.runtime.inputs.label(source, television ? t("inputs.liveTv") : undefined);
  const { kind, status, disconnected } = getInputPresentation(source, label, {
    recognized: Boolean(env.runtime.inputs.hasRecognizedDevice?.(source)),
    pinned: Boolean(env.runtime.inputs.alwaysVisible?.(source)),
  });
  const subtitle = television ? t("inputs.status.live") : port;
  return (
    <HomeControl
      env={env}
      controlKey={"input:" + source.type + ":" + source.number}
      className={styles.card}
      dataAttributes={{ "data-input-card": "", "data-status": status, "data-disconnected": String(disconnected) }}
      title={label}
    >
      <span class={styles.icon} data-input-part="icon">
        <Icon icon={INPUT_ICONS[kind]} />
      </span>
      <div class={styles.label + " " + text.truncate} data-input-part="label">
        {label}
        {(television || label !== port) && (
          <div class={styles.subtitle} data-input-part="subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </HomeControl>
  );
};
