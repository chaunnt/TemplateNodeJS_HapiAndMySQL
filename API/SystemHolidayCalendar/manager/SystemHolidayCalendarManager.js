/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'user strict';
const SystemHolidayCalendarResourceAccess = require('../resourceAccess/SystemHolidayCalendarResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND, POPULAR_ERROR } = require('../../Common/CommonConstant');
const { SYSTEM_HOLIDAY_ERRORS } = require('../SystemHolidayCalendarConstants');
const Logger = require('../../../utils/logging');
const moment = require('moment');
const { DATE_DB_SORT_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

async function _checkExistedSystemHoliday(date) {
  const existedDay = await SystemHolidayCalendarResourceAccess.find(
    {
      scheduleDayOff: date,
    },
    0,
    1,
  );

  if (existedDay && existedDay.length > 0) {
    throw SYSTEM_HOLIDAY_ERRORS.EXISTED_DATE_ERROR;
  }
}

async function _checkIfDateIsInPast(date) {
  const isPastDate = moment(date, DATE_DB_SORT_FORMAT, true).isBefore(moment(), 'day');
  if (isPastDate) {
    throw SYSTEM_HOLIDAY_ERRORS.INVALID_PAST_DATE_ERROR;
  }
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const data = req.payload;

      // Kiểm tra ngày nghỉ ở quá khứ
      await _checkIfDateIsInPast(data.scheduleDayOff);

      // Kiểm tra ngày nghỉ hệ thống đã tạo trước đó chưa
      await _checkExistedSystemHoliday(data.scheduleDayOff);

      const result = await SystemHolidayCalendarResourceAccess.insert(data);
      if (result) {
        return resolve(result);
      } else {
        return reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SYSTEM_HOLIDAY_ERRORS).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let { startDate, endDate } = req.payload;

      const systemHolidayCalendar = await SystemHolidayCalendarResourceAccess.customSearch({}, startDate, endDate);

      let result = { data: [], total: 0 };

      if (systemHolidayCalendar && systemHolidayCalendar.length > 0) {
        result = { data: systemHolidayCalendar, total: systemHolidayCalendar.length };
      }

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await SystemHolidayCalendarResourceAccess.findById(id);

      if (result) {
        return resolve(result);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;

      const oldRecord = await SystemHolidayCalendarResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      }

      const result = await SystemHolidayCalendarResourceAccess.deleteById(id);
      if (!result || result === 0) {
        return reject(POPULAR_ERROR.DELETE_FAILED);
      }

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const updateData = req.payload.data;

      const targetRecord = await SystemHolidayCalendarResourceAccess.findById(id);
      if (!targetRecord) {
        return reject(NOT_FOUND);
      }

      // Kiểm tra ngày nghỉ ở quá khứ
      await _checkIfDateIsInPast(updateData.scheduleDayOff);

      // Kiểm tra ngày nghỉ hệ thống đã tạo trước đó chưa
      await _checkExistedSystemHoliday(updateData.scheduleDayOff);

      const result = await SystemHolidayCalendarResourceAccess.updateById(id, updateData);
      if (!result && result === 0) {
        return reject(POPULAR_ERROR.UPDATE_FAILED);
      }

      return resolve(result);
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(SYSTEM_HOLIDAY_ERRORS).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  deleteById,
  updateById,
};
