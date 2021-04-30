const AWS = require('aws-sdk');
const chromium = require('chrome-aws-lambda');
const dayjs = require('dayjs');
const pLimit = require('p-limit');
const { withBrowser, withPage } = require('/opt/scraperHelper');

const calendar = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const { GuardianUrl } = process.env;

const limit = pLimit(20);

let totalEval = 0;

exports.handler = async () => {
  try {
    const articlesData = await withBrowser(async browser => {
      const articleLinks = await getLinks(browser);
      return Promise.all(articleLinks.map(async link => {
        return getArticleData(browser, link)
        }))
    });

    const articles = articlesData.map(([
      author,
      contentType,
      keywords,
      sectionName,
      headline,
      byline,
      contentId,
      thumbnail,
      publication,
      series,
      seriesId,
    ]) => {
      if (contentType.toLowerCase() !== 'tag') {
        const tags = keywords.split(',');
        const newspaper = 'guardian';
        const primaryKey = `${newspaper}`;
        const {sortKey, section, title} = generateSortKeyParts(contentType, contentId);
        const scrapedOn = dayjs().format('YYYY-MM-DDTHH:mm:ss.SSSZ');

        return {
          contentType,
          tags,
          sectionName,
          headline,
          contentId,
          thumbnail,
          publication,
          sortKey,
          primaryKey,
          scrapedOn,
          newspaper,
          section,
          title,
          author: author || byline,
          ...(series && { series }),
          ...(seriesId && { seriesId })
        }
      }
    })

    

    






    // for (const link of articleLinks) {
    //   await page.goto(link);
    //   const result = await page.evaluate(() => {
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

    //   articlesData.push(result);

    // }

    // await browser.close();

    // const articles = articlesData.map(([
      // author,
      // contentType,
      // keywords,
      // sectionName,
      // headline,
      // byline,
      // contentId,
      // thumbnail,
      // publication,
      // series,
      // seriesId,
    // ]) => {
    //   if (contentType.toLowerCase() !== "tag") {
    //     const tags = keywords.split(",");

    //     const newspaper = "guardian";
    //     const pk = `${contentType.toLowerCase()}#${newspaper}`;

    //     let sk = "";

    //     if (contentType.toLowerCase() === "article") {
    //       const [sec, y, m, d, title] = contentId.split("/");
    //       sk = `${sec}#${y}-${calendar[m]}-${d}#${title}`;
    //     } else {
    //       const [sec, type, y, m, d, title] = contentId.split("/");
    //       sk = `${sec}#${y}-${calendar[m]}-${d}#${title}`;
    //     }

    //     const now = Date.now();
    //     const today = new Date(now);
    //     const scrapedOn = today.toISOString();

    //     console.log("pk: ", pk);
    //     console.log("sk: ", sk);

    //     return {
    //       contentType,
    //       tags,
    //       sectionName,
    //       headline,
    //       contentId,
    //       thumbnail,
    //       publication,
    //       author: author || byline,
    //       pk,
    //       sk,
    //       scrapedOn,
    //       ...(series && { series }),
    //       ...(seriesId && { seriesId }),
    //     }
    //   }
    // }).filter(article => article?.sk && article?.pk);

    // console.log('articles: ', articles);


    // const promises = articleLinks.map(async link => {
    //   const newPage = await browser.newPage();
    //   await newPage.goto(link);
    //   return newPage.evaluate(() => {
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

    
    
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getHeadlines = () => {
  return [
    ...document.getElementsByClassName(
      "u-faux-block-link__overlay js-headline-text"
      ),
         ].map(item => item.getAttribute('href'))
};

const getLinks = async browser => {
  try {
    return withPage(browser)(async page => {
      await page.goto(GuardianUrl, { waitUntil: 'networkidle2' });
      return page.evaluate(getHeadlines)
    });
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getArticleData = async (browser, link) => {
  try {
    return limit(() => withPage(browser)(async page => {
      await page.goto(link);
      totalEval += 1;
      console.log(`evaluating ${link}, no ${totalEval}`);
      return page.evaluate(() => {
        const {
          author,
          contentType,
          keywords,
          sectionName,
          headline,
          byline,
          contentId,
          thumbnail,
          publication,
          series,
          seriesId,
        } = window.guardian.config.page;

        return [
          author,
          contentType,
          keywords,
          sectionName,
          headline,
          byline,
          contentId,
          thumbnail,
          publication,
          contentId,
          series,
          seriesId,
        ];
      });
    }))
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const generateSortKeyParts = (contentType, contentId) => {
  if (contentType.toLowerCase() === 'article') {
    const [section, y, m, d, title] = contentId.split('/');
    return {
      section,
      title,
      sortKey: `${section}#${y}-${calendar[m]}-${d}#${title}`
    };
  } else {
    const [section,, y, m, d, title] = contentId.split('/');
    return {
      section,
      title,
      sortKey: `${section}#${y}-${calendar[m]}-${d}#${title}`
    };
  }
}
