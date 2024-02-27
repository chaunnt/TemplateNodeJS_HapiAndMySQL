'use strict';
const StationNewsNotificationJobAccess = require('../resourceAccess/StationNewsNotificationJobAccess');
const { NOTIFICATION_SENDING_STATUS } = require('../StationNewsConstants');
const Logger = require('../../../utils/logging');
const FirebaseNotificationFunctions = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const moment = require('moment');

async function sendPushNotificationToAllCustomer() {
  Logger.info('START SEND PUSH NOTIFICATION TO ALL CUSTOMER');

  await sendPushNotificationToCustomers();

  Logger.info('SEND PUSH NOTIFICATION TO ALL CUSTOMER DONE');

  process.exit();
}

async function sendPushNotificationToCustomers() {
  // lấy lấy thông báo chưa được gửi (chỉ lấy 1 thông báo)
  let notification = await StationNewsNotificationJobAccess.customSearch(
    {
      sendStatus: NOTIFICATION_SENDING_STATUS.NEW,
    },
    0,
    1,
  );

  // Nếu không có thông báo thì dừng
  if (notification && notification.length > 0) {
    const result = await FirebaseNotificationFunctions.pushNotificationByTopic(
      'GENERAL',
      notification[0].notificationTitle,
      notification[0].notificationContent,
      notification[0].otherData,
      'GENERAL',
    );

    let _sendResultData = {
      sendStatus: NOTIFICATION_SENDING_STATUS.FAILED,
      sendTime: moment().format('HH:mm'),
      sendDate: moment().format('DD/MM/YYYY'),
    };

    if (result) {
      _sendResultData.sendStatus = NOTIFICATION_SENDING_STATUS.COMPLETED;
    }

    // Cập nhật lại trạng thái thông báos
    await StationNewsNotificationJobAccess.updateById(notification[0].pushNotificationJobId, _sendResultData);
  }
}

sendPushNotificationToAllCustomer();

module.exports = {
  sendPushNotificationToAllCustomer,
};
