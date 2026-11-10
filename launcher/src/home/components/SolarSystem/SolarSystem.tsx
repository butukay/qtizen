import { useId } from "preact/hooks";

import { SOLAR_PLANETS, SOLAR_TILT, SOLAR_YEAR_SECONDS } from "./planets";
import styles from "./SolarSystem.module.css";

export const SolarSystem = ({ running }: { running: boolean }) => {
  const prefix = useId();
  const shadow = prefix + "-shadow";
  const glow = prefix + "-glow";
  return (
    <svg
      class={styles.system}
      viewBox="0 0 600 280"
      data-solar-system
      data-running={String(running)}
      data-home-decoration
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={shadow} cx="30%" cy="25%" r="78%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="0.45" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000000" stopOpacity="0.45" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.92" />
        </radialGradient>
        <radialGradient id={glow}>
          <stop offset="0.2" stopColor="#e6a355" stopOpacity="0.2" />
          <stop offset="1" stopColor="#e6a355" stopOpacity="0" />
        </radialGradient>
        <clipPath id={prefix + "-sun"}>
          <circle r="20" />
        </clipPath>
        {SOLAR_PLANETS.map((planet) => (
          <clipPath key={planet.id} id={prefix + "-" + planet.id}>
            <circle r={planet.radius} />
          </clipPath>
        ))}
      </defs>
      <g class={styles.orbits}>
        {SOLAR_PLANETS.map((planet) => (
          <ellipse key={planet.id} cx="300" cy="140" rx={planet.orbit} ry={planet.orbit * SOLAR_TILT} />
        ))}
      </g>
      <g transform="translate(300 140)">
        <circle r="42" fill={"url(#" + glow + ")"} />
        <circle r="20" fill="#c28b4a" />
        <image
          href="assets/solar-system/2k_sun.jpg"
          x="-40"
          y="-20"
          width="80"
          height="40"
          clipPath={"url(#" + prefix + "-sun)"}
          preserveAspectRatio="none"
          class={styles.sun}
        />
      </g>
      <g transform={"translate(300 140) scale(1 " + SOLAR_TILT + ")"}>
        {SOLAR_PLANETS.map((planet) => {
          const period = (planet.days / 365) * SOLAR_YEAR_SECONDS;
          const timing = { animationDuration: period + "s", animationDelay: (-period * planet.phase) / 360 + "s" };
          return (
            <g key={planet.id} class={styles.orbiter} style={timing} data-solar-planet={planet.id}>
              <g transform={"translate(" + planet.orbit + " 0)"}>
                <g class={styles.upright} style={timing}>
                  <g transform={"scale(1 " + 1 / SOLAR_TILT + ")"}>
                    {planet.id === "saturn" && (
                      <ellipse class={styles.ringBack} rx="22" ry="6.5" transform="rotate(-25)" />
                    )}
                    <circle r={planet.radius} fill={planet.colour} />
                    <image
                      href={"assets/solar-system/" + planet.texture}
                      x={-planet.radius * 2}
                      y={-planet.radius}
                      width={planet.radius * 4}
                      height={planet.radius * 2}
                      clipPath={"url(#" + prefix + "-" + planet.id + ")"}
                      preserveAspectRatio="none"
                    />
                    <circle r={planet.radius} fill={"url(#" + shadow + ")"} />
                    {planet.id === "saturn" && (
                      <path class={styles.ringFront} d="M-22 0a22 6.5 0 0 0 44 0" transform="rotate(-25)" />
                    )}
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
