import { type Command, Option } from "commander";
import path from "node:path";

export type Options = Record<string, unknown>;

/**
 * A ForwardOption is an option that is forwarded to the underlying ocaml program.
 */
export class ForwardOption extends Option {
  // A ForwardOption is forwarded to the underlying program
  public forward: boolean = true;
  public toFlag(opts: Options) {
    const value = opts[this.attributeName()];
    if (value instanceof Array && value.length > 0) {
      return `${this.long || this.short}=${value.join(",")}`;
    } else if (typeof value === "string" || typeof value === "number") {
      return `${this.long || this.short}=${value}`;
    } else if (
      (this.negate && value === false) ||
      (!this.negate && value === true)
    ) {
      return this.long || this.short;
    }
  }
}

export class ProfileOption extends Option {
  // Like ForwardOption, ProfileOption is forwarded to the underlying program
  // but we convert the flag into a profile flag, i.e. `--release` becomes `--profile=release`
  public forward: boolean = true;
  public toFlag(opts: Options) {
    const attribute = this.attributeName();
    if (opts[attribute]) {
      return `--profile=${attribute}`;
    }
  }
}

/** A parser for converting comma-separated strings into arrays. */
export const listParser = (val: string) => val.split(",").map((s) => s.trim());
/** A parser for converting strings to integers. */
export const intParser = (val: string) => Number.parseInt(val, 10);

/**
 * This function is responsible for converting Commander options into CLI flags that can be passed to the underlying ocaml tooling.
 *
 * @param program: The commander program instance containing the options to convert
 * @param options: The options object containing the values of the options to convert
 * @param positional: An array of positional arguments to include in the output
 * @returns An array of CLI flags corresponding to the provided options and positional arguments
 */
export const optionsToFlags = (
  program: Command,
  options: any,
  positional: string[],
) => {
  const flags: any[] = [];
  program.options.forEach((option: any) => {
    if (!option.forward) return;
    const flag = option.toFlag(options);
    if (flag) flags.push(flag);
  });
  return [...flags, ...positional];
};

/**
 * This function is responsible for determining the default location of the compiled wasm file according to grains conventions.
 *
 * @param file: The file being compiled
 * @param options: The options passed to the compiler of particular interest are `targetDir` and `release` which determine the target directory and profile respectively
 * @returns The default wasm output location
 */
export const defaultWasmLocation = (
  file: string,
  options: { targetDir?: string; release?: boolean } & Options,
): string => {
  const targetDir = options.targetDir
    ? path.resolve(options.targetDir)
    : path.resolve("target");
  const profile = options.release ? "release" : "debug";
  const basename = path.basename(file).replace(/\.gr$/, ".wasm");
  return path.join(targetDir, profile, basename);
};

/**
 * This function is responsible for running a grain command, either by running the compiled
 * executable if available, or by running the compiled JavaScript file with `deno run` if
 * the executable is not available.
 *
 * @param name: The name of the command to run (e.g. "grainc", "grainfmt", etc.)
 * @param args: The cli arguments to pass to the command (e.g. ["--release", "src/index.gr"])
 * @returns A promise resolving to a boolean indicating whether the command succeeded.
 */
export async function runCommand(name: string, args: string[]) {
  if (!name) throw new Error("No command provided");

  const base = new URL("./artifacts/", import.meta.url);
  const exe = new URL(`${name}.exe`, base);
  const js = new URL(`${name}.bc.cjs`, base);

  // Check if the executable exists. If it does, we can run it directly.
  const isExe = await Deno.stat(exe).then(() => true).catch(() => false);

  const cmd = isExe
    ? new Deno.Command(exe, {
      args,
      stdout: "inherit",
      stderr: "inherit",
    })
    : new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", js.pathname, ...args],
      env: {
        // NOTE: This is used to redirect `main.ts` to the correct command when running from the compiled executable
        GRAIN_INTERNAL: JSON.stringify({
          script: js.pathname,
          args,
        }),
      },
      stdout: "inherit",
      stderr: "inherit",
    });

  const r = await cmd.output();

  return r.success;
}
