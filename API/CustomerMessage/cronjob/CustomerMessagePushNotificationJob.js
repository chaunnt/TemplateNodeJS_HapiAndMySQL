/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
const { MESSAGE_SEND_STATUS } = require('../CustomerMessageConstant');
const { DATE_DB_FORMAT } = require('../../Common/CommonConstant');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const Logger = require('../../../utils/logging');
const { pushNotificationByTopic } = require('../../../ThirdParty/FirebaseNotification/FirebaseNotificationFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const MessageCustomerMarketingResourceAccess = require('../resourceAccess/MessageCustomerMarketingResourceAccess');
const moment = require('moment');

async function _cancelAllSMSMessage() {
  const currentDay = moment().format(DATE_DB_FORMAT);

  while (true) {
    let messageList = await MessageCustomerResourceAccess.find(
      {
        messageFCMStatus: MESSAGE_SEND_STATUS.NEW,
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        await MessageCustomerResourceAccess.updateById(messageList[i].messageCustomerId, {
          messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          messageSendDate: currentDay,
        });
      }
    } else {
      break;
    }
  }
}
async function _cancelAllStationSMSMessage() {
  while (true) {
    let messageList = await MessageCustomerMarketingResourceAccess.find(
      {
        messageFCMStatus: MESSAGE_SEND_STATUS.NEW,
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        await MessageCustomerMarketingResourceAccess.updateById(messageList[i].messageMarketingId, {
          messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
        });
      }
    } else {
      break;
    }
  }
}

async function sendFCMToAllCustomer() {
  console.info(`sendFCMToAllCustomer ${new Date()}`);
  return new Promise(async (resolve, reject) => {
    //Failure all message if station do not use SMS
    if (process.env.FIREBASE_ENABLE * 1 !== 1) {
      Logger.info(`FIREBASE_ENABLE disabled`);
      await _cancelAllSMSMessage();
      resolve('OK');
      return;
    }
    let messageList = await MessageCustomerResourceAccess.customSearch(
      {
        messageFCMStatus: [MESSAGE_SEND_STATUS.NEW, MESSAGE_SEND_STATUS.SENDING],
      },
      0,
      100,
    );

    const currentDay = moment().format(DATE_DB_FORMAT);

    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const _customerMessage = messageList[i];

        //neu khong co so dien thoai thi khong gui sms
        if (!UtilsFunction.isValidValue(_customerMessage.customerId)) {
          //cap nhat trang thai la CANCELED
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
            messageSendDate: currentDay,
          });
          continue;
        }

        if (_customerMessage.customerStationId === null) {
          //cap nhat trang thai la SENDING
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.SENDING,
            messageSendDate: currentDay,
          });

          let _receiverUser = await AppUsersResourceAccess.findById(_customerMessage.customerId);

          if (!_receiverUser) {
            await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
              messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
            });
            continue;
          }

          if (UtilsFunction.isInvalidStringValue(_receiverUser.firebaseToken)) {
            await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, {
              messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
            });
            continue;
          }

          let _sendResultData = {
            messageFCMStatus: MESSAGE_SEND_STATUS.FAILED,
          };

          let _pushResult = await pushNotificationByTopic(
            `USER_${_receiverUser.appUserId}`,
            _customerMessage.messageTitle,
            _customerMessage.messageContent,
          );
          if (_pushResult) {
            _sendResultData.messageFCMStatus = MESSAGE_SEND_STATUS.COMPLETED;
          }
          await MessageCustomerResourceAccess.updateById(_customerMessage.messageCustomerId, _sendResultData);
        }
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

async function stationSendFCMToAllCustomer() {
  console.info(`stationSendFCMToAllCustomer ${new Date()}`);
  return new Promise(async (resolve, reject) => {
    //Failure all message if station do not use SMS
    if (process.env.FIREBASE_ENABLE * 1 !== 1) {
      Logger.info(`FIREBASE_ENABLE disabled`);
      await _cancelAllStationSMSMessage();
      resolve('OK');
      return;
    }
    let messageList = await MessageCustomerMarketingResourceAccess.customSearch(
      {
        messageFCMStatus: [MESSAGE_SEND_STATUS.NEW, MESSAGE_SEND_STATUS.SENDING],
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const _customerMessage = messageList[i];
        let station = await StationsResourceAccess.findById(_customerMessage.customerStationId);
        if (station.enableUseAPNSMessages === 0) {
          Logger.info(`station ${station.stationsId} disabled APNS`);
          // await _cancelAllSMSMessage(station);
          // resolve('OK');
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }
        await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
          messageFCMStatus: MESSAGE_SEND_STATUS.SENDING,
        });
        let _receiverUser = await AppUsersResourceAccess.findById(_customerMessage.customerId);
        if (!_receiverUser) {
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }
        if (UtilsFunction.isInvalidStringValue(_receiverUser.firebaseToken)) {
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageFCMStatus: MESSAGE_SEND_STATUS.CANCELED,
          });
          continue;
        }
        let _sendResultData = {
          messageFCMStatus: MESSAGE_SEND_STATUS.FAILED,
        };
        let _pushResult = await pushNotificationByTopic(
          `USER_${_receiverUser.appUserId}`,
          _customerMessage.messageTitle,
          _customerMessage.messageContent,
        );
        if (_pushResult) {
          _sendResultData.messageFCMStatus = MESSAGE_SEND_STATUS.COMPLETED;
        }
        await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, _sendResultData);
      }
    } else {
      resolve('DONE');
    }
  });
}
module.exports = {
  sendFCMToAllCustomer,
  stationSendFCMToAllCustomer,
};
