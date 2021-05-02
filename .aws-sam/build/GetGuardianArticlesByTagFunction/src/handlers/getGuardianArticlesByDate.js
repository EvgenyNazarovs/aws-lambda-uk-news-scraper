const { queryItems } = require('/opt/dynamodbHelper');
const {
  PrimaryKey,
  NewsScraperTable,
  ByDateGsiName
  } = process.env;

exports.handler = async ({ pathParameter }) => {
  try { 
    const { start, end } = pathParameter;
    const articles = await getGuardianArticlesByDate(start, end);
    return {
      statusCode: 200,
      body: JSON.stringify(articles)
    }
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getGuardianArticlesByDate = async (start, end) => {
  try {
    const params = {
      TableName: NewsScraperTable,
      IndexName: ByDateGsiName,
      KeyConditionExpression: 'primaryKey = :primaryKey and #date between :start and :end',
      ExpressionAttributeNames: {
        '#date': 'date'
      },
      ExpressionAttributeValues: {
        ':primaryKey': PrimaryKey,
        ':start': start,
        ':end': end
      }
    }

    return queryItems(params);

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}