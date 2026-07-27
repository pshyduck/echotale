/**
 * Normalizes a word for matching: lowercases, trims, strips punctuation,
 * and collapses accents so recognizer variance (e.g. "Kék." vs "kek") still matches.
 */
export function normalizeWord(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim();
}
