import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "../utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("doc <file|dir:string>")
    .description("generate documentation for a grain file")
    .option("--current-version <version:string>", "provide a version to use as current when generating markdown for `@since` and `@history` attributes")
    .option("-o, --output <file|dir:string>", "output file or directory")
    .action((opts, file) => {
      runCommand(
        "graindoc",
        // TODO: This needs to be re-worked slightly
        [file, ...optionsToArgs(opts, { "output": { "alias": "o", short: true } })]
      );
    });

  return cli;
};