const { getItem, batchGetItems } = require('/opt/dynamodbHelper');
const { NewsScraperTable, TagPrimaryKey } = process.env;

exports.handler = async ({ queryStringParameter }) => {
  try {
    const { tag } = queryStringParameter;
    const tagObj = await getTag(tag);
    const articles = await getArticlesPerTag(tagObj);
    return {
      body: JSON.stringify(articles),
      statusCode: 200
    }
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getArticlesPerTag = async ({ articleIds }) => {
  try {
    const articles = await batchGetItems(NewsScraperTable, articleIds);
    return articles;
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getTag = async tag => {
  try {
    const result = await getItem(
      NewsScraperTable,
      TagPrimaryKey,
      tag
      );
    return result;
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}