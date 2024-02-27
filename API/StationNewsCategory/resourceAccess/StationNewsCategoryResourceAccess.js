/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'StationNewsCategory';
const primaryKeyField = 'stationNewsCategoryId';
const newCategoryData = require('../data/seedingData');

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(primaryKeyField).primary();
          table.integer('stationsId');
          table.string('stationNewsCategoryTitle');
          table.string('stationNewsCategoryContent', 500);
          table.string('stationNewsCategoryDisplayIndex').defaultTo(0);
          table.string('stationNewsCategoryAvatar');
          timestamps(table);
          table.index('stationNewsCategoryId');
          table.index('stationNewsCategoryDisplayIndex');
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
  const seedData = [...newCategoryData.NEWS_CATEGORY];
  return new Promise(async (resolve, reject) => {
    DB(`${tableName}`)
      .insert(seedData)
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
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.updateById(tableName, dataId, data);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));
  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('stationNewsCategoryTitle', 'like', `%${searchText}%`).orWhere('stationNewsCategoryContent', 'like', `%${searchText}%`);
    });
  } else {
    if (filterData.stationNewsCategoryName) {
      queryBuilder.where('stationNewsCategoryName', 'like', `%${filterData.stationNewsCategoryName}%`);
      delete filterData.stationNewsCategoryName;
    }
    if (filterData.stationNewsCategoryTitle) {
      queryBuilder.where('stationNewsCategoryTitle', 'like', `%${filterData.stationNewsCategoryTitle}%`);
      delete filterData.stationNewsCategoryTitle;
    }
    if (filterData.stationNewsCategoryContent) {
      queryBuilder.where('stationNewsCategoryContent', 'like', `%${filterData.stationNewsCategoryContent}%`);
      delete filterData.stationNewsCategoryContent;
    }
  }
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate);
  }

  queryBuilder.where(filterData);

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }

  queryBuilder.where({ isDeleted: 0 });

  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records[0].count);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function deleteById(stationNewsCategoryId) {
  let dataId = {};
  dataId[primaryKeyField] = stationNewsCategoryId;
  return await Common.deleteById(tableName, dataId);
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initDB,
  modelName: tableName,
  customSearch,
  customCount,
  deleteById,
};
