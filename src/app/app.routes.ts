import { Routes } from '@angular/router';
import { ComicReaderComponent } from './components/comic-reader/comic-reader.component';

export const routes: Routes = [
  {
    path: '',
    component: ComicReaderComponent,
    title: 'Himli & Seven',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
