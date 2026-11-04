import { readFileSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

// Never fall back to .env.local or an inherited hosted endpoint.
const values = Object.fromEntries(
  readFileSync(new URL('.env.verification.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => [
      line.slice(0, line.indexOf('=')),
      line.slice(line.indexOf('=') + 1),
    ]),
)
if (
  values.VITE_SUPABASE_URL !== 'http://127.0.0.1:55321' ||
  !values.VITE_SUPABASE_PUBLISHABLE_KEY
) {
  throw new Error(
    'Generate the isolated local frontend environment before running this test.',
  )
}
export default defineConfig({
  testDir: './e2e-local',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    headless: true,
    ...(process.env.LOCAL_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.LOCAL_CHROMIUM_PATH } }
      : { channel: 'chrome' }),
  },
  webServer: {
    command:
      'npm run dev -- --mode verification --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: values.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: values.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  },
})
