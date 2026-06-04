#!/usr/bin/env -S deno run --allow-read --allow-write
const files = [
  "./artifacts/grainc.bc.cjs",
  "./artifacts/graindoc.bc.cjs",
  "./artifacts/grainformat.bc.cjs",
  "./artifacts/grainlsp.bc.cjs"
];

const shims: [string | RegExp, string][] = [
  ["node:fs", "../shims/fs.cjs"],
];

for (const file of files) {
  let s = await Deno.readTextFile(file);

  for (const [from, to] of shims) {
    s = s.replaceAll(from, to as any);
  }

  await Deno.writeTextFile(file, s);
  console.log("patched", file);
}