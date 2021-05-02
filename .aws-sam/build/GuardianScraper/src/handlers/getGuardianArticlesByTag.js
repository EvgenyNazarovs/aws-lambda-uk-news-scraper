const { getItem, batchGetItems } = require('/opt/dynamodbHelper');
const { NewsScraperTable, TagPrimaryKey } = process.env;

exports.handler = async ({ pathParameter }) => {
  try {
    const { tag } = pathParameter;
    console.log('tag: ', tag);
    const tagObj = await getItem(NewsScraperTable, TagPrimaryKey, tag);
    const uniqueArticleIds = [...new Set(tagObj.articleIds)];
    console.log('unique articles ids: ', uniqueArticleIds);
    const articles = await batchGetItems(NewsScraperTable, uniqueArticleIds);
    return {
      body: JSON.stringify(articles),
      statusCode: 200
    }
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}