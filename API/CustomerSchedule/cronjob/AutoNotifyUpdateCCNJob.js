/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const SystemAppLogChangeScheduleResourceAccess = require('../../SystemAppLogChangeSchedule/resourceAccess/SystemAppLogChangeScheduleResourceAccess');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');

async function notifyUpdateVehicleInfo() {
  Logger.info('NOTIFY UDPATE VEHICLE INFO');
  const notificationPromise = await _splitToBunchOfPromises();

  for (promiseBunch of notificationPromise) {
    await Promise.all(promiseBunch);
  }

  Logger.info('NOTIFY UDPATE VEHICLE INFO DONE');

  process.exit();
}

async function _splitToBunchOfPromises(limit = 30) {
  const result = [];

  let skip = 0;
  while (true) {
    const scheduleBunch = await CustomerScheduleResourceAccess.customSearch({ CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED }, skip, limit);
    if (scheduleBunch && scheduleBunch.length > 0) {
      const promiseBunch = scheduleBunch.map(schedule => _notifyToUser(schedule));
      result.push(promiseBunch);
    } else {
      break;
    }
    skip += limit;
  }

  return result;
}

async function _notifyToUser(schedule) {
  const changeLogs = await SystemAppLogChangeScheduleResourceAccess.find(
    { dataFieldName: 'CustomerScheduleStatus', dataValueAfter: SCHEDULE_STATUS.CLOSED, customerScheduleId: schedule.customerScheduleId },
    0,
    1,
  );
  const sevenDaysAgo = moment().subtract(7, 'days').format(DATE_DISPLAY_FORMAT);

  if (changeLogs && changeLogs.length > 0) {
    const changeLog = changeLogs[0];

    const closedScheduleTime = moment(changeLog.createdAt).format(DATE_DISPLAY_FORMAT);

    if (sevenDaysAgo === closedScheduleTime) {
      const title = 'Thông báo cập nhật thông tin phương tiện';
      const message = `Thông báo cập nhật GCN để hệ thống đặt lại lịch hẹn mới.`;

      await CustomerMessageFunctions.addMessageCustomer(
        title,
        undefined,
        message,
        schedule.licensePlates,
        schedule.appUserId,
        undefined,
        undefined,
        undefined,
        schedule.customerScheduleId,
      );
    }
  }
}

notifyUpdateVehicleInfo();

module.exports = {
  notifyExpiredVehicle: notifyUpdateVehicleInfo,
};
