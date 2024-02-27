/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const MessageCustomerMarketingResourceAccess = require('../resourceAccess/MessageCustomerMarketingResourceAccess');
const Logger = require('../../../utils/logging');
const SMSAPIFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');

const SystemAppLogFunctions = require('../../SystemAppChangedLog/SystemAppChangedLogFunctions');
const MessageCustomerMarketingFunctions = require('../MessageCustomerMarketingFunctions');

const {
  SMS_PROVIDER,
  EMAIL_PROVIDER,
  MESSAGE_ACTION_STATUS,
  MARKETING_MESSAGE_CATEGORY,
  MARKETING_MESSAGE_ERROR,
  MARKETING_MESSAGE_SEND_STATUS,
  MESSAGE_STATUS,
} = require('../MessageCustomerMarketingConstant');
const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
const {
  MISSING_AUTHORITY,
  UNKNOWN_ERROR,
  NOT_FOUND,
  API_FAILED,
  ERROR_START_DATE_AFTER_END_DATE,
  POPULAR_ERROR,
} = require('../../Common/CommonConstant');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { sendSMSListByTemplate, createTemplate } = require('../../../ThirdParty/SMSVinaPhone/SMSVinaPhoneFunctions');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');

const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { stationSendNewMessage } = require('../../AppUserConversation/AppUserChatLogFunction');
const CustomerRecordFunctions = require('../../CustomerRecord/CustomerRecordFunctions');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const { tryStringify } = require('../../ApiUtils/utilFunctions');
const StationsMarketingConfigResourceAccess = require('../resourceAccess/StationsMarketingConfigResourceAccess');

const UtilsFunction = require('../../ApiUtils/utilFunctions');
const { sendMessageByZNSOfSystem } = require('../../ZaloNotificationService/ZNSSystemFunction');

