/**
 * Natural sort and parsing utilities for DJayJesse-Art comic pages.
 * Handles patterns such as Act1.1.png, Act1.11b.png, Act4.10a.png.
 */

export interface ComicPageKey {
  act: number;
  pageNum: number;
  subPage: string;
  filename: string;
}

export const COMIC_FILENAME_REGEX = /^Act(\d+)\.(\d+)([a-zA-Z]*)\.png$/;

/**
 * Parses a comic filename conforming to `Act<act>.<page><subpage>.png`.
 * Throws an Error if the filename does not match the expected format.
 */
export function parseComicPageKey(filename: string): ComicPageKey {
  const match = COMIC_FILENAME_REGEX.exec(filename);
  if (!match) {
    throw new Error(`Filename does not conform to comic page pattern: "${filename}"`);
  }

  return {
    act: Number.parseInt(match[1], 10),
    pageNum: Number.parseInt(match[2], 10),
    subPage: match[3].toLowerCase(),
    filename,
  };
}

/**
 * Comparator function for sorting comic page keys into exact reading order.
 * Sort criteria:
 * 1. Act ascending (1 to 5)
 * 2. Page number ascending (1, 2, 3...)
 * 3. Sub-page ascending (empty string "" before "a", "a" before "b")
 */
export function comicPageComparator(a: ComicPageKey, b: ComicPageKey): number {
  if (a.act !== b.act) {
    return a.act - b.act;
  }
  if (a.pageNum !== b.pageNum) {
    return a.pageNum - b.pageNum;
  }
  return a.subPage.localeCompare(b.subPage);
}

/**
 * Sorts an array of comic page filenames into exact natural reading order.
 */
export function sortComicFilenames(filenames: string[]): string[] {
  return [...filenames]
    .map(parseComicPageKey)
    .sort(comicPageComparator)
    .map((item) => item.filename);
}
