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
  archiveModalOpen = false;
  isScrubbing = false;
  dragVisualPercent: number | null = null;
  private scrubSettleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly preloadedUrls = new Set<string>();

  // -------------------------------------------------------------
  // Derived Reactive Properties (O(1) Getters)
  // -------------------------------------------------------------

  get displayedImageSrc(): string {
    return this.currentPage.src;
  }

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

  get progressExactPercentage(): number {
    if (this.isScrubbing && this.dragVisualPercent !== null) {
      return this.dragVisualPercent;
    }
    if (this.totalPages <= 0) return 0;
    return (this.humanPageNumber / this.totalPages) * 100;
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
        if (this.isScrubbing) return;
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
    if (this.scrubSettleTimer) {
      clearTimeout(this.scrubSettleTimer);
      this.scrubSettleTimer = null;
    }
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
      return;
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
    const normalizedNoExt = normalized.replace(/\.(png|webp)$/i, '');
    const target = this.pages.find((p) => {
      const pNormalized = p.filename.toLowerCase();
      const pNoExt = pNormalized.replace(/\.(png|webp)$/i, '');
      return pNormalized === normalized || pNoExt === normalizedNoExt;
    });
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

  openArchiveModal(): void {
    this.archiveModalOpen = true;
    this.pageMenuOpen = false;
    this.cdr?.markForCheck();
    this.scrollToCurrentPageInArchive();
  }

  public scrollToCurrentPageInArchive(): void {
    if (typeof window === 'undefined') return;

    const performScroll = () => {
      const container = this.elRef?.nativeElement.querySelector(
        '#archive-scroll-container'
      ) as HTMLElement | null;
      const targetEl = this.elRef?.nativeElement.querySelector(
        `#archive-page-${this.currentIndex}`
      ) as HTMLElement | null;

      if (!targetEl) return false;

      if (container) {
        const targetRect = targetEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
        container.scrollTop = Math.max(
          0,
          relativeTop - container.clientHeight / 2 + targetRect.height / 2
        );
      }

      if (typeof targetEl.scrollIntoView === 'function') {
        try {
          targetEl.scrollIntoView({ block: 'center', inline: 'nearest' });
        } catch {
          targetEl.scrollIntoView({ block: 'center' });
        }
      }

      return true;
    };

    setTimeout(performScroll, 0);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 150);
  }

  closeArchiveModal(): void {
    this.archiveModalOpen = false;
    this.cdr?.markForCheck();
  }

  selectPageAndClose(index: number): void {
    this.jumpToPage(index);
    this.closeArchiveModal();
  }

  // -------------------------------------------------------------
  // Progress Scrubber Bar Handlers (Smooth Click & Drag)
  // -------------------------------------------------------------

  onSliderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pageNum = Number.parseInt(input.value, 10);
    if (!Number.isNaN(pageNum)) {
      const targetIndex = Math.min(this.totalPages - 1, Math.max(0, pageNum - 1));
      this.isScrubbing = true;
      this.currentIndex = targetIndex;
      this.imageError = false;
      this.dragVisualPercent = ((targetIndex + 1) / this.totalPages) * 100;
      this.scheduleScrubSettle();
      this.cdr?.markForCheck();
    }
  }

  onSliderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pageNum = Number.parseInt(input.value, 10);
    if (!Number.isNaN(pageNum)) {
      this.currentIndex = Math.min(this.totalPages - 1, Math.max(0, pageNum - 1));
      this.imageError = false;
    }
    this.isScrubbing = false;
    this.dragVisualPercent = null;
    this.settleScrub();
  }

  onScrubberPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const target = event.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Fallback
    }
    this.isScrubbing = true;
    this.updateDragVisual(event.clientX, target);
    this.applyScrubIndex(event.clientX, target);
    this.scheduleScrubSettle();
  }

  onScrubberPointerMove(event: PointerEvent): void {
    if (!this.isScrubbing) return;
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.isScrubbing = false;
      this.dragVisualPercent = null;
      this.settleScrub();
      return;
    }
    const target = event.currentTarget as HTMLElement;
    this.updateDragVisual(event.clientX, target);
    this.applyScrubIndex(event.clientX, target);
    this.scheduleScrubSettle();
  }

  onScrubberPointerCancel(event: PointerEvent): void {
    if (!this.isScrubbing) return;
    const target = event.currentTarget as HTMLElement;
    try {
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Fallback
    }

    this.isScrubbing = false;
    this.dragVisualPercent = null;
    this.settleScrub();
  }

  onScrubberPointerUp(event: PointerEvent): void {
    if (!this.isScrubbing) return;
    const target = event.currentTarget as HTMLElement;
    try {
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Fallback
    }

    this.applyScrubIndex(event.clientX, target);
    this.isScrubbing = false;
    this.dragVisualPercent = null;
    this.settleScrub();
  }

  private updateDragVisual(clientX: number, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    this.dragVisualPercent = (x / rect.width) * 100;
    this.cdr?.markForCheck();
  }

  private applyScrubIndex(clientX: number, target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const fraction = x / rect.width;
    const targetIndex = Math.min(
      this.totalPages - 1,
      Math.max(0, Math.floor(fraction * this.totalPages))
    );
    if (targetIndex !== this.currentIndex) {
      this.currentIndex = targetIndex;
      this.imageError = false;
      this.cdr?.markForCheck();
    }
  }

  private scheduleScrubSettle(): void {
    if (this.scrubSettleTimer) {
      clearTimeout(this.scrubSettleTimer);
    }
    this.scrubSettleTimer = setTimeout(() => {
      this.scrubSettleTimer = null;
      this.settleScrub();
    }, 120);
  }

  private settleScrub(): void {
    if (this.scrubSettleTimer) {
      clearTimeout(this.scrubSettleTimer);
      this.scrubSettleTimer = null;
    }
    this.syncUrlWithCurrentPage();
    this.preloadAdjacentPages();
    this.cdr?.markForCheck();
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
    if (this.archiveModalOpen) {
      return;
    }
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
    if (this.archiveModalOpen) {
      if (event.key === 'Escape') {
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        this.closeArchiveModal();
      }
      return;
    }

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
    if (this.scrubSettleTimer) {
      clearTimeout(this.scrubSettleTimer);
      this.scrubSettleTimer = null;
    }
    this.isScrubbing = false;
    this.currentIndex = newIndex;
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

    // Filename lookup (e.g., Act1.11b, Act1.11b.png, or Act1.11b.webp)
    const normalized = trimmed.toLowerCase();
    const normalizedNoExt = normalized.replace(/\.(png|webp)$/i, '');
    const byFilename = this.pages.findIndex((p) => {
      const pNormalized = p.filename.toLowerCase();
      const pNoExt = pNormalized.replace(/\.(png|webp)$/i, '');
      return pNormalized === normalized || pNoExt === normalizedNoExt;
    });
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
      if (this.preloadedUrls.has(src)) continue;
      this.preloadedUrls.add(src);
      try {
        const img = new Image();
        img.src = src;
      } catch {
        // Ignore image instantiation issues in headless or mock DOM
      }
    }
  }
}
