/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by Huu on 12/31/21.
 */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserMissionInfo';
const primaryKeyField = 'appUserId';
async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.integer('remainingMissionCount').defaultTo(0);
          table.integer('maxMissionCount').defaultTo(0);
          table.integer('depositCount').defaultTo(0);
          table.integer('withdrawCount').defaultTo(0);
          table.timestamp('lastDepositedAt').nullable();
          table.bigInteger('lastDepositedAtTimestamp').nullable();
          table.bigInteger('lastWithdrawdAtTimestamp').nullable();
          table.integer('enableMissionPlay').defaultTo(1);
          table.integer('enableAddMissionBonus').defaultTo(1);
          table.timestamp('lastWithdrawdAt').nullable();
          table.integer('missionCompletedCount').defaultTo(0);
          table.timestamp('lastUpdateMissionCompletedAt').nullable();
          table.bigInteger('lastUpdateMissionCompletedAtTimestamp').nullable();
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.index(`lastUpdateMissionCompletedAt`);
          table.index(`missionCompletedCount`);
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
  return new Promise(async (resolve, reject) => {
    resolve();
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

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}
async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
}
async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (filterData.appUserMembershipTitle) {
    queryBuilder.where('appUserMembershipTitle', 'like', `%${filterData.appUserMembershipTitle}%`);
    delete filterData.appUserMembershipTitle;
  }

  if (filterData.appUserMembershipDescription) {
    queryBuilder.where('appUserMembershipDescription', 'like', `%${filterData.appUserMembershipDescription}%`);
    delete filterData.appUserMembershipDescription;
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

async function customSearch(filter, skip, limit, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, order);
  return await query.select();
}

async function customCount(filter, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, order);
  return await query.count(`${primaryKeyField} as count`);
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  deleteById,
  findById,
  initDB,
  customSearch,
  customCount,
};
