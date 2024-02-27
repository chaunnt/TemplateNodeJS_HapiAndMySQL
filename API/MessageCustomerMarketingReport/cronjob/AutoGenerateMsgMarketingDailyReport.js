/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Joi = require('joi');
const moment = require('moment');
const { DATE_DB_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const {
  updateMsgCustomerMarketingStationReportByDay,
  fetchDataMsgCustomerMarketingStationReportByDay,
} = require('../MessageCustomerMarketingReporttFunctions');
const StationResource = require('../../Stations/resourceAccess/StationsResourceAccess');

async function generateReportForAllStations() {
  console.info(`generateReportForAllStations started ${new Date()}`);
  let _stationCounter = 0;

  // Vì cronjob chyaj luc 2 giờ sáng, nên tạo report sẽ ở ngày hôm trước
  const yesterday = moment().subtract(1, 'days').format(DATE_DB_FORMAT);

  while (true) {
    let _stationsList = await StationResource.find({}, _stationCounter, 10);
    _stationCounter += 10;
    if (_stationsList && _stationsList.length > 0) {
      for (let i = 0; i < _stationsList.length; i++) {
        const _station = _stationsList[i];
        let _reportData = await fetchDataMsgCustomerMarketingStationReportByDay(_station.stationsId, yesterday);
        const SKIP_REPORT_IF_EXISTING = false;
        await updateMsgCustomerMarketingStationReportByDay(_station.stationsId, yesterday, _reportData, SKIP_REPORT_IF_EXISTING);
      }
    } else {
      break;
    }
  }
  console.info(`generateReportForAllStations Completed ${new Date()}`);
}

generateReportForAllStations();

module.exports = {
  generateReportForAllStations,
};
