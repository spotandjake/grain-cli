# README

This repository contains a rather experimental rewrite of the grain cli using deno.

The reason for this rewrite is the current cli is built using `@yao-pkg/pkg` which is a great tool for generating binaries from node, however it often falls behind in packaging compared to the latest versions of node. The other reason is deno has much better security flags that allow us to furthur scope the permissions of the cli, and the final reason I started working on this is it seemed rather fun.

## Getting started
This project is rather simple to build, as long as the steps below are followed:

1) Run `deno install`
2) Run `git clone https://github.com/grain-lang/grain`
   1) If the grain repo is already on your system you can use that instead.
   2) Switch to the `oscar/oos` branch (This is required)
   3) Follow the grain compiler setup / build process.
   4) Run `npm run compiler build`
   5) Run `npm run compiler build:js`
3) Run `deno task setup ./grain`
   1) If you are using a different directory for grain replace `./grain` with the directory.
4) Run `deno task build` which will package the entire cli.

Once the initial setup is run the project is active and any of the development commands will work, without adding the compiler artifacts and stdlib however the cli will fail to work as intended.


## Commands

### Grain

`deno task grain`, this is the cli's main command and accepts the same argument at the cli itself.

### Build

`deno task build`, this packages the entire cli into an executable which can be found at `./dist/grain`.

### Setup

`deno task setup <GRAIN_ROOT>`, this copies the required artifacts from the grain repository.

### Format

`deno task format`, this can be used to format the entire project.

### Check-format

`deno task check-format`, this can be used to check the formatting of the entire project (mainly used in ci).

### Clean

`deno task clean`, this will remove any artifact files, and wipe the stdlib. I would only run this if you plan on re setting up the cli.

## Hacks

This section describes some of the more important hacks that are performed in the cli in depth and why, along with what would allow us to remove these "hacks". While I am refering to these as hacks not everything listed is explicitly a hack and some are just design decisions.

A lot of these hacks could be solved with deno's [`--self-extracting`](https://docs.deno.com/runtime/reference/cli/compile/#self-extracting-executables) flag which allows the compiled binary to extract it's vfs to a temporary folder on your system however this has been avoided as it makes things less portable.

### Main.ts

The largest hack is that of `main.ts` while the true entry point for the cli is `./src/cli.ts` and this can be used as the entry point while running with `deno run` we must use `main.ts` with `deno compile` the reason for this is similar to issues I was running into when experimenting with `node-sea` where `process.execPath` / `deno.execPath` point's to the compiled deno executable which will always enter through the default entry point no matter what script you call it with, this works differently then when using the standard `deno run` where calling deno again from inside would run it with the new script. The solution to this is to put a script in front of the cli itself that can detect if we are trying to run the main cli or a subscript. The way I implemented this is to use an environmental variable, `GRAIN_INTERNAL` which passes the arguments and such which we can then rewrite and trick the executable into thinking it was called like a separate script.

I think this hack is going to exist long term if we wanted to get rid of it we would need to rework the way that grain compiles and instead of exposing `grainc` and other tooling as cli applications we would want to expose them as library functions, and call them via worker threads. I don't think this hack is obscure or complex though so for the time being it seems fine to include. Some questions may be raised around the choice of an environment variable this was chosen because there aren't many other alternatives or flags I can use to pass the downside of this choice is technically an actor on the system could override this flag which may mess up the cli, we could easily add additional protections against this however and I really don't think its a major worry.

### `oscar/oos`

The next key decision and this one truly isn't a hack is the use of the `oscar/oos` branch the reason for this decision is that working off main we build object files inline with the source this means that when compiling the stdlib we would try and write to the vfs which isn't great in pkg we could avoid this by remapping writes to a `target` directory and while this could be done with our vfs shim it's rather complex and seemed rather fragile.

If we want to fix this better long term I suggest that we handle this on the grain side of things. Using the out of source builds branch is a great fix though as it writes to a `target` directory by default. The write behaviour may still cause issues related to `--debug` / `--verbose` calls however as those would likely try to write alongside the stdlib in the vfs, this can be solved in the fs shim rather easily again. 

### `./shims/fs.cjs`

This is the largest hack in this project, the idea is that when working on this I noticed that we were still hitting `NotSupported` errors from the vfs, that were coming from `fs.fstatSync` calls this just seems to be an issue up stream in deno and once deno `v2.8.3` is released we could easily drop this as a nicer version of my shim was introduced upstream. This shim essentially just allows us to wrap fs functions with override logic as we please.
