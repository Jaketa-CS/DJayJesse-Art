# Original User Request

## Initial Request — 2026-10-25T23:47:06Z

Build **DJayJesse-Art**, a dark-mode web application in **Angular** (TypeScript + Angular standalone components & router + Tailwind CSS + **Vitest**) to showcase a 313-page storyboard/comic (`Act1.1.png` through `Act5.59.png`) with interactive page-flipping navigation, structured so it can later expand into a full art portfolio site. Configure the project in a flat root layout with Vitest (including coverage), Playwright E2E tests, SonarQube configuration, and the CI/CD + security/code-quality tooling modeled after the reference project at `/home/jake/SANDBOX/Thunder-Art`. Make incremental git commits throughout the build with concise, simple, educative commit messages and never cite Gemini or AI authorship.

Working directory: `/home/jake/SANDBOX/DJayJesse-Art`
Integrity mode: development

Reference material & existing workspace state:
- Existing reference repository for CI/CD, security, and tooling: `/home/jake/SANDBOX/Thunder-Art`
- Existing comic page assets (already migrated): `/home/jake/SANDBOX/DJayJesse-Art/public/comic-pages/` (313 PNG files across Acts 1–5: `Act1.1.png` through `Act5.59.png`, including `Act1.11b.png`, `Act4.10a.png`, `Act4.10b.png`)
- Existing pure-TypeScript natural sort & manifest utilities already in workspace: `src/utils/naturalSort.ts`, `src/utils/naturalSort.test.ts`, `src/utils/naturalSort.stress.test.ts`, and `src/data/comicManifest.ts` (keep and reuse these!).
- Note: The workspace initially had React dependencies in `package.json` and `src/main.tsx`. Replace the React packages/entry point with **Angular** (`@angular/core`, `@angular/common`, `@angular/router`, `@angular/platform-browser`, `@angular/compiler`, etc., configured to build and test cleanly with **TypeScript** and **Vitest**).

## Requirements

### R1. Flat Angular Project Structure & Comic Asset Catalog
Configure the **Angular** + TypeScript + Tailwind CSS project directly in the root of `/home/jake/SANDBOX/DJayJesse-Art` (flat layout) with Angular Router support so additional portfolio pages can be added later. Keep all 313 comic page PNGs in `public/comic-pages/` (served at `/comic-pages/<filename>`) and preserve/reuse the structured manifest/catalog (`src/data/comicManifest.ts` and `src/utils/naturalSort.ts`) that orders all 313 pages in their natural narrative sequence across Acts 1 through 5 (`Act1.1` through `Act5.59`).

### R2. Dark-Mode Storyboard / Comic Reader Main Page (Angular Component)
Build the main page as an Angular standalone component in a dark-mode theme with high-contrast white text (`DJayJesse-Art` header/branding and clean reader viewport) that allows users to read and flip through the comic:
- **Next / Previous page controls** (with appropriate disabled states on the first and last pages).
- **Keyboard arrow navigation** (`ArrowRight` / `ArrowLeft` via `@HostListener('window:keydown')` or equivalent to flip forward/backward when not focused in an input/select).
- **Current Act & Page indicator** (showing current Act, page label, and overall progress out of 313 pages).
- **Act & Page jump selector** allowing the reader to jump directly to a specific Act (Acts 1–5) or specific page in the 313-page sequence.

### R3. Testing Suite (Vitest + Playwright E2E for Angular)
Set up **Vitest** (producing `coverage/lcov.info` for SonarQube, testing Angular components/services and the catalog/natural sort utilities in `happy-dom` or `jsdom`) and **Playwright** for end-to-end verification:
- Unit/component tests in Vitest verifying natural sorting/ordering of all 313 comic pages across Acts 1–5 (including alphanumeric sub-pages like `Act1.11b.png`, `Act4.10a.png`, `Act4.10b.png`), Angular comic reader component state/DOM updates for Next/Previous navigation, boundary states (first/last page), keyboard arrow navigation, and Act/Page jump selection.
- Playwright E2E tests verifying the dark-mode rendering, initial page display (`Act1.1.png`), flipping forward and backward via buttons and keyboard arrows, and jumping between Acts/pages.

