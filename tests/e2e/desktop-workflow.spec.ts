import { expect, test } from '@playwright/test';

test('designer can complete the beta desktop workflow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Choose a starting structure' })).toBeVisible();
  await page.getByRole('button', { name: /Horror Puzzle/ }).click();

  await expect(
    page.getByLabel('Project navigation').getByText('Horror Clinic', { exact: true })
  ).toBeVisible();
  await expect(page.getByLabel('Project tools')).toContainText('Export');
  await expect(page.getByLabel('Project tools')).toContainText('Review');
  await expect(page.getByLabel('Project tools')).toContainText('Report');

  await page.getByRole('button', { name: 'Space' }).click();

  const rightPanel = page.getByLabel('Project tools');
  const nameInput = rightPanel.getByLabel('Name');

  await nameInput.fill('Isolation Ward');
  await nameInput.blur();
  await expect(page.getByRole('button', { name: 'Isolation Ward' })).toBeVisible();

  await page.getByRole('button', { name: 'Validate' }).click();
  await expect(page.locator('.lc-validation-panel')).toContainText('Diagnostics');
  await expect
    .poll(async () => page.locator('.lc-status-pill').textContent())
    .not.toContain('Validating');

  await page.getByRole('button', { name: 'Thread' }).click();
  await expect(rightPanel).toContainText('Isolation Ward');

  await rightPanel.locator('.lc-review-compose textarea').fill('Check pacing after the new room.');
  await rightPanel.getByRole('button', { name: 'Add' }).click();
  await expect(rightPanel).toContainText('Check pacing after the new room.');

  await rightPanel.getByRole('button', { name: 'Resolve' }).click();
  await expect(rightPanel.getByRole('button', { name: 'Reopen' })).toBeVisible();

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
});
