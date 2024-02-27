/* Copyright (c) 2022-2023 Reminano */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const Logger = require('../../../utils/logging');
const tableName = 'PaymentBonusDailyReportView';
const rootTableName = 'PaymentBonusDailyReport';
const primaryKeyField = 'PaymentBonusDailyReportId';

async function createView() {
  const UserTableName = 'AppUserViews';

  let fields = [
    `${rootTableName}.${primaryKeyField}`,
    `${rootTableName}.appUserId`,
    `${rootTableName}.summaryDate`, //nguoi user duoc tham chieu de tinh hoa hong
    `${rootTableName}.totalPlayCount`,
    `${rootTableName}.totalUserPlayCount`,
    `${rootTableName}.totalPlayAmount`,
    `${rootTableName}.totalBonus`,
    `${rootTableName}.referLevel`,

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
    `${UserTableName}.isDeleted`,
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

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  sum,
  modelName: tableName,
};
