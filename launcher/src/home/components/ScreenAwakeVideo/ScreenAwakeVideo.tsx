import { useEffect, useRef } from "preact/hooks";

import type { InputsSnapshot } from "../../../contracts/inputs";
import { useStoreSelector } from "../../../shared/hooks/useStore";
import type { Store } from "../../../shared/state/createStore";

import styles from "./ScreenAwakeVideo.module.css";

const PLAYBACK_RETRY_MS = 800;

export const ScreenAwakeVideo = ({ inputs }: { inputs: Store<InputsSnapshot> }) => {
  const inputInUse = useStoreSelector(inputs, (snapshot) => snapshot.playback !== "idle");
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }
    const document = video.ownerDocument;
    let generation = 0;
    let retryTimer: number | undefined;
    const play = async (request: number, retry: boolean) => {
      try {
        if (video.error) {
          video.load();
        }
        await video.play();
      } catch {
        // The TV can still be releasing the decoder from the previous app or input.
        if (retry && request === generation) {
          retryTimer = window.setTimeout(() => void play(request, false), PLAYBACK_RETRY_MS);
        }
      }
    };
    const sync = () => {
      const request = ++generation;
      window.clearTimeout(retryTimer);
      if (document.hidden || inputInUse) {
        video.pause();
      } else {
        void play(request, true);
      }
    };
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      generation++;
      window.clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [inputInUse]);
  return (
    <video
      ref={ref}
      class={styles.video}
      data-screen-awake-video
      aria-hidden="true"
      src="assets/screen-awake.mp4"
      preload="auto"
      muted
      loop
      playsInline
    />
  );
};
