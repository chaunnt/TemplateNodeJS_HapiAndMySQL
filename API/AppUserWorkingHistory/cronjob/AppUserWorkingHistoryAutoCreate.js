/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const AppUserWorkingHistoryAccess = require('../resourceAccess/AppUserWorkingHistoryAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { REPORT_DATE_DATA_FORMAT } = require('../../StationReport/StationReportConstants');
const { createNewWorkingHistory } = require('../AppUserWorkingHistoryFunctions');

async function autoCreateWorkingHistory() {
  Logger.info('AUTO CREATE WORKING HISTORY');

  let skip = 0;
  while (true) {
    const stations = await StationsResourceAccess.find({}, skip, 10);
    if (stations && stations.length > 0) {
      const createWorkingHistory = stations.map(station => _autoCreateNewWorkingHistory(station.stationsId));
      await Promise.all(createWorkingHistory);
    } else {
      break;
    }
    skip += 10;
  }
}

async function _autoCreateNewWorkingHistory(stationsId) {
  let createdDate = moment().format(REPORT_DATE_DATA_FORMAT) * 1;

  // Kiểm tra ngày hôm nay trạm đã tạo phiếu phân công nào chưa
  const existedWokingHistory = await AppUserWorkingHistoryAccess.find({
    createdDate: createdDate,
    stationsId: stationsId,
  });

  // Ngày hôm nay trạm chưa tạo phiếu phân công nào
  if (!existedWokingHistory || existedWokingHistory.length === 0) {
    await createNewWorkingHistory(stationsId, createdDate, null);
  }
}

module.exports = {
  autoCreateWorkingHistory,
};
