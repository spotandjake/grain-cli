import { Command } from "@cliffy/command";
import config from "./deno.json" with { type: "json" };

import setupRunCommand from "./run.ts";
// TODO: Other commands
import setupFormatCommand from "./format.ts";

// Setup the default compile-and-run command
const cli = new Command()
  .name("grain")
  .version(config.version)
  .description("Compile and run Grain programs. 🌾");
  // TODO: Finish setting up the default command

// Add global options to command
// cli.option(
//   "-I, --include-dirs <dirs>",
//   "add additional dependency include directories",
//   list,
//   [],
// );
// cli.option(
//   "-S, --stdlib <path>",
//   "override the standard library with your own",
//   null,
//   stdlibPath,
// );
// cli.option(
//   "--initial-memory-pages <size>",
//   "initial number of WebAssembly memory pages",
//   num,
// );
// cli.option(
//   "--maximum-memory-pages <size>",
//   "maximum number of WebAssembly memory pages",
//   num,
// );
cli.globalOption(
  "--import-memory", "import the memory from `env.memory`",
  {
    default: false,
    value: (value: boolean) => { value: value ? `--import-memory` : "" }
  },
);
cli.globalOption(
  "--elide-type-info",
  "don't include runtime type information used by toString/print",
  { default: false}
);
cli.globalOption(
  "--release",
  "compile using the release profile (production mode)",
  { default: false}
);
cli.globalOption("--no-wasm-tail-call", "disables tail-call optimization", { default: false});
cli.globalOption("--debug", "compile with debugging information", { default: false});
cli.globalOption(
  "--wat",
  "additionally produce a WebAssembly Text (.wat) file",
  { default: false}
);
cli.globalOption(
  "--hide-locs",
  "hide locations from intermediate trees. Only has an effect with `--verbose`",
  { default: false}
);
cli.globalOption("--no-color", "disable colored output", { default: false});
cli.globalOption(
  "--no-gc",
  "turn off reference counting garbage collection",
  { default: false}
);
cli.globalOption(
  "--no-bulk-memory",
  "polyfill WebAssembly bulk memory instructions",
  { default: false}
);
cli.globalOption(
  "--wasi-polyfill <filename>",
  "path to custom WASI implementation",
  { default: false}
);
cli.globalOption(
  "--no-pervasives",
  "don't automatically import the Grain Pervasives module",
  { default: false}
);
cli.globalOption(
  "--memory-base <addr>",
  "set the base address for the Grain heap",
  { default: false}
);
cli.globalOption("--source-map", "generate source maps", { default: false});
cli.globalOption("--strict-sequence", "enable strict sequencing", { default: false});
cli.globalOption(
  "--verbose",
  "print critical information at various stages of compilation",
  { default: false}
);

// register commands
setupRunCommand(cli);
setupFormatCommand(cli);

// fallback
if (Deno.args.length === 0) {
  cli.showHelp();
  Deno.exit(0);
}

await cli.parse(Deno.args);