/**
 * Created by A on 7/18/17.
 */
"use strict";
const StaffResourceAccess = require("../resourceAccess/StaffResourceAccess");
const RoleStaffView = require("../resourceAccess/RoleStaffView");
const StaffFunctions = require("../StaffFunctions");
const TokenFunction = require('../../ApiUtils/token');
const Logger = require('../../../utils/logging');
const { STAFF_ERROR } = require('../StaffConstant');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload;
      if(staffData.roleId && staffData.roleId === 1) {
        reject("can not insert staff");
        return;
      }

      //only insert of current station
      if (req.currentUser && req.currentUser.stationsId) {
        staffData.stationsId = req.currentUser.stationsId;
      }

      if (!staffData.staffAvatar || staffData.staffAvatar === null || staffData.staffAvatar === "") {
        staffData.staffAvatar = `https://${process.env.HOST_NAME}/uploads/avatar.png`;
      }
      
      //create new user
      let addResult = await StaffFunctions.createNewStaff(staffData, staffData.password);
      if (addResult === undefined) {
        reject("can not insert staff");
        return;
      } else {
        resolve(addResult);
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      if (e = STAFF_ERROR.DUPLICATED_USER) {
        reject(STAFF_ERROR.DUPLICATED_USER);
      } else if (e = STAFF_ERROR.DUPLICATED_USER_EMAIL) {
        reject(STAFF_ERROR.DUPLICATED_USER_EMAIL);
      } else if (e = STAFF_ERROR.DUPLICATED_USER_PHONE) {
        reject(STAFF_ERROR.DUPLICATED_USER_PHONE);
      } else {
        reject("failed");
      }
    }
  });
};

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let searchText = req.payload.searchText;
      if (!filter) {
        filter = {}
      }

      //only get data of current station
      if (filter && req.currentUser.stationsId && req.currentUser.stationsId !== null) {
        filter.stationsId = req.currentUser.stationsId;
      }


      const RoleStaffStationView = require('../resourceAccess/RoleStaffStationView');
      let staffs = await RoleStaffStationView.customSearch(filter, skip, limit, searchText, order);
      
      if (staffs && staffs.length > 0) {
        let staffsCount = await RoleStaffStationView.customCount(filter, searchText, order);
        resolve({data: staffs, total: staffsCount[0].count});
      }else{
        resolve({data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  });
};

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffData = req.payload.data;
      let staffId = req.payload.id;

      let updateResult = await StaffResourceAccess.updateById(staffId, staffData);

      if (updateResult) {
        resolve("success");
      } else {
        reject("failed to update staff");
      }
      return;
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  });
};

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffs = await RoleStaffView.find({ staffId: req.payload.id });
      if (staffs && staffs.length > 0) {
        let foundStaff = staffs[0];
        if (foundStaff) {
          resolve(foundStaff);
          return;
        }
      }
      resolve("failed to find staff");
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
    return;
  });
};

async function registerStaff(req) {
  return insert(req);
};

async function loginStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userName = req.payload.username;
      let password = req.payload.password;

      //verify credential
      let foundStaff = await StaffFunctions.verifyCredentials(userName, password);

      if (foundStaff) {
        if (!foundStaff.active) {
          reject("failed");
        }

        //create new login token
        let token = TokenFunction.createToken(foundStaff);

        foundStaff.token = token;

        await StaffResourceAccess.updateById(foundStaff.staffId, { lastActiveAt: new Date() });
        resolve(foundStaff);
        return;
      }

      reject("failed to login staff");
    } catch (e) {
      Logger.error(__filename, e);
      if (e === STAFF_ERROR.USERNAME_OR_PASSWORD_NOT_MATCH) {
        reject(STAFF_ERROR.USERNAME_OR_PASSWORD_NOT_MATCH);
      }
      reject("failed");
    }
    return;
  });
};

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
      reject("change user password failed")
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  });
};

async function adminChangePasswordStaff(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let newPassword = req.payload.newPassword;
      //verify credential
      let foundStaff = await RoleStaffView.find({ staffId: req.payload.id }, 0, 1);

      if (foundStaff && foundStaff.length > 0) {
        foundStaff = foundStaff[0];
        let result = StaffFunctions.changeStaffPassword(foundStaff, newPassword);
        if (result) {
          resolve(result);
          return;
        }
      }
      reject("change user password failed")
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
    }
  });
};

async function deleteStaffById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let staffId = req.payload.id;

      let result = StaffResourceAccess.updateById(staffId, { isDeleted: 1 });
      if (result) {
        resolve(result);
        return;
      }
      reject("delete failed")
    } catch (e) {
      Logger.error(__filename, e);
      reject("failed");
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
  deleteStaffById
};
