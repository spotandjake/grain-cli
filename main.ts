// NOTE: This is a bit of a hack to allow us to run sub deno commands 
// from the compiled executable, without having to extract the compiled commands.
const internalFlag = Deno.env.get("GRAIN_INTERNAL"); // This is set by `utils.runCommand`
if (internalFlag == undefined) {
  await import("./cli.ts");
} else {
  const internalConfig = JSON.parse(internalFlag);
  globalThis.process.argv = ["", internalConfig.script, ...internalConfig.args];
  await import(internalConfig.script);
}