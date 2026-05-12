import { holesEqual } from "./geometry.js";

export function ensureUniqueOptions(options) {
  const unique = [];
  for (const option of options) {
    if (!unique.some((item) => holesEqual(item.holes, option.holes))) {
      unique.push(option);
    }
  }
  return unique;
}

export function hasExactlyOneCorrect(options, correctIndex) {
  let count = 0;
  options.forEach((option, index) => {
    if (index === correctIndex) count += 1;
  });
  return count === 1;
}
