/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'user strict';
const moment = require('moment');

const StationReportResourceAccess = require('../resourceAccess/StationReportResourceAccess');
const { UNKNOWN_ERROR, NOT_FOUND, MISSING_AUTHORITY, ERROR_START_DATE_AFTER_END_DATE } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

const { updateStationReportByDay, convertReportDayOfArrayReports } = require('../StationReportFunctions');
const { getDetailDocumentById } = require('../../StationDocument/StationDocumentFunctions');

const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const {
  STATION_REPORT_DISPLAY_DATE_FORMAT,
  REPORT_DATE_DISPLAY_FORMAT,
  REPORT_DATE_DATA_FORMAT,
} = require('../../StationReport/StationReportConstants');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      return resolve('ok');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip || undefined;
      let limit = req.payload.limit || undefined;
      let startDate = req.payload.startDate || undefined;
      let endDate = req.payload.endDate || undefined;
      let stationCode = req.payload.stationCode;
      if (startDate) startDate = moment(startDate, DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT) * 1;
      if (endDate) endDate = moment(endDate, DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT) * 1;

      if (stationCode) {
        let stations = await StationsResourceAccess.customSearch({}, stationCode);
        if (stations && stations.length > 0) {
          let stationIdArr = [];
          stations.forEach(station => {
            let stationId = station.stationsId;
            stationIdArr.push(stationId);
          });
          filter.stationId = stationIdArr;
        }
      }
      const stationReportResourceAccess = await StationReportResourceAccess.customSearch(filter, skip, limit, startDate, endDate);

      if (stationReportResourceAccess && stationReportResourceAccess.length > 0) {
        const documentCount = await StationReportResourceAccess.customCount(filter, startDate, endDate);
        for (let i = 0; i < stationReportResourceAccess.length; i++) {
          await _attachStationInfo(stationReportResourceAccess[i]);
        }
        return resolve({ data: stationReportResourceAccess, total: documentCount });
      } else {
        return resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
async function _attachStationInfo(stationReportData) {
  let station = await StationsResourceAccess.findById(stationReportData.stationId);
  if (station) {
    stationReportData.stationsName = station.stationsName;
    stationReportData.stationCode = station.stationCode;
  }

  // Chuyển format ngày trong db về dạng hiển thị DD/MM/YYYY
  const dbFormats = [REPORT_DATE_DISPLAY_FORMAT, REPORT_DATE_DATA_FORMAT];
  let reportDay = moment(stationReportData.reportDay, dbFormats).format(DATE_DISPLAY_FORMAT);
  stationReportData.reportDay = reportDay;
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const id = req.payload.id;
      const result = await await getDetailDocumentById(id);

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

      const oldRecord = await StationReportResourceAccess.findById(id);

      if (!oldRecord) {
        return reject(NOT_FOUND);
      } else {
        const result = await StationReportResourceAccess.deleteById(id);
        if (result === 1) {
          return resolve('success');
        } else {
          return reject(UNKNOWN_ERROR);
        }
      }
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

      const targetRecord = await StationReportResourceAccess.findById(id);

      if (targetRecord) {
        const result = await StationReportResourceAccess.updateById(id, updateData);
        if (result && result !== 0) {
          return resolve('success');
        } else {
          return reject('failed');
        }
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetTodayReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      const _today = moment().format(REPORT_DATE_DATA_FORMAT) * 1;

      let filter = {
        stationId: stationId,
        reportDay: _today,
      };
      const _todayReport = await StationReportResourceAccess.find(filter, 0, 1);

      const reports = await convertReportDayOfArrayReports(_todayReport);

      if (reports && reports.length > 0) {
        return resolve(reports[0]);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserSubmitTodayReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;
      const reportData = req.payload || {};
      let today = moment().format(REPORT_DATE_DATA_FORMAT) * 1;
      let reportDay = moment(req.payload.reportDay, DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT) * 1 || today;

      //Xóa field reportDay chưa convert YYYYMMDD
      delete reportData.reportDay;

      // Không cho phép tạo report cho ngày trong tương lai
      if (reportDay > today) {
        return reject(MISSING_AUTHORITY);
      }

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      //Thêm appUserId để biết user này đã đọc tài liệu
      const result = await updateStationReportByDay(stationId, moment(reportDay, REPORT_DATE_DATA_FORMAT).format(DATE_DISPLAY_FORMAT), reportData);

      const report = await convertReportDayOfArrayReports([result]);

      if (report) {
        return resolve(report[0]);
      } else {
        return reject(UNKNOWN_ERROR);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserGetStationReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const stationId = req.currentUser.stationsId;
      let startDate = moment(req.payload.startDate, DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT) * 1;
      let endDate = moment(req.payload.endDate, DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT) * 1;
      let limit = 60;

      if (!stationId) {
        return reject(MISSING_AUTHORITY);
      }

      if (startDate > endDate) {
        return reject(ERROR_START_DATE_AFTER_END_DATE);
      }

      let filter = {
        stationId: stationId,
      };

      const _todayReport = await StationReportResourceAccess.customSearch(filter, undefined, limit, startDate, endDate);

      const reports = await convertReportDayOfArrayReports(_todayReport);

      if (reports && reports.length > 0) {
        return resolve({
          data: reports,
          total: reports.length,
        });
      } else {
        return resolve({
          data: [],
          total: {},
        });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  insert,
  find,
  findById,
  deleteById,
  updateById,
  advanceUserSubmitTodayReport,
  advanceUserGetTodayReport,
  advanceUserGetStationReport,
};
