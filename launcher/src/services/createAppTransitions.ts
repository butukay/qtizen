import type { AppTransition, SettingsStore } from "../contracts/preferences";
import type { TransitionPlatform, TransitionStatus } from "../contracts/transitions";
import { createStore } from "../shared/state/createStore";

export const unavailableTransitions = createStore<TransitionStatus>({ mode: null, phase: "unavailable" });

export const createAppTransitions = ({
  settings,
  platform,
  timers,
  now,
}: {
  now(): number;
  platform: TransitionPlatform;
  settings: SettingsStore;
  timers: Pick<Window, "setTimeout" | "clearTimeout">;
}) => {
  const store = createStore<TransitionStatus>({ mode: null, phase: "applying" });
  let disposed = false;
  let timer = 0;
  let running = false;
  let written: AppTransition | null = null;
  const publish = (mode: AppTransition | null, phase: TransitionStatus["phase"]) => {
    const previous = store.getSnapshot();
    if (!disposed && (previous.mode !== mode || previous.phase !== phase)) {
      store.set({ mode, phase });
    }
  };
  const tick = async () => {
    if (disposed || running) {
      return;
    }
    running = true;
    timers.clearTimeout(timer);
    const desired = settings.getSnapshot().appTransition;
    try {
      if (platform.preview) {
        written = desired;
        publish(desired, "ready");
      } else {
        if (written !== desired) {
          await platform.write(desired);
          written = desired;
        }
        const value = await platform.read();
        const status = value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {};
        const fresh =
          typeof status.updated_at === "number" &&
          now() - status.updated_at >= -1000 &&
          now() - status.updated_at < 6500;
        const ready =
          status.schema_version === 1 &&
          status.ready === true &&
          fresh &&
          status.mode === settings.getSnapshot().appTransition;
        publish(ready ? settings.getSnapshot().appTransition : null, ready ? "ready" : "unavailable");
      }
    } catch {
      publish(null, "unavailable");
    } finally {
      running = false;
      if (!disposed) {
        timer = timers.setTimeout(
          () => {
            void tick();
          },
          desired !== settings.getSnapshot().appTransition ? 50 : 1500,
        );
      }
    }
  };
  const unsubscribe = settings.subscribe(() => {
    if (settings.getSnapshot().appTransition !== written) {
      publish(null, "applying");
      void tick();
    }
  });
  void tick();
  return {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    dispose() {
      disposed = true;
      unsubscribe();
      timers.clearTimeout(timer);
      platform.dispose();
    },
  };
};
