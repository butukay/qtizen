// Display radii and positions are composed for the small scene.
export const SOLAR_PLANETS = [
  { id: "mercury", orbit: 34, radius: 2.4, phase: 205, tone: "neutral" },
  { id: "venus", orbit: 55, radius: 3.6, phase: 315, tone: "warm" },
  { id: "earth", orbit: 77, radius: 3.8, phase: 140, tone: "cool" },
  { id: "mars", orbit: 100, radius: 2.8, phase: 250, tone: "warm" },
  { id: "jupiter", orbit: 140, radius: 6.2, phase: 35, tone: "neutral" },
  { id: "saturn", orbit: 183, radius: 5, phase: 165, tone: "warm" },
  { id: "uranus", orbit: 229, radius: 4, phase: 300, tone: "cool" },
  { id: "neptune", orbit: 277, radius: 3.8, phase: 70, tone: "cool" },
] as const;

export const SOLAR_TILT = 0.4;