async function sendsms(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageTemplateId = req.payload.customerMessageTemplateId;
      let phoneNumber = req.payload.customerMessagePhone;
      // let check = await checkStatusSMS(phoneNumber);
      let check = true;
      if (check) {
        let messageTemplate = await MessageTemplateResourceAccess.findById(customerMessageTemplateId);
        let messageDemo = messageTemplate.messageDemo;
        messageDemo = UtilsFunction.nonAccentVietnamese(messageDemo);
        let smsMessageMarketingConfigClient = {
          smsApiToken:
            process.env.VMG_MARKETING_SMS_TOKEN ||
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c24iOiJ2dHNzMSIsInNpZCI6IjUzMGRlNzc4LWNmODgtNDdmNi1iNjRkLTAyOWVhYzcwNDBhNyIsIm9idCI6IiIsIm9iaiI6IiIsIm5iZiI6MTY5NzAxMTc3MywiZXhwIjoxNjk3MDE1MzczLCJpYXQiOjE2OTcwMTE3NzN9.kXur8dxs6ObOUhcMKTNDYYiZwPzvpjR9TLVF9lu7B2g',
          smsAPIBrand: process.env.VMG_BRANDNAME || 'TTDK.COM.VN',
        };
        let result = await SMSVMGAPIFunctions.sendSMSMessage(phoneNumber, messageDemo, smsMessageMarketingConfigClient, undefined);
        if (result) {
          let sendResult = MessageCustomerMarketingFunctions.mappingResponseSMS(result, SMS_PROVIDER.VMG);
          if (sendResult.externalStatus === '000') {
            resolve(sendResult);
          } else {
            reject(sendResult);
          }
        } else {
          reject(API_FAILED);
        }
      } else {
        reject('has exceeded the number of submissions today');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function sendZns(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageTemplateId = req.payload.customerMessageTemplateId;
      let phoneNumber = req.payload.customerMessagePhone;
      // let check = await checkStatusSMS(phoneNumber);
      let check = true;
      if (check) {
        let messageTemplate = await MessageTemplateResourceAccess.findById(customerMessageTemplateId);
        let messageZNSTemplateId = messageTemplate.messageZNSTemplateId;
        let templateData = {
          stationsName: 'TTDK Tan Binh 1011S',
          stationsBrandname: 'TTDK Tan Binh 1011S',
          stationCode: '1011S',
          stationsAddress: 'P15 Q Tan Binh TP.HCM',
          customerRecordPlatenumber: '50C12345',
          vehiclePlateNumber: '50C12345',
          customerRecordCheckExpiredDate: '01/01/2024',
          stationsHotline: '0909090909',
          dateSchedule: '01/01/2024',
          newDate: '01/01/2024',
          startDay: '01/01/2024',
          minPaymentAmount: '900000',
          distance: '3',
        };

        let sendResult;
        sendResult = await sendMessageByZNSOfSystem(phoneNumber, messageZNSTemplateId, templateData);

        if (sendResult && sendResult.error === 0) {
          resolve(sendResult.message);
        } else if (sendResult && sendResult.error !== 0) {
          return reject(sendResult.message);
        } else {
          return reject(MARKETING_MESSAGE_ERROR.SEND_ZNS_FAILED);
        }
      } else {
        reject('has exceeded the number of submissions today');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function sendScheduleMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const customerScheduleId = req.payload.customerScheduleId;
      const message = req.payload.message;

      const schedule = await CustomerScheduleResourceAccess.findById(customerScheduleId);
      if (!schedule) {
        return reject(NOT_FOUND);
      }

      const title = 'Thông báo từ hệ thống';

      const NO_SEND_SMS = undefined;

      const result = await MessageCustomerMarketingFunctions.createMessageForCustomerOnly(
        title,
        message,
        schedule.appUserId,
        NO_SEND_SMS,
        schedule.email,
        {
          customerScheduleId,
        },
      );

      if (result) {
        return resolve(result);
      } else {
        return reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function checkStatusSMS(phoneNumber) {
  let startDate = moment().startOf('day').format();
  let endDate = moment().endOf('day').format();
  let count = await MessageCustomerMarketingResourceAccess.customCount(
    { customerMessagePhone: phoneNumber },
    startDate,
    endDate,
    undefined,
    undefined,
  );
  if (count == 0) {
    return true;
  } else {
    return false;
  }
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageData = req.payload;
      customerMessageData.customerStationId = req.currentUser.stationsId;

      // //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
      // if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === "") {
      //   continue;
      // }

      let result = await CustomerMessageResourceAccess.insert(customerMessageData);
      if (result) {
        resolve(result);
      }
      reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      // if (startDate) {
      //   startDate = formatDate.FormatDate(startDate)
      // }
      // if (endDate) {
      //   endDate = formatDate.FormatDate(endDate)
      // }
      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.customerStationId = req.currentUser.stationsId;
      }

      let customerMessage = await MessageCustomerMarketingResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (customerMessage && customerMessage.length > 0) {
        let customerMessageCount = await MessageCustomerMarketingResourceAccess.customCount(filter, startDate, endDate, searchText, order);

        resolve({ data: customerMessage, total: customerMessageCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageData = req.payload.data;

      let messageCustomer = await MessageCustomerMarketingResourceAccess.findById(req.payload.id);

      if (!messageCustomer) {
        return reject(API_FAILED);
      }

      let customerMessageId = messageCustomer.messageId;

      let dataBefore = await CustomerMessageResourceAccess.findById(customerMessageId);

      let result = await CustomerMessageResourceAccess.updateById(customerMessageId, {
        customerMessageContent: customerMessageData.customerMessageContent,
        customerMessageCategories: customerMessageData.customerMessageCategories,
        isDeleted: customerMessageData.isDeleted,
      });

      await MessageCustomerMarketingResourceAccess.updateById(req.payload.id, {
        customerMessagePhone: customerMessageData.customerRecordPhone,
        isDeleted: customerMessageData.isDeleted,
      });

      if (result) {
        SystemAppLogFunctions.logCustomerRecordChanged(dataBefore, customerMessageData, req.currentUser);
        resolve(result);
      }
      reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageId = req.payload.id;
      let result = await MessageCustomerMarketingResourceAccess.findById(customerMessageId);
      if (result) {
        resolve(result);
      }
      reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function advanceUserSendZNSMessageToCustomerList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userStationId = req.currentUser.stationsId;
      let customerList = req.payload.customerList;
      let messageZNSTemplateId = req.payload.messageZNSTemplateId;
      let messageTemplatPayloadData = req.payload.messageTemplateData;
      //kiem tra tram co duoc chay chuc nang SMS hay khong
      let stationData = await StationsResourceAccess.findById(userStationId);
      if (stationData.stationEnableUseZNS !== 1) {
        return reject(MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_ZNS);
      }

      // Trạm sử dụng hết tin nhắn thì thông báo "Hết số lượng tin nhắn. Vui lòng liên hệ quản trị viên để được hỗ trợ"
      let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(userStationId);
      if (stationsMarketingConfig.remainingQtyMessageZaloCSKH <= 0) {
        return reject(MARKETING_MESSAGE_ERROR.EXCEED_QUANTITY_MESSAGE);
      }

      let messageTemplate = await MessageTemplateResourceAccess.findById(req.payload.messageTemplateId);
      if (!messageTemplate) {
        return reject(MARKETING_MESSAGE_ERROR.INVALID_TEMPLATE_ID); //----
      }
      let messagePrice = messageTemplate.messageTemplatePrice;

      let _newMessageList = [];
      let _failedMessageList = [];
      MessageCustomerMarketingFunctions.parseMesageTemplateData(messageTemplate);
      for (let i = 0; i < customerList.length; i++) {
        let _customerData = customerList[i];
        // Loại bỏ các ký tự đặt biệt của BSX
        const licensePlate = CustomerRecordFunctions.processLicensePlate(_customerData.customerRecordPlatenumber);
        _customerData.customerRecordPlatenumber = licensePlate.cleanedPlate;

        let _newMessageFullData = {
          ...stationData,
          messagePrice: messagePrice,
          ..._customerData,
          ...messageTemplatPayloadData,
        };

        if (MessageCustomerMarketingFunctions.isMatchedMessageDataContentWithTemplate(messageTemplate, _newMessageFullData)) {
          let messageTemplateData = {};
          for (let i = 0; i < messageTemplate.messageTemplateData.length; i++) {
            let _templateData = messageTemplate.messageTemplateData[i];
            if (_templateData.paramName === 'vehiclePlateNumber') {
              _newMessageFullData.vehiclePlateNumber = _newMessageFullData.customerRecordPlatenumber;
            }
            if (_newMessageFullData[_templateData.paramName]) {
              messageTemplateData[_templateData.paramName] = _newMessageFullData[_templateData.paramName];
            }
            if (_templateData.paramName === 'paramName') {
              // nếu paramName của _templateData là "paramName" (default) thì bỏ qua
              continue;
            }
            let keyOfMessageFullData = Object.keys(_newMessageFullData);
            //Kiểm tra xem các các field mà template yêu cầu có được truyền đầy đủ lên không
            MessageCustomerMarketingFunctions.isMatchedTemplateWithData(_templateData, keyOfMessageFullData);
          }
          if (messageTemplateData.stationsName) {
            messageTemplateData.stationsBrandname = messageTemplateData.stationsName;
          }
          messageTemplateData = tryStringify(messageTemplateData);
          let _newMarketingMessage = {
            customerMessagePhone: _customerData.customerMessagePhone,
            customerMessagePlateNumber: _customerData.customerRecordPlatenumber,
            customerStationId: userStationId,
            // customerRecordCheckExpiredDate: _customerData.customerRecordCheckExpiredDate,
            messageTemplateData: messageTemplateData,
            messageContent: _customerData.customerMessageContent,
            messageTitle: messageTemplate.messageTemplateName,
            customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
            messagePrice: _newMessageFullData.messagePrice,
            messageZNSTemplateId: messageZNSTemplateId,
          };
          _newMessageList.push(_newMarketingMessage);
        } else {
          _failedMessageList.push(i);
        }
      }
      let _result = await MessageCustomerMarketingResourceAccess.insert(_newMessageList);
      if (_result) {
        return resolve({ data: { success: _newMessageList.length, failed: _failedMessageList.length } });
      }
      return reject(POPULAR_ERROR.INSERT_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(MARKETING_MESSAGE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}
async function advanceUserCancelSMSMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let messageMarketingId = req.payload.messageMarketingId;
      let currentUser = req.currentUser;
      let now = moment().format();
      let messageMarketing = await MessageCustomerMarketingResourceAccess.findById(messageMarketingId);
      if (messageMarketing) {
        let customerStationId = messageMarketing.customerStationId;
        if (customerStationId === currentUser.stationsId) {
          let cancelResult = await MessageCustomerMarketingResourceAccess.updateById(messageMarketingId, {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
            messageNote: `Đã hủy gửi tin lúc ${now} bởi ${currentUser.firstName}(${currentUser.appUserId})`,
          });
          if (cancelResult) {
            resolve('success');
          } else {
            reject('failed');
          }
        } else {
          reject('User not Permission');
        }
      } else {
        reject(MARKETING_MESSAGE_ERROR.INVALID_MESSAGE);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
async function advanceUserSendSMSMessageToCustomerList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userStationId = req.currentUser.stationsId;
      let customerList = req.payload.customerList;

      //kiem tra tram co duoc chay chuc nang SMS hay khong
      let stationData = await StationsResourceAccess.findById(userStationId);
      if (stationData.stationEnableUseSMS !== 1) {
        return reject(MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_SMS);
      }

      // Trạm sử dụng hết tin nhắn thì thông báo "Hết số lượng tin nhắn. Vui lòng liên hệ quản trị viên để được hỗ trợ"
      let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(userStationId);
      if (stationsMarketingConfig.remainingQtyMessageSmsCSKH <= 0) {
        return reject(MARKETING_MESSAGE_ERROR.EXCEED_QUANTITY_MESSAGE);
      }

      let messsageTemplate = await MessageTemplateResourceAccess.findById(req.payload.messageTemplateId);
      if (!messsageTemplate) {
        return reject(MARKETING_MESSAGE_ERROR.INVALID_TEMPLATE_ID);
      }
      let messagePrice = messsageTemplate.messageTemplatePrice;

      let _newMessageList = [];
      let _failedMessageList = [];
      MessageCustomerMarketingFunctions.parseMesageTemplateData(messsageTemplate);
      for (let i = 0; i < customerList.length; i++) {
        let _customerData = customerList[i];
        // Loại bỏ các ký tự đặt biệt của BSX
        const licensePlate = CustomerRecordFunctions.processLicensePlate(_customerData.customerRecordPlatenumber);
        _customerData.customerRecordPlatenumber = licensePlate.cleanedPlate;

        let _newMessageFullData = {
          ...stationData,
          messagePrice: messagePrice,
          ..._customerData,
        };

        if (MessageCustomerMarketingFunctions.isMatchedMessageDataContentWithTemplate(messsageTemplate, _newMessageFullData)) {
          let messageTemplateData = {};
          for (let i = 0; i < messsageTemplate.messageTemplateData.length; i++) {
            let _templateData = messsageTemplate.messageTemplateData[i];
            if (_templateData.paramName === 'vehiclePlateNumber') {
              _newMessageFullData.vehiclePlateNumber = _newMessageFullData.customerRecordPlatenumber;
            }
            if (_newMessageFullData[_templateData.paramName]) {
              messageTemplateData[_templateData.paramName] = _newMessageFullData[_templateData.paramName];
            }
            if (_templateData.paramName === 'paramName') {
              // nếu paramName của _templateData là "paramName" (default) thì bỏ qua
              continue;
            }

            let keyOfMessageFullData = Object.keys(_newMessageFullData);
            //Kiểm tra xem các các field mà template yêu cầu có được truyền đầy đủ lên không
            MessageCustomerMarketingFunctions.isMatchedTemplateWithData(_templateData, keyOfMessageFullData);
          }
          messageTemplateData = tryStringify(messageTemplateData);
          let _newMessageContent = '';
          let _newMarketingMessage = {
            customerMessagePhone: _customerData.customerMessagePhone,
            customerMessagePlateNumber: _customerData.customerRecordPlatenumber,
            customerStationId: userStationId,
            // customerRecordCheckExpiredDate: _customerData.customerRecordCheckExpiredDate,
            messageTemplateData: messageTemplateData,
            messageContent: _customerData.customerMessageContent,
            messageTitle: messsageTemplate.messageTemplateName,
            customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
            messagePrice: _newMessageFullData.messagePrice,
          };
          _newMessageList.push(_newMarketingMessage);
        } else {
          _failedMessageList.push(i);
        }
      }
      let _result = await MessageCustomerMarketingResourceAccess.insert(_newMessageList);
      if (_result) {
        return resolve({ data: { success: _newMessageList.length, failed: _failedMessageList.length } });
      }
      return reject(POPULAR_ERROR.INSERT_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(MARKETING_MESSAGE_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(UNKNOWN_ERROR);
      }
    }
  });
}
async function sendMessageToCustomerList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userStationId = req.currentUser.stationsId;
      let customerArr = req.payload.customerList;
      let customerMessageCategories = req.payload.customerMessageCategories;
      let customerList = [];
      let stationData = await StationsResourceAccess.findById(userStationId);
      let messsageTemplate = await MessageTemplateResourceAccess.findById(req.payload.customerMessageTemplateId);
      let messagePrice = messsageTemplate.messageTemplatePrice;
      if (customerMessageCategories === MARKETING_MESSAGE_CATEGORY.SMS_CSKH) {
        if (stationData.stationEnableUseSMS !== 1) {
          return reject(MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_SMS);
        }
        //retrieve info for customer list
        for (var i = 0; i < customerArr.length; i++) {
          //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
          if (customerArr[i].customerRecordCheckExpiredDate === null || customerArr[i].customerRecordCheckExpiredDate.trim() === '') {
            console.info(`${customerArr[i].customerRecordPlatenumber} không có ngày hết hạn`);
            continue;
          }
          customerList.push(customerArr[i]);
        }

        //Send message to many customer
        let result = await MessageCustomerMarketingFunctions.sendSMSMessageToManyCustomer(
          customerList,
          userStationId,
          customerMessageCategories,
          messagePrice,
        );
        if (result) {
          resolve(result);
        } else {
          reject(API_FAILED);
        }
      } else if (customerMessageCategories === MARKETING_MESSAGE_CATEGORY.APNS) {
        if (stationData.enableUseAPNSMessages !== 1) {
          return reject(MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_APNS);
        }
        let sendResultArr = [];
        let result = await MessageCustomerMarketingFunctions.sendMessageAPNSCustomer(
          customerArr,
          userStationId,
          customerMessageCategories,
          stationData,
          messagePrice,
        );
        if (result && result.length > 0) {
          sendResultArr.push(result);
        } else {
          reject(MARKETING_MESSAGE_ERROR.SEND_APNS_FAILED);
        }
        // Tạo tin nhắn trong phần nhắn tin
        for (let i = 0; i < customerArr.length; i++) {
          let sendResult = await stationSendNewMessage(customerArr[i].customerId, customerArr[i].customerMessageContent, userStationId);
          sendResultArr.push(sendResult);
        }
        if (sendResultArr && sendResultArr.length > 0) {
          for (let i = 0; i < sendResultArr.length; i++) {
            if (!sendResultArr[i]) {
              reject(API_FAILED);
            }
          }
          resolve(sendResultArr);
        } else {
          reject(API_FAILED);
        }
      }
      // customerMessageCategories === ZNS sẽ xử lý sau
    } catch (e) {
      Logger.error(__filename, e);
      if (Object.keys(MARKETING_MESSAGE_ERROR).indexOf(e) >= 0) {
        reject(e);
      }
      reject('failed');
    }
  });
}
async function findTemplates(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let stationsId = req.currentUser.stationsId;
      let templates = await MessageCustomerMarketingFunctions.getTemplateMessages(stationsId, filter, skip, limit);
      if (templates) {
        resolve(templates);
      } else {
        reject('do not have any templates');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function sendTestEmail(req) {
  const EmailClient = require('../../../ThirdParty/Email/EmailClient');
  return new Promise(async (resolve, reject) => {
    try {
      // payload: Joi.object({
      //   testEmail:Joi.string().required().email(),
      //   emailUsername: Joi.string().required(),
      //   emailPassword: Joi.string().required(),
      //   emailConfig: Joi.object({
      //     emailHost: Joi.string(),
      //     emailPort: Joi.number(),
      //     emailSecure: Joi.number(),
      //   }),
      //   emailProvider: Joi.string().default(EMAIL_PROVIDER.CUSTOM).allow([EMAIL_PROVIDER.GMAIL, EMAIL_PROVIDER.CUSTOM]).required()
      // })

      let emailData = req.payload;
      let sendResult = undefined;
      if (emailData.emailProvider === EMAIL_PROVIDER.CUSTOM) {
        if (emailData.emailConfig) {
          let _customClient = await EmailClient.createNewClient(
            emailData.emailConfig.emailHost,
            emailData.emailConfig.emailPort,
            emailData.emailConfig.emailSecure,
            emailData.emailUsername,
            emailData.emailPassword,
          );
          sendResult = await EmailClient.sendTestEmail(emailData.testEmail, _customClient);
        } else {
          sendResult = await EmailClient.sendTestEmail(emailData.testEmail);
        }
      } else if (emailData.emailProvider === EMAIL_PROVIDER.GMAIL) {
        let _customThirdPartyClient = await EmailClient.createNewThirdpartyClient(emailData.emailUsername, emailData.emailPassword);
        sendResult = await EmailClient.sendTestEmail(emailData.testEmail, _customThirdPartyClient);
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestEmail failed');
    }
  });
}

async function sendTestSMS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let smsData = req.payload;
      let _smsConfig = smsData.smsConfig;
      let _customSMSClient = undefined;

      let sendResult = undefined;

      let _templates = await MessageCustomerMarketingFunctions.getTemplateMessages();
      let _sampleContent = _templates[0] ? _templates[0].messageTemplateContent : 'day la tin nhan thu nghiem';

      if (_smsConfig) {
        let smsProvider = _smsConfig.smsProvider;
        if (smsProvider === SMS_PROVIDER.VIVAS) {
          _customSMSClient = await SMSAPIFunctions.createClient(
            _smsConfig.smsUrl,
            _smsConfig.smsUserName,
            _smsConfig.smsPassword,
            _smsConfig.smsBrand,
          );
          sendResult = await SMSAPIFunctions.sendSMS(_sampleContent, [smsData.phoneNumber], _customSMSClient);
        } else if (smsProvider === SMS_PROVIDER.VIETTEL) {
          _customSMSClient = await SMSSOAPFunctions.createClient(
            _smsConfig.smsUrl,
            _smsConfig.smsUserName,
            _smsConfig.smsPassword,
            _smsConfig.smsCPCode,
            _smsConfig.smsServiceId,
          );

          sendResult = await SMSSOAPFunctions.sendSMS(_sampleContent, smsData.phoneNumber, _customSMSClient);
        } else if (smsProvider === SMS_PROVIDER.VMG) {
          _customSMSClient = await SMSVMGAPIFunctions.createClient(_smsConfig.smsUrl, _smsConfig.smsToken, _smsConfig.smsBrand);
          sendResult = await SMSVMGAPIFunctions.sendSMSMessage(smsData.phoneNumber, _sampleContent, _customSMSClient);
        }

        if (sendResult) {
          let messageCustomerSMSRecord = MessageCustomerMarketingFunctions.mappingResponseSMS(sendResult, smsProvider);

          sendResult = {
            ...sendResult,
            ...messageCustomerSMSRecord,
          };
        }
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestSMS failed');
    }
  });
}

async function sendTestZNS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let znsData = req.payload;
      let _znsConfig = znsData.znsConfig;
      let _customZNSClient = undefined;

      let sendResult = undefined;

      if (_znsConfig) {
        let znsProvider = _znsConfig.znsProvider;
        if (znsProvider === SMS_PROVIDER.VMG) {
          const ZNSVMGAPIFunctions = require('../../../ThirdParty/ZNSVMGAPIClient/ZNSVMGAPIFunctions');
          _customZNSClient = await ZNSVMGAPIFunctions.createClient(_znsConfig.znsUrl, _znsConfig.znsToken, _znsConfig.znsBrand);
          const UNDEFINED_TRACK_ID = 0;
          const DEFINED_VMG_TEMPLATE_ID = 227966;
          sendResult = await ZNSVMGAPIFunctions.sendZNSMessageByVMGAPI(
            znsData.phoneNumber,
            'day la tin nhan thu nghiem',
            _customZNSClient,
            UNDEFINED_TRACK_ID,
            DEFINED_VMG_TEMPLATE_ID,
            { bien_so_xe: 'bien_so_xe', ten_khach_hang: 'ten_khach_hang', ngay_het_han: 'ngay_het_han' },
          );
        }
      }

      if (sendResult) {
        resolve(sendResult);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('sendTestSMS failed');
    }
  });
}

