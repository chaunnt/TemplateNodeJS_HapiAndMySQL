/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Handlebars = require('handlebars');
const moment = require('moment');
const CustomerMessageResourceAccess = require('../resourceAccess/CustomerMessageResourceAccess');
const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
const Logger = require('../../../utils/logging');
const SMSAPIFunctions = require('../../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');
const SMSSOAPFunctions = require('../../../ThirdParty/SMSSoapClient/SMSClientFunctions');
const CustomerRecordResourceAccess = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const SystemAppLogFunctions = require('../../SystemAppChangedLog/SystemAppChangedLogFunctions');
const CustomerMessageFunctions = require('../CustomerMessageFunctions');
const MessageCustomerView = require('../resourceAccess/MessageCustomerView');
const {
  SMS_PROVIDER,
  EMAIL_PROVIDER,
  MESSAGE_ACTION_STATUS,
  MESSAGE_CATEGORY,
  MESSAGE_SEND_STATUS,
  MESSAGE_REJECT,
} = require('../CustomerMessageConstant');
const SMSVMGAPIFunctions = require('../../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
const { MISSING_AUTHORITY, UNKNOWN_ERROR, NOT_FOUND, API_FAILED, ERROR_START_DATE_AFTER_END_DATE } = require('../../Common/CommonConstant');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { sendSMSListByTemplate, createTemplate } = require('../../../ThirdParty/SMSVinaPhone/SMSVinaPhoneFunctions');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');

const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');
const { stationSendNewMessage } = require('../../AppUserConversation/AppUserChatLogFunction');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');

async function sendsms(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let message = req.payload.message;
      let phoneNumber = req.payload.phoneNumber;
      let check = await checkStatusSMS(phoneNumber);
      if (check) {
        let result = await SMSAPIFunctions.sendSMS(message, [phoneNumber]);
        if (result) {
          resolve(result);
        } else {
          reject(API_FAILED);
        }
      } else {
        reject('has exceeded the number of submissions this month');
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

      const result = await CustomerMessageFunctions.createMessageForCustomerOnly(title, message, schedule.appUserId, NO_SEND_SMS, schedule.email, {
        customerScheduleId,
      });

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
  let count = await MessageCustomerResourceAccess.customCount({ customerMessagePhone: phoneNumber }, startDate, endDate, undefined, undefined);
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

      let customerMessage = await MessageCustomerView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (customerMessage && customerMessage.length > 0) {
        let customerMessageCount = await MessageCustomerView.customCount(filter, startDate, endDate, searchText, order);

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

      let messageCustomer = await MessageCustomerResourceAccess.findById(req.payload.id);

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

      await MessageCustomerResourceAccess.updateById(req.payload.id, {
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
      let result = await MessageCustomerView.findById(customerMessageId);
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

async function sendMessageByFilter(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let userStationId = req.currentUser.stationsId;

      //validate payload to prevent crash
      if (filter === undefined) {
        filter = {};
      }

      //do not have permission for different station
      if (userStationId === undefined) {
        console.error(`sendMessageByFilter do not have stationId`);
        reject('sendMessageByFilter do not have stationId');
        return;
      }

      //retrieve info for customer list for this station only
      let customerList = await CustomerRecordResourceAccess.customSearchByExpiredDate(
        {
          customerStationId: userStationId,
        },
        undefined,
        undefined,
        filter.startDate,
        filter.endDate,
        filter.searchText,
      );

      //filter into waiting list
      let _waitToSendList = [];
      for (let i = 0; i < customerList.length; i++) {
        const customer = customerList[i];
        //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
        if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === '') {
          continue;
        }
        _waitToSendList.push(customer);
      }

      let customerMessageContent = req.payload.customerMessageContent;
      let customerMessageCategories = req.payload.customerMessageCategories;
      //Send message to many customer
      let result = await CustomerMessageFunctions.sendMessageToManyCustomer(
        _waitToSendList,
        userStationId,
        customerMessageContent,
        customerMessageCategories,
        req.payload.customerMessageTemplateId,
      );
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

async function sendMessageByCustomerList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userStationId = req.currentUser.stationsId;
      let customerMessageContent = req.payload.customerMessageContent;
      let customerMessageCategories = req.payload.customerMessageCategories;
      let customerMessageTemplateId = req.payload.customerMessageTemplateId;
      let customerList = [];
      let customerRecordIdList = req.payload.customerRecordIdList;

      //retrieve info for customer list
      for (var i = 0; i < customerRecordIdList.length; i++) {
        let customer = await CustomerRecordResourceAccess.findById(customerRecordIdList[i]);
        if (customer) {
          //VTSS-128 không gửi tin nhắn cho xe không có ngày hết hạn
          if (customer.customerRecordCheckExpiredDate === null || customer.customerRecordCheckExpiredDate.trim() === '') {
            continue;
          }
          customerList.push(customer);
        }
      }

      //Send message to many customer
      let result = await CustomerMessageFunctions.sendMessageToManyCustomer(
        customerList,
        userStationId,
        customerMessageContent,
        customerMessageCategories,
        customerMessageTemplateId,
      );
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
      if (customerMessageCategories === MESSAGE_CATEGORY.SMS) {
        if (stationData.stationEnableUseSMS !== 1) {
          return reject(MESSAGE_REJECT.STATIONS_UNENABLED_SMS);
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
        let result = await CustomerMessageFunctions.sendSMSMessageToManyCustomer(
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
      } else if (customerMessageCategories === MESSAGE_CATEGORY.APNS) {
        if (stationData.enableUseAPNSMessages !== 1) {
          return reject(MESSAGE_REJECT.STATIONS_UNENABLED_APNS);
        }
        let sendResultArr = [];
        let result = await CustomerMessageFunctions.sendMessageAPNSCustomer(
          customerArr,
          userStationId,
          customerMessageCategories,
          stationData,
          messagePrice,
        );

        if (result && result.length > 0) {
          sendResultArr.push(result);
        } else {
          reject(MESSAGE_REJECT.SEND_APNS_FAILED);
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
      if (Object.keys(MESSAGE_REJECT).indexOf(e) >= 0) {
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
      let templates = await CustomerMessageFunctions.getTemplateMessages(stationsId, filter, skip, limit);
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

      let _templates = await CustomerMessageFunctions.getTemplateMessages();
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
          let messageCustomerSMSRecord = CustomerMessageFunctions.mappingResponseSMS(sendResult, smsProvider);

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
        const MessageCustomerResourceAccess = require('../resourceAccess/MessageCustomerResourceAccess');
        let _sentCustomerMessage = await MessageCustomerResourceAccess.findById(smsData.referentId * 1);
        if (_sentCustomerMessage) {
          let updatedData = _mappingStatusByProvider(SMS_PROVIDER.VMG, smsData.status);
          await MessageCustomerResourceAccess.updateById(_sentCustomerMessage.messageCustomerId, updatedData);
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
      let monthlySMSCount = await CustomerMessageFunctions.countMonthlySMSByStation(stationId);

      if (!monthlySMSCount) {
        reject(API_FAILED);
      }
      let totalSMSCount = await CustomerMessageFunctions.sumCustomerSMS(stationId, startDate, endDate);

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

async function userGetListMessage(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;

      filter.customerId = req.currentUser.appUserId;
      let customerMessage = await MessageCustomerView.customSearch(filter, skip, limit);

      if (customerMessage && customerMessage.length > 0) {
        const customerMessageCount = await MessageCustomerView.customCount(filter);

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
            messageType: message.messageType,
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
      let _existingMessage = await MessageCustomerView.findById(customerMessageId);
      if (_existingMessage) {
        if (_existingMessage.customerId === req.currentUser.appUserId) {
          await MessageCustomerResourceAccess.updateById(_existingMessage.messageCustomerId, { isRead: MESSAGE_ACTION_STATUS.READ });
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

      let result = await CustomerMessageFunctions.createMessageForCustomerOnly(title, content, appUserId);
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

      let customerMessage = await MessageCustomerView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (customerMessage && customerMessage.length > 0) {
        let customerMessageCount = await MessageCustomerView.customCount(filter, startDate, endDate, searchText, order);

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

async function advanceUserGetReport(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerStationId = req.currentUser.stationsId;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (moment(startDate, DATE_DISPLAY_FORMAT).isAfter(moment(endDate, DATE_DISPLAY_FORMAT))) {
        return reject(ERROR_START_DATE_AFTER_END_DATE);
      }

      let endMonth = moment(endDate, DATE_DISPLAY_FORMAT).startOf('month');
      let startMonth = moment(startDate, DATE_DISPLAY_FORMAT).startOf('month');
      let totalMonthsInRange = endMonth.diff(startMonth, 'months') + 1;

      if (totalMonthsInRange > 6) {
        totalMonthsInRange = 6;
        endDate = moment(startDate, DATE_DISPLAY_FORMAT).add(5, 'months').endOf('month').format();
      }

      let summaryMessageByStatus = [];
      let summaryMessageByType = [];

      for (let i = 0; i < totalMonthsInRange; i++) {
        //  Tính toán ngày đầu của mỗi tháng
        let monthBegin = moment(startDate, DATE_DISPLAY_FORMAT).add(i, 'month').startOf('month');
        if (i === 0) {
          monthBegin = moment(startDate, DATE_DISPLAY_FORMAT);
        }

        //  Tính toán ngày cuối cùng của mỗi tháng
        let monthEnd = monthBegin.clone().endOf('month');
        if (i === totalMonthsInRange - 1) {
          monthEnd = moment(endDate, DATE_DISPLAY_FORMAT);
        }

        const [totalMessage, totalMessageSuccess, totalMessageInprogress, totalMessageFailed] = await Promise.all([
          MessageCustomerView.customCountTotalMsg({ customerStationId }, monthBegin, monthEnd),
          MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.COMPLETED }, monthBegin, monthEnd),
          MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.SENDING }, monthBegin, monthEnd),
          MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.FAILED }, monthBegin, monthEnd),
        ]);

        summaryMessageByStatus.unshift({
          month: monthBegin.format('YYYYMM'),
          totalMessage,
          totalMessageSuccess,
          totalMessageInprogress,
          totalMessageFailed,
        });

        const [totalMessageSMS, totalMessageZNS, totalMessageEmail] = await Promise.all([
          MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.SMS }, monthBegin, monthEnd),
          MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.ZNS }, monthBegin, monthEnd),
          MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.EMAIL }, monthBegin, monthEnd),
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

      const [totalMessage, totalMessageSuccess, totalMessageInprogress, totalMessageFailed] = await Promise.all([
        //Tổng số tin nhắn của station
        MessageCustomerView.customCountTotalMsg({ customerStationId }, startDate, endDate),

        // Tổng số tin nhắn thành công
        MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.COMPLETED }, startDate, endDate),

        // Tổng số tin nhắn đang gửi
        MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.SENDING }, startDate, endDate),

        // Tổng số tin nhắn gửi thất bại
        MessageCustomerView.customCountTotalMsg({ customerStationId, messageSendStatus: MESSAGE_SEND_STATUS.FAILED }, startDate, endDate),
      ]);

      const [totalMessageSMS, totalMessageZNS, totalMessageEmail] = await Promise.all([
        // Tổng số tin nhắn SMS
        MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.SMS }, startDate, endDate),

        // Tổng số tin nhắn Zalo
        MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.ZNS }, startDate, endDate),

        // Tổng số tin nhắn email
        MessageCustomerView.customCountTotalMsg({ customerStationId, customerMessageCategories: MESSAGE_CATEGORY.EMAIL }, startDate, endDate),
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
      };

      resolve(reportOutput);
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
  sendsms,
  sendMessageByFilter,
  sendMessageByCustomerList,
  findTemplates,
  sendTestEmail,
  sendTestSMS,
  receiveVMGResult,
  reportTotalSMSByStation,
  userGetListMessage,
  userGetDetailMessageById,
  sendScheduleMessage,
  sendVinaphoneSMS,
  createVinaphoneSMSTemplate,
  advanceUserSendMessageToCustomer,
  sendMessageToCustomerList,
};
