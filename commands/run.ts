import { type Command } from 'commander';
import { readFile } from "node:fs/promises";
import { WASI } from "node:wasi";
import { argv, env } from "node:process";


import { runCommand, type Options } from "../utils.ts";

// NOTE: Monkey patch emitWarning to ignore the WASI experimental warning until it's stabilized
if ((globalThis as any).process?.emitWarning) {
  const original = globalThis.process.emitWarning;
  globalThis.process.emitWarning = function (msg: any, type: any) {
    if (msg?.includes?.("WASI is an experimental feature")) return;
    return original.call(this, msg, type);
  };
}

export type RunOptions = {
  dir?: string[];
  env?: string[];
} & Options;

export const run = async (filename: string, opts: RunOptions, program: Command, unprocessedArgs: string[]) => {
  const preopens: { [key: string]: string } = {};
  opts.dir?.forEach((preopen) => {
    const [guestDir, hostDir = guestDir] = preopen.split("=");
    preopens[guestDir] = hostDir;
  });

  const cliEnv: { [key: string]: string } = {};
  opts.env?.forEach((env) => {
    const [name, ...rest] = env.split("=");
    const val = rest.join("=");
    cliEnv[name] = val;
  });

  const wasi = new WASI({
    args: unprocessedArgs,
    env: cliEnv,
    preopens: preopens,
    version: "preview1",
    returnOnExit: false,
  });

  const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

  let bytes;
  try {
    bytes = await readFile(filename);
  } catch (err: unknown) {
    console.error(`Unable to read file: ${filename}`);
    process.exitCode = 1;
    return;
  }

  let wasm;
  try {
    wasm = await WebAssembly.compile(new Uint8Array(bytes));
  } catch (err: any) {
    if (filename.endsWith(".gr")) {
      console.error(
        `The \`grain run\` command is used on compiled \`.wasm\` files.`,
      );
      console.error(
        `To compile and run your \`.gr\` file, use \`grain ${filename}\``,
      );
    } else {
      console.error(`Unable to compile WebAssembly module.`);
      console.error(err.stack);
    }
    process.exitCode = 1;
    return;
  }

  let instance;
  try {
    instance = await WebAssembly.instantiate(wasm, importObject);
  } catch (err: any) {
    console.error(`Unable to instantiate WebAssembly module.`);
    console.error(err.stack);
    process.exitCode = 1;
    return;
  }

  try {
    wasi.start(instance);
  } catch (err: any) {
    console.error(err.stack);
    process.exitCode = 1;
    return;
  }
}
// Setup the command
export default (cli: Command, unprocessedArgs: string[]) => {
  cli.command("run <file:string>")
    .description("run a wasm file via grain's WASI runner")
    .option("--dir <dir...>", "directory to preopen")
    .option("--env <env...>", "WASI environment variables")
    .action(async (file: string, opts: Options, program: Command) => {
      await run(file, opts, program, unprocessedArgs);
    });

  return cli;
};