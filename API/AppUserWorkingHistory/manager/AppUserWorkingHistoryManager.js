/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const moment = require('moment');
const Logger = require('../../../utils/logging');
const RoleUserView = require('../../AppUsers/resourceAccess/RoleUserView');
const AppUserWorkingHistoryAccess = require('../resourceAccess/AppUserWorkingHistoryAccess');
const AppUserWorkingRecordAccess = require('../resourceAccess/AppUserWorkingRecordAccess');
const { REPORT_DATE_DATA_FORMAT } = require('../../StationReport/StationReportConstants');
const { UNKNOWN_ERROR, API_FAILED, MISSING_AUTHORITY, NOT_FOUND } = require('../../Common/CommonConstant');
const { attachWorkingRecord, getListUserOfStation, attachInfoCreatorWorkingHistory } = require('../AppUserWorkingHistoryFunctions');
const { NORMAL_USER_ROLE } = require('../../AppUserRole/AppUserRoleConstant');

function advanceCreateAppUserWorkingHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;
      const creatorId = req.currentUser.appUserId;
      let createdDate = moment().format(REPORT_DATE_DATA_FORMAT) * 1;

      const stationUsers = await getListUserOfStation({
        stationsId: stationId,
        appUserRoleId: NORMAL_USER_ROLE,
        isHidden: 0,
      });

      if (stationUsers.length > 0) {
        // Tạo phiếu phân công
        const workingHistory = await AppUserWorkingHistoryAccess.insert({
          createdDate: createdDate,
          createdBy: creatorId,
          stationsId: stationId,
        });

        if (workingHistory) {
          // Thêm thông tin của phiếu phân công (phân công của từng nhân viên)
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

          resolve(workingHistory);
        }
      }

      reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

function advanceUserGetListWorkingHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate || undefined;
      let endDate = req.payload.endDate || undefined;

      const stationId = req.currentUser.stationsId;

      // Chỉ lấy các phiếu phân công của trạm đang đăng nhập
      filter.stationsId = stationId;

      let workingHistories = await AppUserWorkingHistoryAccess.customSearch(filter, skip, limit, startDate, endDate, undefined, order);

      if (workingHistories.length > 0) {
        // Đính kèm thông tin người tạo phiếu mượn
        workingHistories = await attachInfoCreatorWorkingHistory(workingHistories);

        const countWorkingHistory = await AppUserWorkingHistoryAccess.customCount(filter, startDate, endDate);

        return resolve({ data: workingHistories, total: countWorkingHistory });
      }

      return resolve({ data: [], total: 0 });
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

function advanceUserGetDetailWorkingHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let workingHistoryId = req.payload.id;
      const stationId = req.currentUser.stationsId;

      let workingHistory = await AppUserWorkingHistoryAccess.findById(workingHistoryId);

      if (!workingHistory) {
        return reject(NOT_FOUND);
      }

      // Không cho phép lấy phiếu phân công của trạm khác
      if (stationId !== workingHistory.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      if (workingHistory) {
        // Đính kèm thông tin người tạo phiếu mượn
        workingHistory = await attachInfoCreatorWorkingHistory([workingHistory]);

        // Đính kèm thông tin chi tiết - các record của phiếu phân công
        workingHistory = await attachWorkingRecord(workingHistory);

        return resolve(workingHistory[0]);
      }

      return reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

function advanceUserApprovedWorkingHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let workingHistoryId = req.payload.id;
      const stationId = req.currentUser.stationsId;
      const approvedById = req.currentUser.appUserId;
      let approvedAt = moment().format(REPORT_DATE_DATA_FORMAT) * 1;

      let workingHistory = await AppUserWorkingHistoryAccess.findById(workingHistoryId);

      if (!workingHistory) {
        return reject(NOT_FOUND);
      }

      // Không cho phép duyệt phiếu phân công của trạm khác
      if (stationId !== workingHistory.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      if (workingHistory) {
        let result = await AppUserWorkingHistoryAccess.updateById(workingHistoryId, {
          approvedAt: approvedAt,
          approvedBy: approvedById,
        });

        if (result) {
          return resolve(result);
        }
      }

      return reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

function advanceUserCancelWorkingHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let workingHistoryId = req.payload.id;
      const stationId = req.currentUser.stationsId;
      const canceledById = req.currentUser.appUserId;
      let canceledAt = moment().format(REPORT_DATE_DATA_FORMAT) * 1;

      let workingHistory = await AppUserWorkingHistoryAccess.findById(workingHistoryId);

      if (!workingHistory) {
        return reject(NOT_FOUND);
      }

      // Không cho phép duyệt phiếu phân công của trạm khác
      if (stationId !== workingHistory.stationsId) {
        return reject(MISSING_AUTHORITY);
      }

      if (workingHistory) {
        let result = await AppUserWorkingHistoryAccess.updateById(workingHistoryId, {
          canceledAt: canceledAt,
          canceledBy: canceledById,
        });

        if (result) {
          return resolve(result);
        }
      }

      return reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  advanceCreateAppUserWorkingHistory,
  advanceUserGetListWorkingHistory,
  advanceUserGetDetailWorkingHistory,
  advanceUserApprovedWorkingHistory,
  advanceUserCancelWorkingHistory,
};
