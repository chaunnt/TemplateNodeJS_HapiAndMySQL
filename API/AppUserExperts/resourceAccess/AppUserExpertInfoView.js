/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserExpertInfoView';
const rootTableName = 'AppUserExpertInfo';
const primaryKeyField = 'appUserId';

async function createView() {
  const appUserTableName = 'AppUser';
  let fields = [
    `${rootTableName}.appUserId`,
    `${rootTableName}.profitAmountIndex`,
    `${rootTableName}.copierNumber`,
    `${rootTableName}.shareProfitIndex`,
    `${rootTableName}.minAmountInvest`,
    `${rootTableName}.isActive`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.createdAtTimestamp`,
    `${rootTableName}.isDeleted`,

    `${appUserTableName}.username`,
    `${appUserTableName}.firstName`,
    `${appUserTableName}.lastName`,
    `${appUserTableName}.userAvatar`,
  ];

  var viewDefinition = DB.select(fields)
    .from(`${rootTableName}`)
    .where('isActive', '=', 1)
    .leftJoin(`${appUserTableName}`, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${appUserTableName}.appUserId`);
    });
  Common.createOrReplaceView(tableName, viewDefinition);
}

async function initViews() {
  createView();
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

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`);
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
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText);
  return await query.count(`${primaryKeyField} as count`);
}

async function findById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.findById(tableName, dataId, id);
}
module.exports = {
  insert,
  find,
  findById,
  count,
  updateById,
  initViews,
  sum,
  customSearch,
  customCount,
};
