import 'zone.js';
import './index.css';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error('Failed to bootstrap DJayJesse-Art application:', err);
});
