const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const reservedWords = [
  'section'
]

const createItem = async (tableName, item) => {
  try {
    const params = {
      TableName: tableName,
      Item: item,
      ReturnValues: 'ALL_OLD'
    };

    const { Attributes } = await documentClient.put(params).promise();

    return Attributes;

  } catch (err) {
    console.error(err);
    console.error('error with item: ', item);
    throw Error(err);
  }
}

const getItem = async (tableName, primaryKey, sortKey) => {
  try {
    const params = {  
      TableName: tableName,
      Key: {
        "sortKey": sortKey,
        "primaryKey": primaryKey
      }
    }

    const { Item } = await documentClient.getItem(params).promise();

    return Item;

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const batchGetItems = async (tableName, keys) => {
  try {
    const params = {
      RequestItems: {
        [tableName]: {
          Keys: keys
        }
      }
    };

    const { Items } = await documentClient.batchGet(params).promise();

    return Items;

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const queryItems = async (params) => {
  try {
    const { Items }= await documentClient.query(params).promise();

    return Items;

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const deleteItem = async (tableName, primaryKey, sortKey) => {
  try {
    const params = {
      TableName: tableName,
      Key: {
        'primaryKey': primaryKey,
        'sortKey': sortKey
      }
    }

    await documentClient.delete(params).promise();

  } catch (err) {
    console.error(err);
    throw Error(err);
  }
}

const updateItem = async (tableName, item) => {
  try {
    const { primaryKey, sortKey, ...rest } = item;
    const attributeNames = getExpressionAttributeNames(rest);
    const params = {
      TableName: tableName,
      Key: { primaryKey, sortKey },
      UpdateExpression: getUpdateExpression(rest),
      ExpressionAttributeValues: getExpressionAttributeValues(rest),
      ReturnedValues: 'ALL_NEW',
      ...(Object.entries(attributeNames).length > 0 && {
        ExpressionAttributeNames: attributeNames
      })
    }

    console.log('updating item... ', params)

    const result = await documentClient.update(params).promise();

    console.log('result: ', result);

    return result;
  } catch (err) {
    console.error(err);
    console.error('error with item: ', item);
    throw Error(err);
  }
}

const createMany = (tableName, items) => {
  return items.map(async item => {
    return createItem(tableName, item)
  })
}

const updateMany = (tableName, items) => {
  return items.map(async item => {
    return updateItem(tableName, item)
  })
}

const getExpressionAttributeValues = item => Object.entries(item).reduce((obj, [key, value]) => ({...obj, [`:${key}`]: value}), {});

const getExpressionAttributeNames = item => (
  Object.keys(item).reduce((obj, key) => reservedWords.includes(key) ? {...obj, [`#${key}`]: `${key}`} : obj, {})
);

const getUpdateExpression = (item) => {
  return Object.keys(item).reduce((string, key, index) => {
    const expression = reservedWords.includes(key)
                     ? `#${key} = :${key}`
                     : `${key} = :${key}`;
    return index === 0 ? `${string} ${expression}` : `${string}, ${expression}`;
  }, "set");
};



module.exports = {
  createItem,
  getItem,
  deleteItem,
  queryItems,
  updateItem,
  createMany,
  updateMany,
  batchGetItems
}