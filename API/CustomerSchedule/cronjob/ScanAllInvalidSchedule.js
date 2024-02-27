/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');

async function scanAllScheduleByStation(station) {
  console.info(`scanAllScheduleByStation ${station.stationCode}`);
  let _successSchedule = [SCHEDULE_STATUS.NEW, SCHEDULE_STATUS.CONFIRMED];
  for (let i = 0; i < 5; i++) {
    let _dateSchedule = moment()
      .add(station.limitSchedule + 1 + i, 'day')
      .format(DATE_DISPLAY_FORMAT);
    let _countSchedule = await CustomerScheduleResourceAccess.customCount({
      CustomerScheduleStatus: _successSchedule,
      dateSchedule: _dateSchedule,
      stationsId: station.stationsId,
    });
    if (_countSchedule > 0) {
      console.info(`station ${station.stationCode} _dateSchedule ${_dateSchedule} : ${_countSchedule}`);
    }
  }
}

async function scanAllInvalidSchedule() {
  let _stationsList = await StationsResourceAccess.customSearch({});
  for (let i = 0; i < _stationsList.length; i++) {
    await scanAllScheduleByStation(_stationsList[i]);
  }
}

scanAllInvalidSchedule();
