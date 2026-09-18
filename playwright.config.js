import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  fullyParallel: true,
  reporter: [['list']],
  webServer: {
    command: 'bun ./index.html --port=4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
  },
});
