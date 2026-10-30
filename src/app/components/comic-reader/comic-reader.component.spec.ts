import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { ComicReaderComponent } from './comic-reader.component';
import { comicPages } from '@/data/comicManifest';

describe('ComicReaderComponent', () => {
  let fixture: ComponentFixture<ComicReaderComponent>;
  let component: ComicReaderComponent;
  let compiled: HTMLElement;
  let router: Router;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  // Query helpers for test resilience and clean assertions
  const getPrevButton = (): HTMLButtonElement =>
    (compiled.querySelector('[data-testid="prev-button"]') ||
      compiled.querySelector('[data-testid="prev-page-btn"]')) as HTMLButtonElement;

  const getNextButton = (): HTMLButtonElement =>
    (compiled.querySelector('[data-testid="next-button"]') ||
      compiled.querySelector('[data-testid="next-page-btn"]')) as HTMLButtonElement;

  const getImage = (): HTMLImageElement =>
    (compiled.querySelector('[data-testid="comic-image"]') ||
      compiled.querySelector('[data-testid="comic-page-image"]')) as HTMLImageElement;

  const getActSelect = (): HTMLSelectElement =>
    compiled.querySelector('[data-testid="act-select"]') as HTMLSelectElement;

  const getPageSelect = (): HTMLButtonElement =>
    compiled.querySelector('[data-testid="page-select"]') as HTMLButtonElement;

  const getProgressBar = (): HTMLElement | null =>
    compiled.querySelector('[data-testid="progress-bar"]');

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [ComicReaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
            queryParamMap: queryParamMap$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComicReaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    document.querySelectorAll('.test-fixture-element').forEach((el) => el.remove());
  });

  // ==========================================
  // 1. Initial Render & Component Creation
  // ==========================================
  describe('Initial State & Render', () => {
    it('should create the comic reader component', () => {
      expect(component).toBeTruthy();
      expect(component.totalPages).toBe(313);
      expect(component.currentIndex).toBe(0);
    });

    it('should initialize at Page 1 (Act1.1.png) with accurate properties', () => {
      expect(component.currentPage.filename).toBe('Act1.1.png');
      expect(component.currentPage.src).toBe('/comic-pages/Act1.1.png');
      expect(component.currentPage.act).toBe(1);
      expect(component.currentPage.pageNum).toBe(1);
      expect(component.currentPage.subPage).toBe('');
      expect(component.isFirstPage).toBe(true);
      expect(component.isLastPage).toBe(false);
      expect(component.hasPreviousPage).toBe(false);
      expect(component.hasNextPage).toBe(true);
      expect(component.currentAct.act).toBe(1);
      expect(component.currentAct.title).toBe('Act I');
      expect(component.humanPageNumber).toBe(1);
      expect(component.progressLabel).toBe('Page 1 of 313');
      expect(component.actProgressLabel).toContain('Act I');
      expect(component.progressPercentage).toBeGreaterThanOrEqual(0);
    });

    it('should render initial DOM elements with page 1, disabled Previous, and enabled Next', () => {
      const img = getImage();
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe('/comic-pages/Act1.1.png');

      const prevBtn = getPrevButton();
      expect(prevBtn).toBeTruthy();
      expect(prevBtn.disabled).toBe(true);

      const nextBtn = getNextButton();
      expect(nextBtn).toBeTruthy();
      expect(nextBtn.disabled).toBe(false);

      const pageSelect = getPageSelect();
      expect(pageSelect).toBeTruthy();
      expect(pageSelect.textContent).toContain('Page 1 of 313');

      const progressBar = getProgressBar();
      expect(progressBar).toBeNull();
    });
  });

  // ==========================================
  // 2. Next & Previous Navigation
  // ==========================================
  describe('Next & Previous Navigation', () => {
    it('should advance to page 2 (Act1.2.png) when Next button is clicked', () => {
      const nextBtn = getNextButton();
      nextBtn.click();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(1);
      expect(component.currentPage.filename).toBe('Act1.2.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.2.png');

      // Previous button should now be enabled
      expect(getPrevButton().disabled).toBe(false);
      expect(getNextButton().disabled).toBe(false);
    });

    it('should decrement to previous page when Previous button is clicked', () => {
      component.jumpToPage(2);
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);

      const prevBtn = getPrevButton();
      prevBtn.click();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(1);
      expect(component.currentPage.filename).toBe('Act1.2.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.2.png');

      prevBtn.click();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(0);
      expect(component.currentPage.filename).toBe('Act1.1.png');
      expect(prevBtn.disabled).toBe(true);
    });

    it('should advance multiple pages sequentially with consecutive Next clicks', () => {
      const nextBtn = getNextButton();
      for (let i = 0; i < 5; i++) {
        nextBtn.click();
      }
      fixture.detectChanges();

      expect(component.currentIndex).toBe(5);
      expect(component.currentPage.filename).toBe('Act1.6.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.6.png');
    });

    it('should present a clean comic stage without hover overlay zones', () => {
      const overlayPrev = compiled.querySelector('[data-testid="overlay-prev"]');
      const overlayNext = compiled.querySelector('[data-testid="overlay-next"]');

      expect(overlayPrev).toBeNull();
      expect(overlayNext).toBeNull();
    });

    it('should advance to the next page when the comic image itself is clicked', () => {
      const img = getImage();
      img.click();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(1);
      expect(component.currentPage.filename).toBe('Act1.2.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.2.png');
    });
  });

  // ==========================================
  // 3. Boundary State Enforcement
  // ==========================================
  describe('Boundary Checks', () => {
    it('should disable Previous button on page 1 (index 0)', () => {
      component.jumpToPage(0);
      fixture.detectChanges();

      expect(component.isFirstPage).toBe(true);
      expect(getPrevButton().disabled).toBe(true);
      expect(getNextButton().disabled).toBe(false);
    });

    it('should not decrement currentIndex below 0 when calling previousPage() on page 1', () => {
      component.jumpToPage(0);
      fixture.detectChanges();

      component.previousPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(0);
      expect(component.currentPage.filename).toBe('Act1.1.png');
    });

    it('should disable Next button on page 313 (index 312, Act5.59.png)', () => {
      component.jumpToPage(312);
      fixture.detectChanges();

      expect(component.isLastPage).toBe(true);
      expect(component.currentPage.filename).toBe('Act5.59.png');
      expect(getNextButton().disabled).toBe(true);
      expect(getPrevButton().disabled).toBe(false);
    });

    it('should not increment currentIndex above 312 when calling nextPage() on page 313', () => {
      component.jumpToPage(312);
      fixture.detectChanges();

      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(312);
      expect(component.currentPage.filename).toBe('Act5.59.png');
    });

    it('should ignore negative out-of-bounds indices in jumpToPage', () => {
      component.jumpToPage(10);
      component.jumpToPage(-5);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
    });

    it('should ignore over-limit indices in jumpToPage', () => {
      component.jumpToPage(10);
      component.jumpToPage(500);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
    });

    it('should ignore invalid non-numeric inputs in jumpToPage', () => {
      component.jumpToPage(10);
      component.jumpToPage('not-a-number' as unknown as number);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
    });
  });

  // ==========================================
  // 4. Keyboard Arrow Navigation
  // ==========================================
  describe('Keyboard Arrow Navigation', () => {
    it('should advance page when ArrowRight key is pressed', () => {
      expect(component.currentIndex).toBe(0);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(1);
      expect(component.currentPage.filename).toBe('Act1.2.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.2.png');
    });

    it('should return to previous page when ArrowLeft key is pressed', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(4);
      expect(component.currentPage.filename).toBe('Act1.5.png');
    });

    it('should support code property fallback (code: ArrowRight)', () => {
      expect(component.currentIndex).toBe(0);

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(1);
    });

    it('should support code property fallback (code: ArrowLeft)', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(4);
    });

    it('should support legacy "Right" and "Left" key values', () => {
      expect(component.currentIndex).toBe(0);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Right', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(1);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Left', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(0);
    });

    it('should not navigate when pressing non-arrow keys', () => {
      component.jumpToPage(10);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
    });

    it('should ignore keyboard events with modifier keys (Ctrl, Alt, Meta)', () => {
      component.jumpToPage(10);
      fixture.detectChanges();

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          ctrlKey: true,
          bubbles: true,
        })
      );
      expect(component.currentIndex).toBe(10);

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          altKey: true,
          bubbles: true,
        })
      );
      expect(component.currentIndex).toBe(10);

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          metaKey: true,
          bubbles: true,
        })
      );
      expect(component.currentIndex).toBe(10);
    });

    it('should not decrement below 0 on ArrowLeft when on page 1', () => {
      expect(component.currentIndex).toBe(0);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(0);
    });

    it('should not increment beyond 312 on ArrowRight when on page 313', () => {
      component.jumpToPage(312);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(312);
    });
  });

  // ==========================================
  // 5. Keyboard Focus Guard Suppression
  // ==========================================
  describe('Keyboard Focus Guard Suppression', () => {
    it('should suppress arrow navigation when an input element has focus', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      const input = document.createElement('input');
      input.className = 'test-fixture-element';
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      input.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(5);
      input.remove();
    });

    it('should suppress arrow navigation when the page picker has focus', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      const select = getPageSelect();
      select.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });
      select.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(5);
    });

    it('should suppress arrow navigation when document.activeElement is a textarea', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      const textarea = document.createElement('textarea');
      textarea.className = 'test-fixture-element';
      document.body.appendChild(textarea);
      textarea.focus();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(5);
      textarea.remove();
    });

    it('should suppress arrow navigation when target element is contenteditable', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      const editable = document.createElement('div');
      editable.className = 'test-fixture-element';
      editable.contentEditable = 'true';
      document.body.appendChild(editable);
      editable.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        bubbles: true,
      });
      editable.dispatchEvent(event);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(5);
      editable.remove();
    });

    it('should allow arrow navigation when focus is on a button', () => {
      component.jumpToPage(5);
      fixture.detectChanges();

      const nextBtn = getNextButton();
      nextBtn.focus();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(6);
    });
  });

  // ==========================================
  // 6. Act Jump Selector
  // ==========================================
  describe('Act Jump Selector', () => {
    it('should jump to Act 1 start (index 0, Act1.1.png)', () => {
      component.jumpToPage(100);
      fixture.detectChanges();

      component.jumpToAct(1);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(0);
      expect(component.currentPage.filename).toBe('Act1.1.png');
      expect(component.currentAct.act).toBe(1);
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.1.png');
    });

    it('should jump to Act 2 start (index 67, Act2.1.png)', () => {
      component.jumpToAct(2);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(67);
      expect(component.currentPage.filename).toBe('Act2.1.png');
      expect(component.currentAct.act).toBe(2);
      expect(component.currentAct.title).toBe('Act II');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act2.1.png');
    });

    it('should jump to Act 3 start (index 133, Act3.1.png)', () => {
      component.jumpToAct(3);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(133);
      expect(component.currentPage.filename).toBe('Act3.1.png');
      expect(component.currentAct.act).toBe(3);
      expect(component.currentAct.title).toBe('Act III');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act3.1.png');
    });

    it('should jump to Act 4 start (index 188, Act4.1.png)', () => {
      component.jumpToAct(4);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(188);
      expect(component.currentPage.filename).toBe('Act4.1.png');
      expect(component.currentAct.act).toBe(4);
      expect(component.currentAct.title).toBe('Act IV');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act4.1.png');
    });

    it('should jump to Act 5 start (index 254, Act5.1.png)', () => {
      component.jumpToAct(5);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(254);
      expect(component.currentPage.filename).toBe('Act5.1.png');
      expect(component.currentAct.act).toBe(5);
      expect(component.currentAct.title).toBe('Act V');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act5.1.png');
    });

    it('should display only a page selector with continuous page numbers', () => {
      expect(getActSelect()).toBeNull();
      const pageSelect = getPageSelect();
      pageSelect.click();
      fixture.detectChanges();
      const pageOptions = compiled.querySelectorAll('[role="option"]');
      expect(pageOptions[0].textContent?.trim()).toBe('Page 1 of 313');
      expect(pageOptions[67].textContent?.trim()).toBe('Page 68 of 313');
    });

    it('should ignore invalid act numbers in jumpToAct', () => {
      component.jumpToPage(10);
      component.jumpToAct(99);
      expect(component.currentIndex).toBe(10);

      component.jumpToAct('not-an-act' as unknown as number);
      expect(component.currentIndex).toBe(10);
    });
  });

  // ==========================================
  // 7. Page Jump Selector with Alphanumeric Sub-Pages
  // ==========================================
  describe('Page Jump Selector with Sub-Pages', () => {
    it('should jump to Act 1 sub-page Act1.11b.png (global index 11)', () => {
      const targetIndex = comicPages.findIndex((p) => p.filename === 'Act1.11b.png');
      expect(targetIndex).toBe(11);

      component.jumpToPage(11);
      fixture.detectChanges();

      expect(component.currentPage.filename).toBe('Act1.11b.png');
      expect(component.currentPage.pageNum).toBe(11);
      expect(component.currentPage.subPage).toBe('b');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.11b.png');
      expect(getPageSelect().textContent).toContain('Page 12 of 313');
    });

    it('should navigate sequentially through Act 1 sub-page sequence (Act1.11 -> Act1.11b -> Act1.12)', () => {
      component.jumpToPage(10); // Act1.11.png
      fixture.detectChanges();
      expect(component.currentPage.filename).toBe('Act1.11.png');

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(12);
      expect(component.currentPage.filename).toBe('Act1.12.png');

      component.previousPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');
    });

    it('should jump to Act 4 sub-page Act4.10a.png (global index 197)', () => {
      const targetIndex = comicPages.findIndex((p) => p.filename === 'Act4.10a.png');
      expect(targetIndex).toBe(197);

      component.jumpToPage(197);
      fixture.detectChanges();

      expect(component.currentPage.filename).toBe('Act4.10a.png');
      expect(component.currentPage.pageNum).toBe(10);
      expect(component.currentPage.subPage).toBe('a');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act4.10a.png');
    });

    it('should jump to Act 4 sub-page Act4.10b.png (global index 198)', () => {
      const targetIndex = comicPages.findIndex((p) => p.filename === 'Act4.10b.png');
      expect(targetIndex).toBe(198);

      component.jumpToPage(198);
      fixture.detectChanges();

      expect(component.currentPage.filename).toBe('Act4.10b.png');
      expect(component.currentPage.pageNum).toBe(10);
      expect(component.currentPage.subPage).toBe('b');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act4.10b.png');
    });

    it('should navigate sequentially through Act 4 sub-page sequence (Act4.9 -> Act4.10a -> Act4.10b -> Act4.11)', () => {
      component.jumpToPage(196); // Act4.9.png
      fixture.detectChanges();
      expect(component.currentPage.filename).toBe('Act4.9.png');

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(197);
      expect(component.currentPage.filename).toBe('Act4.10a.png');

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(198);
      expect(component.currentPage.filename).toBe('Act4.10b.png');

      component.nextPage();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(199);
      expect(component.currentPage.filename).toBe('Act4.11.png');
    });

    it('should update component when a page menu option is chosen', () => {
      const pageSelect = getPageSelect();
      pageSelect.click();
      fixture.detectChanges();
      const pageOption = compiled.querySelectorAll<HTMLButtonElement>('[role="option"]')[11];
      pageOption.click();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');
      expect(getImage().getAttribute('src')).toBe('/comic-pages/Act1.11b.png');
    });

    it('should close the page menu when clicking outside the reader', () => {
      getPageSelect().click();
      fixture.detectChanges();
      expect(compiled.querySelector('[role="listbox"]')).toBeTruthy();

      const outside = document.createElement('button');
      outside.className = 'test-fixture-element';
      document.body.appendChild(outside);
      outside.click();
      fixture.detectChanges();

      expect(component.pageMenuOpen).toBe(false);
      expect(compiled.querySelector('[role="listbox"]')).toBeNull();
      outside.remove();
    });
  });

  // ==========================================
  // 8. Direct Helpers & Lookups
  // ==========================================
  describe('Direct Helpers & Lookups', () => {
    it('should jump to first and last page via firstPage and lastPage', () => {
      component.jumpToPage(50);
      expect(component.currentIndex).toBe(50);

      component.firstPage();
      expect(component.currentIndex).toBe(0);

      component.lastPage();
      expect(component.currentIndex).toBe(312);
    });

    it('should find and jump to page by filename', () => {
      const success = component.jumpToPageByFilename('Act1.11b');
      expect(success).toBe(true);
      expect(component.currentIndex).toBe(11);

      const successPng = component.jumpToPageByFilename('Act4.10a.png');
      expect(successPng).toBe(true);
      expect(component.currentIndex).toBe(197);

      const fail = component.jumpToPageByFilename('NonExistent.png');
      expect(fail).toBe(false);
      expect(component.currentIndex).toBe(197);
    });

    it('should find and jump to page by ID', () => {
      const success = component.jumpToPageById('act-1-page-11b');
      expect(success).toBe(true);
      expect(component.currentIndex).toBe(11);

      const fail = component.jumpToPageById('invalid-id');
      expect(fail).toBe(false);
      expect(component.currentIndex).toBe(11);
    });

    it('should handle image load and error events correctly', () => {
      component.onImageLoad();
      expect(component.imageLoaded).toBe(true);
      expect(component.imageError).toBe(false);

      component.onImageError();
      expect(component.imageLoaded).toBe(false);
      expect(component.imageError).toBe(true);
    });

    it('should update selectedPageIndex and selectedAct via getters and setters', () => {
      expect(component.selectedPageIndex).toBe(component.currentIndex);
      component.selectedPageIndex = 15;
      expect(component.currentIndex).toBe(15);

      component.selectedPageIndex = '20';
      expect(component.currentIndex).toBe(20);

      expect(component.selectedAct).toBe(component.currentPage.act);
      component.selectedAct = 3;
      expect(component.currentIndex).toBe(133);

      component.selectedAct = '4';
      expect(component.currentIndex).toBe(188);
    });

    it('should resolve page index from query parameter strings', () => {
      // 1-based number string
      expect(component.resolvePageIndexFromParam('1')).toBe(0);
      expect(component.resolvePageIndexFromParam('12')).toBe(11);
      expect(component.resolvePageIndexFromParam('313')).toBe(312);
      expect(component.resolvePageIndexFromParam('0')).toBe(0);
      expect(component.resolvePageIndexFromParam('999')).toBe(312);

      // Filename
      expect(component.resolvePageIndexFromParam('Act1.11b')).toBe(11);
      expect(component.resolvePageIndexFromParam('Act1.11b.png')).toBe(11);

      // ID
      expect(component.resolvePageIndexFromParam('act-1-page-11b')).toBe(11);

      // Invalid
      expect(component.resolvePageIndexFromParam('')).toBeNull();
      expect(component.resolvePageIndexFromParam('totally-invalid-param')).toBeNull();
    });
  });

  // ==========================================
  // 9. Router Synchronization
  // ==========================================
  describe('Router Synchronization', () => {
    it('should invoke router navigate with replaceUrl when page changes', () => {
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

      component.nextPage();
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(
        [],
        expect.objectContaining({
          queryParams: { page: 2 },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
      );
    });

    it('should update current page when queryParamMap emits page parameter', () => {
      queryParamMap$.next(convertToParamMap({ page: '12' }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');
    });

    it('should update current page when queryParamMap emits act parameter', () => {
      queryParamMap$.next(convertToParamMap({ act: '3' }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(133);
      expect(component.currentPage.filename).toBe('Act3.1.png');
    });
  });

  // ==========================================
  // 10. Teardown
  // ==========================================
  describe('Teardown & Cleanup', () => {
    it('should destroy fixture cleanly without leaving dangling listeners', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
