import { expect, test } from './fixtures';

test('landing page sections fit the viewport and render without React hydration warnings', async ({ page }) => {
  const fetchPriorityWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('fetchPriority')) {
      fetchPriorityWarnings.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Where to next?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular ways to go' })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Explore destinations' })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Plan a better trip' })).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Grow your travel business' })).toBeAttached();
  const footer = page.locator('footer');
  await expect(footer.getByRole('heading', { name: 'Payment methods available' })).toBeAttached();
  for (const method of ['Visa', 'Mastercard', 'UnionPay', 'Airtel Money', 'M-Pesa', 'Mixx by Yas', 'HaloPesa', 'NMB Bank', 'CRDB Bank', 'NBC Bank']) {
    await expect(footer.getByRole('img', { name: method })).toBeAttached();
  }
  await expect(footer).not.toContainText('Multimodal travel booking for Tanzania and beyond.');
  await expect(footer.getByRole('heading', { name: 'Explore', exact: true })).toHaveCount(0);
  await expect(footer).toContainText('Operated by OuterBlocks Destinations Limited.');

  const pageWidth = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(pageWidth.content, 'Landing page should not overflow horizontally').toBeLessThanOrEqual(
    pageWidth.viewport,
  );
  expect(fetchPriorityWarnings).toEqual([]);
});

test('public language selection updates translations and persists across reloads', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  if (await page.evaluate(() => window.innerWidth < 1024)) {
    const menuButton = page.getByRole('button', { name: 'Toggle menu' });
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  }
  const languageSelect = page.locator('header select:visible');
  await languageSelect.selectOption('sw');
  await expect.poll(() => page.locator('html').getAttribute('lang')).toBe('sw');
  await expect(page.getByRole('heading', { name: 'Safari inayofuata ni wapi?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kwenda tu', exact: true })).toBeVisible();

  await languageSelect.selectOption('fr');
  await expect.poll(() => page.locator('html').getAttribute('lang')).toBe('fr');
  await expect(page.getByRole('heading', { name: 'Où partir ensuite ?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aller simple', exact: true })).toBeVisible();

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Où partir ensuite ?' })).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.locator('html').getAttribute('lang')).toBe('fr');
  await page.getByRole('link', { name: 'À propos de Travelar' }).click();
  await expect(page.getByRole('heading', { name: 'À propos de Travelar' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Travelar est une plateforme de réservation multimodale/)).toBeVisible();
});

test('mobile language selection is available and changes the public page language', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const menuButton = page.getByRole('button', { name: 'Toggle menu' });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await page.locator('header select:visible').selectOption('sw');

  await expect(page.getByRole('heading', { name: 'Safari inayofuata ni wapi?' })).toBeVisible();
  await expect.poll(() => page.locator('html').getAttribute('lang')).toBe('sw');
});

test('account and booking access pages follow the saved French locale', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('travelar_lang', 'fr'));
  await page.goto('/signin');
  await page.waitForLoadState('networkidle');
  await expect.poll(() => page.locator('html').getAttribute('lang')).toBe('fr');
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  await expect(page.getByText('ou continuer avec')).toBeVisible();

  await page.getByRole('link', { name: 'Créer un compte' }).click();
  await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible();
  await expect(page.getByLabel('Nom complet')).toBeVisible();
  await expect(page.getByLabel('Confirmez le mot de passe')).toBeVisible();

  await page.goto('/manage-booking');
  await expect(page.getByRole('heading', { name: 'Gérer votre réservation' })).toBeVisible();
  await expect(page.getByLabel('Référence de réservation')).toBeVisible();

  await page.evaluate(() => localStorage.setItem(
    'travelar_auth_user',
    JSON.stringify({ email: 'jane@example.com', name: 'jane', provider: 'email' }),
  ));
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Réservations récentes' })).toBeVisible({ timeout: 15_000 });
});

