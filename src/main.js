const fs = require("fs");
const path = require("path");
const processArgs = require("./processArgs.js");

let opts = {};
let stats = {
  files: [],
  errors: []
};
let actions = [];

async function run(args) {
  opts = processArgs(args);

  // The opts object that's returned contains all steps we need to run.
  // Including any optional ones that have been added via plugins
  // The default steps should be:
  // - collect: This step collects the file we care about
  // - inspect: This step inspects the file to determine any actions to take
  // - act: This step then marks an action to be preformed. Such as deletion

  await enumerateFiles(opts.directory, [], handleFile);

  // After checking all files we can then provide options to the user on actions to take,
  // or output statistics on what was done

  console.log(`Checked ${stats.files.length} total files.`);

  if (opts.verbose) {
    console.log("Verbose File Details:");
    console.log(stats.files);
  }

}

async function handleFile(file, pathArray, filename, immediateReturn) {

  try {
    let act = await opts.inspect(file, pathArray, filename, opts, stats);

    // It's possible no action should be taken on a file, in which case we would get 'false'

    if (act) {
      actions.push({
        file: file,
        pathArray: pathArray,
        action: act
      });
    }

  } catch (err) {
    console.error(err);
    stats.errors.push({
      msg: err.toString(),
      err: err
    });
  }

  stats.files.push({
    file: file,
    filename: filename
  });
}

async function enumerateFiles(dir, pathArray, fileCallback) {
  // dir: The starting directory
  // pathArray: The array of path entries
  // fileCallback: Function to invoke when a file is found
  // When a callback is invoked the following is passed:
  // - file: Which is the file and it's preceeding path. A relative path to a specific file.
  // - pathArray: The path as an array leading up to that file, from the initial dir passed.
  // - filename: The specific file's name.
  // - immediateReturn: An overloaded paramter passed only when the immediate dir
  //   passed was a direct file path.

  if (fs.lstatSync(dir).isFile()) {
    // The initial dir is a file, not a dir
    await fileCallback(dir, pathArray, path.basename(dir), true);
    return;
  }

  let files = fs.readdirSync(dir);

  for (const file of files) {
    let target = path.join(dir, file);

    if (fs.lstatSync(target).isDirectory()) {
      await enumerateFiles(`./${target}`, [ ...pathArray, file], fileCallback);
    } else {
      await fileCallback(target, pathArray, file);
    }
  }
}

module.exports = {
  run,
};
