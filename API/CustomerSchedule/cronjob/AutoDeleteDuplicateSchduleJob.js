/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const Logger = require('../../../utils/logging');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const { cancelScheduleList } = require('../CustomerScheduleFunctions');

async function autoDeleteDuplicateSchedule() {
  Logger.info('AUTO DELETE DUPLICATE SCHEDULE !');

  await _checkingDuplicateSchedule();

  Logger.info('AUTO DELETE DUPLICATE SCHEDULE !');
}

async function _checkingDuplicateSchedule() {
  try {
    const schedules = await CustomerScheduleResourceAccess.findAllVehicleHasManyNewSchedule();
    if (schedules && schedules.length > 0) {
      for (let schedule of schedules) {
        const scheduleList = await CustomerScheduleResourceAccess.find({ licensePlates: schedule.licensePlates });
        if (scheduleList && scheduleList.length >= 2) {
          // giu lai mot lich hen
          scheduleList.pop();

          await cancelScheduleList(scheduleList, 'bạn có quá nhiều lịch hẹn đồng thời');
        }
      }
    }
  } catch (e) {
    console.error(`_checkingDuplicateSchedule`);
    console.error(e);
  }
}

autoDeleteDuplicateSchedule();

module.exports = {
  autoDeleteDuplicateSchedule,
};
