import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen bg-black text-white flex flex-col font-sans">
      <!-- Minimal Monochrome Application Header -->
      <header class="py-4 text-center">
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white">DJayJesse-Art</h1>
      </header>

      <!-- Main Routed Viewport -->
      <main class="flex-1 flex flex-col">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class AppComponent {
  title = 'DJayJesse-Art';
}
