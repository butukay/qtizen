import { createPrivateFiles, type PrivateFileTizen } from "./createPrivateFiles";

type Timers = Pick<Window, "setTimeout" | "clearTimeout">;
const STATUS = "hdmi-wake-status.json";
const freshStatus = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const status = value as Record<string, unknown>;
  const age = Date.now() - Number(status.updated_at);
  return status.schema_version === 1 && status.ready === true && age >= 0 && age < 5000 ? status : null;
};

// Only an explicit source selection produces a short-lived request. Discovery never wakes devices.
export const wakeHdmiSource = (tizen: PrivateFileTizen, timers: Timers, port: number, done: () => void) => {
  const files = createPrivateFiles(tizen, timers);
  const id = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  let active = true;
  let poll: number | undefined;
  const stop = () => {
    active = false;
    timers.clearTimeout(deadline);
    if (poll !== undefined) {
      timers.clearTimeout(poll);
    }
    files.dispose();
  };
  const finish = () => {
    if (active) {
      stop();
      done();
    }
  };
  const deadline = timers.setTimeout(finish, 4500);
  const readReply = async () => {
    try {
      const status = freshStatus(await files.read(STATUS));
      if (!active) {
        return;
      }
      if (status?.request_id === id && status.port === port) {
        finish();
      } else {
        poll = timers.setTimeout(() => void readReply(), 150);
      }
    } catch {
      finish();
    }
  };
  void (async () => {
    try {
      if (!freshStatus(await files.read(STATUS)) || !Number.isInteger(port) || port < 1 || port > 4) {
        finish();
        return;
      }
      if (!active) {
        return;
      }
      await files.write("hdmi-wake-request.json", {
        schema_version: 1,
        request_id: id,
        port,
        requested_at: Date.now(),
      });
      if (active) {
        await readReply();
      }
    } catch {
      finish();
    }
  })();
  return stop;
};
