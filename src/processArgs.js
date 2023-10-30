const path = require("path");
const inspect = require("./inspect.js");

module.exports =
function processArgs(args) {
  let dir;

  if (args.length == 0) {
    // No directory was passed. So we will use the current working directory
    dir = process.cwd();
  } else if (args[0] === ".") {
    // Since this means the current dir we will do the same as above
    dir = process.cwd();
  } else if (args[0].startsWith(".")) {
    // The user has provided a local path
    dir = path.resolve(args[0]);
  } else {
    // The user has provided something else, that we will assume is a full path
    dir = args[0];
  }

  // TODO look for config file
  return {
    directory: dir,
    inspect: inspect,
    verbose: false,
    inspectImageSize: true,
    smallestWidth: 320,
    smallestHeight: 480,
    inspectRename: true,
    inspectDuplicate: true
  };
}
