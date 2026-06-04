import { type Command } from "commander";

import { type Options, optionsToFlags, runCommand } from "../utils.ts";

export const lsp = async (opts: Options, program: Command) => {
  return await runCommand("grainlsp", optionsToFlags(program, opts, []));
};

export default (cli: Command, unprocessedArgs: string[]) => {
  cli.command("lsp")
    .description("start the Grain LSP server")
    .action(async (opts: Options, program: Command) => {
      await lsp(opts, program);
    });
  return cli;
};
