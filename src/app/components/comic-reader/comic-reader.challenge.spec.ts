import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { ComicReaderComponent } from './comic-reader.component';
import { comicPages } from '@/data/comicManifest';

describe('Milestone 2 Adversarial Challenge — ComicReaderComponent', () => {
  let fixture: ComponentFixture<ComicReaderComponent>;
  let component: ComicReaderComponent;
  let compiled: HTMLElement;
  let queryParamMap$: BehaviorSubject<ParamMap>;

  const getPrevButton = (): HTMLButtonElement =>
    (compiled.querySelector('[data-testid="prev-button"]') ||
      compiled.querySelector('[data-testid="prev-page-btn"]')) as HTMLButtonElement;

  const getNextButton = (): HTMLButtonElement =>
    (compiled.querySelector('[data-testid="next-button"]') ||
      compiled.querySelector('[data-testid="next-page-btn"]')) as HTMLButtonElement;

  const getPageSelect = (): HTMLSelectElement =>
    compiled.querySelector('[data-testid="page-select"]') as HTMLSelectElement;

  const getOverlayPrev = (): HTMLElement | null =>
    compiled.querySelector('[data-testid="overlay-prev"]');

  const getOverlayNext = (): HTMLElement | null =>
    compiled.querySelector('[data-testid="overlay-next"]');

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
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    document.querySelectorAll('.challenge-fixture-element').forEach((el) => el.remove());
  });

  // =========================================================================
  // 1. FOCUS GUARD & KEYBOARD SUPPRESSION STRESS TESTS
  // =========================================================================
  describe('Focus Guard & Keyboard Event Suppression', () => {
    it('should suppress ArrowRight and ArrowLeft when focus is in <input type="text">', () => {
      component.jumpToPage(10);
      fixture.detectChanges();

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'challenge-fixture-element';
      document.body.appendChild(input);
      input.focus();

      expect(document.activeElement).toBe(input);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(10);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(10);

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(10);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(10);
    });

    it('should suppress keyboard navigation across varied input types (search, number, email, password)', () => {
      const types = ['search', 'number', 'email', 'password', 'tel', 'url'];
      component.jumpToPage(15);
      fixture.detectChanges();

      for (const t of types) {
        const input = document.createElement('input');
        input.type = t;
        input.className = 'challenge-fixture-element';
        document.body.appendChild(input);
        input.focus();

        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        fixture.detectChanges();

        expect(component.currentIndex).toBe(15);
        input.remove();
      }
    });

    it('should suppress navigation when focus is in an external <select> or internal selects', () => {
      component.jumpToPage(20);
      fixture.detectChanges();

      // Test component internal page-select
      const pageSelect = getPageSelect();
      expect(pageSelect).toBeTruthy();
      pageSelect.focus();
      pageSelect.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(20);

      // Test arbitrary external select
      const externalSelect = document.createElement('select');
      externalSelect.className = 'challenge-fixture-element';
      const opt = document.createElement('option');
      opt.value = '1';
      externalSelect.appendChild(opt);
      document.body.appendChild(externalSelect);
      externalSelect.focus();

      externalSelect.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      );
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(20);
    });

    it('should suppress navigation when focus is in a <textarea>', () => {
      component.jumpToPage(25);
      fixture.detectChanges();

      const textarea = document.createElement('textarea');
      textarea.className = 'challenge-fixture-element';
      document.body.appendChild(textarea);
      textarea.focus();

      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(25);

      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(25);
    });

    it('should suppress navigation when target is contenteditable="true" or contenteditable=""', () => {
      component.jumpToPage(30);
      fixture.detectChanges();

      const ce1 = document.createElement('div');
      ce1.setAttribute('contenteditable', 'true');
      ce1.tabIndex = 0;
      ce1.className = 'challenge-fixture-element';
      document.body.appendChild(ce1);
      ce1.focus();

      ce1.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(30);

      // contenteditable=""
      const ce2 = document.createElement('div');
      ce2.setAttribute('contenteditable', '');
      ce2.tabIndex = 0;
      ce2.className = 'challenge-fixture-element';
      document.body.appendChild(ce2);
      ce2.focus();

      ce2.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(30);
    });

    it('should suppress navigation when focus is on a child element inside contenteditable container', () => {
      component.jumpToPage(35);
      fixture.detectChanges();

      const container = document.createElement('div');
      container.setAttribute('contenteditable', 'true');
      container.className = 'challenge-fixture-element';

      const childSpan = document.createElement('span');
      childSpan.textContent = 'nested editable text';
      childSpan.tabIndex = 0;
      container.appendChild(childSpan);

      document.body.appendChild(container);
      childSpan.focus();

      childSpan.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(35);
    });

    it('should suppress navigation when element has role="textbox"', () => {
      component.jumpToPage(40);
      fixture.detectChanges();

      const roleBox = document.createElement('div');
      roleBox.setAttribute('role', 'textbox');
      roleBox.tabIndex = 0;
      roleBox.className = 'challenge-fixture-element';
      document.body.appendChild(roleBox);
      roleBox.focus();

      roleBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();

      expect(component.currentIndex).toBe(40);
    });

    it('should verify isFocusInEditableOrFormElement unit behavior across elements', () => {
      const input = document.createElement('input');
      const select = document.createElement('select');
      const textarea = document.createElement('textarea');
      const editable = document.createElement('div');
      editable.setAttribute('contenteditable', 'true');
      const button = document.createElement('button');
      const div = document.createElement('div');

      const mockEvent = (target: Element) => ({ target }) as unknown as KeyboardEvent;

      expect(component.isFocusInEditableOrFormElement(mockEvent(input))).toBe(true);
      expect(component.isFocusInEditableOrFormElement(mockEvent(select))).toBe(true);
      expect(component.isFocusInEditableOrFormElement(mockEvent(textarea))).toBe(true);
      expect(component.isFocusInEditableOrFormElement(mockEvent(editable))).toBe(true);
      expect(component.isFocusInEditableOrFormElement(mockEvent(button))).toBe(false);
      expect(component.isFocusInEditableOrFormElement(mockEvent(div))).toBe(false);
    });
  });

  // =========================================================================
  // 2. KEYBOARD NAVIGATION AFTER BUTTON CLICKS
  // =========================================================================
  describe('Keyboard Navigation After Button Clicks', () => {
    it('should continue keyboard navigation after clicking Next button', () => {
      expect(component.currentIndex).toBe(0);

      const nextBtn = getNextButton();
      expect(nextBtn).toBeTruthy();

      // User clicks next button
      nextBtn.click();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(1);

      // Button is now focused in browser
      nextBtn.focus();
      expect(document.activeElement).toBe(nextBtn);

      // Next keyboard event on window advances page
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);

      // Keyboard event dispatched directly on button also advances page
      nextBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(3);

      // Backward keyboard navigation from button focus
      nextBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);
    });

    it('should continue keyboard navigation after clicking Prev button', () => {
      component.jumpToPage(5);
      fixture.detectChanges();
      expect(component.currentIndex).toBe(5);

      const prevBtn = getPrevButton();
      expect(prevBtn).toBeTruthy();

      // Click Prev button
      prevBtn.click();
      fixture.detectChanges();
      expect(component.currentIndex).toBe(4);

      // Prev button is focused
      prevBtn.focus();
      expect(document.activeElement).toBe(prevBtn);

      // ArrowLeft keyboard navigation works
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(3);

      // ArrowRight keyboard navigation works from button
      prevBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(4);
    });

    it('should verify overlays are removed while keyboard navigation remains responsive', () => {
      expect(component.currentIndex).toBe(0);

      const overlayNext = getOverlayNext();
      const overlayPrev = getOverlayPrev();
      expect(overlayNext).toBeNull();
      expect(overlayPrev).toBeNull();

      // Keyboard navigation continues to advance and rewind seamlessly
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(1);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(2);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(1);
    });
  });

  // =========================================================================
  // 3. BOUNDARY BLOCKING AT PAGE 1 AND PAGE 313
  // =========================================================================
  describe('Boundary Blocking at Page 1 (Underflow) and Page 313 (Overflow)', () => {
    it('should strictly enforce boundary blocking at Page 1 (index 0)', () => {
      component.jumpToPage(0);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(0);
      expect(component.isFirstPage).toBe(true);
      expect(component.hasPreviousPage).toBe(false);
      expect(component.hasNextPage).toBe(true);
      expect(component.isLastPage).toBe(false);

      const prevBtn = getPrevButton();
      expect(prevBtn.disabled).toBe(true);

      // Direct previousPage() calls must not change currentIndex
      for (let i = 0; i < 50; i++) {
        component.previousPage();
      }
      expect(component.currentIndex).toBe(0);

      // ArrowLeft keyboard events must not change currentIndex
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }
      expect(component.currentIndex).toBe(0);

      // Out-of-bounds negative jump calls must be rejected
      const underflowInputs = [
        -1,
        -2,
        -100,
        -99999,
        -0.001,
        -0.999,
        Number.NEGATIVE_INFINITY,
        Number.MIN_SAFE_INTEGER,
      ];
      for (const val of underflowInputs) {
        component.jumpToPage(val);
        expect(component.currentIndex).toBe(0);
      }
    });

    it('should strictly enforce boundary blocking at Page 313 (index 312)', () => {
      component.jumpToPage(312);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(312);
      expect(component.isLastPage).toBe(true);
      expect(component.hasNextPage).toBe(false);
      expect(component.isFirstPage).toBe(false);
      expect(component.hasPreviousPage).toBe(true);

      const nextBtn = getNextButton();
      expect(nextBtn.disabled).toBe(true);

      // Direct nextPage() calls must not change currentIndex
      for (let i = 0; i < 50; i++) {
        component.nextPage();
      }
      expect(component.currentIndex).toBe(312);

      // ArrowRight keyboard events must not change currentIndex
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }
      expect(component.currentIndex).toBe(312);

      // Out-of-bounds positive jump calls must be rejected
      const overflowInputs = [
        313,
        314,
        500,
        99999,
        Number.POSITIVE_INFINITY,
        Number.MAX_SAFE_INTEGER,
      ];
      for (const val of overflowInputs) {
        component.jumpToPage(val);
        expect(component.currentIndex).toBe(312);
      }
    });

    it('should reject invalid, NaN, and non-numeric values in jumpToPage', () => {
      component.jumpToPage(50);
      expect(component.currentIndex).toBe(50);

      component.jumpToPage(NaN);
      expect(component.currentIndex).toBe(50);

      component.jumpToPage('not-a-number');
      expect(component.currentIndex).toBe(50);

      component.jumpToPage(undefined as unknown as number);
      expect(component.currentIndex).toBe(50);

      component.jumpToPage(null as unknown as number);
      expect(component.currentIndex).toBe(50);

      component.jumpToPage('');
      expect(component.currentIndex).toBe(50);
    });

    it('should clamp bounds in resolvePageIndexFromParam', () => {
      // '0' maps to 0
      expect(component.resolvePageIndexFromParam('0')).toBe(0);

      // 1 maps to index 0
      expect(component.resolvePageIndexFromParam('1')).toBe(0);

      // 313 maps to index 312
      expect(component.resolvePageIndexFromParam('313')).toBe(312);

      // > 313 clamped to 312
      expect(component.resolvePageIndexFromParam('314')).toBe(312);
      expect(component.resolvePageIndexFromParam('999')).toBe(312);

      // Non-digit strings or non-existent names return null
      expect(component.resolvePageIndexFromParam('-5')).toBeNull();
      expect(component.resolvePageIndexFromParam('nonexistent')).toBeNull();
      expect(component.resolvePageIndexFromParam('')).toBeNull();
    });
  });

  // =========================================================================
  // 4. STEPPING THROUGH ALPHANUMERIC SUB-PAGES
  // =========================================================================
  describe('Alphanumeric Sub-Pages Progression', () => {
    it('should step forward through Act 1 sub-page: Act1.11 -> Act1.11b -> Act1.12', () => {
      // Start at Act1.11 (index 10)
      component.jumpToPage(10);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
      expect(component.currentPage.filename).toBe('Act1.11.png');
      expect(component.currentPage.act).toBe(1);
      expect(component.currentPage.pageNum).toBe(11);
      expect(component.currentPage.subPage).toBe('');
      expect(component.currentPage.pageLabel).toBe('Page 11');

      // Step forward -> Act1.11b (index 11)
      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');
      expect(component.currentPage.act).toBe(1);
      expect(component.currentPage.pageNum).toBe(11);
      expect(component.currentPage.subPage).toBe('b');
      expect(component.currentPage.pageLabel).toBe('Page 12');

      // Step forward -> Act1.12 (index 12)
      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(12);
      expect(component.currentPage.filename).toBe('Act1.12.png');
      expect(component.currentPage.act).toBe(1);
      expect(component.currentPage.pageNum).toBe(12);
      expect(component.currentPage.subPage).toBe('');
      expect(component.currentPage.pageLabel).toBe('Page 13');

      // Step backward -> Act1.11b (index 11)
      component.previousPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');

      // Step backward -> Act1.11 (index 10)
      component.previousPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(10);
      expect(component.currentPage.filename).toBe('Act1.11.png');
    });

    it('should step forward through Act 4 sub-pages: Act4.9 -> Act4.10a -> Act4.10b -> Act4.11', () => {
      // Start at Act4.9 (index 196)
      component.jumpToPage(196);
      fixture.detectChanges();

      expect(component.currentIndex).toBe(196);
      expect(component.currentPage.filename).toBe('Act4.9.png');
      expect(component.currentPage.act).toBe(4);
      expect(component.currentPage.pageNum).toBe(9);
      expect(component.currentPage.subPage).toBe('');

      // Step forward -> Act4.10a (index 197)
      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(197);
      expect(component.currentPage.filename).toBe('Act4.10a.png');
      expect(component.currentPage.act).toBe(4);
      expect(component.currentPage.pageNum).toBe(10);
      expect(component.currentPage.subPage).toBe('a');
      expect(component.currentPage.pageLabel).toBe('Page 198');

      // Step forward -> Act4.10b (index 198)
      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(198);
      expect(component.currentPage.filename).toBe('Act4.10b.png');
      expect(component.currentPage.act).toBe(4);
      expect(component.currentPage.pageNum).toBe(10);
      expect(component.currentPage.subPage).toBe('b');
      expect(component.currentPage.pageLabel).toBe('Page 199');

      // Step forward -> Act4.11 (index 199)
      component.nextPage();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(199);
      expect(component.currentPage.filename).toBe('Act4.11.png');
      expect(component.currentPage.act).toBe(4);
      expect(component.currentPage.pageNum).toBe(11);
      expect(component.currentPage.subPage).toBe('');
      expect(component.currentPage.pageLabel).toBe('Page 200');

      // Step backward sequence: 199 -> 198 -> 197 -> 196
      component.previousPage();
      expect(component.currentIndex).toBe(198);
      expect(component.currentPage.filename).toBe('Act4.10b.png');

      component.previousPage();
      expect(component.currentIndex).toBe(197);
      expect(component.currentPage.filename).toBe('Act4.10a.png');

      component.previousPage();
      expect(component.currentIndex).toBe(196);
      expect(component.currentPage.filename).toBe('Act4.9.png');
    });

    it('should step through sub-pages via keyboard Arrow keys', () => {
      // Act 1 subpage via keyboard
      component.jumpToPage(10);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(12);
      expect(component.currentPage.filename).toBe('Act1.12.png');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(11);
      expect(component.currentPage.filename).toBe('Act1.11b.png');

      // Act 4 subpages via keyboard
      component.jumpToPage(196);
      fixture.detectChanges();

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(197);
      expect(component.currentPage.filename).toBe('Act4.10a.png');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(198);
      expect(component.currentPage.filename).toBe('Act4.10b.png');

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(199);
      expect(component.currentPage.filename).toBe('Act4.11.png');
    });

    it('should support direct jump to sub-pages by filename and ID', () => {
      // Act1.11b
      expect(component.jumpToPageByFilename('Act1.11b')).toBe(true);
      expect(component.currentIndex).toBe(11);

      expect(component.jumpToPageByFilename('Act1.11b.png')).toBe(true);
      expect(component.currentIndex).toBe(11);

      expect(component.jumpToPageById('act-1-page-11b')).toBe(true);
      expect(component.currentIndex).toBe(11);

      // Act4.10a
      expect(component.jumpToPageByFilename('Act4.10a')).toBe(true);
      expect(component.currentIndex).toBe(197);

      expect(component.jumpToPageById('act-4-page-10a')).toBe(true);
      expect(component.currentIndex).toBe(197);

      // Act4.10b
      expect(component.jumpToPageByFilename('Act4.10b')).toBe(true);
      expect(component.currentIndex).toBe(198);

      expect(component.jumpToPageById('act-4-page-10b')).toBe(true);
      expect(component.currentIndex).toBe(198);
    });

    it('should resolve sub-page tokens in resolvePageIndexFromParam', () => {
      expect(component.resolvePageIndexFromParam('Act1.11b')).toBe(11);
      expect(component.resolvePageIndexFromParam('Act1.11b.png')).toBe(11);
      expect(component.resolvePageIndexFromParam('act-1-page-11b')).toBe(11);

      expect(component.resolvePageIndexFromParam('Act4.10a')).toBe(197);
      expect(component.resolvePageIndexFromParam('act-4-page-10a')).toBe(197);

      expect(component.resolvePageIndexFromParam('Act4.10b')).toBe(198);
      expect(component.resolvePageIndexFromParam('act-4-page-10b')).toBe(198);
    });

    it('should sequentially walk entire 313-page catalog forward and backward without skipping or failing', () => {
      expect(comicPages.length).toBe(313);

      component.jumpToPage(0);
      fixture.detectChanges();

      // Forward sweep: 0 -> 312
      for (let i = 0; i < 312; i++) {
        expect(component.currentIndex).toBe(i);
        component.nextPage();
      }
      expect(component.currentIndex).toBe(312);
      expect(component.isLastPage).toBe(true);

      // One more nextPage() at boundary has no effect
      component.nextPage();
      expect(component.currentIndex).toBe(312);

      // Backward sweep: 312 -> 0
      for (let i = 312; i > 0; i--) {
        expect(component.currentIndex).toBe(i);
        component.previousPage();
      }
      expect(component.currentIndex).toBe(0);
      expect(component.isFirstPage).toBe(true);

      // One more previousPage() at boundary has no effect
      component.previousPage();
      expect(component.currentIndex).toBe(0);
    });
  });

  // =========================================================================
  // 5. ADVERSARIAL EDGE CASES & RAPID-FIRE INPUT STRESS
  // =========================================================================
  describe('Adversarial Edge Cases & Rapid-Fire Input Stress', () => {
    it('should call preventDefault on valid arrow navigation, but NOT when focus is in editable element', () => {
      component.jumpToPage(10);
      fixture.detectChanges();

      // Valid navigation outside inputs -> preventDefault called
      const validEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      let preventDefaultCalled = false;
      validEvent.preventDefault = () => {
        preventDefaultCalled = true;
      };

      component.onKeyDown(validEvent);
      expect(preventDefaultCalled).toBe(true);
      expect(component.currentIndex).toBe(11);

      // Focus inside input -> navigation suppressed and preventDefault NOT called by component
      const input = document.createElement('input');
      const inputEvent = {
        target: input,
        key: 'ArrowRight',
        preventDefault: () => {
          preventDefaultCalled = true;
        },
      } as unknown as KeyboardEvent;
      preventDefaultCalled = false;

      component.onKeyDown(inputEvent);
      expect(preventDefaultCalled).toBe(false);
      expect(component.currentIndex).toBe(11);
    });

    it('should transition cleanly when focus moves between input and reader buttons', () => {
      component.jumpToPage(50);
      fixture.detectChanges();

      const input = document.createElement('input');
      input.className = 'challenge-fixture-element';
      document.body.appendChild(input);
      input.focus();
      expect(document.activeElement).toBe(input);

      // Arrow suppressed while focused
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(50);

      // User clicks next button, shifting focus away from input to button
      const nextBtn = getNextButton();
      nextBtn.focus();
      expect(document.activeElement).toBe(nextBtn);

      // Arrow navigation is immediately re-enabled
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(51);

      // Arrow left from button works
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(component.currentIndex).toBe(50);
    });

    it('should handle rapid-fire arrow key bursts without state corruption', () => {
      component.jumpToPage(100);
      fixture.detectChanges();

      // Rapid burst of 50 ArrowRight events
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }
      fixture.detectChanges();
      expect(component.currentIndex).toBe(150);

      // Rapid burst of 30 ArrowLeft events
      for (let i = 0; i < 30; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }
      fixture.detectChanges();
      expect(component.currentIndex).toBe(120);

      // Rapid burst toward end beyond page 313 (overflow test)
      for (let i = 0; i < 300; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      }
      fixture.detectChanges();
      expect(component.currentIndex).toBe(312); // Strictly clamped at 312

      // Rapid burst toward start below page 1 (underflow test)
      for (let i = 0; i < 400; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      }
      fixture.detectChanges();
      expect(component.currentIndex).toBe(0); // Strictly clamped at 0
    });

    it('should ignore modifier key combinations with arrow keys', () => {
      component.jumpToPage(10);
      fixture.detectChanges();

      // Ctrl + ArrowRight
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);

      // Alt + ArrowRight
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);

      // Meta + ArrowRight
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);

      // Ctrl + ArrowLeft
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);

      // Alt + ArrowLeft
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);

      // Meta + ArrowLeft
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', metaKey: true, bubbles: true })
      );
      expect(component.currentIndex).toBe(10);
    });

    it('should handle extreme floating point and scientific notation values in jumpToPage', () => {
      component.jumpToPage(10);
      expect(component.currentIndex).toBe(10);

      // Floats within bounds should floor
      component.jumpToPage(15.9);
      expect(component.currentIndex).toBe(15);

      component.jumpToPage(0.1);
      expect(component.currentIndex).toBe(0);

      // Negative floats out of bounds
      component.jumpToPage(-0.0001);
      expect(component.currentIndex).toBe(0);

      // Floats exceeding totalPages
      component.jumpToPage(312.9);
      expect(component.currentIndex).toBe(312);

      component.jumpToPage(313.1);
      expect(component.currentIndex).toBe(312); // ignored

      // Scientific notation extremes
      component.jumpToPage(1e20);
      expect(component.currentIndex).toBe(312); // ignored

      component.jumpToPage(-1e20);
      expect(component.currentIndex).toBe(312); // ignored
    });
  });
});
