/* Copyright (c) 2021-2024 Reminano */

'use strict';
require('dotenv').config();

const Logger = require('../../../utils/logging');
const { DB, timestamps } = require('../../../config/database');
const Common = require('../../Common/resourceAccess/CommonResourceAccess');
const tableName = 'AppUser';
const {
  USER_VERIFY_INFO_STATUS,
  USER_TYPE,
  USER_REFUND_PLAY,
  USER_VERIFY_EMAIL_STATUS,
  USER_VERIFY_PHONE_NUMBER_STATUS,
  USER_CATEGORY_ID,
  USER_CATEGORY,
  WITHDRAWAL_REQUEST,
  DEPOSIT_REQUEST,
  USER_STATUS,
} = require('../AppUserConstant');
const { LEVER_MEMBERSHIP, LEVEL_MEMBERSHIP_NAME } = require('../../AppUserMembership/AppUserMembershipConstant');
const primaryKeyField = 'appUserId';

//cac field nay la optional, tuy du an co the su dung hoac khong
function optionalFields(table) {
  table.integer('memberReferIdF1').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF2').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF3').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF4').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF5').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF6').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF7').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF8').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF9').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.integer('memberReferIdF10').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.string('sotaikhoan', 500).nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.string('tentaikhoan', 500).nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.string('tennganhang', 500).nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.string('diachiviUSDT', 500).nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.string('diachiviBTC', 500).nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('lastDepositAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('lastDepositAmount').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('firstDepositAmount').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('firstDepositAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('lastWithdrawAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('lastWithdrawAmount').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('firstWithdrawAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('firstWithdrawAmount').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('firstMissionAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.timestamp('firstPlayAt').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('firstDepositAtTimestamp').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('firstWithdrawAtTimestamp').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('lastWithdrawAtTimestamp').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('lastDepositAtTimestamp').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.bigInteger('firstMissionAtTimestamp').nullable(); //cac field nay la optional, tuy du an co the su dung hoac khong
  table.index('memberReferIdF1');
  table.index('memberReferIdF2');
  table.index('memberReferIdF3');
  table.index('memberReferIdF4');
  table.index('memberReferIdF5');
  table.index('memberReferIdF6');
  table.index('memberReferIdF7');
  table.index('memberReferIdF8');
  table.index('memberReferIdF9');
  table.index('memberReferIdF10');
  table.index('lastDepositAt');
  table.index('firstDepositAt');
  table.index('lastWithdrawAt');
  table.index('firstWithdrawAt');
  table.index('firstMissionAt');
  table.index('firstPlayAt');
}

async function createTable() {
  Logger.info('ResourceAccess', `createTable ${tableName}`);
  return new Promise(async (resolve, reject) => {
    DB.schema.dropTableIfExists(`${tableName}`).then(() => {
      DB.schema
        .createTable(`${tableName}`, function (table) {
          table.increments(`${primaryKeyField}`).primary();
          table.string('username');
          table.string('firstName');
          table.string('lastName');
          table.string('phoneNumber');
          table.string('userHomeAddress');
          table.string('companyName');
          table.string('email');
          table.string('birthDay');
          table.integer('sex');
          table.string('password');
          table.string('token', 5000);
          table.string('secondaryPassword');
          table.string('lastActiveAt');
          table.string('twoFACode');
          table.string('twoFAQR');
          table.string('userFirstLoginDevice');
          table.string('userDevice');
          table.integer('twoFAEnable').defaultTo(0);
          table.string('userAvatar', 2000); //Image from social login may be so long (include token)
          table.string('socialInfo', 2000); //Image from social login may be so long (include token)
          table.string('identityNumber');
          table.string('imageBeforeIdentityCard'); //link hinh (ben trong he thong nen chi can 255)
          table.string('imageAfterIdentityCard'); //link hinh (ben trong he thong nen chi can 255)
          table.boolean('active').defaultTo(USER_STATUS.ACTIVATED);
          table.boolean('blockedLogin').defaultTo(0);
          table.boolean('blockedWithdrawBank').defaultTo(0);
          table.boolean('blockedWithdrawCrypto').defaultTo(0);
          table.string('verifiedAt');
          table.integer('isVerified').defaultTo(USER_VERIFY_INFO_STATUS.NOT_VERIFIED);
          table.integer('isVerifiedEmail').defaultTo(USER_VERIFY_EMAIL_STATUS.NOT_VERIFIED);
          table.integer('isVerifiedPhoneNumber');
          table.integer('referUserId').nullable(); //dung de luu tru nguoi gioi thieu (khi can thiet)
          table.string('referUser').nullable(); //dung de luu username cua nguoi gioi thieu (khi can thiet)
          table.string('referCode', 15).nullable(); //dung de luu code cua nguoi gioi thieu (khi can thiet)
          table.string('memberLevelName').defaultTo(LEVEL_MEMBERSHIP_NAME.VIP0); //luu membership
          table.integer('appUserMembershipId').defaultTo(LEVER_MEMBERSHIP.MEMBER); // memberShip Id
          table.float('limitWithdrawDaily', 48, 24).defaultTo(1000000); //luu so tien toi da duoc rut (khi can thiet)
          table.string('ipAddress').nullable(); //luu IP address -> chong spam va hack
          table.string('firstLoginIp').nullable(); //luu IP address -> chong spam va hack
          table.integer('duplicatedFirstLoginIp').defaultTo(0); //luu IP address -> chong spam va hack
          table.integer('duplicatedIpAddress').defaultTo(0); //luu IP address -> chong spam va hack
          table.string('googleId').nullable(); //luu google id - phong khi 1 user co nhieu tai khoan
          table.string('telegramId').nullable(); //luu telegram id - phong khi 1 user co nhieu tai khoan
          table.string('facebookId').nullable(); //luu facebook id - phong khi 1 user co nhieu tai khoan
          table.string('appleId').nullable(); //luu apple id - phong khi 1 user co nhieu tai khoan
          table.string('firebaseToken', 500).nullable();
          table.string('appUserNote', 500).nullable();
          table.string('activeOTPCode');
          table.string('activeOTPAt');
          table.boolean('appUserCategoryId').defaultTo(USER_CATEGORY_ID.NORMAL_USER); // quyền đại lý
          table.boolean('isVirtualUser').defaultTo(USER_CATEGORY.NORMAL_USER);
          table.boolean('isAllowedWithdraw').defaultTo(WITHDRAWAL_REQUEST.ALLOWED);
          table.boolean('isAllowedDeposit').defaultTo(DEPOSIT_REQUEST.ALLOWED);
          table.boolean('isExpert').defaultTo(USER_TYPE.NOMAL);
          table.boolean('isPlayRoundRefund').defaultTo(USER_REFUND_PLAY.WAITING);
          table.integer('staffId'); //F0 là tổng đại lý
          table.integer('supervisorId'); //F0 là user
          optionalFields(table);
          timestamps(table);
          table.index(`${primaryKeyField}`);
          table.unique('username');
          table.unique('email');
          table.unique('phoneNumber');
          table.index('memberLevelName');
          table.index('username');
          table.index('firstName');
          table.index('lastName');
          table.index('referUserId');
          table.index('active');
          table.index('phoneNumber');
          table.index('lastActiveAt');
          table.index('referUser');
          table.index('email');
          table.index('staffId');
          table.index('supervisorId');
          table.index('referCode');
          table.index('ipAddress');
          table.index('firstLoginIp');
          table.index('appUserMembershipId');
        })
        .then(() => {
          Logger.info(`${tableName}`, `${tableName} table created done`);
          seeding().then(result => {
            Logger.info(`${tableName}`, `init ${tableName}` + result);
            resolve();
          });
        });
    });
  });
}

async function initDB() {
  await createTable();
}

async function seeding() {
  return new Promise(async (resolve, reject) => {
    let initialStaff = [
      {
        lastName: 'string',
        firstName: 'string',
        username: 'string',
        email: 'string@string.com',
        password: '9d8e0483d5a71a73d4cf762d3dfdd30d5f441a85a060d3335c0c4979ff3e0530',
        phoneNumber: 'string',
      },
    ];
    DB(`${tableName}`)
      .insert(initialStaff)
      .then(result => {
        Logger.info(`${tableName}`, `seeding ${tableName}` + result);
        resolve();
      });
  });
}

async function insert(data) {
  return await Common.insert(tableName, data);
}

async function updateById(id, data) {
  let filter = {};
  filter[`${primaryKeyField}`] = id;
  return await Common.updateById(tableName, filter, data);
}

async function deleteById(id) {
  let dataId = {};
  dataId[primaryKeyField] = id;
  return await Common.deleteById(tableName, dataId);
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

async function updateAllById(idList, data) {
  return await Common.updateAllById(tableName, primaryKeyField, idList, data);
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
        .orWhere('lastName', 'like', `%${searchText}%`)
        .orWhere('phoneNumber', 'like', `%${searchText}%`)
        .orWhere('firstLoginIp', 'like', `%${searchText}%`)
        .orWhere('ipAddress', 'like', `%${searchText}%`)
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
  let query = _makeQueryBuilderByFilter(filter, skip, limit, startDate, endDate, searchText, order);
  return await query.select();
}
async function customCount(filter, skip, limit, startDate, endDate, searchText, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function customCountFirstDepositAt(filter, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, undefined, undefined, searchText, order);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('firstDepositAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('firstDepositAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

async function customCountFirstWithdrawAt(filter, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, undefined, undefined, searchText, order);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('firstWithdrawAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('firstWithdrawAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function customCountFirstMissionAt(filter, startDate, endDate, searchText, order) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, undefined, undefined, undefined, undefined, searchText, order);
  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('firstMissionAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('firstMissionAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  return new Promise((resolve, reject) => {
    try {
      queryBuilder.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}
async function customCountMemberShip(filter, searchText, startDate, endDate, order) {
  let query = _makeQueryBuilderByFilter(filter, undefined, undefined, startDate, endDate, searchText, order);
  return new Promise((resolve, reject) => {
    try {
      query.where('appUserMembershipId', '>', 0);
      query.count(`${primaryKeyField} as count`).then(records => {
        resolve(records);
      });
    } catch (e) {
      Logger.error('ResourceAccess', `DB COUNT ERROR: ${tableName} : ${JSON.stringify(filter)} - ${JSON.stringify(order)}`);
      Logger.error('ResourceAccess', e);
      reject(undefined);
    }
  });
}

function _makeQueryBuilderForReferedUser(
  appUserId,
  skip,
  limit,
  memberReferIdF1,
  memberReferIdF2,
  memberReferIdF3,
  memberReferIdF4,
  memberReferIdF5,
  memberReferIdF6,
  startDate,
  endDate,
  searchText,
  appUserMembershipId,
  filter = {},
) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, skip, limit);

  if (memberReferIdF1) {
    queryBuilder.where({ memberReferIdF1: memberReferIdF1 });
  } else if (memberReferIdF2) {
    queryBuilder.where({ memberReferIdF2: memberReferIdF2 });
  } else if (memberReferIdF3) {
    queryBuilder.where({ memberReferIdF3: memberReferIdF3 });
  } else if (memberReferIdF4) {
    queryBuilder.where({ memberReferIdF4: memberReferIdF4 });
  } else if (memberReferIdF5) {
    queryBuilder.where({ memberReferIdF5: memberReferIdF5 });
  } else if (memberReferIdF6) {
    queryBuilder.where({ memberReferIdF6: memberReferIdF6 });
  } else if (appUserId) {
    queryBuilder.where(function () {
      this.orWhere('memberReferIdF1', appUserId)
        .orWhere('memberReferIdF2', appUserId)
        .orWhere('memberReferIdF3', appUserId)
        .orWhere('memberReferIdF4', appUserId)
        .orWhere('memberReferIdF5', appUserId)
        .orWhere('memberReferIdF6', appUserId);
    });
  }

  if (searchText) {
    queryBuilder.where(function () {
      this.orWhere('username', 'like', `%${searchText}%`)
        .orWhere('firstName', 'like', `%${searchText}%`)
        .orWhere('lastName', 'like', `%${searchText}%`);
    });
  }

  if (appUserMembershipId) {
    queryBuilder.where({ appUserMembershipId: appUserMembershipId });
  }

  if (startDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '>=', moment(startDate).toDate() * 1);
  }
  if (endDate) {
    const moment = require('moment');
    queryBuilder.where('createdAtTimestamp', '<=', moment(endDate).toDate() * 1);
  }
  return queryBuilder;
}

async function findReferedUserByUserId(memberReferObject, skip, limit, startDate, endDate, searchText, appUserMembershipId, filter) {
  let queryBuilder = _makeQueryBuilderForReferedUser(
    memberReferObject.appUserId,
    skip,
    limit,
    memberReferObject.memberReferIdF1,
    memberReferObject.memberReferIdF2,
    memberReferObject.memberReferIdF3,
    memberReferObject.memberReferIdF4,
    memberReferObject.memberReferIdF5,
    memberReferObject.memberReferIdF6,
    startDate,
    endDate,
    searchText,
    appUserMembershipId,
    filter,
  );
  return await queryBuilder.select();
}

async function countReferedUserByUserId(memberReferObject, startDate, endDate, searchText, appUserMembershipId, filter) {
  let queryBuilder = _makeQueryBuilderForReferedUser(
    memberReferObject.appUserId,
    undefined,
    undefined,
    memberReferObject.memberReferIdF1,
    memberReferObject.memberReferIdF2,
    memberReferObject.memberReferIdF3,
    memberReferObject.memberReferIdF4,
    memberReferObject.memberReferIdF5,
    memberReferObject.memberReferIdF6,
    startDate,
    endDate,
    searchText,
    appUserMembershipId,
    filter,
  );
  return await queryBuilder.count(`${primaryKeyField} as count`);
}

function _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount = 0, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderByFilter(filter, skip, limit, searchText, startDate, endDate);

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

async function customSumByUserMembership(sumField, appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText);
  return await queryBuilder.sum(`${sumField} as sumResult`);
}

async function customSearchByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText);
  return await queryBuilder.select();
}

async function customCountByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText) {
  let queryBuilder = _makeQueryBuilderForByUserMembership(appUserId, membershipLevelCount, filter, skip, limit, startDate, endDate, searchText);
  return await queryBuilder.count(`${primaryKeyField} as count`);
}

module.exports = {
  insert,
  find,
  count,
  deleteById,
  updateById,
  initDB,
  updateAll,
  findById,
  customSearch,
  customCount,
  customCountFirstDepositAt,
  customCountFirstWithdrawAt,
  customCountFirstMissionAt,
  modelName: tableName,
  updateAllById,
  customCountMemberShip,
  findReferedUserByUserId,
  countReferedUserByUserId,
  customCountByUserMembership,
  customSearchByUserMembership,
  customSumByUserMembership,
};
