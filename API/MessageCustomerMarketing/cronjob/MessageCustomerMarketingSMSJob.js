/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const CustomerRecord = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
// const { SMS_PROVIDER, MESSAGE_SEND_STATUS } = require('../../CustomerMessage/CustomerMessageConstant');
const {
  MARKETING_MESSAGE_CATEGORY,
  MESSAGE_STATUS,
  MARKETING_MESSAGE_SEND_STATUS,
  SMS_PROVIDER,
  MARKETING_MESSAGE_ERROR,
} = require('../MessageCustomerMarketingConstant');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const MessageMarketingFunction = require('../MessageCustomerMarketingFunctions');
const Logger = require('../../../utils/logging');
const moment = require('moment');
const MessageCustomerMarketingResourceAccess = require('../resourceAccess/MessageCustomerMarketingResourceAccess');
const StationsMarketingConfigResourceAccess = require('../resourceAccess/StationsMarketingConfigResourceAccess');
async function _cancelAllSMSMessage(station, messageNote) {
  let skip = 0;
  let limit = 50;
  while (true) {
    let messageList = await MessageCustomerMarketingResourceAccess.find(
      {
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
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

async function sendMessageSMSToCustomer(station) {
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (!station.stationsId) {
      Logger.error(`sendMessageSMSToCustomer station empty`);
      resolve('OK');
      return;
    }

    //Failure all message if station do not use SMS
    if (station.stationEnableUseSMS === 0) {
      await _cancelAllSMSMessage(station);
      resolve('OK');
      return;
    }
    let _customSMSClient = undefined;
    let _customConfig = undefined;
    const ENABLED = 1;
    //Get sms client info if station use custom sms client
    if (station.stationUseCustomSMSBrand === ENABLED) {
      if (station.stationCustomSMSBrandConfig && station.stationCustomSMSBrandConfig !== null && station.stationCustomSMSBrandConfig.trim() !== '') {
        try {
          const _smsConfig = JSON.parse(station.stationCustomSMSBrandConfig);
          _customConfig = _smsConfig;
          if (_smsConfig.smsProvider === SMS_PROVIDER.VIETTEL) {
            //init for VIETTEL SERVICE
            const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
            _customSMSClient = await SMSSOAPFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsCPCode,
              _smsConfig.smsServiceId,
            );
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VIVAS) {
            //init for VIVAS SERVICE
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            _customSMSClient = await SMSAPIClientFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsBrand,
            );
          } else if (_smsConfig.smsProvider === SMS_PROVIDER.VMG) {
            //init for VMG SERVICE
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            _customSMSClient = await SMSVMGAPIFunctions.createClient(_smsConfig.smsUrl, _smsConfig.smsToken, _smsConfig.smsBrand);
          } else {
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            _customSMSClient = await SMSAPIClientFunctions.createClient(
              _smsConfig.smsUrl,
              _smsConfig.smsUserName,
              _smsConfig.smsPassword,
              _smsConfig.smsBrand,
            );
          }
          if (_customSMSClient === undefined) {
            Logger.info(`station ${station.stationsId} enable custom but have wrong sms config`);
            Logger.info(station.stationCustomSMSBrandConfig);
            await _cancelAllSMSMessage(station);
            resolve('OK');
            return;
          }
        } catch (error) {
          Logger.info(`station ${station.stationsId} enable custom but convert custom sms config failed`);
          await _cancelAllSMSMessage(station);
          resolve('OK');
          return;
        }
      }
    }

    let messageList = await MessageCustomerMarketingResourceAccess.find(
      {
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.NEW,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
        customerStationId: station.stationsId,
      },
      0,
      100,
    );
    if (messageList && messageList.length > 0) {
      let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(station.stationsId);
      let remainingQtyMessageSmsCSKH = 0;
      if (stationsMarketingConfig) {
        remainingQtyMessageSmsCSKH = stationsMarketingConfig.remainingQtyMessageSmsCSKH;
      }
      if (remainingQtyMessageSmsCSKH <= 0) {
        await _cancelAllSMSMessage(station, MARKETING_MESSAGE_ERROR.EXCEED_QUANTITY_MESSAGE);
        resolve('OK');
        return;
      }
      let messageLength = messageList.length;
      if (remainingQtyMessageSmsCSKH < messageList.length) {
        messageLength = remainingQtyMessageSmsCSKH;
      }
      for (let i = 0; i < messageLength; i++) {
        const _customerMessage = messageList[i];
        let messageContent = _customerMessage.messageContent;
        //neu khong co so dien thoai thi khong gui sms
        if (UtilsFunction.isInvalidStringValue(_customerMessage.customerMessagePhone)) {
          //cap nhat trang thai la CANCELED
          await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
            messageContent: messageContent,
            messageTitle: messageContent,
            messageSendDate: new Date().toISOString(),
          });
          continue;
        }

        messageContent = UtilsFunction.nonAccentVietnamese(messageContent);

        //cap nhat trang thai la SENDING
        await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, {
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
          messageContent: messageContent,
          messageTitle: messageContent,
          messageSendDate: new Date().toISOString(),
        });

        let sendSMSResultData = {
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
        };

        //if we disable SMS
        if (process.env.SMS_ENABLE * 1 === 1) {
          let sendResult = undefined;
          sendSMSResultData.externalReceiveDate = new Date();

          if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VIETTEL) {
            const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
            sendResult = await SMSSOAPFunctions.sendSMS(messageContent, _customerMessage.customerMessagePhone, _customSMSClient);

            if (sendResult) {
              sendSMSResultData = MessageMarketingFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VIVAS) {
            const SMSAPIClientFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
            sendResult = await SMSAPIClientFunctions.sendSMS(messageContent, [_customerMessage.customerMessagePhone], _customSMSClient);

            if (sendResult) {
              sendSMSResultData = MessageMarketingFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else if (_customConfig && _customConfig.smsProvider === SMS_PROVIDER.VMG) {
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            sendResult = await SMSVMGAPIFunctions.sendSMSMessage(
              _customerMessage.customerMessagePhone,
              messageContent,
              _customSMSClient,
              _customerMessage.messageCustomerId,
            );

            if (sendResult) {
              sendSMSResultData = MessageMarketingFunction.mappingResponseSMS(sendResult, _customConfig.smsProvider);
            } else {
              sendSMSResultData.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          } else {
            const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
            let smsMessageMarketingConfigClient = {
              smsApiToken:
                process.env.VMG_MARKETING_SMS_TOKEN ||
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c24iOiJ2dHNzMSIsInNpZCI6IjUzMGRlNzc4LWNmODgtNDdmNi1iNjRkLTAyOWVhYzcwNDBhNyIsIm9idCI6IiIsIm9iaiI6IiIsIm5iZiI6MTY5NzAxMTc3MywiZXhwIjoxNjk3MDE1MzczLCJpYXQiOjE2OTcwMTE3NzN9.kXur8dxs6ObOUhcMKTNDYYiZwPzvpjR9TLVF9lu7B2g',
              smsAPIBrand: process.env.VMG_BRANDNAME || 'TTDK.COM.VN',
            };
            sendResult = await SMSVMGAPIFunctions.sendSMSMessage(
              _customerMessage.customerMessagePhone,
              messageContent,
              smsMessageMarketingConfigClient,
              _customerMessage.messageCustomerId,
            );

            if (sendResult) {
              sendSMSResultData = MessageMarketingFunction.mappingResponseSMS(sendResult, SMS_PROVIDER.VMG);
            } else {
              sendSMSResultData.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
              sendSMSResultData.messageNote = 'PROVIDER_API_ERROR';
            }
          }

          //neu da gui sms thanh cong thi cap nhat ngay notify cho customer
          if (sendResult) {
            await CustomerRecord.updateById(_customerMessage.customerId, {
              customerRecordSMSNotifyDate: new Date(),
            });
          }
        } else {
          sendSMSResultData.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.CANCELED;
          sendSMSResultData.messageNote = `SMS_SERVICE_DISABLED`;
        }

        let resultInsert = await MessageCustomerMarketingResourceAccess.updateById(_customerMessage.messageMarketingId, sendSMSResultData);
        if (sendSMSResultData.messageSendStatus === MARKETING_MESSAGE_SEND_STATUS.COMPLETED) {
          remainingQtyMessageSmsCSKH -= 1;
          await StationsMarketingConfigResourceAccess.updateById(station.stationsId, { remainingQtyMessageSmsCSKH: remainingQtyMessageSmsCSKH });
        }
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}

module.exports = {
  sendMessageSMSToCustomer,
};
