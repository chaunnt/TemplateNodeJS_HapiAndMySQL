/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB } = require('../../../config/database');

if (process.env.REDIS_ENABLE) {
  const cache = require('../../../ThirdParty/Redis/RedisInstance');
  cache.initRedis();
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
    result = await DB(tableName).insert(data);

    //enable redis cache
    if (process.env.REDIS_ENABLE) {
      if (result) {
        let id = result[0];
        let dataTable = await find(tableName, undefined, 0, 1);
        let dataCache = dataTable[0];
        await cache.setWithExpire(`${tableName}_${id.toString()}`, JSON.stringify(dataCache));
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB INSERT ERROR: ${tableName} : ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }

  return result;
}
async function sum(tableName, field, filter, order) {
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
      Logger.error(
        'ResourceAccess',
        `DB SUM ERROR: ${tableName} ${field}: ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function sumAmountDistinctByDate(tableName, sumField, filter, startDate, endDate) {
  let queryBuilder = DB(tableName);
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
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
      Logger.error(
        'ResourceAccess',
        `DB sumAmountDistinctByDate ERROR: ${tableName} ${distinctFields}: ${JSON.stringify(filter)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function sumAmountDistinctByCustomField(tableName, sumField, customField, filter, startDate, endDate) {
  let queryBuilder = DB(tableName);
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
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
      Logger.error(
        'ResourceAccess',
        `DB sumAmountDistinctByDate ERROR: ${tableName} ${distinctFields}: ${JSON.stringify(filter)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function updateById(tableName, id, data) {
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update(data);
    //enable redis cache
    if (process.env.REDIS_ENABLE) {
      if (result) {
        var keys = Object.keys(id);
        let idValue = id[keys[0]];
        let dataUpdate = await DB(tableName).select().where(id);
        await cache.deleteByKey(`${tableName}_${idValue.toString()}`);
        await cache.setWithExpire(`${tableName}_${idValue.toString()}`, JSON.stringify(dataUpdate[0]));
      }
    }
  } catch (e) {
    Logger.error('ResourceAccess', `DB UPDATEBYID ERROR: ${tableName} : ${id} - ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

async function updateAll(tableName, data, filter = {}) {
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
  let result = undefined;
  try {
    result = await DB(tableName).whereIn(`${primaryKeyField}`, idList).update(data);
  } catch (e) {
    Logger.error('ResourceAccess', `DB updateAllById ERROR: ${tableName} : ${JSON.stringify(data)}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}

function _makeQueryBuilderByFilter(tableName, filter, skip, limit, order, startDate, endDate) {
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
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
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

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}
async function find(tableName, filter, skip, limit, order, startDate, endDate, fields) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, skip, limit, order, startDate, endDate);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.select(fields).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error(
        'ResourceAccess',
        `DB FIND ERROR: ${tableName} : ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function findAllDelete(tableName, filter, skip, limit, order) {
  let queryBuilder = _makeQueryBuilderByFilterAllDelete(tableName, filter, skip, limit, order);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.select().then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error(
        'ResourceAccess',
        `DB FIND ERROR: ${tableName} : ${JSON.stringify(filter)} - ${skip} - ${limit} ${JSON.stringify(order)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function findById(tableName, key, id) {
  let result = undefined;
  //enable redis cache
  if (process.env.REDIS_ENABLE) {
    result = await cache.getJson(`${tableName}_${id}`);
  }
  return new Promise((resolve, reject) => {
    try {
      if (result) {
        resolve(result);
      } else {
        DB(tableName)
          .select()
          .where(key, id)
          .then(records => {
            if (records && records.length > 0) {
              resolve(records[0]);
            } else {
              resolve(undefined);
            }
          });
      }
    } catch (e) {
      Logger.error('ResourceAccess', `DB FIND ERROR: findById ${tableName} : ${key} - ${id}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function count(tableName, field, filter, order) {
  let queryBuilder = _makeQueryBuilderByFilter(tableName, filter, undefined, undefined, order);

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${field} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error(
        'ResourceAccess',
        `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`,
      );
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function deleteById(tableName, id) {
  let result = undefined;
  try {
    result = await DB(tableName).where(id).update({ isDeleted: 1 });
  } catch (e) {
    Logger.error('ResourceAccess', `DB DELETEBYID ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}
async function incrementInt(tableName, key, id, field, amount) {
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
  let result = undefined;
  try {
    result = await DB(tableName).where(id).decrement(field, amount);
  } catch (e) {
    Logger.error('ResourceAccess', `DB DECREMENT ERROR: ${tableName} : ${id}`);
    Logger.error('ResourceAccess', e);
  }
  return result;
}
async function incrementFloat(tableName, key, id, field, amount) {
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
  find,
  findById,
  findAllDelete,
  updateById,
  updateAllById,
  count,
  createOrReplaceView,
  updateAll,
  sum,
  deleteById,
  incrementInt,
  decrementInt,
  incrementFloat,
  decrementFloat,
  sumAmountDistinctByDate,
  sumAmountDistinctByCustomField,
};
