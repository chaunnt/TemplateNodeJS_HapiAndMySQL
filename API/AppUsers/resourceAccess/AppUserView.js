/* Copyright (c) 2022-2024 Reminano */

'use strict';
require('dotenv').config();
const { DB } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUserViews';
const rootTableName = 'AppUser';
const primaryKeyField = 'appUserId';
const tableMemberShip = 'AppUserMembership';
const StaffUserTableName = 'StaffUser';
const AppUserMissionInfo = 'AppUserMissionInfo';
async function createViews() {
  let fields = [
    `${rootTableName}.appUserId`,
    `${rootTableName}.sotaikhoan`,
    `${rootTableName}.tentaikhoan`,
    `${rootTableName}.tennganhang`,
    `${rootTableName}.username`,
    `${rootTableName}.firstName`,
    `${rootTableName}.isDeleted`,
    `${rootTableName}.lastName`,
    `${rootTableName}.phoneNumber`,
    `${rootTableName}.userHomeAddress`,
    `${rootTableName}.companyName`,
    `${rootTableName}.email`,
    `${rootTableName}.birthDay`,
    `${rootTableName}.sex`,
    `${rootTableName}.password`,
    `${rootTableName}.secondaryPassword`,
    `${rootTableName}.lastActiveAt`,
    `${rootTableName}.twoFACode`,
    `${rootTableName}.twoFAQR`,
    `${rootTableName}.userAvatar`, //Image from social login may be so long (include token)
    `${rootTableName}.socialInfo`, //Image from social login may be so long (include token)
    `${rootTableName}.identityNumber`,
    `${rootTableName}.imageBeforeIdentityCard`, //link hinh (ben trong he thong nen chi can 255)
    `${rootTableName}.imageAfterIdentityCard`, //link hinh (ben trong he thong nen chi can 255)
    `${rootTableName}.active`,
    `${rootTableName}.verifiedAt`,
    `${rootTableName}.isVerified`,
    `${rootTableName}.isVerifiedEmail`,
    `${rootTableName}.isVerifiedPhoneNumber`,
    `${rootTableName}.referUserId`, //dung de luu tru nguoi gioi thieu (khi can thiet)
    `${rootTableName}.referUser`, //dung de luu username cua nguoi gioi thieu (khi can thiet)
    `${rootTableName}.memberLevelName`, //luu membership
    `${rootTableName}.appUserMembershipId`, //luu membership
    `${rootTableName}.limitWithdrawDaily`, //luu so tien toi da duoc rut (khi can thiet)
    `${rootTableName}.userFirstLoginDevice`,
    `${rootTableName}.userDevice`,
    `${rootTableName}.ipAddress`, //luu IP address -> chong spam va hack
    `${rootTableName}.firstLoginIp`, //luu IP address -> chong spam va hack
    `${rootTableName}.duplicatedFirstLoginIp`, //luu IP address -> chong spam va hack
    `${rootTableName}.duplicatedIpAddress`, //luu IP address -> chong spam va hack
    `${rootTableName}.googleId`, //luu google id - phong khi 1 user co nhieu tai khoan
    `${rootTableName}.telegramId`, //luu telegram id - phong khi 1 user co nhieu tai khoan
    `${rootTableName}.facebookId`, //luu facebook id - phong khi 1 user co nhieu tai khoan
    `${rootTableName}.appleId`, //luu apple id - phong khi 1 user co nhieu tai khoan
    `${rootTableName}.createdAt`,
    `${rootTableName}.createdAtTimestamp`,
    `${rootTableName}.appUserNote`,
    `${rootTableName}.activeOTPCode`,
    `${rootTableName}.activeOTPAt`,
    `${rootTableName}.referCode`,
    `${rootTableName}.blockedLogin`,
    `${rootTableName}.blockedWithdrawBank`,
    `${rootTableName}.blockedWithdrawCrypto`,

    `${rootTableName}.diachiviUSDT`, // su dung tam
    `${rootTableName}.diachiviBTC`, //su dung tam
    `${rootTableName}.memberReferIdF1`,
    `${rootTableName}.memberReferIdF2`,
    `${rootTableName}.memberReferIdF3`,
    `${rootTableName}.memberReferIdF4`,
    `${rootTableName}.memberReferIdF5`,
    `${rootTableName}.memberReferIdF6`,
    `${rootTableName}.memberReferIdF7`,
    `${rootTableName}.memberReferIdF8`,
    `${rootTableName}.memberReferIdF9`,
    `${rootTableName}.memberReferIdF10`,
    `${rootTableName}.appUserCategoryId`,
    `${rootTableName}.isVirtualUser`,
    `${rootTableName}.isAllowedWithdraw`,
    `${rootTableName}.isAllowedDeposit`,
    `${rootTableName}.isExpert`,
    `${rootTableName}.isPlayRoundRefund`,
    `${rootTableName}.supervisorId`,
    DB.raw(`MONTH(${rootTableName}.createdAt) as createMonth`),
    DB.raw(`YEAR(${rootTableName}.createdAt) as createYear`),
    `${tableMemberShip}.appUserMembershipTitle`,
    `${tableMemberShip}.appUserMembershipBonusRate`,
    `${tableMemberShip}.appUserMembershipInvitationRequired`,
    `${tableMemberShip}.appUserMembershipAssetRequired`,
    `${tableMemberShip}.appUserMembershipAssetF1Required`,
    `${tableMemberShip}.appUserMembershipDescription`,
    `${tableMemberShip}.appUserMembershipImage`,

    `${StaffUserTableName}.staffUserId`,
    `${StaffUserTableName}.staffId`,

    `${AppUserMissionInfo}.enableMissionPlay`,
    `${AppUserMissionInfo}.enableAddMissionBonus`,
  ];

  var viewDefinition = DB.select(fields)
    .from(rootTableName)
    .leftJoin(tableMemberShip, function () {
      this.on(`${rootTableName}.appUserMembershipId`, '=', `${tableMemberShip}.appUserMembershipId`);
    })
    .leftJoin(StaffUserTableName, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${StaffUserTableName}.appUserId`);
    })
    .leftJoin(AppUserMissionInfo, function () {
      this.on(`${rootTableName}.appUserId`, '=', `${AppUserMissionInfo}.appUserId`);
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

function _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryBuilder = DB(tableName);
  let filterData = filter ? JSON.parse(JSON.stringify(filter)) : {};
  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('email', 'like', `%${searchText}%`)
        .orWhere('firstLoginIp', 'like', `%${searchText}%`)
        .orWhere('ipAddress', 'like', `%${searchText}%`)
        .orWhere('referCode', 'like', `%${searchText}%`)
        .orWhere('companyName', 'like', `%${searchText}%`);
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

async function customSearch(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}

async function customCount(filter, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return await query.count(`${primaryKeyField} as count`);
}

async function countUserMonthByYear(filter, startDate, endDate) {
  let query = await DB(tableName)
    .select('createMonth')
    .select('createYear')
    .where(filter)
    .where('createdAtTimestamp', '>=', startDate)
    .where('createdAtTimestamp', '<=', endDate)
    .count(`createMonth as countCreateMonth`)
    .groupBy('createMonth')
    .groupBy('createYear')
    .orderBy('createMonth', 'desc')
    .orderBy('createYear', 'desc');
  return query;
}

async function findAllUsersFollowingReferId(filter, skip, limit, startDate, endDate, searchText, order) {
  let queryAllUser = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  queryAllUser.where('appUserMembershipId', '>', 1);
  return await queryAllUser.select();
}

async function countAllUsersByReferId(filter, startDate, endDate, searchText, order) {
  let queryAllUser = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  queryAllUser.where('appUserMembershipId', '>', 1);
  return await queryAllUser.count('appUserId as count');
}

module.exports = {
  insert,
  find,
  count,
  updateById,
  initViews,
  updateAll,
  customSearch,
  customCount,
  findById,
  countUserMonthByYear,
  findAllUsersFollowingReferId,
  countAllUsersByReferId,
};
