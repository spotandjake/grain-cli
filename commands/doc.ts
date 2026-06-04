import { type Command } from 'commander';

import { runCommand, ForwardOption, optionsToFlags, type Options } from "../utils.ts";

export const doc = async (file: string, opts: Options, program: Command) => {
  return await runCommand("graindoc", optionsToFlags(program, opts, [file]));
}
// Setup the command
export default (cli: Command, unprocessedArgs: string[]) => {
  cli.command("doc <file|dir:string>")
    .description("generate documentation for a grain file")
    .addOption(new ForwardOption("--current-version <version:string>", "provide a version to use as current when generating markdown for `@since` and `@history` attributes"))
    .addOption(new ForwardOption("-o <file|dir:string>", "output file or directory"))
    .action(async (file: string, opts: Options, program: Command) => {
      await doc(file, opts, program);
    });
  return cli;
};