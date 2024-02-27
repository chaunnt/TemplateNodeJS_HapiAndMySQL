/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { GAME_RECORD_STATUS } = require('../GameRecordConstant');
const { BET_TYPE } = require('../../GamePlayRecords/GamePlayRecordsConstant');

const tableName = 'GameRecords';
const primaryKeyField = 'gameRecordId';
async function createTable() {
  Logger.info(`createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.string('gameRecordValue');
          table.string('gameRecordType');
          table.string('gameRecordUnit');
          table.integer('isPlayGameRecord').defaultTo(1);
          table.string('gameRecordSection').unique();
          table.string('gameRecordNote');
          table.string('gameRecordResult');
          table.integer('gameInfoId');
          table.string('gameRecordStatus').defaultTo(GAME_RECORD_STATUS.NEW);
          timestamps(table);
          table.index('gameInfoId');
          table.index('gameRecordId');
          table.index('gameRecordType');
          table.index('gameRecordValue');
          table.index('gameRecordSection');
          table.index('gameRecordStatus');
          table.index('gameRecordUnit');
          table.index('isPlayGameRecord');
        })
        .then(async () => {
          Logger.info(`${tableName} table created done`);
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

async function find(filter, skip, limit, order, startDate, endDate) {
  return await Common.find(tableName, filter, skip, limit, order, startDate, endDate);
}

async function findById(id) {
  let dataId = { [primaryKeyField]: id };
  return await Common.findById(tableName, dataId, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function sum(field, filter, order) {
  return await Common.sum(tableName, field, filter, order);
}

async function updateAll(filter, data) {
  return await Common.updateAll(tableName, data, filter);
}

async function permanentlyDeleteById(id) {
  return await Common.permanentlyDeleteById(tableName, primaryKeyField, id);
}

async function increment(id, key, amount) {
  const data = await findById(id);
  let gameValue = parseInt(data[key]);
  gameValue += amount;
  await updateById(id, {
    [key]: gameValue,
  });
}

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('gameRecordSection', 'like', `%${searchText}%`);
    });
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
  Common.filterHandler(filterData, queryBuilder);

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

async function customSearch(filter, skip, limit, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, searchText, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate, searchText, undefined);
  return await query.count(`${primaryKeyField} as count`);
}

async function permanentlyDelete(filter, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate);
  return await query.del();
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initDB,
  sum,
  updateAll,
  increment,
  findById,
  permanentlyDeleteById,
  permanentlyDelete,
  customSearch,
  customCount,
};
