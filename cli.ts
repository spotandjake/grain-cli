import { Command } from "@cliffy/command";
import stdlibPath from "@grain/stdlib";
import config from "./deno.json" with { type: "json" };

import setupCompileCommand from "./commands/compile.ts";
import setupRunCommand from "./commands/run.ts";
import setupLspCommand from "./commands/lsp.ts";
import setupDocCommand from "./commands/doc.ts";
import setupFormatCommand from "./commands/format.ts";

// Setup the default compile-and-run command
const cli = new Command()
  .name("grain")
  .version(config.version)
  .description("Compile and run Grain programs. 🌾");
// TODO: Finish setting up the default command

// Add global options to command
// cli.globalOption(
//   "-I, --include-dirs <dirs:string[]>",
//   "add additional dependency include directories",
//   { default: []}
// );
cli.globalOption(
  "-S, --stdlib <path:string>",
  "override the standard library with your own",
  { default: stdlibPath }
);
cli.globalOption(
  "--initial-memory-pages <size:integer>",
  "initial number of WebAssembly memory pages"
);
cli.globalOption(
  "--maximum-memory-pages <size:integer>",
  "maximum number of WebAssembly memory pages"
);
cli.globalOption("--import-memory", "import the memory from `env.memory`", {
  default: false,
});
cli.globalOption(
  "--elide-type-info",
  "don't include runtime type information used by toString/print",
  { default: false },
);
cli.globalOption(
  "--release",
  "compile using the release profile (production mode)",
  { default: false },
);
cli.globalOption("--no-wasm-tail-call", "disables tail-call optimization", {
  default: false,
});
cli.globalOption("--debug", "compile with debugging information", {
  default: false,
});
cli.globalOption(
  "--wat",
  "additionally produce a WebAssembly Text (.wat) file",
  { default: false },
);
cli.globalOption(
  "--hide-locs",
  "hide locations from intermediate trees. Only has an effect with `--verbose`",
  { default: false },
);
cli.globalOption("--no-color", "disable colored output", { default: false });
cli.globalOption("--no-gc", "turn off reference counting garbage collection", {
  default: false,
});
cli.globalOption(
  "--no-bulk-memory",
  "polyfill WebAssembly bulk memory instructions",
  { default: false },
);
cli.globalOption(
  "--wasi-polyfill <filename>",
  "path to custom WASI implementation",
  { default: false },
);
cli.globalOption(
  "--no-pervasives",
  "don't automatically import the Grain Pervasives module",
  { default: false },
);
cli.globalOption(
  "--memory-base <addr>",
  "set the base address for the Grain heap",
  { default: false },
);
cli.globalOption("--source-map", "generate source maps", { default: false });
cli.globalOption("--strict-sequence", "enable strict sequencing", {
  default: false,
});
cli.globalOption(
  "--verbose",
  "print critical information at various stages of compilation",
  { default: false },
);

// register commands
// program
//   .description("Compile and run Grain programs. 🌾")
//   // Show the default usage without "compile-and-run"
//   .usage("[options] <file>")
//   .addHelpCommand(false)
//   // The default command that compiles & runs
//   .command("compile-and-run <file>", { isDefault: true, hidden: true })
//   // `--version` should only be available on the default command
//   .version(pkgJson.version, "-v, --version", "output the current version")
//   .forwardOption("-o <filename>", "output filename")
//   .option("--dir <dir...>", "directory to preopen")
//   .option("--env <env...>", "WASI environment variables")

//   .action(function (file, options, program) {
//     const success = exec.grainc(file, options, program);
//     if (success) {
//       const outFile = options.o ?? file.replace(/\.gr$/, ".wasm");
//       exec.grainrun(unprocessedArgs, outFile, options, program);
//     }
//   });

setupCompileCommand(cli);
setupRunCommand(cli);
setupLspCommand(cli);
setupDocCommand(cli);
setupFormatCommand(cli);

// fallback
if (Deno.args.length === 0) {
  cli.showHelp();
  Deno.exit(0);
}

await cli.parse(Deno.args);
