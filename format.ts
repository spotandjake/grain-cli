import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "./utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("format <file|dir:string>")
    .description("format a grain file")
    .option(
      "-o, --output <file|dir:string>",
      "output file or directory",
      (value: string) => { value: `--o=${value}` }
    )
    .action((opts, file) => {
      console.log(opts);
      console.log(cli);
      runCommand(
        "grainformat",
        [file, ...optionsToArgs(opts, { "output": { "alias": "o", short: true } })]
      );
    });

  return cli;
};