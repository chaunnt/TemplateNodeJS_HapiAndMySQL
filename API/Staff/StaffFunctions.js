/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../utils/logging');
const StaffResourceAccess = require('./resourceAccess/StaffResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const RoleStaffView = require('./resourceAccess/RoleStaffView');
const { STAFF_ERROR } = require('./StaffConstant');
const { encodeReferCode } = require('../AppUsers/AppUsersFunctions');

const crypto = require('crypto');

function hashPassword(password) {
  const hashedPassword = crypto.createHmac('sha256', 'ThisIsStaffSecretKey').update(password).digest('hex');
  return hashedPassword;
}

function unhashPassword(hash) {
  const pass = cryptr.decrypt(hash);
  return pass;
}

async function verifyCredentials(username, password) {
  let hashedPassword = hashPassword(password);
  // Find an entry from the database that
  // matches either the email or username
  let verifyResult = await RoleStaffView.find({
    username: username,
    password: hashedPassword,
  });

  if (verifyResult && verifyResult.length > 0) {
    return verifyResult[0];
  } else {
    Logger.error('StaffFunctions', 'Staff password do not match');
    return undefined;
  }
}

async function changeStaffPassword(staffData, newPassword) {
  let newHashPassword = hashPassword(newPassword);

  let result = await StaffResourceAccess.updateById(staffData.staffId, {
    password: newHashPassword,
  });

  if (result) {
    return result;
  } else {
    return undefined;
  }
}

async function createNewStaff(staffData, newPassword) {
  //check existed username
  let _existedUsers = await StaffResourceAccess.find({
    username: staffData.username,
  });
  if (_existedUsers && _existedUsers.length > 0) {
    throw STAFF_ERROR.DUPLICATED_USER;
  }

  //check existed email
  if (staffData.email) {
    _existedUsers = await StaffResourceAccess.find({ email: staffData.email });
    if (_existedUsers && _existedUsers.length > 0) {
      throw STAFF_ERROR.DUPLICATED_USER_EMAIL;
    }
  }

  //check existed phoneNumber
  if (staffData.phoneNumber) {
    _existedUsers = await StaffResourceAccess.find({
      phoneNumber: staffData.phoneNumber,
    });
    if (_existedUsers && _existedUsers.length > 0) {
      throw STAFF_ERROR.DUPLICATED_USER_PHONE;
    }
  }

  //check existed referCode
  if (staffData.referCode) {
    _existedUsers = await StaffResourceAccess.find({
      referCode: staffData.referCode,
    });
    if (_existedUsers && _existedUsers.length > 0) {
      throw STAFF_ERROR.DUPLICATE_REFERCODE;
    }
    _existedUsers = await AppUsersResourceAccess.find({
      referCode: staffData.referCode,
    });
    if (_existedUsers && _existedUsers.length > 0) {
      throw STAFF_ERROR.DUPLICATE_REFERCODE;
    }
  }

  let newHashPassword = hashPassword(newPassword);

  //hash password
  staffData.password = newHashPassword;

  //create new user
  let result = await StaffResourceAccess.insert(staffData);

  if (result) {
    let newStaffId = result[0];
    if (!staffData.referCode) {
      let referCode = 'S' + encodeReferCode(newStaffId); // thêm S để phân biệt referCode của user và staff
      await StaffResourceAccess.updateById(newStaffId, {
        referCode: referCode,
      });
    }

    return result;
  } else {
    return undefined;
  }
}

async function calculateF1andAgent(staffId) {
  let staffData = {};
  staffData.totalF1Count = 0; //tổng F1
  staffData.totalBranchCount = 0; //tổng chi nhánh
  staffData.totalAgentF1Count = 0; //tổng đại lý F1
  const totalF1 = await AppUsersResourceAccess.customCount({ staffId: staffId, referUserId: null });
  const userF1s = await AppUsersResourceAccess.find({ staffId: staffId, referUserId: null });
  const totalBranch = await AppUsersResourceAccess.customCount({ staffId: staffId });
  if (totalF1 && totalF1.length > 0 && totalF1[0].count) {
    staffData.totalF1Count = totalF1[0].count;
  }
  if (totalBranch && totalBranch.length > 0 && totalBranch[0].count) {
    staffData.totalBranchCount = totalBranch[0].count;
  }
  if (userF1s && userF1s.length > 0) {
    for (let index = 0; index < userF1s.length; index++) {
      const userF1 = userF1s[index];
      const userReferF1 = await AppUsersResourceAccess.countReferedUserByUserId({ appUserId: userF1.appUserId });
      if (userReferF1 && userReferF1.length > 0 && userReferF1[0].count > 0) {
        staffData.totalAgentF1Count += 1; //F1 có giới thiệu cho người chơi khác => đại lý
      }
    }
  }
  return staffData;
}

module.exports = {
  verifyCredentials,
  changeStaffPassword,
  unhashPassword,
  hashPassword,
  createNewStaff,
  calculateF1andAgent,
};
