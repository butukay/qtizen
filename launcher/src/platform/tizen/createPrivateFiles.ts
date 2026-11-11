interface FileStream {
  close(): void;
  read(length: number): string;
  write(value: string): void;
}
interface PrivateFile {
  createFile(name: string): PrivateFile;
  readonly fileSize: number;
  readonly fullPath: string;
  moveTo(from: string, to: string, overwrite: boolean, done: () => void, failed: (error: unknown) => void): void;
  openStream(
    mode: string,
    done: (stream: FileStream) => void,
    failed: (error: unknown) => void,
    encoding: string,
  ): void;
  resolve(name: string): PrivateFile;
}
export interface PrivateFileTizen {
  filesystem?: {
    resolve(path: string, done: (file: PrivateFile) => void, failed: (error: unknown) => void, mode: string): void;
  };
}
export const createPrivateFiles = (
  tizen: PrivateFileTizen | null | undefined,
  timers: Pick<Window, "setTimeout" | "clearTimeout">,
) => {
  let disposed = false;
  let generation = 0;
  const pending = new Set<() => void>();
  const operation = <T>(
    start: (done: (value: T) => void, failed: (error: unknown) => void, active: () => boolean) => void,
  ) =>
    new Promise<T>((resolve, reject) => {
      let settled = false;
      const finish = (value: T | undefined, error?: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        timers.clearTimeout(timer);
        pending.delete(cancel);
        if (error) {
          reject(error instanceof Error ? error : new Error("Private file operation failed"));
        } else {
          resolve(value as T);
        }
      };
      const cancel = () => finish(undefined, new Error("Private file operation cancelled"));
      const timer = timers.setTimeout(cancel, 2000);
      pending.add(cancel);
      if (disposed) {
        cancel();
        return;
      }
      try {
        start(
          (value) => finish(value),
          (error) => finish(undefined, error || new Error("Private file operation failed")),
          () => !settled && !disposed,
        );
      } catch (error) {
        finish(undefined, error);
      }
    });
  const resolveFile = (path: string, mode: string) =>
    operation<PrivateFile>((done, failed) => {
      if (!tizen?.filesystem) {
        throw new Error("Private storage unavailable");
      }
      tizen.filesystem.resolve(path, done, failed, mode);
    });
  return {
    async write(name: string, value: unknown) {
      const current = ++generation;
      const directory = await resolveFile("wgt-private", "rw");
      if (disposed || current !== generation) {
        return;
      }
      let file: PrivateFile;
      try {
        file = directory.resolve(name + ".pending");
      } catch {
        file = directory.createFile(name + ".pending");
      }
      await operation<void>((done, failed, active) => {
        file.openStream(
          "w",
          (stream) => {
            try {
              if (active() && current === generation) {
                stream.write(JSON.stringify(value));
              }
            } catch (error) {
              failed(error);
            } finally {
              try {
                stream.close();
              } catch (error) {
                failed(error);
              }
            }
            done(undefined);
          },
          failed,
          "UTF-8",
        );
      });
      if (disposed || current !== generation) {
        return;
      }
      await operation<void>((done, failed) => {
        directory.moveTo(file.fullPath, directory.fullPath + "/" + name, true, () => done(undefined), failed);
      });
    },
    async read(name: string) {
      const file = await resolveFile("wgt-private/" + name, "r");
      if (!(file.fileSize > 0 && file.fileSize <= 4096)) {
        throw new Error("Invalid private file");
      }
      return operation<unknown>((done, failed, active) => {
        file.openStream(
          "r",
          (stream) => {
            try {
              if (active()) {
                done(JSON.parse(stream.read(file.fileSize)) as unknown);
              }
            } catch (error) {
              failed(error);
            } finally {
              try {
                stream.close();
              } catch (error) {
                failed(error);
              }
            }
          },
          failed,
          "UTF-8",
        );
      });
    },
    dispose() {
      disposed = true;
      generation++;
      [...pending].forEach((cancel) => cancel());
    },
  };
};
