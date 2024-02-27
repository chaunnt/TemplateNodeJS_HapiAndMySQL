/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const Logger = require('../../../utils/logging');
const tableName = 'UserGamePlaysReportView';
const rootTableName = 'UserGamePlaysReport';
const primaryKeyField = 'appUserId';

async function createView() {
  const UserTableName = 'AppUserViews';

  let fields = [
    `${rootTableName}.appUserId`,
    `${rootTableName}.totalF1UserCount`,
    `${rootTableName}.totalSystemUserCount`,
    `${rootTableName}.totalBetRecordAmountIn`,
    `${rootTableName}.sumSystemBetAmountIn`,

    `${UserTableName}.firstName`,
    `${UserTableName}.lastName`,
    `${UserTableName}.username`,
    `${UserTableName}.companyName`,
    `${UserTableName}.memberReferIdF1`,
    `${UserTableName}.memberReferIdF2`,
    `${UserTableName}.memberReferIdF3`,
    `${UserTableName}.memberReferIdF4`,
    `${UserTableName}.memberReferIdF5`,
    `${UserTableName}.memberReferIdF6`,
    `${UserTableName}.memberReferIdF7`,
    `${UserTableName}.memberReferIdF8`,
    `${UserTableName}.memberReferIdF9`,
    `${UserTableName}.memberReferIdF10`,
    `${UserTableName}.supervisorId`,
    `${UserTableName}.staffId`,
    `${UserTableName}.appUserMembershipTitle`,
    `${UserTableName}.appUserMembershipId`,
    `${UserTableName}.memberLevelName`, //luu membership
  ];

  var viewDefinition = DB.select(fields)
    .groupBy(fields)
    .from(rootTableName)
    .leftJoin(UserTableName, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${UserTableName}.appUserId`);
    });

  await Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createView();
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

async function sumAmountDistinctByDate(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByDate(tableName, 'paymentAmount', filter, startDate, endDate);
}

async function sumAmountDistinctByStatus(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByCustomField(tableName, 'paymentAmount', 'paymentStatus', filter, startDate, endDate);
}

async function findAmountDistinctByReferedUserAndDate(filter, skip, limit, searchText, startDate, endDate, order, customFieldsList) {
  let queryBuilder = _makeQueryBuilderByFilterDistinct(filter, skip, limit, searchText, startDate, endDate, order);
  let sumFieldsList = ['paymentAmount', 'totalReferAmount'];

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

async function countAmountDistinctByReferedUserAndDate(filter, skip, limit, searchText, startDate, endDate, order, customFieldsList) {
  let queryBuilder = _makeQueryBuilderByFilterDistinct(filter, skip, limit, searchText, startDate, endDate, order);
  let sumFieldsList = ['paymentAmount', 'totalReferAmount'];

  return new Promise((resolve, reject) => {
    try {
      queryBuilder
        .count(``)
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

function _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('companyName', 'like', `%${searchText}%`);
    });
  }

  queryBuilder.where(filterData);

  if (startDate) {
    queryBuilder.where('paymentDate', '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where('paymentDate', '<=', endDate);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }
  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }
  return queryBuilder;
}

function _makeQueryBuilderByFilterDistinct(filter, skip, limit, searchText, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('companyName', 'like', `%${searchText}%`);
    });
  }

  queryBuilder.where(filterData);

  queryBuilder.where({ isDeleted: 0 });

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }

  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }

  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }
  if (order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc')) {
    queryBuilder.orderBy(order.key, order.value);
  }
  return queryBuilder;
}

function _makeQueryBuilderForFullReferedUser(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter({}, skip, limit, searchText, startDate, endDate, order);

  if (filter.memberReferIdF1) {
    queryBuilder.where({ memberReferIdF1: filter.memberReferIdF1 });
  } else if (filter.memberReferIdF2) {
    queryBuilder.where({ memberReferIdF2: filter.memberReferIdF2 });
  } else if (filter.memberReferIdF3) {
    queryBuilder.where({ memberReferIdF3: filter.memberReferIdF3 });
  } else if (filter.memberReferIdF4) {
    queryBuilder.where({ memberReferIdF4: filter.memberReferIdF4 });
  } else if (filter.memberReferIdF5) {
    queryBuilder.where({ memberReferIdF5: filter.memberReferIdF5 });
  } else if (filter.memberReferIdF6) {
    queryBuilder.where({ memberReferIdF6: filter.memberReferIdF6 });
  } else if (filter.memberReferIdF7) {
    queryBuilder.where({ memberReferIdF7: filter.memberReferIdF7 });
  } else if (filter.memberReferIdF8) {
    queryBuilder.where({ memberReferIdF8: filter.memberReferIdF8 });
  } else if (filter.memberReferIdF9) {
    queryBuilder.where({ memberReferIdF9: filter.memberReferIdF9 });
  } else if (filter.memberReferIdF10) {
    queryBuilder.where({ memberReferIdF10: filter.memberReferIdF10 });
  } else if (filter.appUserId) {
    queryBuilder.where(function () {
      this.orWhere('memberReferIdF1', filter.appUserId)
        .orWhere('memberReferIdF2', filter.appUserId)
        .orWhere('memberReferIdF3', filter.appUserId)
        .orWhere('memberReferIdF4', filter.appUserId)
        .orWhere('memberReferIdF5', filter.appUserId)
        .orWhere('memberReferIdF6', filter.appUserId)
        .orWhere('memberReferIdF7', filter.appUserId)
        .orWhere('memberReferIdF8', filter.appUserId)
        .orWhere('memberReferIdF9', filter.appUserId)
        .orWhere('memberReferIdF10', filter.appUserId);
    });
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate, order);
  return await query.count();
}

async function customSearchFullReferedUser(filter, skip, limit, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderForFullReferedUser(filter, undefined, undefined, startDate, endDate, undefined, order);
  return await query.sum(`${field} as sumResult`);
}

async function customCountFullReferedUser(filter, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderForFullReferedUser(filter, undefined, undefined, startDate, endDate, undefined, order);
  return await query.sum(`${field} as sumResult`);
}

async function customSumFullReferedUser(field, filter, startDate, endDate, order) {
  let query = _makeQueryBuilderForFullReferedUser(filter, undefined, undefined, startDate, endDate, undefined, order);
  return await query.sum(`${field} as sumResult`);
}

async function customSum(field, filter, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, undefined, startDate, endDate, order);
  return await query.sum(`${field} as sumResult`);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}

module.exports = {
  insert,
  findById,
  find,
  count,
  updateById,
  initViews,
  sum,
  modelName: tableName,
  customSearch,
  customCount,
  sumAmountDistinctByDate,
  sumAmountDistinctByStatus,
  findAmountDistinctByReferedUserAndDate,
  countAmountDistinctByReferedUserAndDate,
  customCountFullReferedUser,
  customSearchFullReferedUser,
  customSumFullReferedUser,
  customSum,
};
