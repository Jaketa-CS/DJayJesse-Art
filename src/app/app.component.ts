import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div
      class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-600 selection:text-white"
    >
      <!-- Dark-mode Application Header & Branding -->
      <header
        class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-4 py-3 sticky top-0 z-30"
      >
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <a
            routerLink="/"
            class="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:text-sky-400 transition-colors"
          >
            <span class="text-sky-400 font-mono text-2xl font-black leading-none">⚡</span>
            <span>DJayJesse-Art</span>
          </a>
          <div class="flex items-center gap-3">
            <span
              class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
            >
              313 Pages &bull; Acts 1–5
            </span>
          </div>
        </div>
      </header>

      <!-- Main Routed Viewport -->
      <main class="flex-1 flex flex-col">
        <router-outlet></router-outlet>
      </main>

      <!-- Application Footer -->
      <footer class="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        DJayJesse-Art &copy; 2026 &bull; Interactive Comic Reader &bull; Dark-Mode Portfolio
      </footer>
    </div>
  `,
})
export class AppComponent {
  title = 'DJayJesse-Art';
}
