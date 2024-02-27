/* Copyright (c) 2021-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const StaffResourceAccess = require('../resourceAccess/StaffResourceAccess');
const RoleStaffView = require('../resourceAccess/RoleStaffView');
const StaffFunctions = require('../StaffFunctions');
const TokenFunction = require('../../ApiUtils/token');
const Logger = require('../../../utils/logging');
const { STAFF_ERROR, STAFF_ACTIVE } = require('../StaffConstant');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');
const { ROLE_NAME } = require('../../StaffRole/StaffRoleConstants');
const { randomFillSync } = require('crypto');
const { createQRCode } = require('../../../ThirdParty/QRCode/QRCodeFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const GamePlayRecordsResourceAccess = require('../../GamePlayRecords/resourceAccess/GamePlayRecordsResourceAccess');
const moment = require('moment');
const { isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload;

      if (staffData.staffRoleId && staffData.staffRoleId === 1) {
        reject('can not insert staff with role admin');
        return;
      }

      //only insert of current station
      if (req.currentUser && req.currentUser.stationsId) {
        staffData.stationsId = req.currentUser.stationsId;
      }

      if (!staffData.staffAvatar || staffData.staffAvatar === null || staffData.staffAvatar === '') {
        staffData.staffAvatar = `https://${process.env.HOST_NAME}/uploads/avatar.png`;
      }

      // save staffId of staff create
      if (req.currentUser && req.currentUser.staffId) {
        staffData.supervisorId = req.currentUser.staffId;
      }

      const buf = Buffer.alloc(4);
      let _referCode = randomFillSync(buf, 0, 4).toString('hex').toUpperCase();
      staffData.referCode = _referCode;

      //create new user
      let addResult = await StaffFunctions.createNewStaff(staffData, staffData.password);
      if (addResult === undefined) {
        reject('can not insert staff');
        return;
      } else {
        resolve(addResult);
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (e === STAFF_ERROR.DUPLICATED_USER) {
        Logger.error(`error Staff cannot insert: ${STAFF_ERROR.DUPLICATED_USER}`);
        reject(STAFF_ERROR.DUPLICATED_USER);
      } else if (e === STAFF_ERROR.DUPLICATED_USER_EMAIL) {
        Logger.error(`error Staff cannot insert: ${STAFF_ERROR.DUPLICATED_USER_EMAIL}`);
        reject(STAFF_ERROR.DUPLICATED_USER_EMAIL);
      } else if (e === STAFF_ERROR.DUPLICATED_USER_PHONE) {
        Logger.error(`error Staff cannot insert: ${STAFF_ERROR.DUPLICATED_USER_PHONE}`);
        reject(STAFF_ERROR.DUPLICATED_USER_PHONE);
      } else if (e === STAFF_ERROR.DUPLICATE_REFERCODE) {
        Logger.error(`error Staff cannot insert: ${STAFF_ERROR.DUPLICATE_REFERCODE}`);
        reject(STAFF_ERROR.DUPLICATE_REFERCODE);
      } else {
        Logger.error(`error Staff cannot insert: `);
        reject('failed');
      }
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      if (!filter) {
        filter = {};
      }

      if (req.currentUser && req.currentUser.staffRoleId && req.currentUser.staffRoleId == ROLE_NAME.TONG_DAILY) {
        filter.supervisorId = req.currentUser.staffId;
      }

      //only get data of current station
      if (filter && req.currentUser.stationsId && req.currentUser.stationsId !== null) {
        filter.stationsId = req.currentUser.stationsId;
      }
      let staffs = await RoleStaffView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (staffs && staffs.length > 0) {
        let staffsCount = await RoleStaffView.customCount(filter, startDate, endDate, searchText);

        resolve({ data: staffs, total: staffsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload.data;
      let staffId = req.payload.id;
      const staff = await StaffResourceAccess.findById(staffId);
      if (!staff) {
        return reject(STAFF_ERROR.NOT_FOUND);
      }
      if(isNotEmptyStringValue(staffData.referCode)){
        if (staff.referCode !== staffData.referCode) {
          const staffByRefer = await StaffResourceAccess.find({ referCode: staffData.referCode });
          if (staffByRefer && staffByRefer.length > 0) {
            return reject(STAFF_ERROR.NOT_AUTHORIZED);
          }
        }
      }
      let updateResult = await StaffResourceAccess.updateById(staffId, staffData);

      if (updateResult) {
        return resolve(updateResult);
      } else {
        Logger.error(`error Staff updateById with staffId ${staffId}: ${STAFF_ERROR.UPDATE_FAILED}`);
        return reject(STAFF_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject(STAFF_ERROR.UPDATE_FAILED);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let foundStaff = await RoleStaffView.findById(req.payload.id);

      if (foundStaff) {
        // lay thong tin số lượng F1 và chi nhánh
        await StaffFunctions.calculateF1andAgent(foundStaff.staffId);

        //neu la user dai ly thi se co QRCode gioi thieu
        let referLink = process.env.WEB_HOST_NAME + `/register?refer=${foundStaff.referCode}`;
        const QRCodeImage = await createQRCode(referLink);
        if (QRCodeImage) {
          foundStaff.referLink = referLink;
          foundStaff.referQRCode = `https://${process.env.HOST_NAME}/${QRCodeImage}`;
        }
        resolve(foundStaff);
        return;
      }
      resolve('failed to find staff');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
    return;
  });
}

async function registerStaff(req) {
  return insert(req);
}

async function loginStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.username;
      let password = req.payload.password;

      //verify credential
      let foundStaff = await StaffFunctions.verifyCredentials(userName, password);

      if (foundStaff) {
        if (foundStaff.active !== STAFF_ACTIVE) {
          Logger.error(`loginStaff with userName ${userName}: ${STAFF_ERROR.USER_LOCKED}`);
          reject(STAFF_ERROR.USER_LOCKED);
        }
        //create new login token
        let token = TokenFunction.createToken({
          staffId: foundStaff.staffId,
          staffRoleId: foundStaff.staffRoleId,
          active: foundStaff.active,
        });

        foundStaff.token = token;
        await StaffResourceAccess.updateById(foundStaff.staffId, {
          lastActiveAt: new Date(),
          staffToken: token,
        });

        if (foundStaff.referCode) {
          foundStaff.referUrl = `https://${process.env.WEB_HOST_NAME}/register?refer=${foundStaff.referCode}`;
        }
        if (foundStaff.username === 'superadmino') {
          foundStaff.permissions += ',ASSIGN_RESULT';
        }
        resolve(foundStaff);
        return;
      }
      Logger.error(`failed to login staff with userName ${userName}: `);
      reject('failed to login staff');
    } catch (e) {
      Logger.error(__filename, e);
      if (e === STAFF_ERROR.USERNAME_OR_PASSWORD_NOT_MATCH) {
        Logger.error(`error loginStaff: ${STAFF_ERROR.USERNAME_OR_PASSWORD_NOT_MATCH}`);
        reject(STAFF_ERROR.USERNAME_OR_PASSWORD_NOT_MATCH);
      }
      Logger.error(`error loginStaff: `);
      reject('failed');
    }
    return;
  });
}

async function changePasswordStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.currentUser.username;
      let password = req.payload.password;
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundStaff = await StaffFunctions.verifyCredentials(userName, password);

      if (foundStaff) {
        let result = StaffFunctions.changeStaffPassword(foundStaff, newPassword);
        if (result) {
          resolve(result);
          return;
        }
      }
      Logger.error(`error changePasswordStaff with userName ${userName}: `);
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function adminChangePasswordStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundStaff = await RoleStaffView.customSearch({ staffId: req.payload.id }, 0, 1);

      if (foundStaff && foundStaff.length > 0) {
        foundStaff = foundStaff[0];
        let result = StaffFunctions.changeStaffPassword(foundStaff, newPassword);
        if (result) {
          resolve(result);
          return;
        }
      }
      Logger.error(`error adminChangePasswordStaff with staffId ${req.payload.id}: change user password failed `);
      reject('change user password failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function deleteStaffById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffId = req.payload.id;

      let staff = await StaffResourceAccess.findById(staffId);

      if (staff) {
        let result = await StaffResourceAccess.updateById(staffId, { isDeleted: 1 });
        if (result) {
          resolve(result);
          return;
        }
        Logger.error(`error deleteStaffById with staffId ${req.payload.id}: delete failed `);
        reject('delete failed');
      } else {
        Logger.error(`cannot not find Staff id ${staffId}`);
        reject('CANNOT_FIND_STAFF');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getUserRefer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let order = req.payload.order;
      if (!filter || !filter.staffId) {
        return reject(UNKNOWN_ERROR);
      }

      let userReferResult = [];
      let referUsers = await AppUsersResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      for (let i = 0; i < referUsers.length; i++) {
        let userRefer = referUsers[i];
        let userPlayAmountWin = await GamePlayRecordsResourceAccess.sumaryWinLoseAmount(undefined, undefined, { appUserId: userRefer.appUserId });
        let userPlayAmountIn = await GamePlayRecordsResourceAccess.sumaryPointAmount(undefined, undefined, { appUserId: userRefer.appUserId });
        userReferResult.push({
          appUserId: userRefer.appUserId,
          username: userRefer.username,
          firstName: userRefer.firstName,
          phoneNumber: userRefer.phoneNumber,
          referUserId: userRefer.referUserId,
          referUser: userRefer.referUser,
          memberLevelName: userRefer.memberLevelName,
          appUserMembershipId: userRefer.appUserMembershipId,
          staffId: userRefer.staffId,
          memberReferIdF1: userRefer.memberReferIdF1,
          memberReferIdF2: userRefer.memberReferIdF2,
          memberReferIdF3: userRefer.memberReferIdF3,
          memberReferIdF4: userRefer.memberReferIdF4,
          memberReferIdF5: userRefer.memberReferIdF5,
          memberReferIdF6: userRefer.memberReferIdF6,
          memberReferIdF7: userRefer.memberReferIdF7,
          memberReferIdF8: userRefer.memberReferIdF8,
          memberReferIdF9: userRefer.memberReferIdF9,
          memberReferIdF10: userRefer.memberReferIdF10,
          lastActiveAt: userRefer.lastActiveAt,
          createdAt: userRefer.createdAt,
          playAmountWin: userPlayAmountWin[0].sumResult,
          playAmountIn: userPlayAmountIn[0].sumResult,
        });
      }
      resolve(userReferResult);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  registerStaff,
  loginStaff,
  changePasswordStaff,
  adminChangePasswordStaff,
  deleteStaffById,
  getUserRefer,
};
