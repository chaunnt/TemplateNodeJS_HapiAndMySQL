/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const moment = require('moment');
const Logger = require('../../../utils/logging');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const CustomerScheduleFunctions = require('../../CustomerSchedule/CustomerScheduleFunctions');

async function autoSendPromotionalNotification() {
  Logger.info('START SEND PROMOTIONAL NOTIFICATION');

  await sendPromotionalNotificationToCustomer();

  Logger.info('SEND PROMOTIONAL NOTIFICATION DONE');

  process.exit();
}

async function sendPromotionalNotificationToCustomer() {
  // lấy thời gian hiện tại
  const currentTime = moment().format();

  // Lùi về 30 phút trước
  const startTime = moment().subtract(30, 'minutes').format();

  let skip = 0;
  let limit = 30;
  while (true) {
    // lấy danh sách lịch hẹn từ thời điểm hiện tại về 30 phút trước để gửi thông báo push
    let listCustomerSchedule = await CustomerScheduleResourceAccess.customSearch(
      {
        CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
      },
      skip,
      limit,
      startTime,
      currentTime,
    );

    // Nếu không có lịch hẹn thì dừng
    if (listCustomerSchedule && listCustomerSchedule.length > 0) {
      const promiseNotification = listCustomerSchedule.map(async schedule => {
        // Gửi thông báo push khuyến mãi cho khách hàng đặt lịch thành công
        await CustomerScheduleFunctions.sendPromotionalNotification(schedule.appUserId, schedule.email, schedule.licensePlates);
      });

      await Promise.all(promiseNotification);
    } else {
      break;
    }
    skip += limit;
  }
}

autoSendPromotionalNotification();

module.exports = {
  autoSendPromotionalNotification,
};
