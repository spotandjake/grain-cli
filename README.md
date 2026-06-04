# README

This repository contains a rather experimental rewrite of the grain cli using deno.

The reason for this rewrite is the current cli is built using `@yao-pkg/pkg` which is a great tool for generating binaries from node, however it often falls behind in packaging compared to the latest versions of node. The other reason is deno has much better security flags that allow us to furthur scope the permissions of the cli, and the final reason I started working on this is it seemed rather fun.

## Getting started
This project is rather simple to build, as long as the steps below are followed:

1) Run `deno install`
   - This will install the dependencies used by the project
2) Run `git clone https://github.com/grain-lang/grain`
   - This will clone the grain repo
   - It's important to switch to the `oscar/oos` build currently do to vfs restrictions within deno.
3) Follow the grain compiler setup / build process.
4) Run `npm run compiler build` && `npm run compiler build:js` in the grain directory.
5) Copy the `grain/cli/bin/*.exe`, `grain/cli/bin/*.bc.js` files into `./src/artifacts`
6) Rename the `*.bc.js` files to `*.bc.cjs`
7) Replace `"node:fs"` with `../shims/fs.cjs` in the `*bc.cjs` files
8) Copy the stdlib from grain into `src`
9) Run `deno task build` which will package the entire cli

Once the initial setup is run the project is active and any of the development commands will work, without adding the compiler artifacts and stdlib however the cli will fail to work as intended.


## Commands

### Grain

`deno task grain`, this is the cli's main command and accepts the same argument at the cli itself.

### Build

`deno task build`, this packages the entire cli into an executable which can be found at `./dist/grain`.

### Format

`deno task format`, this can be used to format the entire project.

### Check-format

`deno task check-format`, this can be used to check the formatting of the entire project (mainly used in ci).

### Clean

`deno task clean`, this will remove any artifact files, and wipe the stdlib. I would only run this if you plan on re setting up the cli.

## Notes

This section covers some important notes about this experiment that might be interesting. This section is split into two parts, the first one covers why the artifact setup works the way it does and the second one covers all the "hacks" and oddities that make this project work.

### Setup

The setup for this project is a little more convulted then I would like, the first issue is getting ahold of the `*.bc.js` and `*.exe` artifacts from the compiler, which need to be copied this could be done automatically but I have no clue where your working with grain and settting up a script to automate the copying would be convuluted or duplicate the build process. As such this has been left to the user. The story behind the stdlib is rather similar however, there is nothing truly stopping us from importing `@grain/stdlib` from npm, the main reason this doesn't work right now is to get around some deno virtual file system issues documented in the section below, we are using the `oscar/oos` branch of grain which means the stdlib is not published yet and as such not available on npm.

### Hacks

This section documents all the hacks that make this project work and what would be required to stop them.

#### Main.ts

The first hack is in the entry file of `main.ts`, in reality the main file of our cli is `cli.ts` however, if we entered directly there then when we call deno to run our artifact files through our sub commands we would get stuck in a loop with the cli. This is because `Deno.execPath` resolves to the compiled binary when we are running with `deno compile`, the way this hack works is when we call a subcommand we set an environmental variable indicating that we are trying to run a different script and instead of re-entering through the `cli` we now redirect the application to the artifact. Before redirecting we override the `argv` of the process with the new arguments as these would not have changed by default, this makes our artifacts think they are running in their own binary when really we've just hijacked the existing deno compile binary.

#### Shims

The second issue relates again to `deno compile` and the virtual file system. We ship the standard library in deno's vfs which means that when the compiler wants to operate on these files it's subject to the limit of the vfs, the `oscar/oos` branch was used because of this as we do not need to write object files to the stdlib directory and instead write them to a target directory however, the vfs still doesn't support `fstat` so our fs shim exists to stub bad calls to the vfs and prevent errors, while this could lead to unintended consequences if we weren't being careful because we are only loading the stdlib from here it's not really a problem.

A lot of these issues could be solved with deno's [`--self-extracting`](https://docs.deno.com/runtime/reference/cli/compile/#self-extracting-executables) flag which allows the compiled binary to extract it's vfs to a temporary folder on your system however this has been avoided as it makes things less portable.


## Merging with grain

This section covers what would be required to merge this with grain, in reality not much would be required I think the hardest thing to figure out is how deno is going to be interacting with our package.json files and npm. We would also need to find a good alternative for `npm link` we could use `deno install` but it's not live in the same way that `npm link` is, the best solution I could come up with is we use `npm link` to symlink a resolver binary that calls into our cli and executes our live cli script. I think the other question is if it's really worth switching to deno or not.