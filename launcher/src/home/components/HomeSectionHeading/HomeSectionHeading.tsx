import styles from "./HomeSectionHeading.module.css";

export const HomeSectionHeading = ({ title }: { title: string }) => (
  <h2 class={styles.heading} data-home-section-heading>
    <span>{title}</span>
    <span class={styles.rule} aria-hidden="true" />
  </h2>
);
