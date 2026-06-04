import { type Command } from 'commander';

import { runCommand, ForwardOption, optionsToFlags, type Options } from "../utils.ts";

export const compile = async (file: string, opts: Options, program: Command) => {
  return await runCommand("grainc", optionsToFlags(program, opts, [file]));
}
// Setup the command
export default (cli: Command, unprocessedArgs: string[]) => {
  cli.command("compile <file:string>")
    .description("compile a grain program into wasm")
    .addOption(new ForwardOption("-o <filename:string>", "output filename"))
    .addOption(new ForwardOption("--single-file", "compile a single file without compiling dependencies"))
    .addOption(new ForwardOption("--use-start-section", "replaces the _start export with a start section during linking"))
    .addOption(new ForwardOption("--no-link", "disable static linking"))
    .action(async (file: string, opts: Options, program: Command) => {
      await compile(file, opts, program);
    });
  return cli;
};