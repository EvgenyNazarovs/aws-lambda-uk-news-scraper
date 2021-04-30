const chromium = require('chrome-aws-lambda');

const withBrowser = async fn => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: true,
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

const withPage = browser => async fn => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

module.exports = {
  withBrowser,
  withPage
}