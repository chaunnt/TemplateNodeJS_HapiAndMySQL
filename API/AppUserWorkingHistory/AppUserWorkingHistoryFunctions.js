/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const RoleUserView = require('../AppUsers/resourceAccess/RoleUserView');
const AppUserWorkingHistoryAccess = require('./resourceAccess/AppUserWorkingHistoryAccess');
const AppUserWorkingRecordAccess = require('./resourceAccess/AppUserWorkingRecordAccess');
const AppUserRoleResourceAccess = require('../AppUserRole/resourceAccess/AppUserRoleResourceAccess');
const AppUsersResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');

// Đính kèm các record của phiếu phân công
async function attachWorkingRecord(workingHistories) {
  const promiseList = workingHistories.map(async workingHistory => {
    const workingHistoryRecords = await AppUserWorkingRecordAccess.find({
      appUserWorkingHistoryId: workingHistory.appUserWorkingHistoryId,
    });

    workingHistory.workingRecords = workingHistoryRecords;

    return workingHistory;
  });

  return await Promise.all(promiseList);
}

async function attachInfoCreatorWorkingHistory(workingHistories) {
  const promiseList = workingHistories.map(async workingHistory => {
    if (workingHistory.createdBy) {
      const creator = await AppUsersResourceAccess.findById(workingHistory.createdBy);

      workingHistory.username = creator.username;
      workingHistory.firstName = creator.firstName;
      workingHistory.lastName = creator.lastName;
    } else {
      // trường hợp phiếu phân công do cronjob hệ thống tạo
      workingHistory.username = null;
      workingHistory.firstName = null;
      workingHistory.lastName = null;
    }

    return workingHistory;
  });

  return await Promise.all(promiseList);
}

async function getListUserOfStation(filter) {
  // Sắp xếp theo ngày tạo để đông bộ với danh sách lúc tạo lịch phân công
  const order = {
    key: 'createdAt',
    value: 'desc',
  };

  if (!filter.appUserRoleId) {
    const MAX_COUNT = 20;
    const appUserRoles = await AppUserRoleResourceAccess.find({}, 0, MAX_COUNT);
    if (appUserRoles && appUserRoles.length > 0) {
      const roleIdList = appUserRoles.map(role => role.appUserRoleId);
      filter.appUserRoleId = roleIdList;
    }
  }
  return RoleUserView.customSearch(filter, undefined, undefined, undefined, order);
}

// Tạo phiếu phân công mới
async function createNewWorkingHistory(stationsId, createdDate, createdBy) {
  // Kiểm tra xem trạm có nhân viên nào để phân công không
  const stationUsers = await getListUserOfStation({ stationsId: stationsId });

  if (stationUsers.length > 0) {
    // Tạo phiếu phân công
    const workingHistory = await AppUserWorkingHistoryAccess.insert({
      createdDate: createdDate,
      createdBy: createdBy,
      stationsId: stationsId,
    });

    if (workingHistory) {
      // Tạo record thông tin của phiếu phân công (phân công của từng nhân viên)
      const workingHistoryRecords = stationUsers.map(user => {
        return {
          appUserWorkingHistoryId: workingHistory[0],
          appUserId: user.appUserId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          stationsId: user.stationsId,
          active: user.active,
          appUserRoleName: user.appUserRoleName,
          employeeCode: user.employeeCode,
          appUserPosition: user.appUserPosition,
          appUserWorkStep: user.appUserWorkStep,
        };
      });

      await AppUserWorkingRecordAccess.insert(workingHistoryRecords);
    }
  }
}

module.exports = {
  attachWorkingRecord,
  createNewWorkingHistory,
  getListUserOfStation,
  attachInfoCreatorWorkingHistory,
};
