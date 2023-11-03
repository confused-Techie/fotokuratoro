/*
 * This module will attempt to discover any possible duplicates that may exist
 * within a given set of images.
 * It does this with different techniques, that all primarly look like so:
 * - Grab the image and generate some data form of it
 * - Use said data to then compare against all other known images
 * - Determine a level of confidence that an image is identical.
 */

const { Buffer } = require("node:buffer");
const { Magick, Color } = require("node-magickwand");
const algo = require("./algorithms.js");

// This object will contain data on every single image
// TODO: May be a good idea to look at optimizing for ram, or storage
// As a huge amount of images, will very likely cause issues this way
const IMAGES = {};
const dHashSimilarityScore = 10;

module.exports =
async function main(filepath, filename, opts) {

  let im = new Magick.Image(filepath);
  let width = im.size().width();
  let height = im.size().height();

  IMAGES[filename] = {
    image: im, // If we store this data on disk, we cannot keep this value (As it won't be decoded into JSON properly)
    width: width,
    height: height
  };

  // From here we can generate our forms of data, or we can compare against others
  let dHashData = await dHash(filepath);
  IMAGES[filename].dHash = dHashData;

  let dupFound = await scanImages();

  // Then we need to run any other comparison algorithms we want.

  // TODO: Process this array to make it a proper potential action
  if (dupFound.length === 0) {
    return dupFound;
  }

  let dupFoundActions = [];

  for (let i = 0; i < dupFound.length; i++) {
    dupFoundActions.push({
      action: "delete-choice",
      reason: `The files: ${dupFound[i].image1} seems to be identical to ${dupFound[i].image2}, scoring a '${dupFound[i].score}' via ${dupFound[i].method}`
    });
  }

  return dupFoundActions;
}

async function scanImages() {
  let dupsFound = [];
  for (const image in IMAGES) {
    for (const subimage in IMAGES) {
      if (image === subimage) {
        // Skip identical files
        continue;
      }

      if (typeof IMAGES[image]?.dHash_hamming?.[subimage] === "number") {
        // Since the subimage already exists here, we know they have been compared
        // previously, and there's no need to compare again
        continue;
      }

      // Use hamming_distance on dHash values
      let hd = algo.hamming_distance(IMAGES[image].dHash, IMAGES[subimage].dHash);
      if (IMAGES[image].dHash_hamming === undefined) {
        IMAGES[image].dHash_hamming = {};
      }
      if (IMAGES[subimage].dHash_hamming === undefined) {
        IMAGES[subimage].dHash_hamming = {};
      }

      IMAGES[image].dHash_hamming[subimage] = hd;
      IMAGES[subimage].dHash_hamming[image] = hd;

      if (hd < dHashSimilarityScore) {
        dupsFound.push({
          image1: image,
          image2: subimage,
          score: hd,
          method: "Difference Hash"
        });
      }
    }
  }

  return dupsFound;
}


async function dHash(filepath) {
  // Our custom implementation of 'Difference Hash'
  // Source: https://hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html
  // We resize an image to '9x8' (ignoring aspect ratio), then create an array
  // of pixels as they're greyscale only value.
  // Once we have a flat array of the greyscale pixel data we generate a gradient
  // array. This gradient array is then the image's hash, that we can use in
  // simple string distance algorithms to determine similarity.

  let im = new Magick.Image(filepath);
  await im.scaleAsync('9x8!');
  // Using '!' causes the scaling to ignore the aspect ratio

  // From here, we will need to convert our rows of pixels to grayscale, storing as we go
  let pixels = [];

  for (let y = 0; y < im.size().height(); y++) {
    for (let x = 0; x < im.size().width(); x++) {
      const px = im.pixelColor(x, y);
      const rgb = new Magick.ColorRGB(px);
      const avg = (rgb.red() + rgb.green() + rgb.blue()) / 3;
      const pos = (y * im.size().width() + x) * 3;

      pixels.push(avg);
    }
  }

  // Lets determine the gradiant of pixel changes
  let hashArray = [];
  let nextI = 1;
  for (let i = 0; i < pixels.length; i++) {

    if (nextI === pixels.length) {
      continue;
    }

    if (pixels[i] > pixels[nextI]) {
      hashArray.push(1);
    } else {
      hashArray.push(0);
    }

    nextI++;
  }

  let hash = hashArray.join('');
  return hash;
}
