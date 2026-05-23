import { Command } from "@cliffy/command";

import { runCommand, optionsToArgs } from "../utils.ts";

// Setup the command
export default (cli: Command) => {
  cli.command("run <file:string>")
    .description("start the Grain LSP server")
    .option("--dir <dir...>", "directory to preopen")
    .option("--env <env...>", "WASI environment variables")
    .action((opts, file) => {
      // TODO: This needs to change
      console.log("Run command");
    });

  return cli;
};