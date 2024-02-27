/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */
'use strict';
const moment = require('moment');
const Logger = require('../../../utils/logging');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');

async function createNotifyForCustomerHaveUnConfirmSchedule() {
  Logger.info(`AUTO NOTIFY USER UNCONFIRM SCHEDULE START !`);

  await notifyUnconfirmedBookingAfterThreeDays();

  await notifyUnconfirmedInspectionAfterThreeDays();

  Logger.info(`AUTO NOTIFY USER UNCONFIRM SCHEDULE DONE !`);

  process.exit(0);
}

async function notifyUnconfirmedBookingAfterThreeDays() {
  // 3 ngày trước ngày hiện tại
  const scheduleDateThreeDaysAgoStart = moment().subtract(3, 'days').startOf('day').format();
  const scheduleDateThreeDaysAgoEnd = moment().subtract(3, 'days').endOf('day').format();
  const unComfirmScheduleStatus = [SCHEDULE_STATUS.NEW];

  let batchSize = 10;
  let skip = 0;

  // Thông báo tới người dùng có lịch chưa được xác nhận sau 3 ngày đặt
  while (true) {
    const scheduleDateThreeDaysAgoList =
      (await CustomerScheduleResourceAccess.customSearch(
        {
          CustomerScheduleStatus: unComfirmScheduleStatus,
        },
        skip,
        batchSize,
        scheduleDateThreeDaysAgoStart,
        scheduleDateThreeDaysAgoEnd,
      )) || [];

    if (scheduleDateThreeDaysAgoList && scheduleDateThreeDaysAgoList.length > 0) {
      const notificationThreeDaysAgoPromiseList = scheduleDateThreeDaysAgoList.map(async scheduleData => {
        const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
        if (stationData) {
          let title = 'Cảnh Báo Lịch Hẹn Chưa Được Xác Nhận';
          let message = `Kính gửi quý khách hàng, Lịch hẹn của xe ${scheduleData.licensePlates} vào ngày ${scheduleData.dateSchedule} tại ${stationData.stationsName} chưa được xác nhận. Để đảm bảo dịch vụ đăng kiểm suôn sẻ, quý khách vui lòng chọn trung tâm khác, hoặc các trung tâm được ưu tiên để được hỗ trợ tốt nhất. Mọi thông tin chi tiết vui lòng liên hệ Zalo CSKH để được hỗ trợ. Chúng tôi rất mong nhận được sự hỗ trợ và thông cảm từ phía quý khách. Xin chân thành cảm ơn!`;

          return CustomerMessageFunctions.addMessageCustomer(
            title,
            null,
            message,
            scheduleData.licensePlates,
            scheduleData.appUserId,
            scheduleData.customerScheduleId,
          );
        }
      });

      await Promise.all([...notificationThreeDaysAgoPromiseList]);
    } else {
      break;
    }

    skip += batchSize;
  }
}

async function notifyUnconfirmedInspectionAfterThreeDays() {
  // 3 ngày sau ngày hiện tại
  const scheduleDateThreeDaysLater = moment().add(3, 'days').format('DD/MM/YYYY');

  const unComfirmScheduleStatus = [SCHEDULE_STATUS.NEW];

  let batchSize = 10;
  let skip = 0;

  // Thông báo tới người dùng có lịch chưa được xác nhận sau 3 ngày đặt
  while (true) {
    // Thông báo đến người dùng khi có lịch hẹn 3 ngày nữa đăng kiểm mà vẫn chưa được xác nhận
    const scheduleDateNextThreeDaysList =
      (await CustomerScheduleResourceAccess.customSearch(
        {
          dateSchedule: scheduleDateThreeDaysLater,
          CustomerScheduleStatus: unComfirmScheduleStatus,
        },
        skip,
        batchSize,
      )) || [];

    if (scheduleDateNextThreeDaysList && scheduleDateNextThreeDaysList.length > 0) {
      const notificationNextThreeDaysPromiseList = scheduleDateNextThreeDaysList.map(async scheduleData => {
        const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
        if (stationData) {
          let title = 'Cảnh Báo Lịch Hẹn Chưa Được Xác Nhận';
          let message = `Kính gửi quý khách hàng, Lịch hẹn của xe ${scheduleData.licensePlates} vào ngày ${scheduleData.dateSchedule} tại ${stationData.stationsName} chưa được xác nhận. Để đảm bảo dịch vụ đăng kiểm suôn sẻ, quý khách vui lòng chọn trung tâm khác, hoặc các trung tâm được ưu tiên để được hỗ trợ tốt nhất. Mọi thông tin chi tiết vui lòng liên hệ Zalo CSKH để được hỗ trợ. Chúng tôi rất mong nhận được sự hỗ trợ và thông cảm từ phía quý khách. Xin chân thành cảm ơn!`;

          return CustomerMessageFunctions.addMessageCustomer(
            title,
            null,
            message,
            scheduleData.licensePlates,
            scheduleData.appUserId,
            scheduleData.customerScheduleId,
          );
        }
      });

      await Promise.all([...notificationNextThreeDaysPromiseList]);
    } else {
      break;
    }

    skip += batchSize;
  }
}

createNotifyForCustomerHaveUnConfirmSchedule();

module.exports = {
  createNotifyForCustomerHaveUnConfirmSchedule,
};
