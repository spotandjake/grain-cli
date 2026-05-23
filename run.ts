import { Command } from "@cliffy/command";

// Setup the command
export default (cli: Command) => {
  cli.command("run <file:string>")
    .description("run a wasm file via grain's WASI runner")
    .option("--dir <dir...>", "directory to preopen")
    .option("--env <env...>", "WASI environment variables")
    .action((opts, file) => {
      console.log("run", file, opts);
    });

  return cli;
};