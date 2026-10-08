import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/admin',
  testMatch: /admin\.spec\.mjs$/,
  timeout: 25_000,
  expect: { timeout: 8_000 },
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'],['html',{open:'never',outputFolder:'playwright-report'}]] : 'list',
  use: {
    baseURL:'http://127.0.0.1:4179',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'off',
    actionTimeout:8_000
  },
  projects: [
    {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1365,height:850}}},
    {name:'phone-chromium',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}}
  ],
  webServer:{
    command:'node tests/admin/browser-server.mjs',
    url:'http://127.0.0.1:4179/admin',
    reuseExistingServer:!process.env.CI,
    timeout:20_000
  }
});
