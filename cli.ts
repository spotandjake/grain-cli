import { Command, Help, Option } from 'commander';
// import stdlibPath from "@grain/stdlib";
import config from "./deno.json" with { type: "json" };
import {
  ForwardOption, ProfileOption, listParser, intParser, defaultWasmLocation, type Options
} from "./utils.ts";

import setupCompileCommand, { compile } from "./commands/compile.ts";
import setupRunCommand, { run } from "./commands/run.ts";
import setupLspCommand from "./commands/lsp.ts";
import setupDocCommand from "./commands/doc.ts";
import setupFormatCommand from "./commands/format.ts";

const stdlibPath = new URL("./stdlib", import.meta.url).pathname;

// NOTE: The grain cli skips processing any arguments past `--`
let endOptsI = process.argv.findIndex((x) => x === "--");
if (endOptsI === -1) endOptsI = Infinity;
const argsToProcess = process.argv.slice(0, endOptsI);
const unprocessedArgs = process.argv.slice(endOptsI + 1);

class GrainHelp extends Help {
  override visibleOptions(cmd: any) {
    // If we are running `--help` at the root, we want to list options for `compile-and-run`
    if (cmd.name() === "grain") {
      return super.visibleOptions(
        cmd.commands.find((command: any) => command.name() === "compile-and-run"),
      );
    }
    return super.visibleOptions(cmd);
  }
}

const optionApplicator = (Option: any) =>
  function (this: Command, flags: string, description?: string, parser?: any, defaultValue?: any) {
    const option = new Option(flags, description);
    if (parser) option.argParser(parser);
    if (typeof defaultValue !== "undefined") option.default(defaultValue);
    return this.addOption(option);
  };

class GrainCommand extends Command {
  // Adds .forwardOption to commands. Similar to Commander's native .option,
  // but will forward the flag to the underlying program.
  forwardOption = optionApplicator(ForwardOption);

  // Adds .profileOption to commands. Similar to Commander's native .option,
  // but will convert the flag from the shorthand to the full form.
  profileOption = optionApplicator(ProfileOption);

  override createHelp() {
    return new GrainHelp();
  }

  override createCommand(name: string) {
    const cmd = new GrainCommand(name);
    // Add global options to command
    cmd.forwardOption(
      "-I, --include-dirs <dirs>",
      "add additional dependency include directories",
      listParser,
      [],
    );
    cmd.forwardOption(
      "-L, --library <libs>",
      "load libraries: -L name1=dir1,name2=dir2",
      listParser,
      [],
    );
    cmd.forwardOption(
      "-S, --stdlib <path>",
      "override the standard library with your own",
      null,
      stdlibPath,
    );
    cmd.forwardOption(
      "--target-dir <dir>",
      "directory where build artifacts are written",
    );
    cmd.forwardOption("--project-root <dir>", "project root directory");
    cmd.forwardOption(
      "--initial-memory-pages <size>",
      "initial number of WebAssembly memory pages",
      intParser,
    );
    cmd.forwardOption(
      "--maximum-memory-pages <size>",
      "maximum number of WebAssembly memory pages",
      intParser,
    );
    cmd.forwardOption("--import-memory", "import the memory from `env.memory`");
    cmd.forwardOption(
      "--elide-type-info",
      "don't include runtime type information used by toString/print",
    );
    cmd.profileOption(
      "--release",
      "compile using the release profile (production mode)",
    );
    cmd.forwardOption("--no-wasm-tail-call", "disables tail-call optimization");
    cmd.forwardOption("--debug", "compile with debugging information");
    cmd.forwardOption(
      "--wat",
      "additionally produce a WebAssembly Text (.wat) file",
    );
    cmd.forwardOption(
      "--hide-locs",
      "hide locations from intermediate trees. Only has an effect with `--verbose`",
    );
    cmd.forwardOption("--no-color", "disable colored output");
    cmd.forwardOption(
      "--no-gc",
      "turn off reference counting garbage collection",
    );
    cmd.forwardOption(
      "--no-bulk-memory",
      "polyfill WebAssembly bulk memory instructions",
    );
    cmd.forwardOption(
      "--wasi-polyfill <filename>",
      "path to custom WASI implementation",
    );
    cmd.forwardOption(
      "--no-pervasives",
      "don't automatically import the Grain Pervasives module",
    );
    cmd.forwardOption(
      "--memory-base <addr>",
      "set the base address for the Grain heap",
    );
    cmd.forwardOption("--source-map", "generate source maps");
    cmd.forwardOption("--strict-sequence", "enable strict sequencing");
    cmd.forwardOption(
      "--verbose",
      "print critical information at various stages of compilation",
    );
    return cmd;
  }
}

// Setup the CLI
const program = new GrainCommand();

// Setup the default compile-and-run command
program
  .description("Compile and run Grain programs. 🌾")
  // Show the default usage without "compile-and-run"
  .usage("[options] <file>")
  .addHelpCommand(false)
  // The default command that compiles & runs
  .command("compile-and-run <file>", { isDefault: true, hidden: true })
  // `--version` should only be available on the default command
  .version(config.version, "-v, --version", "output the current version")
  .forwardOption("-o <filename>", "output filename")
  .option("--dir <dir...>", "directory to preopen")
  .option("--env <env...>", "WASI environment variables")

  .action(async (file: string, options: {o?: string} & Options, program: Command) => {
    const success = await compile(file, options, program);
    if (success) {
      const outFile: string = options.o ?? defaultWasmLocation(file, options);
      run(outFile, options, program, unprocessedArgs);
    }
  });

// Setup the regular commands
setupCompileCommand(program, unprocessedArgs);
setupRunCommand(program, unprocessedArgs);
setupLspCommand(program, unprocessedArgs);
setupDocCommand(program, unprocessedArgs);
setupFormatCommand(program, unprocessedArgs);

// Parse the command-line arguments and execute the appropriate command
program.parse(argsToProcess);