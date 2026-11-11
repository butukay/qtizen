// Orbital periods are scaled to a three-minute Earth year for the small scene.
export const SOLAR_PLANETS = [
  { id: "mercury", orbit: 34, radius: 2.4, days: 88, phase: 205, tone: "neutral" },
  { id: "venus", orbit: 55, radius: 3.6, days: 225, phase: 315, tone: "warm" },
  { id: "earth", orbit: 77, radius: 3.8, days: 365, phase: 140, tone: "cool" },
  { id: "mars", orbit: 100, radius: 2.8, days: 687, phase: 250, tone: "warm" },
  { id: "jupiter", orbit: 140, radius: 6.2, days: 4333, phase: 35, tone: "neutral" },
  { id: "saturn", orbit: 183, radius: 5, days: 10759, phase: 165, tone: "warm" },
  { id: "uranus", orbit: 229, radius: 4, days: 30687, phase: 300, tone: "cool" },
  { id: "neptune", orbit: 277, radius: 3.8, days: 60190, phase: 70, tone: "cool" },
] as const;

export const SOLAR_TILT = 0.4;
export const SOLAR_YEAR_SECONDS = 180;
