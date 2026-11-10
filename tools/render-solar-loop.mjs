// Offline artwork generator. FFmpeg is needed here, never when building or running the launcher.
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(path.join(root, "launcher/src/home/components/SolarSystem/planets.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { SOLAR_PLANETS, SOLAR_TILT } = await import(
  "data:text/javascript;base64," + Buffer.from(compiled).toString("base64")
);
// Composed motion closes exactly at the loop boundary; it is not an ephemeris.
const turns = { mercury: 10, venus: 6, earth: 4, mars: 3, jupiter: 2, saturn: 1, uranus: 1, neptune: 1 };
const seconds = 120;
const fps = 10;
const output = path.resolve(root, process.argv[2] || "launcher/assets/solar-loop.mp4");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent('<body class="nord-ui"><canvas width="600" height="280"></canvas></body>');
  await page.addStyleTag({ content: await readFile(path.join(root, "launcher/css/themes.css"), "utf8") });
  const encoder = spawn(
    process.env.AEROTIZEN_FFMPEG || "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      output,
    ],
    { stdio: ["pipe", "ignore", "inherit"] },
  );
  const finished = once(encoder, "close");
  for (let frame = 0; frame < seconds * fps; frame++) {
    const png = await page.evaluate(
      ({ frame, fps, seconds, planets, tilt, turns }) => {
        const canvas = globalThis.document.querySelector("canvas");
        const ctx = canvas.getContext("2d");
        const palette = globalThis.getComputedStyle(globalThis.document.body);
        const colour = (tone) => palette.getPropertyValue("--solar-" + tone).trim();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 600, 280);
        ctx.strokeStyle = palette.getPropertyValue("--solar-orbit").trim();
        ctx.lineWidth = 0.6;
        for (const planet of planets) {
          ctx.beginPath();
          ctx.ellipse(300, 140, planet.orbit, planet.orbit * tilt, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = colour("warm");
        ctx.beginPath();
        ctx.arc(300, 140, 10, 0, Math.PI * 2);
        ctx.fill();
        for (const planet of planets) {
          const angle = (frame / fps / seconds) * turns[planet.id] * Math.PI * 2 + (planet.phase * Math.PI) / 180;
          const x = 300 + Math.cos(angle) * planet.orbit;
          const y = 140 + Math.sin(angle) * planet.orbit * tilt;
          if (planet.id === "saturn") {
            ctx.strokeStyle = colour("warm");
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.ellipse(x, y, 10, 3.5, (-25 * Math.PI) / 180, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = colour(planet.tone);
          ctx.beginPath();
          ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { frame, fps, seconds, planets: SOLAR_PLANETS, tilt: SOLAR_TILT, turns },
    );
    if (!encoder.stdin.write(Buffer.from(png, "base64"))) await once(encoder.stdin, "drain");
  }
  encoder.stdin.end();
  const [code] = await finished;
  if (code !== 0) throw new Error("FFmpeg could not encode the solar loop.");
  process.stdout.write("Rendered " + output + "\n");
} finally {
  await browser.close();
}
