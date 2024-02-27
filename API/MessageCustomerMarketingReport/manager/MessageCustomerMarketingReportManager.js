/* Copyright (c) 2023 TORITECH LIMITED 2022 */

'user strict';
const moment = require('moment');

const MsgMarketingReportResourceAccess = require('../resourceAccess/MsgMarketingReportResourceAccess');
const { UNKNOWN_ERROR, MISSING_AUTHORITY, NOT_FOUND, ERROR_START_DATE_AFTER_END_DATE } = require('../../Common/CommonConstant');
const Logger = require('../../../utils/logging');

const { convertReportDayOfArrayReports } = require('../MessageCustomerMarketingReporttFunctions');

const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { REPORT_DATE_DATA_FORMAT } = require('../../StationReport/StationReportConstants');

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
      const _todayReport = await MsgMarketingReportResourceAccess.find(filter, 0, 1);

      const reports = await convertReportDayOfArrayReports(_todayReport);

      if (reports && reports.length > 0) {
        return resolve(reports[0]);
      } else {
        return reject(NOT_FOUND);
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

      const _todayReport = await MsgMarketingReportResourceAccess.customSearch(filter, 0, limit, startDate, endDate);

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
  advanceUserGetTodayReport,
  advanceUserGetStationReport,
};
