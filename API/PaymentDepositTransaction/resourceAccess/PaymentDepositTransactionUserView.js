"use strict";
require("dotenv").config();
const { DB } = require("../../../config/database");
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const tableName = "DepositTransactionUserView";
const rootTableName = 'PaymentDepositTransaction';
const primaryKeyField = "paymentDepositTransactionId";
async function createView() {
  const UserTableName = 'AppUserViews';
  let fields = [
    `${UserTableName}.appUserId`,
    `${UserTableName}.firstName`,
    `${UserTableName}.lastName`,
    `${UserTableName}.email`,
    `${UserTableName}.memberLevelName`,
    `${UserTableName}.active`,
    `${UserTableName}.ipAddress`,
    `${UserTableName}.phoneNumber`,
    `${UserTableName}.telegramId`,
    `${UserTableName}.facebookId`,
    `${UserTableName}.appleId`,
    `${UserTableName}.username`,
    `${UserTableName}.companyName`,
    `${UserTableName}.appUserMembershipTitle`,
    `${UserTableName}.sotaikhoan`,
    `${UserTableName}.tentaikhoan`,
    `${UserTableName}.tennganhang`,
    
    `${rootTableName}.paymentDepositTransactionId`,
    `${rootTableName}.paymentMethodId`,
    `${rootTableName}.paymentAmount`,
    `${rootTableName}.paymentRewardAmount`,
    `${rootTableName}.paymentUnit`,
    `${rootTableName}.paymentStatus`,
    `${rootTableName}.paymentRef`,
    `${rootTableName}.paymentNote`,
    `${rootTableName}.paymentApproveDate`,
    `${rootTableName}.paymentPICId`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.paymentCategory`,
    `${rootTableName}.paymentRefAmount`,
    `${rootTableName}.paymentType`,
    `${rootTableName}.paymentOwner`,
    `${rootTableName}.paymentOriginSource`,
    `${rootTableName}.paymentOriginName`,


    DB.raw(`DATE_FORMAT(${rootTableName}.createdAt, "%d-%m-%Y") as createdDate`),
    `${rootTableName}.updatedAt`,
    `${rootTableName}.isHidden`,
    `${rootTableName}.isDeleted`,
  ];

  var viewDefinition = DB.select(fields).from(rootTableName).leftJoin(UserTableName, function () {
    this.on(`${rootTableName}.appUserId`, '=', `${UserTableName}.appUserId`)
  });

  Common.createOrReplaceView(tableName, viewDefinition)
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

async function sumAmountDistinctByDate(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByDate(tableName, 'paymentAmount', filter, startDate, endDate);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};
  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`)
        .orWhere('companyName', 'like', `%${searchText}%`)
    })
  }

  queryBuilder.where({ isDeleted: 0 });

  queryBuilder.where(filterData);
  
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate)
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate)
  }
  
  if (limit) {
    queryBuilder.limit(limit);
  }

  if (skip) {
    queryBuilder.offset(skip);
  }
  if (
    order &&
    order.key !== "" &&
    order.value !== "" &&
    (order.value === "desc" || order.value === "asc")
  ) {
    queryBuilder.orderBy(order.key, order.value);
  } else {
    queryBuilder.orderBy("createdAt", "desc");
  }
  return queryBuilder;
}
async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return await query.count(`${primaryKeyField} as count`);
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  sum,
  modelName: tableName,
  customSearch,
  customCount,
  sumAmountDistinctByDate
};
