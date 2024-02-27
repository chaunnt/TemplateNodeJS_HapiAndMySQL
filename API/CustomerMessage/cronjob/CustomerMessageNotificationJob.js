/* Copyright (c) 2021-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { executeBatchPromise } = require('../../ApiUtils/utilFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { MESSAGE_STATUS } = require('../CustomerMessageConstant');
const CustomerMessageNotificationResourceAccess = require('../resourceAccess/CustomerMessageNotificationResourceAccess');
const CustomerMessageResourceAccess = require('../resourceAccess/CustomerMessageResourceAccess');
const Logger = require('../../../utils/logging');

async function sendNotificationToUser() {
  Logger.info(`sendNotificationToUser`);
  let messageList = await CustomerMessageNotificationResourceAccess.find(
    {
      customerMessageSendStatus: MESSAGE_STATUS.NEW,
    },
    0,
    50,
  );
  let result = '';
  if (messageList && messageList.length > 0) {
    for (let i = 0; i < messageList.length; i++) {
      const _customerMessage = messageList[i];
      result = await sendNotification(_customerMessage);
      if (result) {
        await CustomerMessageNotificationResourceAccess.updateById(_customerMessage.customerMessageId, {
          customerMessageSendStatus: MESSAGE_STATUS.COMPLETED,
        });
        return result;
      }
      return undefined;
    }
  }
}

async function sendNotification(customerMessage) {
  return new Promise(async (resolve, reject) => {
    let skip = 0;
    let limit = 50;
    while (true) {
      let messageCustomerList = [];
      let listUser = await AppUsersResourceAccess.find({}, skip, limit);
      if (listUser && listUser.length > 0) {
        for (let i = 0; i < listUser.length; i++) {
          let appUserId = listUser[i].appUserId;
          let { customerMessageId, ...message } = customerMessage;
          message.customerId = appUserId;
          messageCustomerList.push(message);
        }
        let result = await CustomerMessageResourceAccess.insert(messageCustomerList);
        if (result) {
          resolve('OK');
        } else {
          resolve('DONE');
        }
      } else {
        break;
      }
      skip += 50;
    }
  });
}

module.exports = {
  sendNotificationToUser,
};
