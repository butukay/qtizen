import { Check } from "lucide-preact";

import { Icon } from "../../../shared/icons/Icon/Icon";

import styles from "./SelectionIndicator.module.css";

export const SelectionIndicator = ({ small = false, inline = false }: { small?: boolean; inline?: boolean }) => (
  <div
    class={styles.indicator + (small ? " " + styles.small : "") + (inline ? " " + styles.inline : "")}
    data-selection-indicator
    aria-hidden="true"
  >
    <Icon icon={Check} />
  </div>
);
