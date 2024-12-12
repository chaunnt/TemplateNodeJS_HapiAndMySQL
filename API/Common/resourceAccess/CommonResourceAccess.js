/* Copyright (c) 2021-2024 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB } = require('../../../config/database');
const { isValidValue, isNotEmptyStringValue, executeBatchPromise } = require('../../ApiUtils/utilFunctions');

let RedisInstance;
if (process.env.REDIS_ENABLE * 1 === 1) {
  RedisInstance = require('../../../ThirdParty/Redis/RedisInstance');
}

function createOrReplaceView(viewName, viewDefinition) {
  Logger.info('ResourceAccess', 'createOrReplaceView: ' + viewName);
  Logger.info('ResourceAccess', viewDefinition.toString());
  return DB.schema.raw('CREATE OR REPLACE VIEW ?? AS (\n' + viewDefinition + '\n)', [viewName]).then(() => {
    Logger.info('ResourceAccess', '[DONE]createOrReplaceView: ' + viewName);
  });
}

async function insert(tableName, data) {
  let result = undefined;
  try {
    if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
      Logger.info(`tableName : ${tableName}, data: ${data}`);
    }
    data.createdAtTimestamp = new Date() * 1;
    result = await DB(tableName).insert(data);
    if (process.env.REDIS_ENABLE * 1 === 1) {
      if (result) {
        let _newId = result[0];
        if (_newId && _newId > 0) {
          let _insertedData = await findById(tableName, primaryKey, _newId);
          if (_insertedData) {
            await RedisInstance.setWithExpire(`${primaryKey}_${_newId}`, JSON.stringify(_insertedData));
          }
        }
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB INSERT ERROR: ${tableName} : ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }

  return result;
}
async function sum(tableName, field, filter, order) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: sum ${field}`);
  }
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, undefined, undefined, order);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${field} as sumResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(undefined);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${field}: ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function sumAmountDistinctByDate(tableName, sumField, filter, startDate, endDate) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: sumAmountDistinctByDate ${sumField}`);
  }
  let queryBuilder = DB(tableName);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where(filter);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder
        .sum(`${sumField} as totalSum`)
        .count(`${sumField} as totalCount`)
        .select('createdDate')
        .groupBy('createdDate')
        .then(records => {
          if (records && (records.length < 1 || records[0].totalCount === null)) {
            resolve(undefined);
          } else {
            resolve(records);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB sumAmountDistinctByDate ERROR: ${tableName} ${distinctFields}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function sumAmountDistinctByCustomField(tableName, sumField, customField, filter, startDate, endDate) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: sumAmountDistinctByCustomField ${sumField}, customField: ${customField}`);
  }
  let queryBuilder = DB(tableName);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filter);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder
        .sum(`${sumField} as totalSum`)
        .count(`${sumField} as totalCount`)
        .select(`${customField}`)
        .groupBy(`${customField}`)
        .then(records => {
          if (records && (records.length < 1 || records[0].totalCount === null)) {
            resolve(undefined);
          } else {
            resolve(records);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB sumAmountDistinctByDate ERROR: ${tableName} ${distinctFields}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function sumAmountDistinctByCustomMultiFields(tableName, sumFieldsList, customFieldsList, filter, skip, limit, startDate, endDate, order) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: sumAmountDistinctByCustomMultiFields: ${sumFieldsList}, customFieldsList: ${customFieldsList}`);
  }
  let queryBuilder = makeBasicQueryBuilder(tableName, filter, skip, limit, order, startDate, endDate);
  return new Promise((resolve, reject) => {
    try {
      for (let i = 0; i < sumFieldsList.length; i++) {
        queryBuilder.sum(`${sumFieldsList[i]} as ${sumFieldsList[i]}`);
      }
      queryBuilder
        .select(customFieldsList)
        .groupBy(customFieldsList)
        .then(records => {
          if (records && (records.length < 1 || records[0].totalCount === null)) {
            resolve(undefined);
          } else {
            resolve(records);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB sumAmountDistinctByDate ERROR: ${tableName} ${distinctFields}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function updateById(tableName, id, data) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: updateById: id: ${id}, data: ${data}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update(data);
    if (process.env.REDIS_ENABLE * 1 === 1) {
      if (result !== undefined) {
        let _updatedData = await DB(tableName).where(id);
        await RedisInstance.setWithExpire(`${id[Object.keys(id)[0]]}_${id[Object.keys(id)[1]]}`, JSON.stringify(_updatedData[0]));
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEBYID ERROR: ${tableName} : ${id} - ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function updateAll(tableName, data, filter = {}) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: updateAll, data: ${data}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(filter).update(data);
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEALL ERROR: ${tableName} : ${filter} - ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function updateAllById(tableName, primaryKeyField, idList, data) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: updateAllById, primaryKeyField: ${primaryKeyField}, idList:${idList}, data: ${data}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).whereIn(`${primaryKeyField}`, idList).update(data);
  } catch (e) {
    Logger.error('ResourceAccess', `DB updateAllById ERROR: ${tableName} : ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

function makeBasicQueryBuilder(tableName, filter, skip, limit, order, startDate, endDate) {
  let queryBuilder = DB(tableName);

  if (filter) {
    queryBuilder.where(filter);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }

  return queryBuilder;
}

function _makeQueryBuilderByFilterAllDelete(tableName, filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  if (filter) {
    queryBuilder.where(filter);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }

  return queryBuilder;
}

async function executeSelectQuery(queryBuilder, tableName, primaryKey) {
  return new Promise((resolve, reject) => {
    try {
      //neu data can optimize query select theo primary key (danh cho cac table co luong record nhieu)
      if (process.env.ENABLE_OPTIMIZE_QUERYDB * 1 === 1 && isNotEmptyStringValue(primaryKey)) {
        //lấy ra danh sách id của các record
        queryBuilder.select(primaryKey).then(records => {
          const _queryPromiseList = [];
          let skipCache = true;

          //lấy thông tin chi tiết từng record theo id
          for (const recordId of records) {
            _queryPromiseList.push(findById(tableName, primaryKey, recordId[primaryKey], skipCache));
          }
          Promise.all(_queryPromiseList).then(queryResultList => {
            resolve(queryResultList);
          });
        });
      } else {
        //nếu không cần tối ưu thì xử lý như bình thường
        queryBuilder.select().then(records => {
          resolve(records);
        });
      }
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: ${queryBuilder.toString()}`);
      Logger.error('ResourceAccess', e);
      resolve(undefined);
    }
  });
}

async function find(tableName, filter, skip, limit, order, primaryKey) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, skip, limit, order);
  return executeSelectQuery(queryBuilder, tableName, primaryKey);
}

async function findAllDelete(tableName, filter, skip, limit, order) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: findAllDelete ${filter}`);
  }
  let queryBuilder = _makeQueryBuilderByFilterAllDelete(tableName, filter, skip, limit, order);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.select().then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: ${tableName} : ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function findById(tableName, key, id, skipCache = false) {
  if (skipCache === false || process.env.REDIS_ENABLE * 1 === 1) {
    let _cacheItem = await RedisInstance.getJson(`${tableName}_${id}`);

    if (isValidValue(_cacheItem)) {
      return _cacheItem;
    }
  }
  return new Promise((resolve, reject) => {
    try {
      DB(tableName)
        .select()
        .where(key, id)
        .where('isDeleted', 0)
        .then(records => {
          if (records && records.length > 0) {
            if (skipCache === false && process.env.REDIS_ENABLE * 1 === 1) {
              if (isValidValue(records[0])) {
                RedisInstance.setWithExpire(`${key}_${id}`, JSON.stringify(records[0])).then(() => {
                  resolve(records[0]);
                });
              } else {
                resolve(undefined);
              }
            } else {
              resolve(records[0]);
            }
          } else {
            resolve(undefined);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: findById ${tableName} : ${key} - ${id}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function findOne(tableName, filter) {
  return new Promise((resolve, reject) => {
    try {
      DB(tableName)
        .select()
        .where(filter)
        .then(records => {
          if (records && records.length > 0) {
            if (process.env.REDIS_ENABLE * 1 === 1) {
              if (isValidValue(records[0])) {
                RedisInstance.setWithExpire(`${tableName}_findone_${JSON.stringify(filter)}`, JSON.stringify(records[0])).then(() => {
                  resolve(records[0]);
                });
              } else {
                resolve(undefined);
              }
            } else {
              resolve(records[0]);
            }
          } else {
            resolve(undefined);
          }
        });
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: findById ${tableName} : ${key} - ${id}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function count(tableName, field, filter, order) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: count, field: ${field}`);
  }
  let queryBuilder = makeBasicQueryBuilder(tableName, filter, undefined, undefined, order);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${field} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function countDistinct(tableName, field, filter, startDate, endDate) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: countDistinct, field:${field}`);
  }
  let queryBuilder = makeBasicQueryBuilder(tableName, filter, undefined, undefined, undefined, startDate, endDate);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.countDistinct(`${field} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${startDate} - ${endDate}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function deleteById(tableName, id) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: deleteById, id: ${id}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update({ isDeleted: 1 });
  } catch (e) {
    Logger.error('ResourceAccess', `DB DELETEBYID ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function permanentlyDeleteById(tableName, key, id) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: permanentlyDeleteById, key ${key}, id: ${id}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(key, id).del();
  } catch (e) {
    Logger.error('ResourceAccess', `DB DELETEBYID ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

function filterHandler(filterData, queryBuilder) {
  for (const key in filterData) {
    const filterValue = filterData[key];
    if (Array.isArray(filterValue)) {
      queryBuilder.where(function () {
        for (let value of filterValue) {
          this.orWhere(key, value);
        }
      });
      delete filterData[key];
    }
  }
  queryBuilder.where(filterData);
}

async function incrementInt(tableName, key, id, field, amount) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: incrementInt, field: ${field}, id: ${id}, key: ${key}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(key, id).increment(field, amount);
  } catch (e) {
    Logger.error('ResourceAccess', `DB INCREMENT ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function decrementInt(tableName, id, amount, field) {
  if (process.env.ENABLE_DEBUG_QUERYDB === 1) {
    Logger.info(`tableName : ${tableName}, Query: decrementInt, field ${field}, id: ${id}`);
  }
  let result = undefined;
  try {
    result = await DB(tableName).where(id).decrement(field, amount);
  } catch (e) {
    Logger.error('ResourceAccess', `DB DECREMENT ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

let _pendingTrx = {};

setInterval(() => {
  if (Object.keys(_pendingTrx).length > 0) {
    for (let i = 0; i < Object.keys(_pendingTrx).length; i++) {
      const _trxKey = Object.keys(_pendingTrx)[i];
      let _tableName = _trxKey.split('_')[0];
      let _key = _trxKey.split('_')[1];
      let _id = _trxKey.split('_')[2];
      let _field = _trxKey.split('_')[3];
      _executeIncrement(_tableName, _key, _id, _field, _pendingTrx[_trxKey]).then(result => {
        delete _pendingTrx[_trxKey];
      });
    }
  }
}, 500);

async function _executeIncrement(tableName, key, id, field, amount) {
  let result = undefined;
  try {
    let record = await DB(tableName).select(field).where(key, id);

    record = record[0];
    record[field] = record[field] + amount;

    let updatedData = {};
    updatedData[field] = record[field];

    result = await DB(tableName).where(key, id).update(updatedData);
  } catch (e) {
    Logger.error('ResourceAccess', `DB INCREMENT ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function incrementFloat(tableName, key, id, field, amount) {
  let result = 'ok';
  let _trxKey = `${tableName}_${key}_${id}_${field}`;
  if (_pendingTrx[_trxKey]) {
    _pendingTrx[_trxKey] += amount;
  } else {
    _pendingTrx[_trxKey] = amount;
  }
  return result;
}

async function decrementFloat(tableName, key, id, field, amount) {
  let result = undefined;
  try {
    let record = await DB(tableName).where(key, id);
    record = record[0];
    record[field] = record[field] - amount;

    let updatedData = {};
    updatedData[field] = record[field];

    result = await DB(tableName).where(key, id).update(updatedData);
  } catch (e) {
    Logger.error('ResourceAccess', `DB DECREMENT ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}
module.exports = {
  insert,
  executeSelectQuery,
  find,
  findById,
  findOne,
  findAllDelete,
  updateById,
  updateAllById,
  count,
  countDistinct,
  createOrReplaceView,
  updateAll,
  sum,
  deleteById,
  permanentlyDeleteById,
  filterHandler,
  incrementInt,
  decrementInt,
  incrementFloat,
  decrementFloat,
  sumAmountDistinctByDate,
  sumAmountDistinctByCustomMultiFields,
  sumAmountDistinctByCustomField,
  makeBasicQueryBuilder,
};
