const { chromium } = require('playwright');
const assert = require('assert');
(async () => {
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_PATH ? {executablePath: process.env.CHROMIUM_PATH} : {}), args: ['--no-sandbox']});
  try {
    const fresh = await browser.newPage();
    await fresh.goto('http://127.0.0.1:1420/#/settings');
    await fresh.getByRole('heading', {name: 'Settings'}).waitFor();
    const saved = await browser.newPage();
    await saved.addInitScript(() => localStorage.setItem('akari_settings', JSON.stringify({language: 'ru'})));
    await saved.goto('http://127.0.0.1:1420/#/settings');
    await saved.getByRole('heading', {name: 'Настройки'}).waitFor();
    assert.equal(await saved.evaluate(() => JSON.parse(localStorage.getItem('akari_settings')).language), 'ru');
    console.log('OK: new users see English; saved Russian preference is preserved');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exit(1)});
