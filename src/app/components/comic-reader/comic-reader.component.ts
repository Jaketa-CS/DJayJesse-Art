import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ComicActInfo, comicActs, ComicPageItem, comicPages } from '@/data/comicManifest';

@Component({
  selector: 'app-comic-reader',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './comic-reader.component.html',
})
export class ComicReaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router, { optional: true });
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef, { optional: true });
  private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef, { optional: true });
  private readonly destroy$ = new Subject<void>();

  // Catalog Data
  readonly pages: ComicPageItem[] = comicPages;
  readonly acts: ComicActInfo[] = comicActs;
  readonly totalPages: number = comicPages.length;

  // Active Reader State
  currentIndex = 0;
  imageLoaded = false;
  imageError = false;
  pageMenuOpen = false;

  // -------------------------------------------------------------
  // Derived Reactive Properties (O(1) Getters)
  // -------------------------------------------------------------

  get currentPage(): ComicPageItem {
    return this.pages[this.currentIndex] ?? this.pages[0];
  }

  get currentAct(): ComicActInfo {
    const actNum = this.currentPage?.act ?? 1;
    return this.acts[actNum - 1] ?? this.acts[0];
  }

  get isFirstPage(): boolean {
    return this.currentIndex <= 0;
  }

  get isLastPage(): boolean {
    return this.currentIndex >= this.totalPages - 1;
  }

  get hasPreviousPage(): boolean {
    return !this.isFirstPage;
  }

  get hasNextPage(): boolean {
    return !this.isLastPage;
  }

  get humanPageNumber(): number {
    return this.currentIndex + 1;
  }

  get progressLabel(): string {
    return `Page ${this.humanPageNumber} of ${this.totalPages}`;
  }

  get actProgressLabel(): string {
    const act = this.currentAct;
    const pageInAct = this.currentPage.actIndex + 1;
    return `${act.title} • Page ${pageInAct} of ${act.pageCount}`;
  }

  get progressPercentage(): number {
    return Math.round((this.humanPageNumber / this.totalPages) * 100);
  }

  // Two-way dropdown binding helpers
  get selectedPageIndex(): number {
    return this.currentIndex;
  }
  set selectedPageIndex(val: number | string) {
    const num = typeof val === 'number' ? val : Number.parseInt(String(val), 10);
    if (!Number.isNaN(num)) {
      this.jumpToPage(num);
    }
  }

  get selectedAct(): number {
    return this.currentPage.act;
  }
  set selectedAct(val: number | string) {
    const num = typeof val === 'number' ? val : Number.parseInt(String(val), 10);
    if (!Number.isNaN(num)) {
      this.jumpToAct(num);
    }
  }

  // -------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------

  ngOnInit(): void {
    if (this.route) {
      this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
        const pageParam = params.get('page');
        const actParam = params.get('act');

        if (pageParam !== null) {
          const resolvedIndex = this.resolvePageIndexFromParam(pageParam);
          if (resolvedIndex !== null && resolvedIndex !== this.currentIndex) {
            this.setPageIndex(resolvedIndex, false);
          }
        } else if (actParam !== null) {
          const actNum = Number.parseInt(actParam, 10);
          if (!Number.isNaN(actNum) && actNum >= 1 && actNum <= 5) {
            const act = this.acts.find((a) => a.act === actNum);
            if (act && act.startGlobalIndex !== this.currentIndex) {
              this.setPageIndex(act.startGlobalIndex, false);
            }
          }
        }
      });
    }

    this.preloadAdjacentPages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------
  // Navigation Operations
  // -------------------------------------------------------------

  nextPage(): void {
    if (this.isLastPage) return;
    this.setPageIndex(this.currentIndex + 1, true);
  }

  previousPage(): void {
    if (this.isFirstPage) return;
    this.setPageIndex(this.currentIndex - 1, true);
  }

  jumpToPage(index: number | string): void {
    const numericIndex = typeof index === 'number' ? index : Number.parseInt(String(index), 10);
    if (Number.isNaN(numericIndex)) return;
    const intIndex = Math.floor(numericIndex);
    if (intIndex < 0 || intIndex >= this.totalPages) {
      return; // Ignore out-of-bounds indices
    }
    if (intIndex === this.currentIndex) return;
    this.setPageIndex(intIndex, true);
  }

  jumpToAct(actNumber: number | string): void {
    const actNum =
      typeof actNumber === 'number' ? actNumber : Number.parseInt(String(actNumber), 10);
    if (Number.isNaN(actNum)) return;
    const targetAct = this.acts.find((a) => a.act === actNum);
    if (targetAct) {
      this.jumpToPage(targetAct.startGlobalIndex);
    }
  }

  firstPage(): void {
    this.jumpToPage(0);
  }

  lastPage(): void {
    this.jumpToPage(this.totalPages - 1);
  }

  jumpToPageByFilename(filename: string): boolean {
    const normalized = filename.trim().toLowerCase();
    const target = this.pages.find(
      (p) =>
        p.filename.toLowerCase() === normalized || p.filename.toLowerCase() === `${normalized}.png`
    );
    if (target) {
      this.jumpToPage(target.globalIndex);
      return true;
    }
    return false;
  }

  jumpToPageById(pageId: string): boolean {
    const target = this.pages.find((p) => p.id === pageId.trim().toLowerCase());
    if (target) {
      this.jumpToPage(target.globalIndex);
      return true;
    }
    return false;
  }

  selectPageFromMenu(index: number): void {
    this.jumpToPage(index);
    this.pageMenuOpen = false;
  }

  // Image loading events
  onImageLoad(): void {
    this.imageLoaded = true;
    this.imageError = false;
    this.cdr?.markForCheck();
  }

  onImageError(): void {
    this.imageLoaded = false;
    this.imageError = true;
    this.cdr?.markForCheck();
  }

  // -------------------------------------------------------------
  // Keyboard and Host Click Navigation
  // -------------------------------------------------------------

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.id === 'comic-page-image' || target?.dataset['testid'] === 'comic-image') {
      this.nextPage();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (this.pageMenuOpen && target && !this.elRef?.nativeElement.contains(target)) {
      this.pageMenuOpen = false;
      this.cdr?.markForCheck();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ignore modifier combinations (Ctrl, Alt, Meta)
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Suppress when typing in form controls or editable areas
    if (this.isFocusInEditableOrFormElement(event)) {
      return;
    }

    const key = event.key;
    const code = event.code;

    if (key === 'ArrowRight' || key === 'Right' || code === 'ArrowRight') {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      this.nextPage();
    } else if (key === 'ArrowLeft' || key === 'Left' || code === 'ArrowLeft') {
      if (typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      this.previousPage();
    }
  }

  public isFocusInEditableOrFormElement(event?: KeyboardEvent): boolean {
    const isControl = (el: Element | null): boolean => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toUpperCase();
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        return true;
      }
      const ceProp = el.contentEditable;
      const ceAttr = el.getAttribute('contenteditable');
      return (
        el.isContentEditable ||
        ceProp === 'true' ||
        ceProp === '' ||
        ceAttr === 'true' ||
        ceAttr === '' ||
        el.getAttribute('role') === 'textbox' ||
        el.getAttribute('role') === 'combobox' ||
        Boolean(el.closest?.('[contenteditable="true"], [contenteditable=""]'))
      );
    };

    if (event && isControl(event.target as Element)) {
      return true;
    }
    return typeof document !== 'undefined' && isControl(document.activeElement);
  }

  // -------------------------------------------------------------
  // Internal State Helpers & Preloading
  // -------------------------------------------------------------

  private setPageIndex(newIndex: number, syncRouter: boolean): void {
    if (newIndex === this.currentIndex) return;
    this.currentIndex = newIndex;
    this.imageLoaded = false;
    this.imageError = false;

    if (syncRouter) {
      this.syncUrlWithCurrentPage();
    }
    this.preloadAdjacentPages();
    this.cdr?.markForCheck();
  }

  private syncUrlWithCurrentPage(): void {
    if (!this.router || !this.route) return;

    const targetPageNum = this.humanPageNumber;
    const currentParam = this.route.snapshot?.queryParamMap?.get('page');
    if (currentParam !== String(targetPageNum)) {
      this.router
        .navigate([], {
          relativeTo: this.route,
          queryParams: { page: targetPageNum },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch(() => {
          // handle
        });
    }
  }

  public resolvePageIndexFromParam(param: string): number | null {
    if (!param) return null;
    const trimmed = param.trim();

    // 1-based numeric page index
    const num = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(num) && /^\d+$/.test(trimmed)) {
      if (num >= 1 && num <= this.totalPages) {
        return num - 1;
      }
      if (num <= 0) return 0;
      if (num > this.totalPages) return this.totalPages - 1;
    }

    // Filename lookup (e.g., Act1.11b or Act1.11b.png)
    const normalized = trimmed.toLowerCase();
    const byFilename = this.pages.findIndex(
      (p) =>
        p.filename.toLowerCase() === normalized || p.filename.toLowerCase() === `${normalized}.png`
    );
    if (byFilename !== -1) {
      return byFilename;
    }

    // ID lookup (e.g., act-1-page-11b)
    const byId = this.pages.findIndex((p) => p.id.toLowerCase() === normalized);
    if (byId !== -1) {
      return byId;
    }

    return null;
  }

  private preloadAdjacentPages(): void {
    if (typeof window === 'undefined') return;

    const toPreload: string[] = [];
    if (this.currentIndex + 1 < this.totalPages) {
      toPreload.push(this.pages[this.currentIndex + 1].src);
    }
    if (this.currentIndex + 2 < this.totalPages) {
      toPreload.push(this.pages[this.currentIndex + 2].src);
    }
    if (this.currentIndex - 1 >= 0) {
      toPreload.push(this.pages[this.currentIndex - 1].src);
    }

    for (const src of toPreload) {
      try {
        const img = new Image();
        img.src = src;
      } catch {
        // Ignore image instantiation issues in headless or mock DOM
      }
    }
  }
}
