import { test, expect, type Page } from '@playwright/test';

/**
 * Playwright End-to-End Test Suite for DJayJesse-Art Comic Reader.
 *
 * Validates:
 * 1. Minimal monochrome styling & dark-mode theme enforcement
 * 2. Initial page display & image asset loading (Act1.1.png)
 * 3. Button flipping & sequential navigation (Next / Previous)
 * 4. Boundary enforcement at Page 1 and Page 313 (Act5.59.png)
 * 5. Keyboard arrow navigation (ArrowRight / ArrowLeft)
 * 6. Keyboard focus guard suppression when select dropdowns have focus
 * 7. Act jump dropdown navigation (Acts 1 through 5)
 * 8. Page jump dropdown navigation with alphanumeric sub-pages (Act1.11b, Act4.10a, Act4.10b)
 * 9. URL deep linking & query parameter synchronization (?page=X, ?act=Y)
 * 10. Application stability and zero fatal console/page errors
 */

test.describe('DJayJesse-Art Comic Reader E2E Suite', () => {
  // Shared helper locators
  const getComicImage = (page: Page) => page.getByTestId('comic-image');
  const getPrevButton = (page: Page) => page.getByTestId('prev-button');
  const getNextButton = (page: Page) => page.getByTestId('next-button');
  const getIndicator = (page: Page) => page.getByTestId('page-indicator');
  const getActSelect = (page: Page) => page.getByTestId('act-select');
  const getPageSelect = (page: Page) => page.getByTestId('page-select');

  // =========================================================================
  // 1. Dark Mode & Minimal Monochrome Styling
  // =========================================================================
  test.describe('Dark Mode & Minimal Monochrome Styling', () => {
    test('renders application in dark mode with dark background and high-contrast text', async ({
      page,
    }) => {
      await page.goto('/');

      // Verify html element has dark class
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Verify header branding
      const headerTitle = page.getByRole('heading', { name: /^DJayJesse$/ });
      await expect(headerTitle).toBeVisible();

      // Verify computed background color on body is dark (black / neutral-950)
      const body = page.locator('body');
      await expect(body).toBeVisible();
      const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      const rgbValues = bgColor.match(/\d+/g)?.map(Number) ?? [255, 255, 255];
      // All RGB channels must be very dark (<= 30)
      expect(rgbValues[0]).toBeLessThanOrEqual(30);
      expect(rgbValues[1]).toBeLessThanOrEqual(30);
      expect(rgbValues[2]).toBeLessThanOrEqual(30);

      // Verify high-contrast white text color on header title
      const titleColor = await headerTitle.evaluate((el) => window.getComputedStyle(el).color);
      const titleRgb = titleColor.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
      // RGB channels must be high-contrast light (>= 200)
      expect(titleRgb[0]).toBeGreaterThanOrEqual(200);
      expect(titleRgb[1]).toBeGreaterThanOrEqual(200);
      expect(titleRgb[2]).toBeGreaterThanOrEqual(200);
    });

    test('verifies stripped-down minimal layout: progress bar and tap overlays are absent', async ({
      page,
    }) => {
      await page.goto('/');

      // Reading progress bar has been removed per user specification
      await expect(page.locator('[data-testid="progress-bar"]')).toHaveCount(0);
      await expect(page.getByRole('progressbar')).toHaveCount(0);

      // Hover tap overlays have been removed from the clean comic stage
      await expect(page.locator('[data-testid="overlay-prev"]')).toHaveCount(0);
      await expect(page.locator('[data-testid="overlay-next"]')).toHaveCount(0);

      // Keyboard shortcut hint card removed
      await expect(page.locator('[data-testid="keyboard-hint"]')).toHaveCount(0);
    });
  });

  // =========================================================================
  // 2. Initial Page Display & Asset Loading
  // =========================================================================
  test.describe('Initial Page Display & Asset Loading', () => {
    test('renders initial Page 1 (Act1.1.png) with accurate properties and button states', async ({
      page,
    }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const prevBtn = getPrevButton(page);
      const nextBtn = getNextButton(page);
      const indicator = getIndicator(page);

      // Verify comic image attributes
      await expect(comicImg).toBeVisible();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 1, Page 1');

      // Verify image actually decoded and rendered
      const isLoaded = await comicImg.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalWidth > 0;
      });
      expect(isLoaded).toBe(true);

      // Verify indicator content
      await expect(indicator).toContainText('Page 1 of 313');
      await expect(indicator).toContainText('Act 1, Page 1');

      // Verify boundary initial button states: Previous disabled, Next enabled
      await expect(prevBtn).toBeDisabled();
      await expect(nextBtn).toBeEnabled();

      // Verify dropdown initial values
      await expect(getActSelect(page)).toHaveValue('1');
      await expect(getPageSelect(page)).toHaveValue('0');
    });
  });

  // =========================================================================
  // 3. Button Flipping & Sequential Navigation
  // =========================================================================
  test.describe('Button Flipping & Sequential Navigation', () => {
    test('clicking Next advances page and updates indicator; clicking Previous returns', async ({
      page,
    }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const prevBtn = getPrevButton(page);
      const nextBtn = getNextButton(page);
      const indicator = getIndicator(page);

      // 1. Advance to Page 2
      await nextBtn.click();

      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.2\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 1, Page 2');
      await expect(indicator).toContainText('Page 2 of 313');
      await expect(indicator).toContainText('Act 1, Page 2');

      // Previous button should now be enabled
      await expect(prevBtn).toBeEnabled();
      await expect(nextBtn).toBeEnabled();

      // 2. Return to Page 1
      await prevBtn.click();

      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(indicator).toContainText('Page 1 of 313');
      await expect(prevBtn).toBeDisabled();
      await expect(nextBtn).toBeEnabled();
    });

    test('clicking Next multiple times advances sequentially through pages', async ({ page }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const nextBtn = getNextButton(page);
      const indicator = getIndicator(page);

      // Advance 4 times to reach Page 5 (Act1.5.png)
      for (let i = 0; i < 4; i++) {
        await nextBtn.click();
      }

      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.5\.png$/);
      await expect(indicator).toContainText('Page 5 of 313');
    });

    test('clicking directly on the comic image advances to the next page', async ({ page }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);

      await comicImg.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.2\.png$/);
      await expect(indicator).toContainText('Page 2 of 313');
    });
  });

  // =========================================================================
  // 4. Boundary Enforcement
  // =========================================================================
  test.describe('Boundary Enforcement', () => {
    test('enforces lower boundary at Page 1: Previous button remains disabled and cannot underflow', async ({
      page,
    }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const prevBtn = getPrevButton(page);

      // Verify disabled state
      await expect(prevBtn).toBeDisabled();

      // Attempt ArrowLeft keyboard navigation at boundary
      await page.keyboard.press('ArrowLeft');

      // State remains strictly at Page 1
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(getIndicator(page)).toContainText('Page 1 of 313');
      await expect(prevBtn).toBeDisabled();
    });

    test('enforces upper boundary at Page 313 (Act5.59.png): Next button is disabled and cannot overflow', async ({
      page,
    }) => {
      await page.goto('/');

      const pageSelect = getPageSelect(page);
      const prevBtn = getPrevButton(page);
      const nextBtn = getNextButton(page);
      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);

      // Jump to last page: global index 312 (Act5.59.png)
      await pageSelect.selectOption('312');

      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act5\.59\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 5, Page 59');
      await expect(indicator).toContainText('Page 313 of 313');

      // Verify Next button is disabled and Previous button is enabled
      await expect(nextBtn).toBeDisabled();
      await expect(prevBtn).toBeEnabled();

      // Attempt ArrowRight keyboard navigation at upper boundary
      await page.keyboard.press('ArrowRight');

      // State remains strictly at Page 313
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act5\.59\.png$/);
      await expect(indicator).toContainText('Page 313 of 313');
      await expect(nextBtn).toBeDisabled();
    });
  });

  // =========================================================================
  // 5. Keyboard Navigation
  // =========================================================================
  test.describe('Keyboard Navigation', () => {
    test('navigates forward with ArrowRight and backward with ArrowLeft', async ({ page }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);

      // Press ArrowRight to advance to Page 2
      await page.keyboard.press('ArrowRight');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.2\.png$/);
      await expect(indicator).toContainText('Page 2 of 313');

      // Press ArrowRight again to advance to Page 3
      await page.keyboard.press('ArrowRight');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.3\.png$/);
      await expect(indicator).toContainText('Page 3 of 313');

      // Press ArrowLeft to return to Page 2
      await page.keyboard.press('ArrowLeft');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.2\.png$/);
      await expect(indicator).toContainText('Page 2 of 313');

      // Press ArrowLeft to return to Page 1
      await page.keyboard.press('ArrowLeft');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(indicator).toContainText('Page 1 of 313');
    });
  });

  // =========================================================================
  // 6. Keyboard Focus Guard Suppression
  // =========================================================================
  test.describe('Keyboard Focus Guard Suppression', () => {
    test('suppresses page flipping when focus is inside an input element', async ({ page }) => {
      await page.goto('/');

      const comicImg = getComicImage(page);

      // Inject a temporary text input and focus it to verify focus guard in real browser
      await page.evaluate(() => {
        const input = document.createElement('input');
        input.id = 'e2e-focus-guard-input';
        input.type = 'text';
        input.value = 'test';
        document.body.appendChild(input);
        input.focus();
      });

      const input = page.locator('#e2e-focus-guard-input');
      await expect(input).toBeFocused();

      // Press ArrowRight while focused in the input
      await page.keyboard.press('ArrowRight');

      // Comic page must NOT flip (still on Act1.1.png)
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(getIndicator(page)).toContainText('Page 1 of 313');

      // Press ArrowLeft while focused in the input
      await page.keyboard.press('ArrowLeft');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);

      // Blur the input by focusing the Next button
      await getNextButton(page).focus();
      await page.keyboard.press('ArrowRight');

      // Page flipping is now restored
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.2\.png$/);
      await expect(getIndicator(page)).toContainText('Page 2 of 313');
    });

    test('suppresses page flipping when focus is inside a textarea element', async ({ page }) => {
      await page.goto('/');

      // Advance to page 5 first so both directions are available
      await getPageSelect(page).selectOption('4');
      const comicImg = getComicImage(page);
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.5\.png$/);

      await page.evaluate(() => {
        const textarea = document.createElement('textarea');
        textarea.id = 'e2e-focus-guard-textarea';
        textarea.value = 'notes';
        document.body.appendChild(textarea);
        textarea.focus();
      });

      const textarea = page.locator('#e2e-focus-guard-textarea');
      await expect(textarea).toBeFocused();

      // Press ArrowRight while focused
      await page.keyboard.press('ArrowRight');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.5\.png$/);

      // Press ArrowLeft while focused
      await page.keyboard.press('ArrowLeft');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.5\.png$/);
    });
  });

  // =========================================================================
  // 7. Act Jump Navigation
  // =========================================================================
  test.describe('Act Jump Navigation', () => {
    test('selecting Acts from dropdown jumps directly to act starting pages', async ({ page }) => {
      await page.goto('/');

      const actSelect = getActSelect(page);
      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);

      // Jump to Act 2 (starts at globalIndex 67 -> Act2.1.png)
      await actSelect.selectOption('2');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act2\.1\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 2, Page 1');
      await expect(indicator).toContainText('Page 68 of 313');
      await expect(indicator).toContainText('Act 2, Page 1');

      // Jump to Act 3 (starts at globalIndex 133 -> Act3.1.png)
      await actSelect.selectOption('3');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act3\.1\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 3, Page 1');
      await expect(indicator).toContainText('Page 134 of 313');

      // Jump to Act 4 (starts at globalIndex 188 -> Act4.1.png)
      await actSelect.selectOption('4');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.1\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 4, Page 1');
      await expect(indicator).toContainText('Page 189 of 313');

      // Jump to Act 5 (starts at globalIndex 254 -> Act5.1.png)
      await actSelect.selectOption('5');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act5\.1\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 5, Page 1');
      await expect(indicator).toContainText('Page 255 of 313');

      // Return to Act 1 (starts at globalIndex 0 -> Act1.1.png)
      await actSelect.selectOption('1');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.1\.png$/);
      await expect(indicator).toContainText('Page 1 of 313');
    });
  });

  // =========================================================================
  // 8. Page Jump Navigation & Alphanumeric Sub-Pages
  // =========================================================================
  test.describe('Page Jump Navigation & Alphanumeric Sub-Pages', () => {
    test('jumps directly to Act 1 sub-page Act1.11b.png and steps sequentially', async ({
      page,
    }) => {
      await page.goto('/');

      const pageSelect = getPageSelect(page);
      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);
      const nextBtn = getNextButton(page);
      const prevBtn = getPrevButton(page);

      // Select index 11 (Act1.11b.png)
      await pageSelect.selectOption('11');

      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.11b\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 1, Page 11b');
      await expect(indicator).toContainText('Act 1, Page 11b');
      await expect(indicator).toContainText('Page 12 of 313');

      // Advance to Act1.12.png (index 12)
      await nextBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.12\.png$/);
      await expect(indicator).toContainText('Page 13 of 313');

      // Return to Act1.11b.png (index 11)
      await prevBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.11b\.png$/);

      // Return to Act1.11.png (index 10)
      await prevBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.11\.png$/);
      await expect(indicator).toContainText('Act 1, Page 11');
      await expect(indicator).toContainText('Page 11 of 313');
    });

    test('jumps directly to Act 4 sub-pages Act4.10a.png & Act4.10b.png and traverses sequence', async ({
      page,
    }) => {
      await page.goto('/');

      const pageSelect = getPageSelect(page);
      const comicImg = getComicImage(page);
      const indicator = getIndicator(page);
      const nextBtn = getNextButton(page);
      const prevBtn = getPrevButton(page);

      // Jump to Act4.10a.png (globalIndex 197)
      await pageSelect.selectOption('197');
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.10a\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 4, Page 10a');
      await expect(indicator).toContainText('Act 4, Page 10a');
      await expect(indicator).toContainText('Page 198 of 313');

      // Step forward to Act4.10b.png (globalIndex 198)
      await nextBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.10b\.png$/);
      await expect(comicImg).toHaveAttribute('alt', 'Act 4, Page 10b');
      await expect(indicator).toContainText('Act 4, Page 10b');
      await expect(indicator).toContainText('Page 199 of 313');

      // Step forward to Act4.11.png (globalIndex 199)
      await nextBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.11\.png$/);
      await expect(indicator).toContainText('Act 4, Page 11');

      // Step backward to Act4.10b.png
      await prevBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.10b\.png$/);

      // Step backward to Act4.10a.png
      await prevBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.10a\.png$/);

      // Step backward to Act4.9.png (globalIndex 196)
      await prevBtn.click();
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act4\.9\.png$/);
      await expect(indicator).toContainText('Act 4, Page 9');
    });
  });

  // =========================================================================
  // 9. URL Deep Linking & Query Parameter Synchronization
  // =========================================================================
  test.describe('URL Deep Linking & Query Parameter Synchronization', () => {
    test('deep links to specific page via ?page query parameter', async ({ page }) => {
      // Direct navigation to Page 12 (Act1.11b.png)
      await page.goto('/?page=12');

      const comicImg = getComicImage(page);
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act1\.11b\.png$/);
      await expect(getIndicator(page)).toContainText('Page 12 of 313');
    });

    test('deep links to specific act via ?act query parameter', async ({ page }) => {
      // Direct navigation to Act 3
      await page.goto('/?act=3');

      const comicImg = getComicImage(page);
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act3\.1\.png$/);
      await expect(getIndicator(page)).toContainText('Page 134 of 313');
    });

    test('deep links to boundary last page via ?page=313', async ({ page }) => {
      await page.goto('/?page=313');

      const comicImg = getComicImage(page);
      await expect(comicImg).toHaveAttribute('src', /\/comic-pages\/Act5\.59\.png$/);
      await expect(getNextButton(page)).toBeDisabled();
      await expect(getPrevButton(page)).toBeEnabled();
    });

    test('synchronizes browser URL query parameters during UI navigation', async ({ page }) => {
      await page.goto('/');

      // Advancing to page 2 updates URL query params to page=2
      await getNextButton(page).click();
      await expect(page).toHaveURL(/.*[?&]page=2/);

      // Advancing to page 3 updates URL query params to page=3
      await getNextButton(page).click();
      await expect(page).toHaveURL(/.*[?&]page=3/);
    });
  });

  // =========================================================================
  // 10. Application Stability & Zero Console Errors
  // =========================================================================
  test.describe('Application Stability & Zero Console Errors', () => {
    test('executes multi-step navigation sequence with zero fatal console or unhandled page errors', async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Suppress benign connection refused or favicon 404s if any
          if (!text.includes('favicon') && !text.includes('ERR_CONNECTION_REFUSED')) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      await page.goto('/');

      // Perform user workflow: Next, Next, Act Jump, Subpage Jump, Keyboard navigation
      await getNextButton(page).click();
      await getNextButton(page).click();
      await getActSelect(page).selectOption('3');
      await getPageSelect(page).selectOption('197'); // Act4.10a
      await page.keyboard.press('ArrowRight'); // Act4.10b
      await page.keyboard.press('ArrowLeft'); // Act4.10a

      // Verify no fatal exceptions were logged
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
    });
  });
});
