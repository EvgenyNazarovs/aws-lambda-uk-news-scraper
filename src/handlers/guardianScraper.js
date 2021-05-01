const dayjs = require('dayjs');
const pLimit = require('p-limit');
const { updateMany } = require('../utilitiesLayer/dynamodbHelper');
const { queryItems, updateItem, createMany, upfateMany } = require('/opt/dynamodbHelper')
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

const {
  GuardianUrlUk,
  GuardianUrl,
  NewsScraperTable,
  PrimaryKey
} = process.env;

const limit = pLimit(10);

let totalEval = 0;

exports.handler = async () => {
  try {
    const [
      articlesData,
      existingTags,
      existingAuthors
    ] = await Promise.all([
      scrapeArticles(),
      getExistingTags(),
      getExistingAuthors()
    ])

    const articles = articlesData.map(processArticle);
    const tags = sortTags(articles, existingTags);
    const authors = sortAuthors(articles, existingAuthors);

    const result = await Promise.all([
      ...createMany(NewsScraperTable, articles),
      ...updateMany(NewsScraperTable, tags),
      ...updateMany(NewsScraperTable, authors)
    ])

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

const sortAuthors = (articles, existingAuthors) => {
  const existingAuthorsObj = sortBySortKey(existingAuthors);
  const sortedAuthorsObj = getAuthorsFromArticles(articles, existingAuthorsObj);
  return Object.values(sortedAuthorsObj);
}

const sortTags = (articles, existingTags) => {
  const existingTagsObj = sortBySortKey(existingTags);
  const sortedTagsObj = getTagsFromNewArticles(articles, existingTagsObj)
  return Object.values(sortedTagsObj);
}


  const sortByKey = (arr, key) => {
    return arr.reduce((obj, item) => {
      return { ...obj, [item[key]]: item }
    }, {})
  }

  const sortBySortKey = arr => sortByKey(arr, 'sortKey');

  const getAuthorsFromArticles = (articles, existingAuthorsObj) => {
    return articles.reduce((obj, { primaryKey, sortKey, authors }) => {
      authors.forEach(author => {
        const authorObj = {
          primaryKey: 'Author',
          sortKey: author,
          newspaper: 'Guardian',
          articleIds: [
            ...obj[tag].articleIds || [],
            { primaryKey, sortKey }
          ]
        };

        obj = { ...obj, [author]: authorObj }
      })

      return obj;
    }, existingAuthorsObj)
  }

  const getTagsFromNewArticles = (articles, existingTagsObj) => {
    return articles.reduce((obj, { primaryKey, sortKey, tags }) => {
      tags.forEach(tag => {
        const tagObj = {
          primaryKey: 'Tag',
          secondaryKey: tag,
          articleIds: [
            ...obj[tag].articleIds || [],
            { primaryKey, sortKey }
          ]
        };
  
      obj = { ...obj, [tag]: tagObj }
    })

    return obj;

    }, existingTagsObj)
  }


// const updateTag = async (tag, article) => {
//   try {
//     const ddbItem = {
//       primaryKey: 'Tag',
//       sortKey: tag,
//       articles: article.map()
//     }
//   } catch (err) {
//     console.error(err);
//     throw Error(err);
//   }
// }

const getUniqueUrls = (urls, existingArticles) => {
  const filteredUniqueUrls = filterUnique(urls);
  return filterExisting(filteredUniqueUrls, existingArticles);
}

// const getUniqueTags = (articles, existingTags) => {
//   const newTags = articles.flatMap(({ tags }) => tags);
//   return [...new Set([
//     ...existingTags,
//     ...newTags
//   ])]
// }

const filterExisting = (urls, existingArticles) => {
  const existingUrls = existingArticles.map(({ contentId }) => {
    return `${GuardianUrl}${contentId}`;
  })
  return [...new Set([
      ...urls,
      ...existingUrls
      ])]
}

const scrapeArticles = async () => {
  try {
    return await withBrowser(async browser => {
      const [
        articleUrls,
        existingArticles
      ] = await Promise.all([
        getUrls(browser),
        getExistingArticles(PrimaryKey, dayjs.format('YYYY-MM-DD'))
      ])

      const uniqUrls = getUniqueUrls(articleUrls, existingArticles);
      return Promise.all(uniqUrls.map(async url => {
        return getArticleData(browser, url)
        }))
    });
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getExistingTags = async () => {
  try {
    const params = {
      TableName: NewsScraperTable,
      KeyConditionExpression: '#primaryKey = :primaryKey',
      ExpressionAttributeNames: {
        '#primaryKey': 'primaryKey'
      },
      ExpressionAttributeValues: {
        ':primaryKey': 'Tag'
      }
    }

    return queryItems(params);

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getExistingAuthors = async () => {
  try {
    const params = {
      TableName: NewsScraperTable,
      KeyConditionExpression: '#primaryKey = :primaryKey',
      ExpressionAttributeNames: {
        '#primaryKey': 'primaryKey'
      },
      ExpressionAttributeValues: {
        ':primaryKey': 'Author'
      }
    }

    return queryItems(params);
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const filterUnique = links => [...new Set(links)];

const getHeadlines = () => {
  return [
    ...document.getElementsByClassName(
      "u-faux-block-link__overlay js-headline-text"
      ),
         ].map(item => item.getAttribute('href'))
};

const getExistingArticles = async (newspaper, date) => {
  try {
    const params = {
      TableName: NewsScraperTable,
      KeyConditionExpression: '#primaryKey = :primaryKey and begins_with(#sortKey, :sortKey)',
      ExpressionAttributeNames: {
        '#primaryKey': 'primaryKey',
        '#sortKey': 'sortKey'
      },
      ExpressionAttributeValues: {
        ':primaryKey': newspaper,
        ':sortKey': date
      }
    }

    return queryItems(params);

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getUrls = async browser => {
  try {
    return withPage(browser)(async page => {
      await page.goto(GuardianUrlUk, { waitUntil: 'networkidle2' });
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
    const newspaper = 'Guardian';
    const primaryKey = `${newspaper}`;
    const {date, title, sortKey} = generateSortKeyParts(contentType, contentId);
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
      date,
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
    const [, y, m, d, title] = contentId.split('/');
    const date = `${y}-${calendar[m]}-${d}`;
    return {
      date,
      title,
      sortKey: `${date}#${contentType}#${title}`
    };
  } else {
    const [,, y, m, d, title] = contentId.split('/');
    const date = `${y}-${calendar[m]}-${d}`;
    return {
      date,
      title,
      sortKey: `${date}#${contentType}#${title}`
    };
  }
}