### R4. Tooling, Security Pipeline & SonarQube Integration
Adapt the engineering, code quality, and security setup from `/home/jake/SANDBOX/Thunder-Art` to the flat root Angular structure in `/home/jake/SANDBOX/DJayJesse-Art`:
- **Code Quality & Git Hooks:** ESLint (TypeScript/Angular compatible rules), Prettier (`.prettierrc`, `.editorconfig`), Husky + `lint-staged`.
- **SonarQube:** Add `sonar-project.properties` configured for TypeScript sources (`src/`), test files, and `coverage/lcov.info`.
- **GitHub Actions Workflows (`.github/workflows/`):**
  - `ci.yml`: Lint job (ESLint + Prettier check), Unit Tests & Build job (Vitest with coverage + production build), E2E Tests job (Playwright Chromium), SonarQube / SonarCloud scan job, Secret Scan job (TruffleHog), and Dependency Vulnerability Scan job (Trivy).
  - `codeql.yml`: CodeQL security & quality analysis for `javascript-typescript`.

### R5. Incremental Git Commits & Clean Commit History
Create logical, incremental Git commits in `/home/jake/SANDBOX/DJayJesse-Art` as major pieces are completed (e.g., migrating scaffolding from React to Angular, implementing the dark-mode Angular comic reader component & unit tests, adding CI/CD + SonarQube + Playwright E2E tests). Commit messages must be concise, simple, and educative (explaining what and why clearly), and must **never** include any citation or mention of Gemini, Claude, AI, or automated agents (including in `Co-authored-by` trailers).

## Acceptance Criteria

### Asset & Catalog Integrity
- [ ] All 313 comic `.png` files reside in `/home/jake/SANDBOX/DJayJesse-Art/public/comic-pages/` and are served at `/comic-pages/<filename>`.
- [ ] The comic catalog/manifest contains all 313 pages sorted in natural Act and page order (`Act1.1` first, `Act1.2` before `Act1.10`, `Act1.11` followed by `Act1.11b` then `Act1.12`, ending at `Act5.59`).

### Angular Dark-Mode UI & Reader Functionality
- [ ] The application is built with **Angular** (`@angular/core`, `@angular/router`, etc., with zero React dependencies remaining in `package.json`), renders in dark mode by default (dark background with white text), and displays the comic reader on the main route (`/`).
- [ ] Clicking "Next" advances to the next comic page and updates the image and Act/Page indicator; clicking "Previous" returns to the previous page; "Previous" is disabled on page 1 and "Next" is disabled on page 313.
- [ ] Pressing `ArrowRight` and `ArrowLeft` navigates to the next and previous pages respectively.
- [ ] Selecting an Act or Page from the jump selector updates the displayed comic page to the selected target.

### Build, Lint, Coverage & End-to-End Verification
- [ ] `npm run lint` and `npm run format:check` exit with code `0` with zero errors.
- [ ] `npm run test` (and coverage generation) passes all Vitest unit/component tests and generates `coverage/lcov.info`.
- [ ] `npm run build` compiles the Angular TypeScript application and produces a production bundle in `dist/` with exit code `0`.
- [ ] `npm run test:e2e` runs Playwright against the Angular app and passes all E2E tests.

### CI/CD, Security, SonarQube & Git History
- [ ] `.github/workflows/ci.yml` and `.github/workflows/codeql.yml` exist, use the flat root paths, and include Lint, Unit Test + Coverage + Build, Playwright E2E, SonarQube scan, TruffleHog secret scan, Trivy dependency scan, and CodeQL analysis.
- [ ] `sonar-project.properties`, `.prettierrc`, `.editorconfig`, `eslint.config.js`, and `.husky/` are present and properly configured.
- [ ] `git log` shows multiple incremental commits with concise, educative commit messages, zero mentions of Gemini/AI/Co-authored-by AI, and `git status` is clean at completion.