function _mappingStatusByProvider(smsProvider, status) {
  const { MESSAGE_STATUS } = require('../CustomerMessageConstant');
  let mappedStatus = {
    messageSendStatus: MESSAGE_STATUS.SENDING,
    messageNote: '',
  };

  let _messageSendStatus = MESSAGE_STATUS.SENDING;
  let _messageNote = '';
  if (smsProvider === SMS_PROVIDER.VMG) {
    switch (status) {
      case 0: // 0: Tin chờ duyệt (bị giữ lại do chứa nội dung QC),
        _messageSendStatus = MESSAGE_STATUS.SENDING;
        _messageNote = '0: Tin chờ duyệt (bị giữ lại do chứa nội dung QC)';
        break;
      case -2: // -2: Gửi telco thất bại.
        _messageSendStatus = MESSAGE_STATUS.FAILED;
        _messageNote = '-2: Gửi telco thất bại.';
        break;
      case -1: // -1: Bị từ chối duyệt hoặc có lỗi khi kiểm tra thông tin
        _messageSendStatus = MESSAGE_STATUS.FAILED;
        _messageNote = '-1: Bị từ chối duyệt hoặc có lỗi khi kiểm tra thông tin';
        break;
      case 1: // 1: Đã được duyệt,
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '1: Đã được duyệt,';
        break;
      case 2: // 2: Gửi telco thành công,
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '2: Gửi telco thành công,';
        break;
      case 3: // 3: seen
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '3: seen';
        break;
      case 4: // 4: subscribe
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '4: subscribe';
        break;
      case 5: // 5: unsubscribe
        _messageSendStatus = MESSAGE_STATUS.COMPLETED;
        _messageNote = '5: unsubscribe';
        break;
      case 6: // 6: expired
        _messageSendStatus = MESSAGE_STATUS.CANCELED;
        _messageNote = '6: expired';
        break;
      default:
        break;
    }
  }
  mappedStatus = {
    messageSendStatus: _messageSendStatus,
    messageNote: _messageNote,
  };
  return mappedStatus;
}

