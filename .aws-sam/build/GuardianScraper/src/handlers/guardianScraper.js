const dayjs = require('dayjs');
const pLimit = require('p-limit');
const { createItem } = require('/opt/dynamodbHelper')
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

const { GuardianUrl, NewsScraperTable } = process.env;

const limit = pLimit(20);

let totalEval = 0;

exports.handler = async () => {
  try {
    const articlesData = await withBrowser(async browser => {
      const articleLinks = await getLinks(browser);
      console.log('number of articles: ', articleLinks.length);
      const uniqLinks = filterUniqueLinks(articleLinks);
      console.log('number of unique: ', uniqLinks.length);
      return Promise.all(uniqLinks.map(async link => {
        return getArticleData(browser, link)
        }))
    });

    const articles = articlesData.map(processArticle);

    const result = await Promise.all(articles.map(async article => {
      console.log('article: ', article);
      return createItem(NewsScraperTable, article);
    }))

    console.log('result: ', result);

    return {
      statusCode: 200,
      body: JSON.stringify('Articles Processed Successfully')
    }
    
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const filterUniqueLinks = links => [...new Set(links)];

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

const processArticle = ([
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
