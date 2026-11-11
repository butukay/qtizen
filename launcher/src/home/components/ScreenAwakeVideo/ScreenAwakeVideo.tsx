import { useEffect, useRef } from "preact/hooks";

import type { InputsSnapshot } from "../../../contracts/inputs";
import { useStoreSelector } from "../../../shared/hooks/useStore";
import type { Store } from "../../../shared/state/createStore";

import styles from "./ScreenAwakeVideo.module.css";

export const ScreenAwakeVideo = ({ inputs }: { inputs: Store<InputsSnapshot> }) => {
  const inputInUse = useStoreSelector(inputs, (snapshot) => snapshot.playback !== "idle");
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }
    const document = video.ownerDocument;
    const sync = () => {
      if (document.hidden || inputInUse) {
        video.pause();
      } else {
        void video.play()?.catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
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
