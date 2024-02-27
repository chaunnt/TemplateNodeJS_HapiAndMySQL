/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */
'use strict';
const moment = require('moment');
const Logger = require('../../../utils/logging');
const CustomerScheduleResourceAccess = require('../resourceAccess/CustomerScheduleResourceAccess');
const CustomerMessageFunctions = require('../../CustomerMessage/CustomerMessageFunctions');
const { SCHEDULE_STATUS } = require('../CustomerScheduleConstants');
const AppUserVehicleResourceAccess = require('../../AppUserVehicle/resourceAccess/AppUserVehicleResourceAccess');
const UtilFunctions = require('../../ApiUtils/utilFunctions');
const AppUserVehicleFunctions = require('../../AppUserVehicle/AppUserVehicleFunctions');
const { CRIMINAL } = require('../../AppUserVehicle/AppUserVehicleConstant');
const { DATE_DB_FORMAT } = require('../../Common/CommonConstant');
const { MESSAGE_TYPE } = require('../../MessageCustomerMarketing/MessageCustomerMarketingConstant');
const MessageCustomerResourceAccess = require('../../CustomerMessage/resourceAccess/MessageCustomerResourceAccess');

async function createNotifyForCustomerHaveCriminalSchedule() {
  Logger.info(`AUTO CHECK CRIME FOR VEHICLE OF SCHEDULE START !`);

  await notifyCriminalScheduleThreeDays();

  await notifyCriminalScheduleTwoDays();

  await notifyCriminalScheduleOneDays();

  Logger.info(`AUTO CHECK CRIME FOR VEHICLE OF SCHEDULE DONE !`);

  process.exit(0);
}

async function _checkCriminalVehicle(scheduleData) {
  let messageType = MESSAGE_TYPE.NOTIFY_CRIMINAL_WARNING_SCHEDULE;

  // Kiểm tra lịch hẹn hôm nay đã gửi thông báo chưa => Rồi thì không gửi nữa
  const existedMessage = await MessageCustomerResourceAccess.customSearch(
    {
      customerScheduleId: scheduleData.customerScheduleId,
      messageSendDate: moment().format(DATE_DB_FORMAT),
      messageType: messageType,
    },
    0,
    1,
  );

  if (!existedMessage || existedMessage.length === 0) {
    // lấy thông tin xe để kiểm tra phạt nguội
    const appUserVehicle = await AppUserVehicleResourceAccess.findById(scheduleData.appUserVehicleId);

    let checkCrime = CRIMINAL.NO;

    if (UtilFunctions.isNotEmptyStringValue(appUserVehicle.certificateSeries)) {
      let appUserVehicleData = {
        licensePlates: scheduleData.licensePlates,
        certificateSeries: appUserVehicle.certificateSeries,
        licensePlateColor: scheduleData.licensePlateColor,
      };

      checkCrime = await AppUserVehicleFunctions.checkCriminal(appUserVehicleData);
    }

    if (checkCrime === CRIMINAL.NO) {
      let messageTitle = `Thông Báo Tự Động Kiểm Tra Phạt Nguội`;
      let messageContent = `Xe ${scheduleData.licensePlates} không có cảnh báo phạt nguội đăng kiểm ngày ${scheduleData.dateSchedule}. Bác tài cố gắng đi đường cẩn thận, đừng vi phạm luật giao thông nhé. Lịch hẹn của quý khách vào lúc ${scheduleData.time} ngày ${scheduleData.dateSchedule}, vui lòng mang xe đi đăng kiểm đúng giờ để được hỗ trợ tốt nhất`;

      return CustomerMessageFunctions.addMessageCustomer(
        messageTitle,
        null,
        messageContent,
        scheduleData.licensePlates,
        scheduleData.appUserId,
        scheduleData.email,
        scheduleData.appUserVehicleId,
        scheduleData.customerRecordId,
        scheduleData.customerScheduleId,
        messageType,
      );
    } else {
      // Thông báo xe có phạt nguội đến tài khoản khách hàng
      let messageTitle = 'Thông Báo Kiểm Tra Phạt Nguội Từ Hệ Thống';
      let messageContent = `TTDK thông báo: phương tiện biển số ${scheduleData.licensePlates} của quý khách có phạt nguội, vui lòng kiểm tra xử lý phạt nguội trước khi đăng kiểm.`;

      return await CustomerMessageFunctions.addMessageCustomer(
        messageTitle,
        null,
        messageContent,
        scheduleData.licensePlates,
        scheduleData.appUserId,
        scheduleData.email,
        scheduleData.appUserVehicleId,
        scheduleData.customerRecordId,
        scheduleData.customerScheduleId,
        messageType,
      );
    }
  }
}

