import { useEffect, useMemo, useRef, useState } from "preact/hooks";

import styles from "./SolarSystem.module.css";
import { SolarSystemDrawing } from "./SolarSystemDrawing";

export const SolarSystem = ({ running }: { running: boolean }) => {
  const motion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)"), []);
  const [reduced, setReduced] = useState(() => motion?.matches ?? false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const animate = running && !reduced;
  const showVideo = animate && playing && !failed;
  useEffect(() => {
    if (!motion) {
      return;
    }
    const changed = () => setReduced(motion.matches);
    motion.addListener(changed);
    return () => motion.removeListener(changed);
  }, [motion]);
  useEffect(() => {
    const media = video.current;
    if (!media) {
      return;
    }
    if (!animate || failed) {
      media.pause();
      return;
    }
    let disposed = false;
    void Promise.resolve()
      .then(() => {
        if (!disposed) {
          return media.play();
        }
      })
      .catch(() => {
        if (!disposed) {
          setFailed(true);
        }
      });
    return () => {
      disposed = true;
      media.pause();
    };
  }, [animate, failed]);
  return (
    <div
      class={styles.system}
      data-solar-system
      data-running={String(animate && !showVideo)}
      data-video-active={String(showVideo)}
      data-home-decoration
      aria-hidden="true"
    >
      <video
        ref={video}
        class={styles.video}
        data-solar-video
        src="assets/solar-loop.mp4"
        muted
        loop
        playsInline
        preload={animate ? "auto" : "none"}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <SolarSystemDrawing />
    </div>
  );
};
