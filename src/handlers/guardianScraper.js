const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const fs = require('fs');
const documentClient = new AWS.DynamoDB.DocumentClient();

const { GuardianUrl } = process.env;

exports.handler = async () => {
  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(GuardianUrl, { waitUntil: 'networkidle2' });

    const articleLinks = await page.evaluate(() =>
      [
        ...document.getElementsByClassName(
          "u-faux-block-link__overlay js-headline-text"
        ),
      ].map(item => item.getAttribute('href'))
    )

    console.log('article links: ', articleLinks);

    // const promises = articleLinks.map(async link => {
    //   await page.goto(link);
    //   return page.evaluate(() => {
    //     const {
    //       author,
    //       contentType,
    //       keywords,
    //       sectionName,
    //       headline,
    //       byline,
    //       contentId,
    //       thumbnail,
    //       publication,
    //       series,
    //       seriesId,
    //     } = window.guardian.config.page;

        

    //     // const description = getMetaTag("description");
    //     // const publishedTime = getMetaTag("published_time");
    //     // const modifiedTime = getMetaTag("modified_time");

    //     return [
    //       author,
    //       contentType,
    //       keywords,
    //       sectionName,
    //       headline,
    //       byline,
    //       contentId,
    //       thumbnail,
    //       publication,
    //       series,
    //       seriesId,
    //     ];
    //   })
    // })

    // const scraperData = await Promise.all(promises);
    // await browser.close();
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}
