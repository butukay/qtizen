import type { AppTransition } from "./preferences";

export interface TransitionStatus {
  readonly mode: AppTransition | null;
  readonly phase: "ready" | "applying" | "unavailable";
}
export interface TransitionPlatform {
  dispose(): void;
  readonly preview: boolean;
  read(): Promise<unknown>;
  write(mode: AppTransition): Promise<void>;
}
