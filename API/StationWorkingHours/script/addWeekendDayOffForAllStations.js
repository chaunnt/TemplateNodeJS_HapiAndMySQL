/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const { executeBatchPromise } = require('../../ApiUtils/utilFunctions');
const { DATE_DATA_FORMAT } = require('../../Common/CommonConstant');
const { DATE_DB_FORMAT, DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { generateDayOff } = require('../../StationWorkSchedule/StationWorkScheduleFunctions');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');

//Saturday
const START_SATURDAY_WORK_DATE = moment().weekday(6);
//Sunday
const START_SUNDAY_WORK_DATE = moment().weekday(7);

let _dayOffListSaturday = [];
let _dayOffListSunday = [];
let MAX_WEEK_COUNT = 26; //6 thang
for (let i = 0; i < MAX_WEEK_COUNT; i++) {
  _dayOffListSaturday.push(START_SATURDAY_WORK_DATE.add(7, 'day').format(DATE_DATA_FORMAT));
  _dayOffListSunday.push(START_SUNDAY_WORK_DATE.add(7, 'day').format(DATE_DATA_FORMAT));
}

const _scheduleTimeSaturday = [
  { time: '7h-9h', isWorking: 1 },
  { time: '9h30-11h30', isWorking: 1 },
  { time: '13h30-15h', isWorking: 0 },
  { time: '15h30-17h30', isWorking: 0 },
];
const _scheduleTimeSunday = [
  { time: '7h-9h', isWorking: 0 },
  { time: '9h30-11h30', isWorking: 0 },
  { time: '13h30-15h', isWorking: 0 },
  { time: '15h30-17h30', isWorking: 0 },
];

async function addWeekendDayOffForAllStations() {
  console.info(`START addWeekendDayOffForAllStations ${new Date()}`);
  let stationsListCount = await StationsResourceAccess.count({});

  if (stationsListCount && stationsListCount > 0) {
    console.info(`stationsListCount has ${stationsListCount} item`);
  } else {
    console.info(`stationsListCount is empty`);
    return;
  }

  if (stationsListCount <= 0) {
    console.info(`stationsListCount has no station`);
    return;
  }

  for (let i = 0; i < stationsListCount; i++) {
    let _station = await StationsResourceAccess.find({}, i, 1);
    if (_station && _station.length > 0) {
      _station = _station[0];
    } else {
      continue;
    }

    let stationsId = _station.stationsId;

    let _promiseTaskList = [];
    for (let i = 0; i < _dayOffListSaturday.length; i++) {
      const dayOff = moment(_dayOffListSaturday[i], DATE_DATA_FORMAT).format(DATE_DISPLAY_FORMAT);

      const _scheduleDayOff = {
        stationsId: _station.stationsId,
        scheduleDayOff: dayOff,
        scheduleTime: JSON.stringify(_scheduleTimeSaturday),
        scheduleDate: moment(dayOff, DATE_DISPLAY_FORMAT).toDate(),
      };
      _promiseTaskList.push(generateDayOff(_scheduleDayOff));
    }
    for (let i = 0; i < _dayOffListSunday.length; i++) {
      const dayOff = moment(_dayOffListSunday[i], DATE_DATA_FORMAT).format(DATE_DISPLAY_FORMAT);

      const _scheduleDayOff = {
        stationsId: _station.stationsId,
        scheduleDayOff: dayOff,
        scheduleTime: JSON.stringify(_scheduleTimeSunday),
        scheduleDate: moment(dayOff, DATE_DISPLAY_FORMAT).toDate(),
      };
      _promiseTaskList.push(generateDayOff(_scheduleDayOff));
    }
    await executeBatchPromise(_promiseTaskList);
  }
  console.info(`FINISH addWeekendDayOffForAllStations ${new Date()}`);
}

addWeekendDayOffForAllStations();

module.exports = {
  addWeekendDayOffForAllStations,
};
