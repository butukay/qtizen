import { SOLAR_PLANETS, SOLAR_TILT } from "./planets";
import styles from "./SolarSystemDrawing.module.css";

export const SolarSystemDrawing = () => (
  <svg viewBox="0 0 600 280" data-solar-system data-solar-drawing aria-hidden="true" focusable="false">
    <g class={styles.orbits}>
      {SOLAR_PLANETS.map((planet) => (
        <ellipse key={planet.id} cx="300" cy="140" rx={planet.orbit} ry={planet.orbit * SOLAR_TILT} />
      ))}
    </g>
    <circle class={styles.sun} cx="300" cy="140" r="10" />
    {SOLAR_PLANETS.map((planet) => {
      const angle = (planet.phase * Math.PI) / 180;
      const x = 300 + Math.cos(angle) * planet.orbit;
      const y = 140 + Math.sin(angle) * planet.orbit * SOLAR_TILT;
      return (
        <g key={planet.id} transform={`translate(${x} ${y})`} data-solar-planet={planet.id}>
          {planet.id === "saturn" && <ellipse class={styles.ring} rx="10" ry="3.5" transform="rotate(-25)" />}
          <circle class={styles.planet} data-tone={planet.tone} r={planet.radius} />
        </g>
      );
    })}
  </svg>
);
