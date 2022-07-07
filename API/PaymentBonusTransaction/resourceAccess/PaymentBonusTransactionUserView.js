"use strict";
require("dotenv").config();
const { DB } = require("../../../config/database");
const Common = require('../../Common/resourceAccess/CommonResourceAccess');

const tableName = "BonusTransactionUserView";
const rootTableName = 'PaymentBonusTransaction';
const primaryKeyField = "paymentBonusTransactionId";
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
    `${UserTableName}.memberReferIdF1`,
    `${UserTableName}.memberReferIdF2`,
    `${UserTableName}.memberReferIdF3`,
    `${UserTableName}.memberReferIdF4`,
    `${UserTableName}.memberReferIdF5`,

    `${rootTableName}.paymentBonusTransactionId`,
    `${rootTableName}.paymentMethodId`,
    `${rootTableName}.paymentAmount`,
    `${rootTableName}.totalReferAmount`,
    `${rootTableName}.paymentUnit`,
    `${rootTableName}.paymentStatus`,
    `${rootTableName}.paymentRef`,
    `${rootTableName}.paymentNote`,
    `${rootTableName}.paymentApproveDate`,
    `${rootTableName}.paymentPICId`,
    `${rootTableName}.createdAt`,
    `${rootTableName}.referUserId`, //nguoi user duoc tham chieu de tinh hoa hong
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

async function sumAmountDistinctByStatus(filter, startDate, endDate) {
  return await Common.sumAmountDistinctByCustomField(tableName, 'paymentAmount', 'paymentStatus', filter, startDate, endDate);
}

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};
  if (filterData.name) {
    queryBuilder.where('firstName', 'like', `%${filterData.name}%`);
    delete filterData.name;
  }
  if (filterData.username) {
    queryBuilder.where("username", "like", `%${filterData.username}%`);
    delete filterData.username;
  }

  if (filterData.email) {
    queryBuilder.where("email", "like", `%${filterData.email}%`);
    delete filterData.email;
  }

  if (filterData.phoneNumber) {
    queryBuilder.where("phoneNumber", "like", `%${filterData.phoneNumber}%`);
    delete filterData.phoneNumber;
  }

  queryBuilder.where({ isDeleted: 0 });
  queryBuilder.where(filterData);
  
  if (startDate) {
    queryBuilder.where('createdAt', '>=', startDate)
  }

  if (endDate) {
    queryBuilder.where('createdAt', '<=', endDate)
  }
  
  console.log(queryBuilder.toString())
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
async function customSearch(filter, skip, limit, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, order);
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
  sumAmountDistinctByDate,
  sumAmountDistinctByStatus
};