## Follow-up — 2026-10-26T01:27:39Z

URGENT USER DESIGN CHANGE REQUEST — Please forward immediately to the active Project Orchestrator and ensure it is implemented, tested, and committed before completion:

The user reviewed the live app and requested the following visual/UI adjustments:
1. **Use pure blacks and neutral grays instead of dark blues (`slate-*` / `sky-*` / `indigo-*`)**:
   - Replace all `slate-*`, `sky-*`, and `indigo-*` classes across `index.html`, `src/index.css`, `src/app/app.component.ts`, and `src/app/components/comic-reader/comic-reader.component.html` with neutral blacks, grays, and white (`bg-black`, `bg-neutral-950`, `bg-neutral-900`, `bg-neutral-800`, `border-neutral-800`, `border-neutral-700`, `text-white`, `text-neutral-200`, `text-neutral-400`, etc.).
   - Update `<meta name="theme-color" content="#0a0a0a" />` in `index.html`.
2. **Make the styling simpler and less "modern/techy"**:
   - Remove the `⚡` lightning bolt icon, pulsing dots (`animate-pulse`), neon blue button/badge glows, and overly techy badges/borders. Keep the header, controls, and comic stage clean, minimal, understated, and focused on the artwork in monochrome black/gray/white.
3. **Remove the progress bar**:
   - Remove the visual reading progress bar (`role="progressbar"` / `data-testid="progress-bar"`) from `src/app/components/comic-reader/comic-reader.component.html`.
   - Update any unit/component/challenge tests in `src/app/components/comic-reader/*.spec.ts` (and Playwright E2E tests) that check for `progress-bar` or `slate`/`sky` classes so all Vitest and Playwright tests pass cleanly with the new neutral black/gray minimal styling and no progress bar.
4. **Also add `"start": "vite"` to `package.json` scripts** so both `npm start` and `npm run dev` work.
5. Commit this styling update with a concise, educative commit message (no AI/Gemini mentions).


## Follow-up — 2026-10-26T01:29:52Z

URGENT FOLLOW-UP USER UI SIMPLIFICATION REQUEST — Forward immediately to the Project Orchestrator:

The user clarified they want the UI stripped down to be **very basic and simple** ("remove most of the styling actually, thunder art was just me, djayjesse should be pretty basic, i want to keep it pretty simple for now, like it should be just the comic in the middle with centered below it left and right arrows"):

1. **Ultra-basic layout (remove bulky headers, cards, boxes, badges, overlays, and footers)**:
   - Simple dark/black background (`bg-neutral-950` or `bg-black`) with white text (`text-white`).
   - Simple plain text title (`DJayJesse-Art`) at the top (no sticky navbar card, no "313 Pages • Acts 1-5" pill badge, no footer banner, no keyboard shortcut hint card).
   - **Comic image centered in the middle** of the page (clean `<img>` without heavy nested border cards/containers or hover overlay zones).
   - **Centered directly below the comic image**: Left (`←`) and Right (`→`) arrow buttons (`data-testid="prev-button"` and `data-testid="next-button"`) to go to the previous and next page, along with a simple, unobtrusive page indicator / Act & Page jump select so all existing unit/E2E test selectors (`data-testid="prev-button"`, `data-testid="next-button"`, `data-testid="comic-image"`, `data-testid="page-indicator"`, `data-testid="act-select"`, `data-testid="page-select"`) still work while keeping the visual presentation super minimal: comic in the middle, left/right arrow controls centered underneath!
2. **Update any unit/component/E2E tests** that depended on removed elements (`progress-bar`, `overlay-prev`, `overlay-next`, `keyboard-hint`, etc.) so `npm test`, `npm run lint`, `npm run format:check`, `npm run build`, and `npm run test:e2e` all pass 100%.
3. Commit with a concise, educative commit message (no AI/Gemini mentions).
