/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'CustomerReceiptView';
const rootTableName = 'CustomerReceipt';
const primaryKeyField = 'customerReceiptId';
const moment = require('moment');

async function createRoleStaffView() {
  const CustomerScheduleTableName = 'CustomerSchedule';

  let fields = [
    `${rootTableName}.customerReceiptId`,
    `${rootTableName}.customerReceiptName`,
    `${rootTableName}.customerReceiptEmail`,
    `${rootTableName}.customerReceiptPhone`,
    `${rootTableName}.customerReceiptAmount`,
    `${rootTableName}.customerReceiptContent`,
    `${rootTableName}.customerReceiptStatus`,
    `${rootTableName}.paymentMethod`,
    `${rootTableName}.paymentApproveDate`,
    `${rootTableName}.customerReceiptNote`,
    `${rootTableName}.fee`,
    `${rootTableName}.total`,
    `${rootTableName}.customerReceiptExternalRef`,
    `${rootTableName}.customerReceiptInternalRef`,
    `${rootTableName}.orderId`,
    `${rootTableName}.paymentResult`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.customerVehicleIdentity`,

    `${CustomerScheduleTableName}.customerScheduleId`,
    `${CustomerScheduleTableName}.licensePlates`,
    `${CustomerScheduleTableName}.stationsId`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(CustomerScheduleTableName, function () {
      this.on(`${rootTableName}.customerReceiptInternalRef`, '=', `${CustomerScheduleTableName}.customerScheduleId`);
    });

  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createRoleStaffView();
}

async function insert(data) {
  return await Common.insert(tableName, data, primaryKeyField);
}

async function updateById(id, data) {
  return await Common.updateById(tableName, { userId: id }, data);
}

async function find(filter, skip, limit, order) {
  return await Common.find(tableName, filter, skip, limit, order);
}

async function findById(id) {
  return await Common.findById(tableName, primaryKeyField, id);
}

async function count(filter, order) {
  return await Common.count(tableName, primaryKeyField, filter, order);
}

async function updateAll(data, filter) {
  return await Common.updateAll(tableName, data, filter);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};

  if (searchText) {
    searchText = searchText.trim();
    queryBuilder.where(function () {
      this.orWhere('customerReceiptName', 'like', `%${searchText}%`)
        .orWhere('customerReceiptPhone', 'like', `%${searchText}%`)
        .orWhere('customerReceiptEmail', 'like', `%${searchText}%`)
        .orWhere('licensePlates', 'like', `%${searchText}%`);
    });
  }

  if (filterData.paymentApproveDate) {
    queryBuilder.where('paymentApproveDate', '>=', moment(filterData.paymentApproveDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate());
    queryBuilder.where('paymentApproveDate', '<=', moment(filterData.paymentApproveDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate());
    delete filterData.paymentApproveDate;
  }

  if (filterData.createdAt) {
    queryBuilder.where('createdAt', '>=', moment(filterData.createdAt, 'DD/MM/YYYY').hours(0).minutes(0).toDate());
    queryBuilder.where('createdAt', '<=', moment(filterData.createdAt, 'DD/MM/YYYY').hours(23).minutes(59).toDate());
    delete filterData.createdAt;
  }

  if (!(order && order.key !== '' && order.value !== '' && (order.value === 'desc' || order.value === 'asc'))) {
    order = {
      key: 'createdAt',
      value: 'desc',
    };
  }

  if (startDate) {
    queryBuilder.where(order.key, '>=', startDate);
  }

  if (endDate) {
    queryBuilder.where(order.key, '<=', endDate);
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
    queryBuilder.orderBy('createdAt', 'desc');
  }

  return queryBuilder;
}

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, startDate, endDate, searchText, order) {
  if (startDate) {
    startDate = moment(startDate, 'DD/MM/YYYY').hours(0).minutes(0).toDate();
  }
  if (endDate) {
    endDate = moment(endDate, 'DD/MM/YYYY').hours(23).minutes(59).toDate();
  }

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

async function customCountDistinct(fieldDistinct, filter, startDate, endDate, searchText) {
  //override orderBy of default query
  let order = {
    key: `${fieldDistinct}`,
    value: 'asc',
  };
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).select(`${fieldDistinct}`).groupBy(`${fieldDistinct}`);
      query.then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  updateAll,
  findById,
  customSearch,
  customCount,
  customCountDistinct,
};
