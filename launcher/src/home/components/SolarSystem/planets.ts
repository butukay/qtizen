// Approximate orbital periods: NASA Space Place, "Years on Other Planets".
// Display radii and phases are composed for the small scene, not an ephemeris.
export const SOLAR_PLANETS = [
  { id: "mercury", texture: "2k_mercury.jpg", orbit: 34, radius: 3.5, days: 88, phase: 205, colour: "#a1a09c" },
  { id: "venus", texture: "2k_venus_atmosphere.jpg", orbit: 55, radius: 6, days: 225, phase: 315, colour: "#d0ac75" },
  { id: "earth", texture: "2k_earth_daymap.jpg", orbit: 77, radius: 6.5, days: 365, phase: 140, colour: "#5795c4" },
  { id: "mars", texture: "2k_mars.jpg", orbit: 100, radius: 4.5, days: 687, phase: 250, colour: "#b87659" },
  { id: "jupiter", texture: "2k_jupiter.jpg", orbit: 140, radius: 13, days: 4333, phase: 35, colour: "#c3a385" },
  { id: "saturn", texture: "2k_saturn.jpg", orbit: 183, radius: 10.5, days: 10759, phase: 165, colour: "#c4b18c" },
  { id: "uranus", texture: "2k_uranus.jpg", orbit: 229, radius: 8, days: 30687, phase: 300, colour: "#8db9bd" },
  { id: "neptune", texture: "2k_neptune.jpg", orbit: 277, radius: 8, days: 60190, phase: 70, colour: "#5279bd" },
] as const;

export const SOLAR_YEAR_SECONDS = 180;
export const SOLAR_TILT = 0.4;
