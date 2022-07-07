"use strict";
require("dotenv").config();
const { DB, timestamps } = require("../../../config/database");
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BET_STATUS, BET_TYPE } = require('../BetRecordsConstant');
const tableName = "BetRecords";
const primaryKeyField = "betRecordId";
async function createTable() {
  console.log(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments('betRecordId').primary();
          table.integer('appUserId');
          table.float('betRecordAmountIn', 48, 24).defaultTo(0);
          table.float('betRecordAmountOut', 48, 24).defaultTo(0);
          table.float('betRecordWin', 48, 24).defaultTo(0);
          table.string('betRecordSection');
          table.string('betRecordHalfSection');
          table.string('betRecordNote').defaultTo('');
          table.string('betRecordStatus').defaultTo(BET_STATUS.NEW);
          table.integer('betRecordType');
          table.string('betRecordPaymentBonusStatus').defaultTo(BET_STATUS.NEW);
          table.integer('betRecordResult');
          table.integer('gameRecordId');
          table.integer('walletId');
          table.boolean('isFake').defaultTo(0); //not fake
          timestamps(table);
          table.index('appUserId');
          table.index('betRecordId');
          table.index('betRecordAmountIn');
          table.index('betRecordAmountOut');
          table.index('betRecordStatus');
          table.index('betRecordType');
          table.index('betRecordSection');
          table.index('betRecordHalfSection');
          table.index('gameRecordId');
          table.index('walletId');
          table.index('isFake');
        })
        .then(() => {
          console.log(`${tableName} table created done`);
          resolve();
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findAllTodayNewBet(filter) {
  let result = undefined;

  let today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(5)
  try {
    result = await DB(tableName)
      .where(filter)
      .where('createdAt', '>=', today);
  } catch (e) {
    console.error(`DB UPDATEALL ERROR: ${tableName} : ${filter} - ${JSON.stringify(data)}`);
    console.error(e);
  }
  return result;
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function sum(field, filter, order) {
  return await Common.sum(tableName, field, filter, order);
}

async function sumaryPointAmount(startDate, endDate, filter, referAgentId) {
  let sumField = 'betRecordAmountIn';
  let queryBuilder = DB(tableName);
  if (filter) {
    queryBuilder.where(filter);
  }
  
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  if (referAgentId) {
    queryBuilder.where('referId', referAgentId);
  }

  queryBuilder.where({
    betRecordStatus: BET_STATUS.COMPLETED
  });

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`)
        .then(records => {
          resolve(records);
        });
    }
    catch (e) {
      console.log(e)
      reject(-1);
    }
  });
}

async function sumaryWinLoseAmount(startDate, endDate, filter, referAgentId) {
  let sumField = 'betRecordWin';
  let queryBuilder = DB(tableName);
  if (filter) {
    queryBuilder.where(filter);
  }
  
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  if (referAgentId) {
    queryBuilder.where('referId', referAgentId);
  }

  queryBuilder.where({
    betRecordStatus: BET_STATUS.COMPLETED
  });

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`)
        .then(records => {
          resolve(records);
        });
    }
    catch (e) {
      console.log(e)
      reject(-1);
    }
  });
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  sum,
  sumaryPointAmount,
  sumaryWinLoseAmount,
  updateAll,
  findAllTodayNewBet
};
