import { SOLAR_PLANETS, SOLAR_TILT, SOLAR_YEAR_SECONDS } from "./planets";
import styles from "./SolarSystem.module.css";

export const SolarSystem = ({ running }: { running: boolean }) => (
  <svg
    class={styles.system}
    viewBox="0 0 600 280"
    data-solar-system
    data-running={String(running)}
    data-home-decoration
    aria-hidden="true"
    focusable="false"
  >
    <g class={styles.orbits}>
      {SOLAR_PLANETS.map((planet) => (
        <ellipse key={planet.id} cx="300" cy="140" rx={planet.orbit} ry={planet.orbit * SOLAR_TILT} />
      ))}
    </g>
    <circle class={styles.sun} cx="300" cy="140" r="10" />
    <g transform={"translate(300 140) scale(1 " + SOLAR_TILT + ")"}>
      {SOLAR_PLANETS.map((planet) => {
        const period = (planet.days / 365) * SOLAR_YEAR_SECONDS;
        const timing = { animationDuration: period + "s", animationDelay: (-period * planet.phase) / 360 + "s" };
        return (
          <g key={planet.id} class={styles.orbiter} style={timing} data-solar-planet={planet.id}>
            <g transform={"translate(" + planet.orbit + " 0)"}>
              <g class={styles.upright} style={timing}>
                <g transform={"scale(1 " + 1 / SOLAR_TILT + ")"}>
                  {planet.id === "saturn" && <ellipse class={styles.ring} rx="10" ry="3.5" transform="rotate(-25)" />}
                  <circle class={styles.planet} data-tone={planet.tone} r={planet.radius} />
                </g>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  </svg>
);
