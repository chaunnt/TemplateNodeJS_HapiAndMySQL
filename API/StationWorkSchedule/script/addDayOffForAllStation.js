/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationsWorkScheduleResourceAccess = require('../../StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess');
const StationsWorkScheduleFunctions = require('../StationWorkScheduleFunctions');
const SystemHolidayCalendarFunctions = require('../../SystemHolidayCalendar/SystemHolidayCalendarFunctions');
const { DATE_DB_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { WORKING_STATUS } = require('../StationWorkScheduleConstants');
const { STATION_STATUS } = require('../../Stations/StationsConstants');

async function autoCreateDayOffForStation() {
  Logger.info('CREATING DAY OFF SCHEDULE FOR STATION');

  const dayOffList = _getDayOffList();

  for (dayOff of dayOffList) {
    const promiseList = await _splitToBunchOfPromises(dayOff, 50);
    _executePromise(promiseList);
  }
  Logger.info('COMPLETED CREATING DAY OFF SCHEDULE FOR STATION');
}

async function _executePromise(promiseList) {
  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
}

async function _getDayOffList() {
  const result = await SystemHolidayCalendarFunctions.getListSystemHolidayCalendar();
  return result;
}

async function _splitToBunchOfPromises(sunday, limit = 10) {
  const result = [];

  let skip = 0;
  while (true) {
    const stationList = await StationResourceAccess.find({}, skip, limit);
    if (stationList && stationList.length > 0) {
      const promiseBunch = stationList.map(station => _createDayOffSchedule(station, sunday));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _createDayOffSchedule(station, dayOff) {
  const stationConfigs = JSON.parse(station.stationBookingConfig);
  if (!stationConfigs) return;

  const scheduleTime = stationConfigs.map(configTime => ({ time: configTime.time, isWorking: WORKING_STATUS.NOT_ACTIVE }));

  const dayOffData = {
    stationsId: station.stationsId,
    scheduleDayOff: dayOff,
    scheduleTime: JSON.stringify(scheduleTime),
    scheduleDate: moment(dayOff, DATE_DB_FORMAT).toDate(),
  };

  await StationsWorkScheduleFunctions.addDayOffSchedule(dayOffData);
}
// autoCreateDayOffForStation();

module.exports = {
  autoCreateDayOffForStation,
};
