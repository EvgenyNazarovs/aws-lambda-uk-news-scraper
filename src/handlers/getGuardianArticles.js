const { queryItems } = require('/opt/dynamodbHelper');
const { PrimaryKey, NewsScraperTable } = process.env;

exports.handler = async ({ queryStringParameters }) => {
  try { 
    if (!queryStringParameters) {
      const items = await getAllGuardianArticles()
      return {
        statusCode: 200,
        body: JSON.stringify(items),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        }
      }
    } else {
      const { start, end } = queryStringParameters;
      const items = await getGuardianArticlesByDate(start, end);
      return {
        statusCode: 200,
        body: JSON.stringify(items),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        }
      }
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      }
    }
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
    throw Error(err)
  }
}