import type { JSX } from "preact";

import { SettingsControl } from "../../../components/SettingsControl/SettingsControl";

import styles from "./SettingsAppRow.module.css";

export type SettingsAppRowVariant = "favourite" | "source";

interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "ref"> {
  class?: string;
  focusKey: string;
  selected?: boolean;
  variant?: SettingsAppRowVariant;
}

export const SettingsAppRow = ({ class: className = "", selected, variant = "favourite", ...props }: Props) => (
  <SettingsControl
    {...props}
    class={styles.row + " " + className}
    role="button"
    aria-pressed={selected}
    data-application-row={variant}
  />
);
