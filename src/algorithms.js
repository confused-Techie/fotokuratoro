
function hamming_distance(str1, str2) {
  if (str1.length != str2.length) {
    throw new Error("String values must be equal!");
  }

  let dist_counter = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] != str2[i]) {
      dist_counter += 1;
    }
  }

  return dist_counter;
}

module.exports = {
  hamming_distance,
};
