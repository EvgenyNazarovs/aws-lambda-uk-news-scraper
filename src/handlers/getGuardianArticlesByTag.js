const { getItem, batchGetItems } = require('/opt/dynamodbHelper');
const { NewsScraperTable, TagPrimaryKey, PrimaryKey } = process.env;

exports.handler = async ({ pathParameter }) => {
  try {
    const { tag } = pathParameter;
    console.log('tag: ', tag);
    const tagObj = await getItem(NewsScraperTable, TagPrimaryKey, tag);
    const uniqueArticleIds = getUniqueKeys(tagObj.articleIds);
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

// TEMP FUNCTION TO DEAL WITH DUPLICATION

const getUniqueKeys = articleIds => {
  const sortKeyArr = articleIds.map(({ sortKey }) => sortKey);
  const uniqSortKeyArr = [...new Set(sortKeyArr)];
  return uniqSortKeyArr.map(sortKey => ({ sortKey, primaryKey: PrimaryKey }));
}