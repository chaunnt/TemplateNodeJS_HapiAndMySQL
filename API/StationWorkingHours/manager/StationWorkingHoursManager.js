/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'use strict';
const StationWorkingHoursAccess = require('../resourceAccess/StationWorkingHoursAccess');
const { NOT_FOUND, MISSING_AUTHORITY, API_FAILED } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');
const { getDetailWorkingHoursByStationId } = require('../StationWorkingHoursFunction');

async function findByStationId(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const currentStation = req.currentUser.stationsId;

      const stationWorkingHours = await getDetailWorkingHoursByStationId(currentStation);

      return resolve(stationWorkingHours);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationWorkingHoursId = req.payload.id;
      let updateData = req.payload.data;

      const currentStation = req.currentUser.stationsId;

      // Kiểm tra có working hours không
      const previousRecord = await StationWorkingHoursAccess.findById(stationWorkingHoursId);

      if (!previousRecord) {
        return reject(NOT_FOUND);
      }

      //Người cập nhật không phải là chủ nhân của lịch làm việc này thì không cho phép update
      if (!currentStation || currentStation !== previousRecord.stationId) {
        return reject(MISSING_AUTHORITY);
      }

      let result = await StationWorkingHoursAccess.updateById(stationWorkingHoursId, updateData);

      if (result) {
        return resolve(result);
      }

      return reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  updateById,
  findByStationId,
};
