import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comic-reader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div class="rounded-xl bg-slate-900 border border-slate-800 p-8 shadow-2xl max-w-lg">
        <div class="flex items-center justify-center gap-2 text-sky-400 mb-3">
          <span class="text-2xl font-black">⚡</span>
          <h2 class="text-2xl font-bold text-white">DJayJesse-Art Comic Reader</h2>
        </div>
        <p class="text-slate-400 text-sm leading-relaxed mb-4">
          Angular standalone scaffolding initialized with Angular Router and Tailwind CSS. Ready to
          showcase 313 comic pages across Acts 1 through 5.
        </p>
        <div
          class="inline-flex items-center px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-semibold"
        >
          Milestone 1 Ready &bull; Awaiting M2 Reader Component Implementation
        </div>
      </div>
    </div>
  `,
})
export class ComicReaderComponent {
  readonly totalPages = 313;
}
