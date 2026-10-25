import { describe, it, expect } from 'vitest';
import { parseComicPageKey, sortComicFilenames } from './naturalSort';
import { ALL_COMIC_FILENAMES, comicManifest, comicPages, comicActs } from '../data/comicManifest';

describe('naturalSort', () => {
  it('parses valid comic page filenames accurately', () => {
    expect(parseComicPageKey('Act1.1.png')).toEqual({
      act: 1,
      pageNum: 1,
      subPage: '',
      filename: 'Act1.1.png',
    });

    expect(parseComicPageKey('Act1.11b.png')).toEqual({
      act: 1,
      pageNum: 11,
      subPage: 'b',
      filename: 'Act1.11b.png',
    });

    expect(parseComicPageKey('Act4.10a.png')).toEqual({
      act: 4,
      pageNum: 10,
      subPage: 'a',
      filename: 'Act4.10a.png',
    });

    expect(parseComicPageKey('Act5.59.png')).toEqual({
      act: 5,
      pageNum: 59,
      subPage: '',
      filename: 'Act5.59.png',
    });
  });

  it('throws an error for non-conforming filenames', () => {
    expect(() => parseComicPageKey('page1.png')).toThrow();
    expect(() => parseComicPageKey('Act.1.png')).toThrow();
    expect(() => parseComicPageKey('Act1_1.jpg')).toThrow();
  });

  it('correctly handles non-lexicographical integer sorting (Act1.2 before Act1.10)', () => {
    const unsorted = ['Act1.10.png', 'Act1.2.png', 'Act1.1.png', 'Act1.20.png'];
    const sorted = sortComicFilenames(unsorted);
    expect(sorted).toEqual(['Act1.1.png', 'Act1.2.png', 'Act1.10.png', 'Act1.20.png']);
  });

  it('orders Act 1 sub-page Act1.11 -> Act1.11b -> Act1.12', () => {
    const filenames = ['Act1.12.png', 'Act1.11.png', 'Act1.11b.png'];
    const sorted = sortComicFilenames(filenames);
    expect(sorted).toEqual(['Act1.11.png', 'Act1.11b.png', 'Act1.12.png']);
  });

  it('orders Act 4 sub-pages Act4.10a -> Act4.10b', () => {
    const filenames = ['Act4.11.png', 'Act4.10b.png', 'Act4.9.png', 'Act4.10a.png'];
    const sorted = sortComicFilenames(filenames);
    expect(sorted).toEqual(['Act4.9.png', 'Act4.10a.png', 'Act4.10b.png', 'Act4.11.png']);
  });

  it('orders pages across different acts sequentially', () => {
    const filenames = ['Act5.1.png', 'Act1.1.png', 'Act3.1.png', 'Act2.1.png', 'Act4.1.png'];
    const sorted = sortComicFilenames(filenames);
    expect(sorted).toEqual(['Act1.1.png', 'Act2.1.png', 'Act3.1.png', 'Act4.1.png', 'Act5.1.png']);
  });

  it('verifies all 313 comic pages in the manifest', () => {
    expect(ALL_COMIC_FILENAMES).toHaveLength(313);
    expect(comicManifest.totalPages).toBe(313);
    expect(comicPages).toHaveLength(313);

    // Boundary check: first and last page
    expect(comicPages[0].filename).toBe('Act1.1.png');
    expect(comicPages[0].globalIndex).toBe(0);
    expect(comicPages[0].prevPageId).toBeNull();
    expect(comicPages[0].nextPageId).toBe('act-1-page-2');

    expect(comicPages[312].filename).toBe('Act5.59.png');
    expect(comicPages[312].globalIndex).toBe(312);
    expect(comicPages[312].nextPageId).toBeNull();

    // Verify Act distribution
    expect(comicActs).toHaveLength(5);
    expect(comicActs[0]).toMatchObject({
      act: 1,
      pageCount: 67,
      startGlobalIndex: 0,
      endGlobalIndex: 66,
    });
    expect(comicActs[1]).toMatchObject({
      act: 2,
      pageCount: 66,
      startGlobalIndex: 67,
      endGlobalIndex: 132,
    });
    expect(comicActs[2]).toMatchObject({
      act: 3,
      pageCount: 55,
      startGlobalIndex: 133,
      endGlobalIndex: 187,
    });
    expect(comicActs[3]).toMatchObject({
      act: 4,
      pageCount: 66,
      startGlobalIndex: 188,
      endGlobalIndex: 253,
    });
    expect(comicActs[4]).toMatchObject({
      act: 5,
      pageCount: 59,
      startGlobalIndex: 254,
      endGlobalIndex: 312,
    });

    // Verify sub-page presence in full catalog
    const act1_11 = comicPages.find((p) => p.filename === 'Act1.11.png');
    const act1_11b = comicPages.find((p) => p.filename === 'Act1.11b.png');
    const act1_12 = comicPages.find((p) => p.filename === 'Act1.12.png');
    expect(act1_11).toBeDefined();
    expect(act1_11b).toBeDefined();
    expect(act1_12).toBeDefined();
    expect(act1_11b!.globalIndex).toBe(act1_11!.globalIndex + 1);
    expect(act1_12!.globalIndex).toBe(act1_11b!.globalIndex + 1);

    const act4_10a = comicPages.find((p) => p.filename === 'Act4.10a.png');
    const act4_10b = comicPages.find((p) => p.filename === 'Act4.10b.png');
    expect(act4_10a).toBeDefined();
    expect(act4_10b).toBeDefined();
    expect(act4_10b!.globalIndex).toBe(act4_10a!.globalIndex + 1);
  });
});
