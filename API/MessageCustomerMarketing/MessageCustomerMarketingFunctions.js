/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const Handlebars = require('handlebars');
const moment = require('moment');
const MessageCustomerMarketingResourceAccess = require('./resourceAccess/MessageCustomerMarketingResourceAccess');
const MessageTemplateResourceAccess = require('../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const StationsResource = require('../Stations/resourceAccess/StationsResourceAccess');
const CustomerRecord = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerSchedule = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const ApiUtilsFunctions = require('../ApiUtils/utilFunctions');

const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const StationsMarketingConfigResourceAccess = require('./resourceAccess/StationsMarketingConfigResourceAccess');

const {
  MARKETING_MESSAGE_ERROR,
  MESSAGE_STATUS,
  MARKETING_MESSAGE_SEND_STATUS,
  MARKETING_MESSAGE_CATEGORY,
} = require('./MessageCustomerMarketingConstant');
const { SMS_PROVIDER } = require('../CustomerMessage/CustomerMessageConstant');

function isMatchedMessageDataContentWithTemplate(messageTemplate, messageData) {
  if (messageTemplate.messageTemplateData.length <= 0) {
    console.info(`messageTemplateData has no data, no need to check`);
    return 1;
  }

  messageTemplate.messageTemplateData.forEach(_templateData => {
    if (ApiUtilsFunctions.isNotValidValue(messageData[_templateData.paramName])) {
      console.info(`Lack of message data ${_templateData} in template`);
      return;
    }
    if (messageData[_templateData.paramName].length > _templateData.paramLength) {
      console.info(`Lack of message data ${_templateData} in template`);
      return;
    }
  });
  return 1;
}
function parseMesageTemplateData(messageTemplate) {
  if (ApiUtilsFunctions.isNotEmptyStringValue(messageTemplate.messageTemplateData) === false) {
    console.info(`messageTemplateData is empty, no need to check`);
    return 1;
  }
  try {
    messageTemplate.messageTemplateData = JSON.parse(messageTemplate.messageTemplateData);
  } catch (error) {
    console.error(`error isMatchedMessageDataContentWithTemplate`);
    console.error(messageTemplate);
    return;
  }
}
function isMatchedTemplateWithData(templateData, keyOfMessageFullData) {
  let isMatchedTemplateWithData = false;
  for (let j = 0; j < keyOfMessageFullData.length; j++) {
    if (templateData.paramName === keyOfMessageFullData[j]) {
      isMatchedTemplateWithData = true;
      break;
    }
  }
  if (!isMatchedTemplateWithData) {
    throw MARKETING_MESSAGE_ERROR.MISSING_DATA;
  }
}
function mappingResponseSMS(responseSMS, smsProvider) {
  let mappedResponseResult = {};
  if (smsProvider === SMS_PROVIDER.VIVAS) {
    mappedResponseResult = _mappingResponseSMSVivas(responseSMS);
  } else if (smsProvider === SMS_PROVIDER.VMG) {
    mappedResponseResult = _mappingResponseSMSVMG(responseSMS);
  } else {
    mappedResponseResult = _mappingResponseSMSViettel(responseSMS);
  }

  return mappedResponseResult;
}
function _mappingResponseSMSVMG(responseSMS) {
  const SMSVMGAPIFunctions = require('./../../ThirdParty/SMSVMGAPIClient/SMSVMGAPIFunctions');
  let mappedStatusSendSMS = {
    messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
    externalResult: '- NoError Không lỗi',
  };

  let code = responseSMS.errorCode;
  if (code !== undefined) {
    mappedStatusSendSMS.externalStatus = code;
    if (code !== '000') {
      console.info(`sendSMS error code : ${responseSMS.errorMessage}`);
      let responseError = SMSVMGAPIFunctions.responseSMSVMG[code];
      mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
    } else {
      console.info(`sendSMS: ${responseSMS.errorMessage}`);
      let responseMessage = SMSVMGAPIFunctions.responseSMSVMG[code];
      let data = responseSMS.data ? responseSMS.data : {};
      console.info(data);
      mappedStatusSendSMS.externalResult = responseMessage ? responseMessage.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.COMPLETED;
      mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    mappedStatusSendSMS.externalStatus = '-1';
  }

  if (responseSMS.referentId) {
    mappedStatusSendSMS.externalInfo = responseSMS.referentId;
  }

  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);

  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VMG;
  return mappedStatusSendSMS;
}
function _mappingResponseSMSVivas(responseSMS) {
  const SMSAPIFunctions = require('./../../ThirdParty/SMSAPIClient/SMSAPIClientFunctions');

  let mappedStatusSendSMS = {
    externalResult: '0: Request được tiếp nhận thành công',
  };

  let code = responseSMS.code;

  if (code !== undefined) {
    mappedStatusSendSMS.externalStatus = responseSMS.code;

    if (code !== 0) {
      let responseError = SMSAPIFunctions.responseReceiveValidSMSVivas[code];
      mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;

      if (code === 4) {
        mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.CANCELED;
      } else if (code === 1 || code === 2 || code === 5) {
        mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.SENDING;
      } else {
        mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
      }
    } else {
      let responseMessage = SMSAPIFunctions.responseReceiveValidSMSVivas[code];

      mappedStatusSendSMS.externalResult = responseMessage ? responseMessage.errorMessage : `error ${code}`;
      mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.COMPLETED;
      mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }
  } else {
    mappedStatusSendSMS.externalStatus = '-1';
  }

  if (responseSMS.transactionid) {
    mappedStatusSendSMS.externalInfo = responseSMS.transactionid;
  }

  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);
  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VIVAS;

  return mappedStatusSendSMS;
}
function _mappingResponseSMSViettel(responseSMS) {
  const SMSSOAPFunctions = require('./../../ThirdParty/SMSSoapClient/SMSClientFunctions');
  let mappedStatusSendSMS = {
    messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
    externalResult: 'Insert MT_QUEUE: OK',
  };
  let code = responseSMS.result;
  let errorMessageResponse = responseSMS.errorMessageResponse;

  if (code !== 0) {
    console.info(`sendSMS error : ${errorMessageResponse}`);
    let responseError = SMSSOAPFunctions.responseSMSViettel(errorMessageResponse);
    mappedStatusSendSMS.externalStatus = responseError.errorCode;
    mappedStatusSendSMS.externalResult = responseError ? responseError.errorMessage : `error ${code}`;
    mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.FAILED;
  } else {
    console.info(`sendSMS: Insert MT_QUEUE: OK`);
    mappedStatusSendSMS.messageSendStatus = MARKETING_MESSAGE_SEND_STATUS.COMPLETED;
    mappedStatusSendSMS.externalStatus = code;
    mappedStatusSendSMS.customerReceiveDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  }

  mappedStatusSendSMS.externalInfo = mappedStatusSendSMS.externalResult;
  mappedStatusSendSMS.messageNote = JSON.stringify(responseSMS);
  mappedStatusSendSMS.externalProvider = SMS_PROVIDER.VIETTEL;
  return mappedStatusSendSMS;
}
async function getTemplateMessages(stationId, filter, skip, limit) {
  let _usableTemplate = [];
  filter = { ...filter, messageTemplateEnabled: 1 };
  let _messageTemplates = await MessageTemplateResourceAccess.find(filter, skip, limit);
  let _count = await MessageTemplateResourceAccess.count(filter);
  for (let i = 0; i < _messageTemplates.length; i++) {
    const _template = _messageTemplates[i];
    if (_template.stationsId && stationId && _template.stationsId === stationId) {
      _usableTemplate.push(_template);
    }

    if (_template.stationsId === undefined || _template.stationsId === null) {
      _usableTemplate.push(_template);
    }
  }
  let dataResult = {
    templates: _usableTemplate,
    total: _count,
  };
  return dataResult;
}
async function retrySendMessageZaloToSMS(customerMessage, station, messageTemplate) {
  let messageTemplateData = customerMessage.messageTemplateData;
  messageTemplateData = JSON.parse(messageTemplateData);
  let templateData = {
    customerRecordPlatenumber: customerMessage.customerMessagePlateNumber,
    vehiclePlateNumber: customerMessage.customerMessagePlateNumber,
    customerRecordCheckExpiredDate: messageTemplateData.customerRecordCheckExpiredDate,
    stationsName: station.stationsName,
    stationsAddress: station.stationsAddress,
    stationsHotline: station.stationsHotline,
    stationCode: stationData.stationCode,
  };
  let customerMessageContent = Handlebars.compile(messageTemplate.messageTemplateContent)(templateData);
  templateData = ApiUtilsFunctions.tryStringify(templateData);
  let _newMarketingMessage = {
    customerMessagePhone: customerMessage.customerMessagePhone,
    customerMessagePlateNumber: customerMessage.customerMessagePlateNumber,
    customerStationId: station.stationsId,
    messageContent: customerMessageContent,
    messageTemplateData: templateData,
    messageTitle: messageTemplate.messageTemplateName,
    customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
    messagePrice: messageTemplate.messageTemplatePrice,
    retryZaloToSMS: customerMessage.messageMarketingId,
    messageSendDate: new Date().toISOString(),
  };
  // Tạo tin nhắn SMS
  return await MessageCustomerMarketingResourceAccess.insert(_newMarketingMessage);
}
async function sendMSMToCustomerByPhone(phoneNumber, plateNumber, station, messageTitle, messageContent) {
  //Kiểm tra trạm có bặt chức năng nhận lịch qua SMS
  if (station.stationEnableUseSMS !== 1) {
    return; // Thoát không làm gì cả
  }

  // Trạm sử dụng hết tin nhắn thì thông báo "Hết số lượng tin nhắn. Vui lòng liên hệ quản trị viên để được hỗ trợ"
  let stationsMarketingConfig = await StationsMarketingConfigResourceAccess.findById(station.stationsId);
  if (stationsMarketingConfig.remainingQtyMessageSmsCSKH <= 0) {
    return;
  }

  let _newMarketingMessage = {
    customerMessagePhone: phoneNumber,
    customerMessagePlateNumber: plateNumber,
    customerStationId: station.stationsId,
    messageTemplateData: null,
    messageContent: messageContent,
    messageTitle: messageTitle,
    customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
    messagePrice: 850,
  };

  // Tạo tin nhắn SMS để gửi cho khách hàng
  return await MessageCustomerMarketingResourceAccess.insert(_newMarketingMessage);
}

module.exports = {
  isMatchedMessageDataContentWithTemplate,
  mappingResponseSMS,
  getTemplateMessages,
  parseMesageTemplateData,
  isMatchedTemplateWithData,
  retrySendMessageZaloToSMS,
  sendMSMToCustomerByPhone,
};
