import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "../utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("format <file|dir:string>")
    .description("format a grain file")
    .option("-o, --output <file|dir:string>", "output file or directory")
    .action((opts, file) => {
      runCommand(
        "grainformat",
        // TODO: This needs to be re-worked slightly
        [file, ...optionsToArgs(opts, { "output": { "alias": "o", short: true } })]
      );
    });

  return cli;
};