test('booking fields keep their default appearance when focused', async ({ page }) => {
  await page.goto('/');

  // Browsers expose zero-width ring layers in `box-shadow`; only visible shadows matter here.
  const readAppearance = (element: Element) => {
    const style = getComputedStyle(element);
    return {
      borderColor: style.borderColor,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow
        .split(/,(?![^(]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => !/ 0px 0px 0px( 0px)?$/.test(layer))
        .join(', '),
    };
  };

  const origin = page.getByRole('combobox', { name: /From/ });
  const originDefault = await origin.evaluate(readAppearance);
  await origin.focus();
  await expect.poll(() => origin.evaluate(readAppearance)).toEqual(originDefault);

  const departureDate = page.getByRole('textbox', { name: 'Departure Date' });
  const dateDefault = await departureDate.evaluate(readAppearance);
  await departureDate.focus();
  await expect.poll(() => departureDate.evaluate(readAppearance)).toEqual(dateDefault);
});

test('search modes use stacked blue icons and an active underline', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const busTab = page.getByLabel('Search Bus');
  const busIcon = busTab.locator('svg');
  const busLabel = busTab.getByText('Bus', { exact: true });
  await expect(busIcon).toBeVisible();
  await expect(busLabel).toBeVisible();
  await expect
    .poll(async () => {
      const icon = await busIcon.boundingBox();
      const label = await busLabel.boundingBox();
      return icon && label ? label.y - (icon.y + icon.height) : -1;
    })
    .toBeGreaterThanOrEqual(0);
  await expect(busTab).toHaveCSS('border-bottom-color', 'rgb(0, 85, 221)');

  const flightTab = page.getByLabel('Search Flight');
  await flightTab.click();
  await expect(flightTab).toHaveAttribute('aria-pressed', 'true');
  await expect(flightTab).toHaveCSS('border-bottom-color', 'rgb(0, 85, 221)');
  await expect(busTab).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
});

test('hero search card keeps the same height across travel tabs', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const searchForm = page.locator('.search-form');
  const searchCard = page.locator('.hero-search-card');
  await expect(searchForm).toBeVisible();
  await expect(searchCard).toBeVisible();

  const modes = ['Ferry', 'Flight', 'Trains', 'Stays', 'Experiences'];
  const dimensions: Record<string, { width: number; height: number }> = {};
  const passengerPositions: Record<string, Array<{ x: number; width: number }>> = {};

  for (const mode of modes) {
    const tab = page.getByLabel(`Search ${mode}`);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-pressed', 'true');

    if (mode === 'Flight') {
      await page.getByRole('button', { name: 'Return', exact: true }).click();
    }

    passengerPositions[mode] = await page
      .locator('.search-travelers-field')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const { x, width } = element.getBoundingClientRect();
          return { x, width };
        }),
      );

    if (mode === 'Flight') {
      dimensions['Flight return'] = await searchCard.evaluate((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      });
      await page.getByRole('button', { name: 'Multi-city', exact: true }).click();
      dimensions['Flight multi-city'] = await searchCard.evaluate((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      });
      const multiCityFields = page.locator('.search-form > .flex-none');
      await expect(multiCityFields).toBeVisible();
      const initialCardHeight = dimensions['Flight return'].height;
      await page.getByRole('button', { name: 'Add flight leg' }).click();
      await page.getByRole('button', { name: 'Add flight leg' }).click();
      const multiCityCard = await searchCard.evaluate((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      });
      expect(multiCityCard.height).toBeGreaterThan(initialCardHeight);
      const multiCityLayout = await multiCityFields.evaluate((element) => ({
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
      }));
      expect(
        multiCityLayout.scrollHeight,
        'Multi-city fields should not be forced into an internal scroll area',
      ).toBeLessThanOrEqual(multiCityLayout.clientHeight);
    } else {
      dimensions[mode] = await searchCard.evaluate((element) => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      });
    }
  }

  await page.getByLabel('Search Bus').click();
  dimensions.Bus = await searchCard.evaluate((element) => {
    const { width, height } = element.getBoundingClientRect();
    return { width, height };
  });
  const reference = dimensions['Flight return'];
  for (const [mode, size] of Object.entries(dimensions).filter(([mode]) => mode !== 'Flight multi-city')) {
    expect(Math.abs(size.width - reference.width), `${mode} width: ${JSON.stringify(dimensions)}`)
      .toBeLessThanOrEqual(1);
  }

  // Bus, Ferry and Trains share the one-row desktop layout, so their cards must be the same
  // height. Flights add a cabin field and a return date, and Stays/Experiences drop the trip-type
  // row, so those three are content-sized by design.
  if (test.info().project.name === 'desktop') {
    for (const mode of ['Ferry', 'Trains']) {
      expect(Math.abs(dimensions[mode].height - dimensions.Bus.height), `${mode} height: ${JSON.stringify(dimensions)}`)
        .toBeLessThanOrEqual(1);
    }
  }

  for (const [mode, controls] of Object.entries(passengerPositions)) {
    expect(controls.length, `${mode} should expose the travelers control`).toBeGreaterThanOrEqual(1);
    expect(controls[0].width, `${mode} travelers control should stay visible`).toBeGreaterThan(0);
  }

  await page.getByLabel('Search Ferry').click();
  const searchFieldHeight = await page
    .locator('.search-form .input-field')
    .first()
    .evaluate((element) => element.getBoundingClientRect().height);
  const residentOption = page.getByRole('button', { name: 'Resident', exact: true });
  const nonResidentOption = page.getByRole('button', { name: 'Non-Resident', exact: true });
  for (const option of [residentOption, nonResidentOption]) {
    const layout = await option.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        height: bounds.height,
        whiteSpace: getComputedStyle(element).whiteSpace,
        textFits: element.scrollWidth <= element.clientWidth,
      };
    });
    // The options sit inside a padded toggle track, so they are one padding step shorter
    // than the search inputs beside them.
    expect(
      Math.abs(layout.height - searchFieldHeight),
      'Residency options should match the search input height',
    ).toBeLessThanOrEqual(8);
    expect(layout.whiteSpace).toBe('nowrap');
    expect(layout.textFits, 'Residency option labels should not wrap or clip').toBe(true);
  }
  await nonResidentOption.click();
  await expect(nonResidentOption).toHaveAttribute('aria-pressed', 'true');
  await expect(residentOption).toHaveAttribute('aria-pressed', 'false');

  for (const mode of ['Bus', 'Ferry', 'Trains']) {
    await page.getByLabel(`Search ${mode}`).click();
    await expect(page.getByRole('button', { name: 'One-way', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('button', { name: 'Return', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Return Date' })).toBeVisible();
    const returnLayout = await page.evaluate(() => {
      const fields = document.querySelector('.search-form > .min-h-0')!;
      const footer = document.querySelector('.search-form-bottom')!;
      return {
        fieldsBottom: fields.getBoundingClientRect().bottom,
        footerTop: footer.getBoundingClientRect().top,
      };
    });
    expect(
      returnLayout.fieldsBottom,
      `${mode} return fields should not overlap the passenger controls`,
    ).toBeLessThanOrEqual(returnLayout.footerTop);
    await page.getByRole('button', { name: 'One-way', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Return Date' })).toHaveCount(0);
  }

  await page.getByLabel('Search Stays').click();
  await page.getByRole('button', { name: /Travelers:/ }).click();
  const stayDialog = page.getByRole('dialog', { name: 'Travelers' });
  await expect(stayDialog).toBeVisible();
  // Stays tracks adults, children and rooms.
  await expect(stayDialog.getByText('Adults', { exact: true })).toBeVisible();
  await expect(stayDialog.getByText('Children', { exact: true })).toBeVisible();
  await expect(stayDialog.getByText('Rooms', { exact: true })).toBeVisible();
  await expect(stayDialog.getByRole('button', { name: /increase$/ })).toHaveCount(3);
  await page.keyboard.press('Escape');

  await page.getByLabel('Search Bus').click();
  await page.getByRole('combobox', { name: 'From' }).click();
  const busOptions = page.locator('[role="listbox"] [role="option"]').first();
  await expect(busOptions).toBeVisible();
  await expect(page.getByRole('option', { name: 'Ubungo Terminal' })).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Magomeni Terminal' })).toHaveCount(0);
  await page.getByRole('option', { name: /Dar es Salaam/ }).click();
  await page.getByRole('combobox', { name: 'To' }).click();
  await expect(page.getByRole('option', { name: /^Dar es Salaam/ })).toHaveCount(0);
  await expect(page.getByRole('option', { name: /^Dodoma/ })).toBeVisible();
  await page.getByRole('combobox', { name: 'To' }).press('Escape');

  await page.getByRole('combobox', { name: 'From' }).click();
  const busOptionIsOnTop = await busOptions.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return topElement?.closest('[role="option"]') === element;
  });
  expect(busOptionIsOnTop, 'Bus autocomplete options should render above the card').toBe(true);

  await page.getByLabel('Search Flight').click();
  await page.getByRole('combobox', { name: 'Origin Airport' }).click();
  const flightOptions = page.locator('[role="listbox"] [role="option"]').first();
  await expect(flightOptions).toBeVisible();
  const flightOptionIsOnTop = await flightOptions.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return topElement?.closest('[role="option"]') === element;
  });
  expect(flightOptionIsOnTop, 'Flight autocomplete options should render above the card').toBe(true);

  await page.getByRole('button', { name: 'One-way', exact: true }).click();
  await page.getByRole('textbox', { name: 'Departure Date' }).click();
  const calendarControl = page.getByRole('button', { name: 'Next month' });
  await expect(calendarControl).toBeVisible();
  const calendarControlIsOnTop = await calendarControl.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    return topElement === element || element.contains(topElement);
  });
  expect(calendarControlIsOnTop, 'Flight calendar should render above the card').toBe(true);
});
