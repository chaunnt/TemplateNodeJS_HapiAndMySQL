/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const MessageCustomerMarketingResourceAccess = require('../../CustomerMessage/resourceAccess/MessageCustomerMarketingResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');
const StationMessageDailyReportResourceAccess = require('../resourceAccess/StationMessageDailyReportResourceAccess');
const { countStationMessageReport, countMessageReportByStation } = require('../StationMessageReportFunctions');
const Logger = require('../../../utils/logging');
const { UNKNOWN_ERROR } = require('../../Common/CommonConstant');

async function advanceUserGetReportList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let month = req.payload.month;
      let year = req.payload.year;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let stationId = req.payload.stationId;
      month = month * 1 + 1;
      let startDate = moment().month(month).year(year).startOf('month').format();
      let endDate = moment().month(month).year(year).endOf('month').format();
      let result = {};
      let resultSearch = await StationMessageDailyReportResourceAccess.customSearch({ stationId: stationId }, skip, limit, startDate, endDate, order);
      let count = await StationMessageDailyReportResourceAccess.customCount({ stationId: stationId }, startDate, endDate);
      result.data = resultSearch;
      result.total = count;
      if (resultSearch && resultSearch.length > 0) {
        resolve(result);
      } else {
        resolve('Failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getReportList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let month = req.payload.month;
      let year = req.payload.year;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      month = month * 1 + 1;

      let startDate = moment().month(month).year(year).startOf('month').format();
      let endDate = moment().month(month).year(year).endOf('month').format();
      let result = {};
      let resultSearch = await StationMessageDailyReportResourceAccess.customSearch({}, skip, limit, startDate, endDate, order);
      if (resultSearch && resultSearch.length > 0) {
        let count = await StationMessageDailyReportResourceAccess.customCount({}, startDate, endDate);
        result.data = resultSearch;
        result.total = count;
        resolve(result);
      } else {
        resolve('Failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  advanceUserGetReportList,
  getReportList,
};