async function notifyCriminalScheduleThreeDays() {
  // 3 ngày sau ngày hiện tại
  const scheduleDateThreeDaysLater = moment().add(3, 'days').format('DD/MM/YYYY');

  const confirmScheduleStatus = [SCHEDULE_STATUS.CONFIRMED];

  let batchSize = 10;
  let skip = 0;

  // Thông báo tới người dùng có đặt lịch có xe bị phạt nguội
  while (true) {
    const scheduleDateNextThreeDaysList =
      (await CustomerScheduleResourceAccess.customSearch(
        {
          dateSchedule: scheduleDateThreeDaysLater,
          CustomerScheduleStatus: confirmScheduleStatus,
        },
        skip,
        batchSize,
      )) || [];

    if (scheduleDateNextThreeDaysList && scheduleDateNextThreeDaysList.length > 0) {
      const notificationNextThreeDaysPromiseList = scheduleDateNextThreeDaysList.map(async scheduleData => {
        await _checkCriminalVehicle(scheduleData);
      });

      await Promise.all([...notificationNextThreeDaysPromiseList]);
    } else {
      break;
    }

    skip += batchSize;
  }
}

async function notifyCriminalScheduleTwoDays() {
  // 2 ngày sau ngày hiện tại
  const scheduleDateTwoDaysLater = moment().add(2, 'days').format('DD/MM/YYYY');

  const confirmScheduleStatus = [SCHEDULE_STATUS.CONFIRMED];

  let batchSize = 10;
  let skip = 0;

  // Thông báo tới người dùng có đặt lịch có xe bị phạt nguội
  while (true) {
    const scheduleDateNextTwoDaysList =
      (await CustomerScheduleResourceAccess.customSearch(
        {
          dateSchedule: scheduleDateTwoDaysLater,
          CustomerScheduleStatus: confirmScheduleStatus,
        },
        skip,
        batchSize,
      )) || [];

    if (scheduleDateNextTwoDaysList && scheduleDateNextTwoDaysList.length > 0) {
      const notificationNextTwoDaysPromiseList = scheduleDateNextTwoDaysList.map(async scheduleData => {
        await _checkCriminalVehicle(scheduleData);
      });

      await Promise.all([...notificationNextTwoDaysPromiseList]);
    } else {
      break;
    }

    skip += batchSize;
  }
}

async function notifyCriminalScheduleOneDays() {
  // 1 ngày sau ngày hiện tại
  const scheduleDateOneDaysLater = moment().add(1, 'days').format('DD/MM/YYYY');

  const confirmScheduleStatus = [SCHEDULE_STATUS.CONFIRMED];

  let batchSize = 10;
  let skip = 0;

  // Thông báo tới người dùng có đặt lịch có xe bị phạt nguội
  while (true) {
    const scheduleDateNextOneDaysList =
      (await CustomerScheduleResourceAccess.customSearch(
        {
          dateSchedule: scheduleDateOneDaysLater,
          CustomerScheduleStatus: confirmScheduleStatus,
        },
        skip,
        batchSize,
      )) || [];

    if (scheduleDateNextOneDaysList && scheduleDateNextOneDaysList.length > 0) {
      const notificationNextOneDaysPromiseList = scheduleDateNextOneDaysList.map(async scheduleData => {
        await _checkCriminalVehicle(scheduleData);
      });

      await Promise.all([...notificationNextOneDaysPromiseList]);
    } else {
      break;
    }

    skip += batchSize;
  }
}

createNotifyForCustomerHaveCriminalSchedule();

module.exports = {
  createNotifyForCustomerHaveCriminalSchedule,
};
