// TODO: Clean this up???
export function optionsToArgs(opts: Record<string, any>, aliasMap: Record<string, { alias?: string; short?: boolean }>): string[] {
  const args: string[] = [];
  for (const [key, value] of Object.entries(opts)) {
    const alias = aliasMap[key];
    if (typeof value === "boolean") {
      if (value) args.push(`${alias?.short ? "-" : "--"}${alias?.alias || key}`);
    } else if (value !== undefined) {
      args.push(`${alias?.short ? "-" : "--"}${alias?.alias || key}`, String(value));
    }
  }
  return args;
}

export async function runCommand(name: string, args: string[]) {
  if (!name) throw new Error("No command provided");

  const base = new URL("./commands/", import.meta.url);
  const exe = new URL(`${name}.exe`, base);
  const js = new URL(`${name}.bc.cjs`, base);

  const isExe = await Deno.stat(exe).then(() => true).catch(() => false);

  const cmd = isExe
    ? new Deno.Command(exe, {
        args,
        stdout: "inherit",
        stderr: "inherit",
      })
    : new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", js.pathname, ...args],
        env: {
          // NOTE: This is used to redirect `main.ts` to the correct command when running from the compiled executable
          GRAIN_INTERNAL: JSON.stringify({
            script: js.pathname,
            args,
          }),
        },
        stdout: "inherit",
        stderr: "inherit",
      });

  const r = await cmd.output();

  if (!r.success) Deno.exit(r.code);
}