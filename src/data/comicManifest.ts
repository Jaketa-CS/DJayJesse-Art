import { parseComicPageKey, sortComicFilenames } from '../utils/naturalSort';

export interface ComicPageItem {
  id: string;
  filename: string;
  src: string;
  act: number;
  pageNum: number;
  subPage: string;
  pageLabel: string;
  globalIndex: number;
  actIndex: number;
  actTotalPages: number;
  prevPageId: string | null;
  nextPageId: string | null;
}

export interface ComicActInfo {
  act: number;
  romanNumeral: string;
  title: string;
  pageCount: number;
  startGlobalIndex: number;
  endGlobalIndex: number;
  firstPageId: string;
  lastPageId: string;
  firstPageFilename: string;
}

export interface ComicCatalogManifest {
  version: string;
  totalPages: number;
  acts: ComicActInfo[];
  pages: ComicPageItem[];
}

export const ALL_COMIC_FILENAMES: string[] = [
  // Act 1: 67 pages (1 to 66 + 11b)
  ...Array.from({ length: 10 }, (_, i) => `Act1.${i + 1}.png`),
  'Act1.11.png',
  'Act1.11b.png',
  ...Array.from({ length: 55 }, (_, i) => `Act1.${i + 12}.png`),

  // Act 2: 66 pages (1 to 66)
  ...Array.from({ length: 66 }, (_, i) => `Act2.${i + 1}.png`),

  // Act 3: 55 pages (1 to 55)
  ...Array.from({ length: 55 }, (_, i) => `Act3.${i + 1}.png`),

  // Act 4: 66 pages (1 to 9, 10a, 10b, 11 to 65)
  ...Array.from({ length: 9 }, (_, i) => `Act4.${i + 1}.png`),
  'Act4.10a.png',
  'Act4.10b.png',
  ...Array.from({ length: 55 }, (_, i) => `Act4.${i + 11}.png`),

  // Act 5: 59 pages (1 to 59)
  ...Array.from({ length: 59 }, (_, i) => `Act5.${i + 1}.png`),
];

export function buildComicCatalog(filenames: string[] = ALL_COMIC_FILENAMES): ComicCatalogManifest {
  const sorted = sortComicFilenames(filenames);
  const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V'];

  const actPageCount = new Map<number, number>();
  for (const filename of sorted) {
    const key = parseComicPageKey(filename);
    actPageCount.set(key.act, (actPageCount.get(key.act) || 0) + 1);
  }

  const actIndexTracker = new Map<number, number>();
  const pages: ComicPageItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const filename = sorted[i];
    const key = parseComicPageKey(filename);
    const actIndex = actIndexTracker.get(key.act) || 0;
    actIndexTracker.set(key.act, actIndex + 1);

    const subSuffix = key.subPage ? `${key.subPage}` : '';
    const id = `act-${key.act}-page-${key.pageNum}${subSuffix}`;
    const pageLabel = `Act ${key.act}, Page ${key.pageNum}${subSuffix}`;

    pages.push({
      id,
      filename,
      src: `/comic-pages/${filename}`,
      act: key.act,
      pageNum: key.pageNum,
      subPage: key.subPage,
      pageLabel,
      globalIndex: i,
      actIndex,
      actTotalPages: actPageCount.get(key.act) || 0,
      prevPageId: i > 0 ? pages[i - 1]?.id || null : null,
      nextPageId: null,
    });
  }

  // Set nextPageId
  for (let i = 0; i < pages.length - 1; i++) {
    pages[i].nextPageId = pages[i + 1].id;
  }

  // Build Act summaries
  const acts: ComicActInfo[] = [];
  for (let a = 1; a <= 5; a++) {
    const actPages = pages.filter((p) => p.act === a);
    if (actPages.length > 0) {
      acts.push({
        act: a,
        romanNumeral: romanNumerals[a],
        title: `Act ${romanNumerals[a]}`,
        pageCount: actPages.length,
        startGlobalIndex: actPages[0].globalIndex,
        endGlobalIndex: actPages[actPages.length - 1].globalIndex,
        firstPageId: actPages[0].id,
        lastPageId: actPages[actPages.length - 1].id,
        firstPageFilename: actPages[0].filename,
      });
    }
  }

  return {
    version: '1.0.0',
    totalPages: pages.length,
    acts,
    pages,
  };
}

export const comicManifest = buildComicCatalog();
export const comicPages = comicManifest.pages;
export const comicActs = comicManifest.acts;
