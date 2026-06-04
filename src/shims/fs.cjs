// This file exists to shim `fs.fstatSync` when it is called on a file descriptor from the deno vfs.
// The deno vfs does not support `fstatSync` and will throw a `NotSupported` error when it is called.
// This shim catches that error and returns a fake `Stats` object that indicates that the file is a
// regular file with a size of 0 and a modification time of the Unix epoch.
// This allows the compiler to use files from the stdlib.
const realFs = require("node:fs");

function wrapFstatSync(fn) {
  return function (...args) {
    try {
      return fn.apply(realFs, args);
    } catch (err) {
      // We only want to handle the `NotSupported` error thrown by the deno vfs
      if (err.name !== "NotSupported") throw err;
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: 0,
        mtime: new Date(0),
        ctime: new Date(0),
      };
    }
  };
}

const fs = {
  ...realFs,
  fstatSync: wrapFstatSync(realFs.fstatSync),
};

module.exports = fs;
