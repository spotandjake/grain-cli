import { type Command } from 'commander';

import { runCommand, ForwardOption, optionsToFlags, type Options } from "../utils.ts";

export const format = async (file: string, opts: Options, program: Command) => {
  return await runCommand("grainformat", optionsToFlags(program, opts, [file]));
}
// Setup the command
export default (cli: Command, unprocessedArgs: string[]) => {
  cli.command("format <file|dir:string>")
    .description("format a grain file")
    .addOption(new ForwardOption("-o <file|dir:string>", "output file or directory"))
    .action(async (file: string, opts: Options, program: Command) => {
      await format(file, opts, program);
    });
  return cli;
};