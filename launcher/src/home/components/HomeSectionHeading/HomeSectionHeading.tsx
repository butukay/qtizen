import styles from "./HomeSectionHeading.module.css";

export const HomeSectionHeading = ({ title, nord = false }: { title: string; nord?: boolean }) => (
  <h2 class={styles.heading} data-home-section-heading data-nord={nord ? "true" : "false"}>
    {nord && (
      <span class={styles.index} aria-hidden="true">
        02
      </span>
    )}
    {title}
  </h2>
);
