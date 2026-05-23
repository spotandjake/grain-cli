import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "../utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("lsp")
    .description("start the Grain LSP server")
    .action((opts) => {
      console.log(opts);
      // runCommand("grainlsp", optionsToArgs(opts, {}));
    });

  return cli;
};