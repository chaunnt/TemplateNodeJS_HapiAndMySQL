/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

const MessageCustomerMarketingResourceAccess = require('../../CustomerMessage/resourceAccess/MessageCustomerMarketingResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');
const StationMessageDailyReportResourceAccess = require('../resourceAccess/StationMessageDailyReportResourceAccess');
const { countStationMessageReport } = require('../StationMessageReportFunctions');

async function updateStationMessageReport() {
  await _updateStationMessageReport();
  console.info('updateStationMessageReport DONE');
  process.exit();
}

async function _updateStationMessageReport() {
  return new Promise(async (resolve, reject) => {
    try {
      console.info(`updateStationMessageReport started ${new Date().getMonth() + 1}`);
      let startDate = (startDate = moment().startOf('month').format());
      let endDate = moment().endOf('day').format();
      let resultReport = await countStationMessageReport(startDate, endDate);
      if (resultReport && resultReport.length > 0) {
        resolve(resultReport);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
updateStationMessageReport();
module.exports = {
  updateStationMessageReport,
};
