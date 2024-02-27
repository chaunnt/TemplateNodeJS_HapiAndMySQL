/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'SystemIPView';
const rootTableName = 'SystemIP';
const primaryKeyField = 'systemIpId';

async function createSystemIPView() {
  const UserTableName = 'AppUser';
  let fields = [
    `${rootTableName}.systemIpId`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.IP`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.createdAtTimestamp`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.isHidden`,

    `${UserTableName}.referUserId`,
    `${UserTableName}.referUser`,
    `${UserTableName}.username`,
    `${UserTableName}.firstName`,
    `${UserTableName}.lastName`,
    `${UserTableName}.email`,
    `${UserTableName}.memberLevelName`,
    `${UserTableName}.active`,
    `${UserTableName}.ipAddress`,
    `${UserTableName}.phoneNumber`,
  ];

  var viewDefinition = DB.select(fields)
    .from(`${rootTableName}`)
    .leftJoin(`${UserTableName}`, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${UserTableName}.appUserId`);
    });
  await Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  await createSystemIPView();
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

  if (searchText && searchText.trim() !== '') {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`);
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

async function customSearch(filter, skip, limit, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, searchText, startDate, endDate) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate, undefined);
  return await query.count(`${primaryKeyField} as count`);
}

async function customSum(sumField, filter, searchText, startDate, endDate, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, searchText, startDate, endDate, order);
  return queryBuilder.sum(`${sumField} as sumResult`);
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
  customSum,
};
