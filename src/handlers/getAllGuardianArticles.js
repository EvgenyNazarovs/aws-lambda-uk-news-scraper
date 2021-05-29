const { queryItems } = require('/opt/dynamodbHelper');
const { PrimaryKey, NewsScraperTable } = process.env;

exports.handler = async () => {
  try {
    const items = await getAllGuardianArticles();
    return {
      body: JSON.stringify(items),
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      }
    }
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const getAllGuardianArticles = async () => {
  try {
    const params = {
      TableName: NewsScraperTable,
      KeyConditionExpression: 'primaryKey = :primaryKey',
      ExpressionAttributeValues: {
        ":primaryKey": PrimaryKey
      }
    }

    return queryItems(params);
  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}