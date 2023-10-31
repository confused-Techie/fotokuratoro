/*
 * This module will attempt to discover any possible duplicates that may exist
 * within a given set of images.
 * It does this with different techniques, that all primarly look like so:
 * - Grab the image and generate some data form of it
 * - Use said data to then compare against all other known images
 * - Determine a level of confidence that an image is identical.
 */

const { Magick, Color } = require("node-magickwand");
const algo = require("./algorithms.js");

// This object will contain data on every single image
// TODO: May be a good idea to look at optimizing for ram, or storage
// As a huge amount of images, will very likely cause issues this way
const IMAGES = {};

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
  console.log(IMAGES);

  let dupFound = await scanImages();
}

async function scanImages() {
  for (const image in IMAGES) {
    for (const subimage in IMAGES) {
      // Use hamming_distance on dHash values
      console.log(image);
      console.log(subimage);
      let hd = algo.hamming_distance(IMAGES[image].dHash, IMAGES[subimage].dHash);
      console.log(`${image} v ${subimage} - ${hd}`);
    }
  }
}


async function dHash(filepath) {
  // A simple implementation of 'Difference Hash'
  // With a slight variation.
  // This function has two modes built in, with one commented out:
  // - Disabled: Saves a greyscale version of the image
  // - Active: Creates a hex string of the greyscale pixel data. Allowing for use
  //           with comparisons of the hamming distance later on
  // A simple, slightly custom implementation of dHash or 'Difference Hash'
  // Source: https://hackerfactor.com/blog/?/archives/529-Kind-of-Like-That.html
  // Here we take an image, scaling it down to '9x8', then convert to greyscale.
  // While converting to greyscale we get the pixel value of each position and
  // create an array with these pixels. Where we can then encode them into a
  // Hexdecimal string.
  // From here this string is available to run against other comparisons,
  // such as the Hamming Distance

  // TODO Convert image to greyscale
  let im = new Magick.Image(filepath);
  // Without converting to greyscale, we can at least reduce our color data
  await im.scaleAsync('9x8'); // We will scale the image down to 150x150 pixels
  // This is largely a random value.

  // From here, we will need to convert our rows of pixels to grayscale, storing as we go

  //let pixels = new Float32Array(im.size().width() * im.size().height() * 3);
  let pixels = [];

  for (let y = 0; y < im.size().height(); y++) {
    for (let x = 0; x < im.size().width(); x++) {
      const px = im.pixelColor(x, y);
      const rgb = new Magick.ColorRGB(px);
      const avg = (rgb.red() + rgb.green() + rgb.blue()) / 3;
      const pos = (y * im.size().width() + x) * 3;

      pixels.push(avg);
      //pixels[pos] = avg;
      //pixels[pos + 1] = avg;
      //pixels[pos + 2] = avg;
    }
  }
  // The above snippet should give us a Float32Array of pixel values for the whole
  // image, now in grayscale
  //const grayIm = new Magick.Image(im.size().width(), im.size().height(), 'RGB', pixels);

  //await Magick.writeImagesAsync([grayIm], "./hello.jpeg");

  let hash = toHexString(pixels);
  console.log(hash);
  return hash;
}

function toHexString(arr) {
  return Array.from(arr, (byte) => {
    return byte.toString(16).slice(-2);
  }).join("");
}
