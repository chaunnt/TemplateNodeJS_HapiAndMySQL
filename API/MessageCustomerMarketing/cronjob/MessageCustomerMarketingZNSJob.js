/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const StationsMarketingConfigResourceAccess = require('../resourceAccess/StationsMarketingConfigResourceAccess');
const StationMessageConfigsAccess = require('../../StationMessageConfigs/resourceAccess/StationMessageConfigsAccess');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const MessageCustomerMarketingResourceAccess = require('../resourceAccess/MessageCustomerMarketingResourceAccess');

const { MARKETING_MESSAGE_CATEGORY, MARKETING_MESSAGE_SEND_STATUS, MARKETING_MESSAGE_ERROR } = require('../MessageCustomerMarketingConstant');

const UtilsFunction = require('../../ApiUtils/utilFunctions');
const Logger = require('../../../utils/logging');
const { retrySendMessageZaloToSMS } = require('../MessageCustomerMarketingFunctions');
const { sendMessageByZNSOfSystem } = require('../../ZaloNotificationService/ZNSSystemFunction');

async function _cancelAllSMSMessage(station, messageNote) {
  let skip = 0;
  let limit = 50;
  while (true) {
    let messageList = await MessageCustomerMarketingResourceAccess.find(
      {
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.NEW,
        customerStationId: station.stationsId,
      },
      skip,
      limit,
    );
    if (messageList && messageList.length > 0) {
      for (let i = 0; i < messageList.length; i++) {
        const messageObj = messageList[i];
        let dataUpdate = {
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
        };
        if (messageNote) {
          dataUpdate.messageNote = messageNote;
        }
        await MessageCustomerMarketingResourceAccess.updateById(messageObj.messageMarketingId, dataUpdate);
      }
    } else {
      break;
    }
    skip += limit;
  }
}

async function sendMessageZNSToCustomer(station) {
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (station.stationsId === 0) {
      Logger.info(`sendMessageZNSToCustomer station empty ${station.stationsId} `);
      resolve('OK');
      return;
    }
    if (station.stationEnableUseZNS === 0) {
      Logger.info(`sendMessageZNSToCustomer station ${station.stationsId} disabled SMS`);
      await _cancelAllSMSMessage(station);
      resolve('OK');
      return;
    }
    let messageList = await MessageCustomerMarketingResourceAccess.find(
      {
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.NEW,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
        customerStationId: station.stationsId,
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(station.stationsId);
      let remainingQtyMessageZaloCSKH = 0;
      if (stationsMarketingConfig) {
        remainingQtyMessageZaloCSKH = stationsMarketingConfig.remainingQtyMessageZaloCSKH;
      }
      if (remainingQtyMessageZaloCSKH <= 0) {
        await _cancelAllSMSMessage(station, MARKETING_MESSAGE_ERROR.EXCEED_QUANTITY_MESSAGE);
        resolve('OK');
        return;
      }
      let messageLength = messageList.length;
      if (remainingQtyMessageZaloCSKH < messageList.length) {
        messageLength = remainingQtyMessageZaloCSKH;
      }

      for (let i = 0; i < messageLength; i++) {
        const _customerMessage = messageList[i];
        let customConfig = undefined;
        if (UtilsFunction.isNotEmptyStringValue(_customerMessage.customConfigZNS)) {
          customConfig = _customerMessage.customConfigZNS;
        }
        let messageTemplateData = _customerMessage.messageTemplateData;
        messageTemplateData = JSON.parse(messageTemplateData);
        let messageZNSTemplateId = _customerMessage.messageZNSTemplateId;

        //neu khong co so dien thoai thi khong gui zns
        if (UtilsFunction.isInvalidStringValue(_customerMessage.customerMessagePhone)) {
          //cap nhat trang thai la CANCELED
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
            messageSendDate: new Date().toISOString(),
          });
          continue;
        }
        //cap nhat trang thai la SENDING
        await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
          messageSendDate: new Date().toISOString(),
        });

        // if (process.env.ZNS_ENABLE * 1 !== 1) {
        //   await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
        //     messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
        //     messageSendDate: new Date().toISOString(),
        //     messageNote: "ZNS DISABLE",
        //   });
        //   continue
        // }

        let sendResult;
        sendResult = await sendMessageByZNSOfSystem(_customerMessage.customerMessagePhone, messageZNSTemplateId, messageTemplateData);

        if (sendResult && sendResult.error === 0) {
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
            messageSendDate: new Date().toISOString(),
            messageNote: sendResult.message,
          });
          remainingQtyMessageZaloCSKH -= 1;
          await StationsMarketingConfigResourceAccess.updateById(station.stationsId, { remainingQtyMessageZaloCSKH: remainingQtyMessageZaloCSKH });
        } else if (sendResult && sendResult.error !== 0) {
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
            messageSendDate: new Date().toISOString(),
            messageNote: sendResult.message,
          });

          // Nếu gửi thất bại => kiểm tra xem lỗi có phải do sđt chưa đăng ký zalo
          if (sendResult.message === 'Zalo account not existed') {
            // Kiểm tra xem có bật tính năng gửi SMS nếu sđt chưa đăng ký Zalo
            let stationMessageConfig = await StationMessageConfigsAccess.findById(station.stationsId);
            if (stationMessageConfig && stationMessageConfig.enableNotiBySMSRetry) {
              // lấy template SMS
              let messageTemplateToSendSMS = await MessageTemplateResourceAccess.findById(stationMessageConfig.messageTemplateSMSRetry);
              let createMessageRetry = await retrySendMessageZaloToSMS(_customerMessage, station, messageTemplateToSendSMS);
              // Cập nhật lại messageNote là đã chuyển qua gửi SMS đối với tn này
              await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
                messageNote: 'Switched to SMS because phone number is not registered Zalo',
              });
            }
          }
        } else {
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
            messageSendDate: new Date().toISOString(),
            messageNote: sendResult,
          });
        }
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

module.exports = {
  sendMessageZNSToCustomer,
};
