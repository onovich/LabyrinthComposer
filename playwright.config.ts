import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const e2ePort = 4173;
const systemChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync(systemChromePath) ? systemChromePath : undefined);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 8_000
  },
  use: {
    baseURL: `http://127.0.0.1:${e2ePort}`,
    launchOptions:
      chromeExecutablePath === undefined ? undefined : { executablePath: chromeExecutablePath },
    trace: 'retain-on-failure',
    viewport: {
      width: 1440,
      height: 1000
    }
  },
  webServer: {
    command: `npx --yes pnpm@11.7.0 --filter @labyrinth/desktop exec vite --host 127.0.0.1 --port ${e2ePort} --strictPort`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://127.0.0.1:${e2ePort}`
  }
});
