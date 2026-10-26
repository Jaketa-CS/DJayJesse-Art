import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { comicPageComparator, parseComicPageKey, sortComicFilenames } from './naturalSort';
import {
  ALL_COMIC_FILENAMES,
  buildComicCatalog,
  comicActs,
  comicManifest,
  comicPages,
} from '@/data/comicManifest';

describe('Empirical Challenge: naturalSort & comicManifest Stress Tests', () => {
  const DISK_COMIC_DIR = path.resolve(__dirname, '../../public/comic-pages');

  // -------------------------------------------------------------
  // Test Suite 1: Disk Asset & Manifest Parity
  // -------------------------------------------------------------
  describe('1. Disk Asset & Manifest Parity', () => {
    it('verifies disk directory exists and contains exactly 313 PNG files', () => {
      expect(fs.existsSync(DISK_COMIC_DIR)).toBe(true);
      const diskFiles = fs.readdirSync(DISK_COMIC_DIR);
      expect(diskFiles).toHaveLength(313);

      const nonPng = diskFiles.filter((f) => !f.endsWith('.png'));
      expect(nonPng).toEqual([]);
    });

    it('verifies ALL_COMIC_FILENAMES exactly matches the set of disk files', () => {
      const diskFiles = fs.readdirSync(DISK_COMIC_DIR);
      const diskSet = new Set(diskFiles);
      const manifestSet = new Set(ALL_COMIC_FILENAMES);

      expect(ALL_COMIC_FILENAMES).toHaveLength(313);
      expect(manifestSet.size).toBe(313);

      // Check difference in both directions
      const missingFromManifest = diskFiles.filter((f) => !manifestSet.has(f));
      const extraInManifest = ALL_COMIC_FILENAMES.filter((f) => !diskSet.has(f));

      expect(missingFromManifest).toEqual([]);
      expect(extraInManifest).toEqual([]);
    });

    it('verifies sorting disk files produces the exact sequence in comicManifest.pages', () => {
      const diskFiles = fs.readdirSync(DISK_COMIC_DIR);
      const sortedDisk = sortComicFilenames(diskFiles);
      const manifestFilenames = comicPages.map((p) => p.filename);

      expect(sortedDisk).toEqual(manifestFilenames);
    });
  });

  // -------------------------------------------------------------
  // Test Suite 2: Natural Sort Stress Testing
  // -------------------------------------------------------------
  describe('2. Natural Sort Stress Testing', () => {
    it('directly tests comicPageComparator with equal and distinct keys', () => {
      const keyA = parseComicPageKey('Act1.10.png');
      const keyB = parseComicPageKey('Act1.2.png');
      expect(comicPageComparator(keyA, keyB)).toBeGreaterThan(0);
      expect(comicPageComparator(keyB, keyA)).toBeLessThan(0);
      expect(comicPageComparator(keyA, keyA)).toBe(0);

      const keySubA = parseComicPageKey('Act4.10a.png');
      const keySubB = parseComicPageKey('Act4.10b.png');
      expect(comicPageComparator(keySubA, keySubB)).toBeLessThan(0);
      expect(comicPageComparator(keySubB, keySubA)).toBeGreaterThan(0);
    });

    it('reliably sorts reversed, shuffled, and randomized 313 files across multiple seeds', () => {
      const expected = comicPages.map((p) => p.filename);

      // 1. Reversed order
      const reversed = [...expected].reverse();
      expect(sortComicFilenames(reversed)).toEqual(expected);

      // 2. Deterministic pseudo-random permutations (Fisher-Yates with LCG)
      let seed = 123456789;
      const pseudoRandom = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let run = 0; run < 20; run++) {
        const shuffled = [...expected];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(pseudoRandom() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // Verify shuffled array is indeed different from expected
        expect(shuffled).not.toEqual(expected);
        // Verify sort restores exact expected order
        expect(sortComicFilenames(shuffled)).toEqual(expected);
      }
    });

    it('sub-pages: correctly sorts Act1.11, Act1.11b, Act1.12 for all 6 permutations', () => {
      const expected = ['Act1.11.png', 'Act1.11b.png', 'Act1.12.png'];
      const permutations = [
        ['Act1.11.png', 'Act1.11b.png', 'Act1.12.png'],
        ['Act1.11.png', 'Act1.12.png', 'Act1.11b.png'],
        ['Act1.11b.png', 'Act1.11.png', 'Act1.12.png'],
        ['Act1.11b.png', 'Act1.12.png', 'Act1.11.png'],
        ['Act1.12.png', 'Act1.11.png', 'Act1.11b.png'],
        ['Act1.12.png', 'Act1.11b.png', 'Act1.11.png'],
      ];

      for (const p of permutations) {
        expect(sortComicFilenames(p)).toEqual(expected);
      }
    });

    it('split pages: correctly sorts Act4.9, Act4.10a, Act4.10b, Act4.11 across all 24 permutations', () => {
      const expected = ['Act4.9.png', 'Act4.10a.png', 'Act4.10b.png', 'Act4.11.png'];

      // Generate all 24 permutations of the 4 items
      const permute = (arr: string[]): string[][] => {
        if (arr.length <= 1) return [arr];
        const res: string[][] = [];
        for (let i = 0; i < arr.length; i++) {
          const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
          for (const sub of permute(rest)) {
            res.push([arr[i], ...sub]);
          }
        }
        return res;
      };

      const allPerms = permute(expected);
      expect(allPerms).toHaveLength(24);

      for (const p of allPerms) {
        expect(sortComicFilenames(p)).toEqual(expected);
      }
    });

    it('hypothetical sub-page collations: handles empty vs a vs b vs c', () => {
      const input = [
        'Act2.5c.png',
        'Act2.5.png',
        'Act2.5b.png',
        'Act2.5a.png',
        'Act2.4.png',
        'Act2.6.png',
      ];
      const sorted = sortComicFilenames(input);
      expect(sorted).toEqual([
        'Act2.4.png',
        'Act2.5.png',
        'Act2.5a.png',
        'Act2.5b.png',
        'Act2.5c.png',
        'Act2.6.png',
      ]);
    });

    it('numeric collation: Act1.2 vs Act1.10, Act1.9 vs Act1.20, Act2.5 vs Act2.50', () => {
      // Act1.2 vs Act1.10
      expect(sortComicFilenames(['Act1.10.png', 'Act1.2.png'])).toEqual([
        'Act1.2.png',
        'Act1.10.png',
      ]);

      // Act1.9 vs Act1.20
      expect(sortComicFilenames(['Act1.20.png', 'Act1.9.png'])).toEqual([
        'Act1.9.png',
        'Act1.20.png',
      ]);

      // Act2.5 vs Act2.50
      expect(sortComicFilenames(['Act2.50.png', 'Act2.5.png'])).toEqual([
        'Act2.5.png',
        'Act2.50.png',
      ]);

      // Multiple digit boundary checks
      const numericChaos = [
        'Act1.100.png',
        'Act1.2.png',
        'Act1.20.png',
        'Act1.10.png',
        'Act1.1.png',
        'Act1.9.png',
        'Act1.50.png',
        'Act1.5.png',
      ];
      expect(sortComicFilenames(numericChaos)).toEqual([
        'Act1.1.png',
        'Act1.2.png',
        'Act1.5.png',
        'Act1.9.png',
        'Act1.10.png',
        'Act1.20.png',
        'Act1.50.png',
        'Act1.100.png',
      ]);
    });

    it('act collation precedence over pageNum (e.g. Act1.50 vs Act2.1)', () => {
      const crossAct = ['Act2.1.png', 'Act1.50.png', 'Act3.1.png', 'Act1.5.png'];
      expect(sortComicFilenames(crossAct)).toEqual([
        'Act1.5.png',
        'Act1.50.png',
        'Act2.1.png',
        'Act3.1.png',
      ]);
    });

    it('case-insensitivity of sub-pages during parsing & collation', () => {
      const parsedUpper = parseComicPageKey('Act1.11B.png');
      expect(parsedUpper.subPage).toBe('b');

      const mixed = ['Act1.11b.png', 'Act1.11a.png', 'Act1.11.png'];
      expect(sortComicFilenames(mixed)).toEqual(['Act1.11.png', 'Act1.11a.png', 'Act1.11b.png']);
    });
  });

  // -------------------------------------------------------------
  // Test Suite 3: Malformed Inputs & Error Handling
  // -------------------------------------------------------------
  describe('3. Malformed Inputs and Error Handling', () => {
    const invalidFilenames = [
      { name: 'empty string', value: '' },
      { name: 'whitespace string', value: '   ' },
      { name: 'leading whitespace', value: ' Act1.1.png' },
      { name: 'trailing whitespace', value: 'Act1.1.png ' },
      { name: 'missing act number', value: 'Act.1.png' },
      { name: 'missing page number', value: 'Act1..png' },
      { name: 'missing both act and page', value: 'Act..png' },
      { name: 'no dot', value: 'Act1png' },
      { name: 'no extension', value: 'Act1.1' },
      { name: 'jpg extension', value: 'Act1.1.jpg' },
      { name: 'jpeg extension', value: 'Act1.1.jpeg' },
      { name: 'webp extension', value: 'Act1.1.webp' },
      { name: 'uppercase extension', value: 'Act1.1.PNG' },
      { name: 'appended extension', value: 'Act1.1.png.bak' },
      { name: 'lowercase act prefix', value: 'act1.1.png' },
      { name: 'uppercase act prefix', value: 'ACT1.1.png' },
      { name: 'negative act number', value: 'Act-1.1.png' },
      { name: 'negative page number', value: 'Act1.-1.png' },
      { name: 'underscore instead of dot', value: 'Act1_1.png' },
      { name: 'slash in name', value: 'Act1/1.png' },
      { name: 'arbitrary non-conforming text', value: 'chapter1_page01.png' },
      { name: 'author note file', value: 'credits.png' },
    ];

    for (const testCase of invalidFilenames) {
      it(`throws explicit error for ${testCase.name} ("${testCase.value}")`, () => {
        expect(() => parseComicPageKey(testCase.value)).toThrowError(
          /Filename does not conform to comic page pattern/
        );
      });
    }

    it('sortComicFilenames fails fast if any item in the list is malformed', () => {
      const dirtyList = ['Act1.1.png', 'Act1.2.png', 'bad_file.png', 'Act1.3.png'];
      expect(() => sortComicFilenames(dirtyList)).toThrowError(
        /Filename does not conform to comic page pattern/
      );
    });
  });

  // -------------------------------------------------------------
  // Test Suite 4: Comic Manifest Data Structures Verification
  // -------------------------------------------------------------
  describe('4. Comic Manifest Verification', () => {
    it('contains exactly 313 entries in comicManifest.pages', () => {
      expect(comicManifest.pages).toHaveLength(313);
      expect(comicManifest.totalPages).toBe(313);
      expect(comicPages).toHaveLength(313);
    });

    it('verifies all global indices (0 to 312) are contiguous and strictly match array index', () => {
      comicPages.forEach((page, index) => {
        expect(page.globalIndex).toBe(index);
      });
    });

    it('verifies IDs are unique and conform to expected syntax', () => {
      const idSet = new Set<string>();
      for (const page of comicPages) {
        expect(idSet.has(page.id)).toBe(false);
        idSet.add(page.id);

        const subSuffix = page.subPage ? page.subPage : '';
        expect(page.id).toBe(`act-${page.act}-page-${page.pageNum}${subSuffix}`);
        expect(page.src).toBe(`/comic-pages/${page.filename}`);
      }
      expect(idSet.size).toBe(313);
    });

    it('verifies bidirectional linked list: prevPageId and nextPageId linking', () => {
      // First page check
      expect(comicPages[0].prevPageId).toBeNull();
      expect(comicPages[0].nextPageId).toBe(comicPages[1].id);

      // Last page check
      expect(comicPages[312].nextPageId).toBeNull();
      expect(comicPages[312].prevPageId).toBe(comicPages[311].id);

      // Contiguous bidirectional linking check for all interior pages
      for (let i = 0; i < comicPages.length; i++) {
        const page = comicPages[i];

        if (i === 0) {
          expect(page.prevPageId).toBeNull();
        } else {
          expect(page.prevPageId).toBe(comicPages[i - 1].id);
        }

        if (i === comicPages.length - 1) {
          expect(page.nextPageId).toBeNull();
        } else {
          expect(page.nextPageId).toBe(comicPages[i + 1].id);
        }
      }
    });

    it('verifies Act summary contiguity, page counts, and start/end boundaries', () => {
      expect(comicActs).toHaveLength(5);

      const expectedPageCounts = [67, 66, 55, 66, 59];
      let currentGlobalIndex = 0;

      comicActs.forEach((actInfo, index) => {
        const actNum = index + 1;
        const expectedCount = expectedPageCounts[index];

        expect(actInfo.act).toBe(actNum);
        expect(actInfo.pageCount).toBe(expectedCount);
        expect(actInfo.startGlobalIndex).toBe(currentGlobalIndex);
        expect(actInfo.endGlobalIndex).toBe(currentGlobalIndex + expectedCount - 1);

        expect(actInfo.firstPageId).toBe(comicPages[currentGlobalIndex].id);
        expect(actInfo.lastPageId).toBe(comicPages[currentGlobalIndex + expectedCount - 1].id);
        expect(actInfo.firstPageFilename).toBe(comicPages[currentGlobalIndex].filename);

        currentGlobalIndex += expectedCount;
      });

      expect(currentGlobalIndex).toBe(313);
    });

    it('verifies actIndex within each act starts at 0 and increments contiguously', () => {
      for (let a = 1; a <= 5; a++) {
        const pagesInAct = comicPages.filter((p) => p.act === a);
        pagesInAct.forEach((p, idx) => {
          expect(p.actIndex).toBe(idx);
          expect(p.actTotalPages).toBe(pagesInAct.length);
        });
      }
    });

    it('verifies specific critical sub-pages and split-pages links', () => {
      // Act 1: 11 -> 11b -> 12
      const p11 = comicPages.find((p) => p.filename === 'Act1.11.png')!;
      const p11b = comicPages.find((p) => p.filename === 'Act1.11b.png')!;
      const p12 = comicPages.find((p) => p.filename === 'Act1.12.png')!;

      expect(p11).toBeDefined();
      expect(p11b).toBeDefined();
      expect(p12).toBeDefined();

      expect(p11.nextPageId).toBe(p11b.id);
      expect(p11b.prevPageId).toBe(p11.id);
      expect(p11b.nextPageId).toBe(p12.id);
      expect(p12.prevPageId).toBe(p11b.id);

      // Act 4: 9 -> 10a -> 10b -> 11
      const p4_9 = comicPages.find((p) => p.filename === 'Act4.9.png')!;
      const p4_10a = comicPages.find((p) => p.filename === 'Act4.10a.png')!;
      const p4_10b = comicPages.find((p) => p.filename === 'Act4.10b.png')!;
      const p4_11 = comicPages.find((p) => p.filename === 'Act4.11.png')!;

      expect(p4_9).toBeDefined();
      expect(p4_10a).toBeDefined();
      expect(p4_10b).toBeDefined();
      expect(p4_11).toBeDefined();

      expect(p4_9.nextPageId).toBe(p4_10a.id);
      expect(p4_10a.prevPageId).toBe(p4_9.id);
      expect(p4_10a.nextPageId).toBe(p4_10b.id);
      expect(p4_10b.prevPageId).toBe(p4_10a.id);
      expect(p4_10b.nextPageId).toBe(p4_11.id);
      expect(p4_11.prevPageId).toBe(p4_10b.id);
    });

    it('verifies buildComicCatalog on empty input handles edge case gracefully', () => {
      const emptyCatalog = buildComicCatalog([]);
      expect(emptyCatalog.totalPages).toBe(0);
      expect(emptyCatalog.pages).toEqual([]);
      expect(emptyCatalog.acts).toEqual([]);
    });

    it('verifies buildComicCatalog on arbitrary valid subsets', () => {
      const subset = ['Act2.2.png', 'Act1.1.png', 'Act2.1.png'];
      const catalog = buildComicCatalog(subset);

      expect(catalog.totalPages).toBe(3);
      expect(catalog.pages.map((p) => p.filename)).toEqual([
        'Act1.1.png',
        'Act2.1.png',
        'Act2.2.png',
      ]);
      expect(catalog.pages[0].prevPageId).toBeNull();
      expect(catalog.pages[0].nextPageId).toBe('act-2-page-1');
      expect(catalog.pages[1].prevPageId).toBe('act-1-page-1');
      expect(catalog.pages[1].nextPageId).toBe('act-2-page-2');
      expect(catalog.pages[2].nextPageId).toBeNull();

      expect(catalog.acts).toHaveLength(2);
      expect(catalog.acts[0].act).toBe(1);
      expect(catalog.acts[0].pageCount).toBe(1);
      expect(catalog.acts[1].act).toBe(2);
      expect(catalog.acts[1].pageCount).toBe(2);
    });
  });

  // -------------------------------------------------------------
  // Test Suite 5: Performance & Worst-Case Scaling
  // -------------------------------------------------------------
  describe('5. Performance & Stress Scaling', () => {
    it('sorts 5,000 randomized comic page entries in under 50ms', () => {
      const basePool = comicPages.map((p) => p.filename);
      const largePool: string[] = [];
      for (let i = 0; i < 16; i++) {
        largePool.push(...basePool);
      }
      // Shuffle large pool
      for (let i = largePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [largePool[i], largePool[j]] = [largePool[j], largePool[i]];
      }

      const t0 = performance.now();
      const sorted = sortComicFilenames(largePool);
      const t1 = performance.now();

      expect(sorted).toHaveLength(largePool.length);
      expect(t1 - t0).toBeLessThan(100); // Expecting <100ms for 5,000 items
    });
  });
});
