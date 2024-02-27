/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserMissionStaffViews';
const rootTableName = 'AppUserMissionInfo';
const primaryKeyField = 'appUserId';
const StaffUserTableName = 'StaffUser';
async function createViews() {
  let fields = [
    `${rootTableName}.appUserId`,
    `${rootTableName}.remainingMissionCount`,
    `${rootTableName}.maxMissionCount`,
    `${rootTableName}.depositCount`,
    `${rootTableName}.withdrawCount`,
    `${rootTableName}.missionCompletedCount`,
    `${rootTableName}.lastDepositedAt`,
    `${rootTableName}.lastWithdrawdAt`,
    `${rootTableName}.lastDepositedAtTimestamp`,
    `${rootTableName}.lastWithdrawdAtTimestamp`,
    `${rootTableName}.lastUpdateMissionCompletedAtTimestamp`,
    `${rootTableName}.lastUpdateMissionCompletedAt`,
    `${rootTableName}.isDeleted`,

    `${StaffUserTableName}.staffUserId`,
    `${StaffUserTableName}.staffId`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(StaffUserTableName, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${StaffUserTableName}.appUserId`);
    });
  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createViews();
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let filter = {};
  filter[`${primaryKeyField}`] = id;
  return await Common.updateById(tableName, filter, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, order) {
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
  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);

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

async function countDeposit(filter, startDate, endDate, minDepositCount) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('lastDepositedAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('lastDepositedAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  if (minDepositCount) {
    queryBuilder.where('depositCount', '>=', minDepositCount);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);
  return await queryBuilder.count(`${primaryKeyField} as count`);
}

async function withdrawDeposit(filter, startDate, endDate, minWithdrawCount) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('lastWithdrawdAt', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('lastWithdrawdAt', '<=', moment(endDate).toDate() * 1);
  }
  if (minWithdrawCount) {
    queryBuilder.where('withdrawCount', '>=', minWithdrawCount);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);
  return await queryBuilder.count(`${primaryKeyField} as count`);
}

async function countMisionCompleted(filter, startDate, endDate, minMissionCompleted) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('lastUpdateMissionCompletedAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('lastUpdateMissionCompletedAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  if (minMissionCompleted) {
    queryBuilder.where('missionCompletedCount', '>=', minMissionCompleted);
  } else {
    queryBuilder.where('missionCompletedCount', '=', 1);
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);

  return await queryBuilder.countDistinct(` ${primaryKeyField} as count`);
}

async function customSearch(filter, skip, limit, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, undefined);
  return await query.count(`${primaryKeyField} as count`);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  updateAll,
  countDeposit,
  withdrawDeposit,
  countMisionCompleted,
  customSearch,
  customCount,
  findById,
};
