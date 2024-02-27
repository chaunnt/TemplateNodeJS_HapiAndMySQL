/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const StationsWorkScheduleResourceAccess = require('../../StationWorkSchedule/resourceAccess/StationsWorkScheduleResourceAccess');
const StationsWorkScheduleFunctions = require('../StationWorkScheduleFunctions');
const { DATE_DB_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { WORKING_STATUS } = require('../StationWorkScheduleConstants');
const { STATION_STATUS } = require('../../Stations/StationsConstants');

async function autoCreateDayOffForStation() {
  Logger.info('CREATING DAY OFF SCHEDULE FOR STATION');

  // 1 month have 4 sundays -> 1 year have 52 sundays
  const sundayList = _getSundayList(52);

  for (sunday of sundayList) {
    const promiseList = await _splitToBunchOfPromises(sunday, 50);
    _executePromise(promiseList);
  }
}

async function _executePromise(promiseList) {
  for (promiseBunch of promiseList) {
    await Promise.all(promiseBunch);
  }
}

function _findClosestSunDay() {
  const SUNDAY_NUMBER = 0;

  let additionDay = 0;
  while (true) {
    const dayOfWeek = moment().add(additionDay, 'days');
    if (dayOfWeek.weekday() === SUNDAY_NUMBER) {
      return dayOfWeek.format(DATE_DB_FORMAT);
    }
    additionDay++;
  }
}

function _getSundayList(count = 40) {
  const sunday = _findClosestSunDay();
  const result = [sunday];
  count--;
  while (count--) {
    const nextSunDay = moment(result[result.length - 1], DATE_DB_FORMAT)
      .add(7, 'days')
      .format(DATE_DB_FORMAT);
    result.push(nextSunDay);
  }
  return result;
}

async function _splitToBunchOfPromises(sunday, limit = 10) {
  const result = [];

  let skip = 0;
  while (true) {
    const stationList = await StationResourceAccess.find({ stationStatus: STATION_STATUS.ACTIVE }, skip, limit);
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

async function _createDayOffSchedule(station, sunday) {
  const stationConfigs = JSON.parse(station.stationBookingConfig);
  if (!stationConfigs) return;

  // sunday
  const sundayScheduleTime = stationConfigs.map(configTime => ({ time: configTime.time, isWorking: WORKING_STATUS.NOT_ACTIVE }));

  const sundayDayOff = {
    stationsId: station.stationsId,
    scheduleDayOff: sunday,
    scheduleTime: JSON.stringify(sundayScheduleTime),
    scheduleDate: moment(sunday, DATE_DB_FORMAT).toDate(),
  };

  // saturdays
  const saturday = moment(sunday, DATE_DB_FORMAT).subtract(1, 'day').format(DATE_DB_FORMAT);
  const saturdayScheduleTime = stationConfigs.map(configTime => {
    if (configTime.time === '15h30-17h30' || configTime.time === '13h30-15h') {
      return { time: configTime.time, isWorking: WORKING_STATUS.NOT_ACTIVE };
    } else {
      return { time: configTime.time, isWorking: WORKING_STATUS.ACTIVE };
    }
  });

  const saturdayDayOff = {
    stationsId: station.stationsId,
    scheduleDayOff: saturday,
    scheduleTime: JSON.stringify(saturdayScheduleTime),
    scheduleDate: moment(saturday, DATE_DB_FORMAT).toDate(),
  };

  await Promise.all([StationsWorkScheduleFunctions.generateDayOff(sundayDayOff), StationsWorkScheduleFunctions.generateDayOff(saturdayDayOff)]);
}

module.exports = {
  autoCreateDayOffForStation,
};
