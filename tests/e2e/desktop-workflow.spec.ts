import { expect, test, type Page } from '@playwright/test';

async function waitForValidation(page: Page) {
  await expect
    .poll(async () => page.locator('.lc-status-pill').textContent())
    .not.toContain('Validating');
}

async function installDownloadCapture(page: Page) {
  await page.addInitScript(() => {
    type CapturedDownload = {
      mimeType: string;
      text: string;
    };
    const downloadWindow = window as Window & {
      __lcDownloads?: CapturedDownload[];
    };
    const createObjectUrl = URL.createObjectURL.bind(URL);

    downloadWindow.__lcDownloads = [];
    URL.createObjectURL = (value) => {
      if (value instanceof Blob) {
        void value.text().then((text) => {
          downloadWindow.__lcDownloads?.push({
            mimeType: value.type,
            text
          });
        });
      }

      return createObjectUrl(value);
    };
  });
}

test('designer can complete the productized single-user desktop workflow', async ({
  page
}) => {
  await installDownloadCapture(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Choose a starting structure' })).toBeVisible();
  await page.getByRole('button', { name: /Horror Puzzle/ }).click();

  await expect(
    page.getByLabel('Project navigation').getByText('Horror Clinic', { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('Project tools')).toContainText('Export');
  await expect(page.getByLabel('Project tools')).toContainText('Self Review');
  await expect(page.getByLabel('Project tools')).toContainText('Report');
  await expect(page.getByLabel('Engine export summary')).toContainText('5');
  await expect(page.getByLabel('Engine export summary')).toContainText('2');
  await expect(page.getByLabel('Engine export summary')).toContainText('3');

  await page.getByRole('button', { name: 'Space' }).click();

  const rightPanel = page.getByLabel('Project tools');
  const nameInput = rightPanel.getByLabel('Name');

  await nameInput.fill('Isolation Ward');
  await nameInput.blur();
  await expect(page.getByRole('button', { name: 'Isolation Ward' })).toBeVisible();

  await page
    .getByLabel('Project navigation')
    .getByRole('button', { name: /Waiting Room -> Records Office/ })
    .click();
  await rightPanel.getByLabel('Directed connection').check();
  await rightPanel.getByLabel('Description').fill('One-way return route from the isolation ward.');
  await rightPanel.getByLabel('Description').blur();

  await page.getByLabel('Project navigation').getByRole('button', { name: /Basement Keypad/ }).click();
  await rightPanel.getByLabel('Name').fill('Isolation Keycard');
  await rightPanel.getByLabel('Name').blur();
  await rightPanel.getByLabel('Kind').selectOption('ability');
  await rightPanel.getByLabel('Basement Code').check();

  await page.getByLabel('Project navigation').getByRole('button', { name: /Basement Code/ }).click();
  await rightPanel.getByLabel('Name').fill('Isolation Code');
  await rightPanel.getByLabel('Name').blur();
  await rightPanel.getByLabel('Kind').selectOption('knowledge');
  await rightPanel.getByLabel('Location').selectOption('operating-theater');

  await page
    .getByLabel('Project navigation')
    .getByRole('button', { name: /Repair the Breaker/ })
    .click();
  await rightPanel.getByLabel('Name').fill('Repair the Isolation Breaker');
  await rightPanel.getByLabel('Name').blur();

  await page
    .getByLabel('Project navigation')
    .getByRole('button', { name: /Flickering hall lights/ })
    .click();
  await rightPanel.getByLabel('Name').fill('Isolation Ward Spike');
  await rightPanel.getByLabel('Name').blur();
  await rightPanel.getByLabel('Intensity', { exact: true }).fill('0.7');
  await rightPanel.getByLabel('Kind').selectOption('threat');

  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.locator('.lc-validation-panel')).toContainText('Diagnostics');
  await waitForValidation(page);

  await page.getByRole('button', { name: 'Note' }).click();
  await expect(rightPanel).toContainText('Isolation Ward');

  await rightPanel.locator('.lc-review-compose textarea').fill('Check pacing after the new room.');
  await rightPanel.getByRole('button', { name: 'Add' }).click();
  await expect(rightPanel).toContainText('Check pacing after the new room.');

  await rightPanel.getByRole('button', { name: 'Mark Done' }).click();
  await expect(rightPanel.getByRole('button', { name: 'Reopen' })).toBeVisible();

  const [saveDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save As' }).click()
  ]);
  const savedProjectText = (await page
    .waitForFunction(
      () =>
        (
          window as Window & {
            __lcDownloads?: Array<{ text: string }>;
          }
        ).__lcDownloads?.find((download) => download.text.includes('"Isolation Ward"'))?.text
    )
    .then((handle) => handle.jsonValue())) as string;
  const savedProject = JSON.parse(savedProjectText) as {
    spaces: Record<string, { name: string }>;
    connections: Record<string, { directed?: boolean; description?: string }>;
    gates: Record<string, { name: string; kind: string; requiredTokenIds: string[] }>;
    tokens: Record<string, { name: string; kind: string; locationSpaceId?: string }>;
    puzzles: Record<string, { name: string }>;
    beats: Record<string, { name: string; intensity?: number; kind?: string }>;
    reviewThreads?: Array<{ status: string; comments: Array<{ body: string }> }>;
  };
  const entityCount =
    Object.keys(savedProject.spaces).length +
    Object.keys(savedProject.connections).length +
    Object.keys(savedProject.gates).length +
    Object.keys(savedProject.tokens).length +
    Object.keys(savedProject.puzzles).length +
    Object.keys(savedProject.beats).length;

  expect(saveDownload.suggestedFilename()).toBe('labyrinth-composer-copy.lcproj.json');
  expect(entityCount).toBe(18);
  expect(savedProject.spaces['space-6']?.name).toBe('Isolation Ward');
  expect(savedProject.connections['waiting-room-records-office']).toEqual(
    expect.objectContaining({
      directed: true,
      description: 'One-way return route from the isolation ward.'
    })
  );
  expect(savedProject.gates['basement-code-gate']).toEqual(
    expect.objectContaining({
      name: 'Isolation Keycard',
      kind: 'ability',
      requiredTokenIds: ['basement-code']
    })
  );
  expect(savedProject.tokens['basement-code']).toEqual(
    expect.objectContaining({
      name: 'Isolation Code',
      kind: 'knowledge',
      locationSpaceId: 'operating-theater'
    })
  );
  expect(savedProject.puzzles['repair-breaker']?.name).toBe('Repair the Isolation Breaker');
  expect(savedProject.beats['first-scare']).toEqual(
    expect.objectContaining({
      name: 'Isolation Ward Spike',
      intensity: 0.7,
      kind: 'threat'
    })
  );
  expect(savedProject.reviewThreads?.[0]?.status).toBe('resolved');
  expect(savedProject.reviewThreads?.[0]?.comments[0]?.body).toBe(
    'Check pacing after the new room.'
  );

  const [engineDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Engine JSON' }).click()
  ]);
  expect(engineDownload.suggestedFilename()).toBe('engine-export.json');

  const [markdownDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export Markdown' }).click()
  ]);
  expect(markdownDownload.suggestedFilename()).toBe('labyrinth-report.md');

  const [jsonDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export JSON' }).click()
  ]);
  expect(jsonDownload.suggestedFilename()).toBe('labyrinth-report.json');

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('workbench remains usable at the mobile acceptance viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: /Horror Puzzle/ }).click();
  await expect(page.getByLabel('Project navigation')).toContainText('Horror Clinic');
  await expect(page.getByLabel('Graph canvas')).toBeVisible();
  await expect(page.getByLabel('Project tools')).toContainText('Self Review');
  await expect(page.locator('.lc-validation-panel')).toContainText('Diagnostics');

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > window.innerWidth + 1 ||
      document.body.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
