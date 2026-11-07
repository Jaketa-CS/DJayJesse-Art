import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { ComicReaderComponent } from './comic-reader.component';

export interface ComicReaderTestContext {
  fixture: ComponentFixture<ComicReaderComponent>;
  component: ComicReaderComponent;
  compiled: HTMLElement;
}

export async function createComicReaderTestBed(
  queryParamMap$: Observable<ParamMap>
): Promise<ComicReaderTestContext> {
  await TestBed.configureTestingModule({
    imports: [ComicReaderComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap({}) },
          queryParamMap: queryParamMap$,
        },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ComicReaderComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  const compiled = fixture.nativeElement as HTMLElement;

  return { fixture, component, compiled };
}
