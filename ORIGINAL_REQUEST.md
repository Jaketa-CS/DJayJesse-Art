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
