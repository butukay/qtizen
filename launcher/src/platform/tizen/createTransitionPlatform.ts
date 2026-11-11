import type { AppTransition } from "../../contracts/preferences";
import type { TransitionPlatform } from "../../contracts/transitions";

import { createPrivateFiles, type PrivateFileTizen } from "./createPrivateFiles";

export type TransitionTizen = PrivateFileTizen;

export const createTransitionPlatform = (
  tizen: TransitionTizen | null | undefined,
  timers: Pick<Window, "setTimeout" | "clearTimeout">,
): TransitionPlatform => {
  const files = createPrivateFiles(tizen, timers);
  return {
    preview: !tizen,
    write: (mode: AppTransition) => files.write("window-transitions.json", { schema_version: 1, mode }),
    read: () => files.read("window-transitions-status.json"),
    dispose: files.dispose,
  };
};
