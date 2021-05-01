const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

// const reservedWords = [
//   'section'
// ]

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

module.exports = {
  createItem,
  getItem,
  deleteItem
}

// const updateItem = async (tableName, ) => {
//   try {

//   } catch (err) {
//     console.error(err);
//     throw Error(err);
//   }
// }

// const getExpressionAttributeValues = item => Object.entries(item).reduce((obj, [key, value]) => ({...obj, [`:${key}`]: value}), {});

// const getExpressionAttributeNames = item => (
//   Object.keys(item).reduce((obj, key) => reservedWords.includes(key) ? {...obj, [`#${key}`]: `${key}`} : obj, {})
// );

// const getUpdateExpression = (item) => {
//   return Object.keys(item).reduce((string, key, index) => {
//     const expression = reservedWords.includes(key)
//                      ? `#${key} = :${key}`
//                      : `${key} = :${key}`;
//     return index === 0 ? `${string} ${expression}` : `${string}, ${expression}`;
//   }, "set");
// };