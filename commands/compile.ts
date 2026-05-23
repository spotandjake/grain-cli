import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "../utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("compile <file:string>")
    .description("compile a grain program into wasm")
    .option("-o, --output <filename:string>", "output filename")
    .option("--single-file", "compile a single file without compiling dependencies")
    .option("--use-start-section", "replaces the _start export with a start section during linking")
    // .option("--no-link", "disable static linking")
    .action((opts, file) => {
      runCommand(
        "grainc",
        // TODO: This needs to be re-worked slightly
        [file, ...optionsToArgs(opts, { "output": { "alias": "o", short: true } })]
      );
    });

  return cli;
};