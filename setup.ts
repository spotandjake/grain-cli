#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
// Usage: `./setup.ts <GRAIN_ROOT>`

const [GRAIN_ROOT] = Deno.args;
if (!GRAIN_ROOT) throw new Error("Usage: setup <GRAIN_ROOT>");
const ROOT = "./src/artifacts";
const STDLIB_DIR = `${ROOT}/stdlib`;

// Helpers
const error = (msg: string) => {
  throw new Error(`[Error]: ${msg}`);
};
const log = (msg: string) => console.log(`[Setup]: ${msg}`);
// Check if the provided GRAIN_ROOT is valid
if (!(await Deno.stat(GRAIN_ROOT)).isDirectory) {
  error(`Invalid GRAIN_ROOT: ${GRAIN_ROOT} is not a directory`);
}
if (!(await Deno.stat(`${GRAIN_ROOT}/cli/bin`)).isDirectory) {
  error(`Invalid GRAIN_ROOT: ${GRAIN_ROOT}/cli/bin is not a directory`);
}
if (!(await Deno.stat(`${GRAIN_ROOT}/stdlib`)).isDirectory) {
  error(`Invalid GRAIN_ROOT: ${GRAIN_ROOT}/stdlib is not a directory`);
}

// Clean the artifacts directory
log("Cleaning artifacts directory...");
for await (const e of Deno.readDir(ROOT)) {
  await Deno.remove(`${ROOT}/${e.name}`, { recursive: e.isDirectory });
}
// Copy the *.bc.js files
log("Copying .bc.js files");
for await (const e of Deno.readDir(`${GRAIN_ROOT}/cli/bin`)) {
  if (e.isFile && e.name.endsWith(".bc.js")) {
    const data = await Deno.readFile(`${GRAIN_ROOT}/cli/bin/${e.name}`);
    await Deno.writeFile(`${ROOT}/${e.name}`, data);
  }
}
// Copy the *.exe files
log("Copying .exe files");
for await (const e of Deno.readDir(`${GRAIN_ROOT}/cli/bin`)) {
  if (e.isFile && e.name.endsWith(".exe")) {
    const data = await Deno.readFile(`${GRAIN_ROOT}/cli/bin/${e.name}`);
    await Deno.writeFile(`${ROOT}/${e.name}`, data);
  }
}
// Rename the .bc.js files to .bc.cjs and patch the imports
log("5-6) Rename + patch");
for await (const e of Deno.readDir(ROOT)) {
  if (!e.isFile || !e.name.endsWith(".bc.js")) continue;

  const oldPath = `${ROOT}/${e.name}`;
  const newPath = oldPath.replace(/\.bc\.js$/, ".bc.cjs");

  await Deno.rename(oldPath, newPath);

  const text = await Deno.readTextFile(newPath);
  await Deno.writeTextFile(
    newPath,
    text.replaceAll("node:fs", "../shims/fs.cjs"),
  );
}
// Copy the stdlib files and set permissions to readable and writeable
log("7) Copy stdlib");
await Deno.mkdir(STDLIB_DIR, { recursive: true });
const queue = [""];
while (queue.length > 0) {
  const relDir = queue.shift()!;
  const srcDir = `${GRAIN_ROOT}/stdlib/${relDir}`;
  const dstDir = `${STDLIB_DIR}/${relDir}`;
  await Deno.mkdir(dstDir, { recursive: true });
  for await (const entry of Deno.readDir(srcDir)) {
    const srcPath = `${srcDir}/${entry.name}`;
    const dstPath = `${dstDir}/${entry.name}`;

    if (entry.isDirectory) {
      queue.push(`${relDir}${entry.name}/`);
      continue;
    }

    if (entry.isFile && entry.name.endsWith(".gr")) {
      await Deno.copyFile(srcPath, dstPath);
      await Deno.chmod(dstPath, 0o644);
    }
  }
}
// Clean the stdlib to reduce bundle size
log("Strip stdlib");
for await (const e of Deno.readDir(STDLIB_DIR)) {
  if (e.isFile && !e.name.endsWith(".gr")) {
    await Deno.remove(`${STDLIB_DIR}/${e.name}`);
  }
}
