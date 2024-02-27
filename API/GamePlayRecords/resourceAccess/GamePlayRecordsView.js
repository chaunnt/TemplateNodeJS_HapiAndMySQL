/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const { BET_STATUS } = require('../GamePlayRecordsConstant');
const tableName = 'GamePlayRecordsView';
const rootTableName = 'GamePlayRecords';
const primaryKeyField = 'betRecordId';
const Logger = require('../../../utils/logging');
async function createGamePlayRecordsView() {
  const GameInfoTableName = 'GameInfo';
  const StaffUser = 'StaffUser';
  const AppUser = 'AppUser';
  let fields = [
    `${rootTableName}.betRecordId`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.betRecordAmountIn`,
    `${rootTableName}.betRecordAmountOut`,
    `${rootTableName}.betRecordWin`,
    `${rootTableName}.betRecordStatus`,
    `${rootTableName}.betRecordSection`,
    `${rootTableName}.betRecordNote`,
    `${rootTableName}.betRecordResult`,
    `${rootTableName}.betRecordValue`,
    `${rootTableName}.betRecordUnit`,
    `${rootTableName}.betRecordType`,
    `${rootTableName}.betRecordHash`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.createdAtTimestamp`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.gameInfoId`,

    `${GameInfoTableName}.gameName`,
    `${StaffUser}.staffId`,

    `${AppUser}.username`,
    `${AppUser}.firstName`,
    `${AppUser}.memberReferIdF1`,
    `${AppUser}.memberReferIdF2`,
    `${AppUser}.memberReferIdF3`,
    `${AppUser}.memberReferIdF4`,
    `${AppUser}.memberReferIdF5`,
    `${AppUser}.memberReferIdF6`,
    `${AppUser}.memberReferIdF7`,
    `${AppUser}.memberReferIdF8`,
    `${AppUser}.memberReferIdF9`,
    `${AppUser}.memberReferIdF10`,
  ];

  var viewDefinition = DB.select(fields)
    .from(`${rootTableName}`)
    .leftJoin(`${GameInfoTableName}`, function () {
      this.on(`${rootTableName}.gameInfoId`, '=', `${GameInfoTableName}.gameInfoId`);
    })
    .leftJoin(`${StaffUser}`, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${StaffUser}.appUserId`);
    })
    .leftJoin(`${AppUser}`, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${AppUser}.appUserId`);
    });
  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createGamePlayRecordsView();
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

async function sum(field, filter, order) {
  return await Common.sum(tableName, field, filter, order);
}

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = JSON.parse(JSON.stringify(filter));

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
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate);
  return await query.count(`${primaryKeyField} as count`);
}

async function sumaryWinAmount(filter, startDate, endDate, searchText) {
  let sumField = 'betRecordWin';
  filter.betRecordStatus = BET_STATUS.COMPLETED;
  return await customSum(sumField, filter, searchText, startDate, endDate);
}

async function customSum(sumField, filter, searchText, startDate, endDate, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate, order);
  return queryBuilder.sum(`${sumField} as sumResult`);
}
async function customCountDistinct(filter, distinctFields, startDate, endDate) {
  let queryBuilder = DB(tableName);
  if (startDate) {
    const moment = require('moment');
    DB.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    DB.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.countDistinct(` ${distinctFields} as CountResult`).then(records => {
        if (records && records[0].sumResult === null) {
          resolve(undefined);
        } else {
          resolve(records);
        }
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB SUM ERROR: ${tableName} ${_field}: ${JSON.stringify(filter)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

function _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount = 0, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderByFilter({}, skip, limit, searchText, startDate, endDate);

  if (filter) {
    queryBuilder.where(filter);
  }

  if (appUserId) {
    queryBuilder.where(function () {
      if (appUserId && membershipLevelCount >= 1) {
        this.orWhere('memberReferIdF1', appUserId);
      }
      if (appUserId && membershipLevelCount >= 2) {
        this.orWhere('memberReferIdF2', appUserId);
      }
      if (appUserId && membershipLevelCount >= 3) {
        this.orWhere('memberReferIdF3', appUserId);
      }
      if (appUserId && membershipLevelCount >= 4) {
        this.orWhere('memberReferIdF4', appUserId);
      }
      if (appUserId && membershipLevelCount >= 5) {
        this.orWhere('memberReferIdF5', appUserId);
      }
      if (appUserId && membershipLevelCount >= 6) {
        this.orWhere('memberReferIdF6', appUserId);
      }
    });
  }

  return queryBuilder;
}

async function sumReferedUserByUserMembership(sumField, appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText);
  return await queryBuilder.sum(`${sumField} as sumResult`);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  sum,
  customSearch,
  customCount,
  sumaryWinAmount,
  customSum,
  customCountDistinct,
  sumReferedUserByUserMembership,
};
