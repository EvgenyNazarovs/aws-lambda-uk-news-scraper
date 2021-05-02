const { getItem, batchGetItems } = require('/opt/dynamodbHelper');
const { NewsScraperTable, TagPrimaryKey } = process.env;

exports.handler = async ({ pathParameter }) => {
  try {
    const { tag } = pathParameter;
    const tagObj = await getItem(NewsScraperTable, TagPrimaryKey, tag);
    const articles = await batchGetItems(NewsScraperTable, tagObj.articleIds);
    return {
      body: JSON.stringify(articles),
      statusCode: 200
    }
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}