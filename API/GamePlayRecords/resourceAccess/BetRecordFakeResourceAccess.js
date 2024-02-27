/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BET_STATUS, BET_TYPE } = require('../GamePlayRecordsConstant');
const tableName = 'BetRecordFake';
const primaryKeyField = 'betRecordId';
const Logger = require('../../../utils/logging');
async function createTable() {
  Logger.info(`createTable ${tableName}`);
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
          table.string('betRecordType', 40);
          table.string('betRecordValue', 255);
          table.integer('betRecordQuantity');
          table.string('betRecordPaymentBonusStatus').defaultTo(BET_STATUS.NEW);
          table.integer('betRecordResult');
          table.string('betRecordHash').unique().nullable();
          table.integer('gameInfoId');
          table.integer('walletId');
          timestamps(table);
          table.index('appUserId');
          table.index('betRecordId');
          table.index('betRecordStatus');
          table.index('betRecordType');
          table.index('betRecordSection');
          table.index('betRecordHalfSection');
          table.index('gameInfoId');
          table.index('walletId');
          table.index('betRecordHash');
        })
        .then(async () => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(() => {
            resolve();
          });
        });
    });
  });
}

async function seeding() {
  let seedingData = [
    {
      appUserId: 1,
      betRecordAmountIn: 10000,
      betRecordAmountOut: 20000,
      betRecordSection: '202302141134-XXX',
      betRecordWin: 10000,
      betRecordStatus: BET_STATUS.COMPLETED,
      betRecordValue: 'XXXXXXXXXXXXXXX',
    },
  ];

  seedingData = [];
  for (let gameCounter = 1; gameCounter <= 8; gameCounter++) {
    const _gameId = gameCounter;
    for (let i = 0; i < Object.keys(BET_TYPE).length; i++) {
      const _betType = Object.keys(BET_TYPE)[i];
      let _newBet = {
        appUserId: 91,
        betRecordAmountIn: 10000,
        betRecordAmountOut: 20000,
        betRecordSection: `202302141134-00${_gameId}`,
        betRecordWin: 10000,
        betRecordStatus: BET_STATUS.COMPLETED,
        betRecordValue: 'XXXXXXXXXXXXXXX',
        betRecordType: _betType,
        gameInfoId: _gameId,
      };
      seedingData.push(_newBet);
    }
  }

  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedingData)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
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

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
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
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  if (referAgentId) {
    queryBuilder.where('referId', referAgentId);
  }

  queryBuilder.where({
    betRecordStatus: BET_STATUS.COMPLETED,
  });

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('error sum point amount: ', e);
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
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  if (referAgentId) {
    queryBuilder.where('referId', referAgentId);
  }

  queryBuilder.where({
    betRecordStatus: BET_STATUS.COMPLETED,
  });

  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('error', e);
      reject(-1);
    }
  });
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }
  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = await _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query;
}
async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function customSum(sumField, filter, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(undefined);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

function _makeQueryBuilderForReferedUser(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter({}, skip, limit, startDate, endDate, searchText, order);

  if (filter && filter.appUserId) {
    const _appUserId = filter.appUserId;
    queryBuilder.where(function () {
      this.orWhere('memberReferIdF1', _appUserId).orWhere('memberReferIdF2', _appUserId).orWhere('memberReferIdF3', _appUserId);
      // .orWhere("memberReferIdF4", _appUserId)
      // .orWhere("memberReferIdF5", _appUserId);
    });
    delete filter.appUserId;
  }

  queryBuilder.where(filter);

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy(`${primaryKeyField}`, 'desc');
  }

  return queryBuilder;
}

async function customSumReferedUserByUserId(appUserId, sumField, filter, startDate, endDate) {
  let queryBuilder = _makeQueryBuilderForReferedUser(
    {
      appUserId: appUserId,
      ...filter,
    },
    undefined,
    undefined,
    startDate,
    endDate,
  );
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.sum(`${sumField} as sumResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(0);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${sumField}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  sum,
  sumaryPointAmount,
  sumaryWinLoseAmount,
  updateAll,
  customSearch,
  customCount,
  customSum,
  customSumReferedUserByUserId,
};
