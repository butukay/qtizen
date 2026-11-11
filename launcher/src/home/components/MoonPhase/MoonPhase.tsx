import styles from "./MoonPhase.module.css";

// USNO's January 2026 new moon and the mean synodic month give an offline estimate.
const REFERENCE_NEW_MOON = Date.UTC(2026, 0, 18, 19, 52);
const LUNATION_MS = 29.53059 * 86_400_000;
const RADIUS = 78;

export const MoonPhase = ({ timestamp }: { timestamp: number }) => {
  const elapsedCycles = (timestamp - REFERENCE_NEW_MOON) / LUNATION_MS;
  const cycle = elapsedCycles - Math.floor(elapsedCycles);
  const terminator = Math.cos(cycle * 2 * Math.PI);
  const width = Math.abs(terminator) * RADIUS;
  const sweep = terminator < 0 ? 1 : 0;
  const litSide = `M 0 ${-RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 0 ${RADIUS} A ${width} ${RADIUS} 0 0 ${sweep} 0 ${-RADIUS} Z`;
  return (
    <svg viewBox="0 0 600 280" data-moon-phase aria-hidden="true" focusable="false">
      <g transform="translate(300 140)">
        <circle class={styles.orbit} r="110" />
        <path class={styles.orbit} d="M -148 0 h 24 M 124 0 h 24 M 0 -136 v 12 M 0 124 v 12" />
        <circle class={styles.disk} r={RADIUS} />
        <path class={styles.light} d={litSide} transform={cycle > 0.5 ? "scale(-1 1)" : undefined} />
        <circle class={styles.marker} cx="84" cy="-71" r="2.5" />
      </g>
    </svg>
  );
};