async function receiveVMGResult(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //msisdn: Số MT (interger)
      //requestId: Mã yêu cầu (String)
      //sendTime: Thời gian gửi tin (String)
      //responseTimeTelco: Thời gian gửi sang telco (chỉ áp dụng với callback SMS)(String)
      //status: Trạng thái tin (interger)
      //referentId: Mã chương trình chung của các message gửi (String)
      //retryCount: Số lần thử lại (integer)
      let smsData = req.payload;

      if (smsData.referentId) {
        let _sentCustomerMessage = await MessageCustomerMarketingResourceAccess.findById(smsData.referentId * 1);
        if (_sentCustomerMessage) {
          let updatedData = _mappingStatusByProvider(SMS_PROVIDER.VMG, smsData.status);
          await MessageCustomerMarketingResourceAccess.updateById(_sentCustomerMessage.messageCustomerId, updatedData);
        } else {
          reject('wrong referentId');
        }
      } else {
        reject('invalid referentId');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('receiveVMGResult failed');
    }
  });
}

async function reportTotalSMSByStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationId = req.payload.filter.stationId;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let monthlySMSCount = await MessageCustomerMarketingFunctions.countMonthlySMSByStation(stationId);

      if (!monthlySMSCount) {
        reject(API_FAILED);
      }
      let totalSMSCount = await MessageCustomerMarketingFunctions.sumCustomerSMS(stationId, startDate, endDate);

      if (totalSMSCount) {
        resolve({
          monthlySMSCount,
          totalSMSCount,
        });
      }
      reject(API_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function configQuantityMessageMarketing(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let quantityConfig = req.payload.quantityConfig;

      let station = await StationsResourceAccess.findById(stationsId);
      if (station) {
        let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(stationsId);
        if (stationsMarketingConfig) {
          let updateResult = await StationsMarketingConfigResourceAccess.updateById(stationsId, quantityConfig);
          if (updateResult) {
            resolve(updateResult);
          } else {
            reject(POPULAR_ERROR.UPDATE_FAILED);
          }
        } else {
          quantityConfig.stationsId = stationsId;
          let insertResult = await StationsMarketingConfigResourceAccess.insert(quantityConfig);
          if (insertResult) {
            resolve(insertResult);
          } else {
            reject(POPULAR_ERROR.UPDATE_FAILED);
          }
        }
      } else {
        reject(MARKETING_MESSAGE_ERROR.STATION_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getMessageMarketingConfig(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let station = await StationsResourceAccess.findById(stationsId);
      if (station) {
        let result = await StationsMarketingConfigResourceAccess.findById(stationsId);
        if (result) {
          resolve(result);
        } else {
          resolve({
            remainingQtyMessageSmsCSKH: 0,
            remainingQtyMessageZaloCSKH: 0,
            remainingQtyMessageAPNS: 0,
            remainingQtyMessageEmail: 0,
            remainingQtyMessageSmsPromotion: 0,
            remainingQtyMessageZaloPromotion: 0,
          });
        }
      } else {
        reject(MARKETING_MESSAGE_ERROR.STATION_NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetListMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      filter.customerId = req.currentUser.appUserId;
      let customerMessage = await MessageCustomerMarketingResourceAccess.customSearch(filter, skip, limit);

      if (customerMessage && customerMessage.length > 0) {
        const customerMessageCount = await MessageCustomerMarketingResourceAccess.customCount(filter);

        const customerMessageData = customerMessage.map(message => {
          return {
            customerId: message.customerId,
            messageCustomerId: message.messageCustomerId,
            messageContent: message.messageContent,
            messageSendStatus: message.messageSendStatus,
            messageTitle: message.messageTitle,
            createdAt: message.createdAt,
            customerScheduleId: message.customerScheduleId,
            customerStationId: message.customerStationId,
            isRead: message.isRead,
          };
        });

        resolve({ data: customerMessageData, total: customerMessageCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetDetailMessageById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerMessageId = req.payload.id;
      let _existingMessage = await MessageCustomerMarketingResourceAccess.findById(customerMessageId);
      if (_existingMessage) {
        if (_existingMessage.customerId === req.currentUser.appUserId) {
          await MessageCustomerMarketingResourceAccess.updateById(_existingMessage.messageCustomerId, { isRead: MESSAGE_ACTION_STATUS.READ });
          return resolve(_existingMessage);
        } else {
          return reject(MISSING_AUTHORITY);
        }
      }
      reject(NOT_FOUND);
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function sendVinaphoneSMS(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { templateId, requestId, params, phoneNumber } = req.payload;

      const result = await sendSMSListByTemplate([phoneNumber], params, templateId, requestId);

      if (result) {
        return resolve(result);
      } else {
        return reject(API_FAILED);
      }
    } catch (e) {
      reportToTelegram('SEND VINAPHONE SMS FAILED', e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function createVinaphoneSMSTemplate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      const { content, requestId, totalPrams } = req.payload;

      const result = await createTemplate(content, totalPrams, requestId);

      if (result) {
        return resolve(result);
      } else {
        return reject(API_FAILED);
      }
    } catch (e) {
      reportToTelegram('CREATE TEMPLATE VINAPHONE SMS FAILED', e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserSendMessageToCustomer(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let title = req.payload.title;
      let content = req.payload.content;
      let appUserId = req.payload.appUserId;

      const user = await AppUsersResourceAccess.findById(appUserId);
      if (!user) {
        return reject(NOT_FOUND);
      }

      let result = await MessageCustomerMarketingFunctions.createMessageForCustomerOnly(title, content, appUserId);
      if (result) {
        resolve(result);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function advanceUserGetFailedMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let stationsId = req.payload.stationsId;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let customerMessageCategories = req.payload.customerMessageCategories;
      if (startDate) {
        startDate = moment(startDate, 'DD/MM/YYYY').startOf('date').format();
      }
      if (endDate) {
        endDate = moment(endDate, 'DD/MM/YYYY').endOf('date').format();
      }
      let messageFailed = await MessageCustomerMarketingResourceAccess.customSearch(
        {
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
          customerStationId: stationsId,
          customerMessageCategories: customerMessageCategories,
        },
        skip,
        limit,
        startDate,
        endDate,
      );
      if (messageFailed && messageFailed.length > 0) {
        let messageFailedCount = await MessageCustomerMarketingResourceAccess.customCount(
          {
            messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
            customerStationId: stationsId,
            customerMessageCategories: customerMessageCategories,
          },
          startDate,
          endDate,
        );
        resolve({ data: messageFailed, total: messageFailedCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function advanceUserGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;

      //only get data of current station
      if (filter && req.currentUser.stationsId) {
        filter.customerStationId = req.currentUser.stationsId;
      }
      if (startDate) {
        startDate = moment(startDate, 'DD/MM/YYYY').startOf('date').format();
      }
      if (endDate) {
        endDate = moment(endDate, 'DD/MM/YYYY').endOf('date').format();
      }
      let customerMessage = await MessageCustomerMarketingResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (customerMessage && customerMessage.length > 0) {
        let customerMessageCount = await MessageCustomerMarketingResourceAccess.customCount(filter, startDate, endDate, searchText, order);

        resolve({ data: customerMessage, total: customerMessageCount });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function _generateReportOfStation(customerStationId, startDate, endDate) {
  try {
    if (moment(startDate, DATE_DISPLAY_FORMAT).isAfter(moment(endDate, DATE_DISPLAY_FORMAT))) {
      return reject(ERROR_START_DATE_AFTER_END_DATE);
    }

    let endMonth = moment(endDate, DATE_DISPLAY_FORMAT).startOf('month');
    let startMonth = moment(startDate, DATE_DISPLAY_FORMAT).startOf('month');
    let totalMonthsInRange = endMonth.diff(startMonth, 'months') + 1;

    if (totalMonthsInRange > 6) {
      totalMonthsInRange = 6;
      endDate = moment(startDate, DATE_DISPLAY_FORMAT).add(5, 'months').endOf('month').format(DATE_DISPLAY_FORMAT);
    }

    let summaryMessageByStatus = [];
    let summaryMessageByType = [];

    for (let i = 0; i < totalMonthsInRange; i++) {
      //  Tính toán ngày đầu của mỗi tháng
      let monthBegin = moment(startDate, DATE_DISPLAY_FORMAT).add(i, 'month').startOf('month');
      if (i === 0) {
        monthBegin = moment(startDate, DATE_DISPLAY_FORMAT).startOf('day');
      }

      //  Tính toán ngày cuối cùng của mỗi tháng
      let monthEnd = monthBegin.clone().endOf('month');
      if (i === totalMonthsInRange - 1) {
        monthEnd = moment(endDate, DATE_DISPLAY_FORMAT).endOf('day');
      }

      const [totalMessage, totalMessageSuccess, totalMessageInprogress, totalMessageFailed] = await Promise.all([
        MessageCustomerMarketingResourceAccess.customCount({ customerStationId }, monthBegin.format(), monthEnd.format()),
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED },
          monthBegin.format(),
          monthEnd.format(),
        ),
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING },
          monthBegin.format(),
          monthEnd.format(),
        ),
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED },
          monthBegin.format(),
          monthEnd.format(),
        ),
      ]);

      summaryMessageByStatus.unshift({
        month: monthBegin.format('YYYYMM'),
        totalMessage,
        totalMessageSuccess,
        totalMessageInprogress,
        totalMessageFailed,
      });

      const [totalMessageSMS, totalMessageZNS, totalMessageEmail] = await Promise.all([
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH },
          monthBegin.format(),
          monthEnd.format(),
        ),
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH },
          monthBegin.format(),
          monthEnd.format(),
        ),
        MessageCustomerMarketingResourceAccess.customCount(
          { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.EMAIL },
          monthBegin.format(),
          monthEnd.format(),
        ),
      ]);

      summaryMessageByType.unshift({
        month: monthBegin.format('YYYYMM'),
        totalMessage,
        totalMessageSMS,
        totalMessageZNS,
        totalMessageEmail,
        totalMessageAPNS: totalMessage - totalMessageSMS - totalMessageZNS - totalMessageEmail,
      });
    }

    let _startDate = moment(startDate, DATE_DISPLAY_FORMAT).startOf('day').format();
    let _endDate = moment(endDate, DATE_DISPLAY_FORMAT).endOf('day').format();

    const [totalMessage, totalMessageSuccess, totalMessageInprogress, totalMessageFailed] = await Promise.all([
      //Tổng số tin nhắn của station
      MessageCustomerMarketingResourceAccess.customCount({ customerStationId }, _startDate, _endDate),

      // Tổng số tin nhắn thành công
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn đang gửi
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn gửi thất bại
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED },
        _startDate,
        _endDate,
      ),
    ]);

    const [totalMessageSMS, totalMessageZNS, totalMessageEmail] = await Promise.all([
      // Tổng số tin nhắn SMS
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn Zalo
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn email
      MessageCustomerMarketingResourceAccess.customCount(
        { customerStationId, customerMessageCategories: MARKETING_MESSAGE_CATEGORY.EMAIL },
        _startDate,
        _endDate,
      ),
    ]);

    const [totalMessageSMSSuccess, totalMessageZNSSuccess, totalMessageEmailSuccess, totalMessageAPNSSuccess] = await Promise.all([
      // Tổng số tin nhắn SMS thành công
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn Zalo thành công
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn email thành công
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.EMAIL,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn APNS thành công
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.APNS,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
        },
        _startDate,
        _endDate,
      ),
    ]);

    const [totalMessageSMSFail, totalMessageZNSFail, totalMessageEmailFail, totalMessageAPNSFail] = await Promise.all([
      // Tổng số tin nhắn SMS thất bại
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn Zalo thất bại
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn email thất bại
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.EMAIL,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
        },
        _startDate,
        _endDate,
      ),

      // Tổng số tin nhắn APNS thất bại
      MessageCustomerMarketingResourceAccess.customCount(
        {
          customerStationId,
          customerMessageCategories: MARKETING_MESSAGE_CATEGORY.APNS,
          messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
        },
        _startDate,
        _endDate,
      ),
    ]);

    let reportOutput = {
      totalMessage, //SỐ LƯỢNG TIN NHẮN
      totalMessageSuccess, //GỬI THÀNH CÔNG
      totalMessageInprogress, //ĐANG GỬI
      totalMessageFailed, //GỬI THẤT BẠI
      summaryMessageByStatus,

      totalMessageAPNS: totalMessage - totalMessageSMS - totalMessageZNS - totalMessageEmail, //Gui qua app
      totalMessageSMS, // gui qua SMS
      totalMessageZNS, // gui qua Zalo
      totalMessageEmail, //gui qua email
      summaryMessageByType,

      totalMessageSMSSuccess, // SMS thành công
      totalMessageZNSSuccess, // ZNS hành công
      totalMessageEmailSuccess, // Email thành công
      totalMessageAPNSSuccess, // APNS thành công

      totalMessageSMSFail, // SMS thất bại
      totalMessageZNSFail, // ZNS thất bại
      totalMessageEmailFail, // Email thất bại
      totalMessageAPNSFail, // APNS thất bại
    };

    return reportOutput;
  } catch (e) {
    Logger.error(__filename, e);
  }
}

async function advanceUserGetReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerStationId = req.currentUser.stationsId;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const stationReport = _generateReportOfStation(customerStationId, startDate, endDate);

      resolve(stationReport);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getReportOfStation(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerStationId = req.payload.id;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      const stationReport = _generateReportOfStation(customerStationId, startDate, endDate);

      resolve(stationReport);
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  advanceUserGetList,
  advanceUserGetReport,
  advanceUserSendSMSMessageToCustomerList,
  sendsms,
  findTemplates,
  sendTestEmail,
  sendTestSMS,
  sendTestZNS,
  receiveVMGResult,
  reportTotalSMSByStation,
  userGetListMessage,
  userGetDetailMessageById,
  sendScheduleMessage,
  sendVinaphoneSMS,
  createVinaphoneSMSTemplate,
  advanceUserSendMessageToCustomer,
  sendMessageToCustomerList,
  advanceUserCancelSMSMessage,
  advanceUserSendZNSMessageToCustomerList,
  configQuantityMessageMarketing,
  getMessageMarketingConfig,
  sendZns,
  advanceUserGetFailedMessage,
  getReportOfStation,
};
