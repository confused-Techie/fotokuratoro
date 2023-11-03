const path = require("path");
const fs = require("fs");
const sizeOf = require("image-size");
const inspectDuplicate = require("./inspectDuplicate.js");

module.exports =
async function inspect(file, pathArray, filename, opts, stats) {
  // The inspect function contains the real logic of this application.
  // Being the one to actually preform any and all actions configured.

  // This array will collect all gathered potential actions as determined by
  // each method of inspection
  let potentialActions = [];

  let ext = path.extname(filename);

  if (ext === "") {
    // This could be empty if no extension is specified, or if the filename begins with a '.'
    ext = filename;
  }

  ext = ext.toLowerCase();

  if (opts.inspectImageSize && IMAGE_SIZE_SUPPORTED_FILES.includes(ext)) {
    // Removes files deemed to small
    const dimensions = sizeOf(file);

    if (typeof opts.smallestWidth === "number") {
      if (dimensions.width <= opts.smallestWidth) {
        potentialActions.push({
          action: "delete",
          reason: `The image's width '${dimensions.width}' is smaller than the smallest configured width '${opts.smallestWidth}'.`
        });
      }
    }
    if (typeof opts.smallestHeight === "number") {
      if (dimensions.height <= opts.smallestHeight) {
        potentialActions.push({
          action: "delete",
          reason: `The image's height '${dimensions.height}' is smaller than the smallest configured height '${opts.smallestHeight}'.`
        });
      }
    }
  }

  if (opts.inspectRename) {
    // Renames nonstandard file extensions
    const renamableExtensions = {
      ".png_large": ".png",
      ".jpg_large": ".jpg",
      ".jpg_medium": ".jpg",
      ".jpg_small": ".jpg",
      ".jpg!d": ".jpeg"
    };

    if (typeof renamableExtensions[ext] === "string") {
      potentialActions.push({
        action: "rename",
        reason: `The extensions '${ext}' should likely be renamed to '${renamableExtensions[ext]}' for better support.`,
        newName: filename.replace(ext, renamableExtensions[ext])
      });
    }
  }

  if (opts.inspectDuplicate) {
    // Removes duplicate files
    let duplicateAction = await inspectDuplicate(file, filename, opts);
    if (duplicateAction.length != 0) {
      potentialActions = potentialActions.concat(duplicateAction);
    }
  }


  return potentialActions;
}

const IMAGE_SIZE_SUPPORTED_FILES = [
  ".bpm",
  ".cur",
  ".dds",
  ".gif",
  ".icns",
  ".ico",
  ".j2c",
  ".jpeg",
  ".ktx",
  ".png",
  ".pnm",
  ".pam",
  ".pbm",
  ".pfm",
  ".pgm",
  ".ppm",
  ".psd",
  ".svg",
  ".tga",
  ".tiff",
  ".webp"
];
