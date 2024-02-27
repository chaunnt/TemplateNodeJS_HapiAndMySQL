/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const Handlebars = require('handlebars');

const CustomerRecord = require('../../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const UtilsFunction = require('../../ApiUtils/utilFunctions');
const StationMessageConfigsAccess = require('../resourceAccess/StationMessageConfigsAccess');
const MessageTemplateResourceAccess = require('../../MessageTemplate/resourceAccess/MessageTemplateResourceAccess');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { MARKETING_MESSAGE_ERROR, MARKETING_MESSAGE_CATEGORY } = require('../../MessageCustomerMarketing/MessageCustomerMarketingConstant');
const MessageCustomerMarketingResourceAccess = require('../../MessageCustomerMarketing/resourceAccess/MessageCustomerMarketingResourceAccess');
const { sendMessageAPNSCustomer } = require('../../CustomerMessage/CustomerMessageFunctions');

async function autoSendStationsMessage() {
  console.info(`START autoSendStationsMessage ${new Date()}`);
  let _skipCounter = 0;
  let _limit = 10;
  while (true) {
    let promiseList = [];

    let stationsList = await StationMessageConfigsAccess.find({}, _skipCounter, _limit);
    _skipCounter += _limit;

    if (stationsList && stationsList.length > 0) {
      for (let i = 0; i < stationsList.length; i++) {
        const station = stationsList[i];
        const promise = await _sendStationMessage(station);
        promiseList.push(promise);
      }
    }

    if (promiseList.length > 0) {
      await UtilsFunction.executeBatchPromise(promiseList);
    } else {
      break;
    }
  }
  console.info(`FINISH autoSendStationsMessage ${new Date()}`);
  process.exit();
}

async function _sendStationMessage(station) {
  return new Promise(async (resolve, reject) => {
    //Skip TEST station
    if (!station.stationsId) {
      resolve('OK');
      return;
    }

    if (station.enableNotiByAPNS || station.enableNotiBySmsCSKH || station.enableNotiByZaloCSKH || station.enableNotiByAutoCall) {
      let results = {};
      if (station.enableAutoSentNotiBefore30Days) {
        results.before30Days = await _sendMessageBeforeDays(30, station);
      }
      if (station.enableAutoSentNotiBefore15Days) {
        results.before15Days = await _sendMessageBeforeDays(15, station);
      }
      if (station.enableAutoSentNotiBefore7Days) {
        results.before7Days = await _sendMessageBeforeDays(7, station);
      }
      if (station.enableAutoSentNotiBefore3Days) {
        results.before3Days = await _sendMessageBeforeDays(3, station);
      }
      if (station.enableAutoSentNotiBefore1Days) {
        results.before1Days = await _sendMessageBeforeDays(1, station);
      }
      if (station.enableAutoSentNotiBeforeOtherDays) {
        results.beforeOtherDays = await _sendMessageBeforeDays(station.enableAutoSentNotiBeforeOtherDays, station);
      }
      resolve('OK');
    } else {
      resolve('DONE');
    }
  });
}
async function _sendMessageBeforeDays(day, station) {
  let time = moment().add(day, 'days').format('DD/MM/YYYY');
  let customerRecordArr = await CustomerRecord.find({ customerStationId: station.stationsId, customerRecordCheckExpiredDate: time });
  let stationData = await StationsResourceAccess.findById(station.stationsId);
  if (customerRecordArr && customerRecordArr.length > 0) {
    let results = {};
    // gửi tn APNS
    if (station.enableNotiByAPNS) {
      if (stationData.enableUseAPNSMessages !== 1) {
        results.notiBySmsCSKH = MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_APNS;
      }
      let messageTemplate = await MessageTemplateResourceAccess.findById(station.messageTemplateAPNS);
      if (messageTemplate) {
        let customerDataArr = [];
        for (let i = 0; i < customerRecordArr.length; i++) {
          let customerRecord = customerRecordArr[i];
          let templateParams = {
            vehiclePlateNumber: customerRecord.customerRecordPlatenumber,
            customerRecordCheckExpiredDate: customerRecord.customerRecordCheckExpiredDate,
            stationCode: stationData.stationCode,
            stationsAddress: stationData.stationsAddress,
            stationsHotline: stationData.stationsHotline,
            stationCode: stationData.stationCode,
          };
          let customerMessageContent = Handlebars.compile(messageTemplate.messageTemplateContent)(templateParams);
          customerDataArr.push({
            customerMessageEmail: customerRecord.customerRecordEmail,
            customerMessagePhone: customerRecord.customerRecordPhone,
            customerId: customerRecord.appUserId,
            customerRecordPlatenumber: customerRecord.customerRecordPlatenumber,
            customerMessageContent: customerMessageContent,
          });
        }
        results.notiByAPNS = await sendMessageAPNSCustomer(
          customerDataArr,
          station.stationsId,
          MARKETING_MESSAGE_CATEGORY.APNS,
          stationData,
          messageTemplate.messageTemplatePrice,
        );
      } else {
        console.error('messageTemplate undefined');
        results.notiByAPNS = undefined;
      }
    }
    // gửi tn SMS CSKH
    if (station.enableNotiBySmsCSKH) {
      if (stationData.stationEnableUseSMS !== 1) {
        results.notiBySmsCSKH = MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_SMS;
      }
      results.notiBySmsCSKH = await importMessage(
        station.messageTemplateSmsCSKH,
        customerRecordArr,
        stationData,
        station.stationsId,
        MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
      );
    }
    // gửi tn Zalo CSKH
    if (station.enableNotiByZaloCSKH) {
      if (stationData.stationEnableUseZNS !== 1) {
        results.notiByZaloCSKH = MARKETING_MESSAGE_ERROR.STATIONS_UNENABLED_ZNS;
      }
      results.notiByZaloCSKH = await importMessage(
        station.messageTemplateZaloCSKH,
        customerRecordArr,
        stationData,
        station.stationsId,
        MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
      );
    }
    // gửi phoneCall
    if (station.enableNotiByAutoCall) {
      results.notiByAutoCall = await importMessage(
        station.messageTemplateAutoCall,
        customerRecordArr,
        stationData,
        station.stationsId,
        MARKETING_MESSAGE_CATEGORY.PHONE_CALL,
      );
    }
    return results;
  }
  return undefined;
}

async function importMessage(templateMessage, customerRecordArr, stationData, stationsId, customerMessageCategories) {
  let messageTemplate = await MessageTemplateResourceAccess.findById(templateMessage);
  if (messageTemplate) {
    let _newMessageList = [];
    for (let i = 0; i < customerRecordArr.length; i++) {
      let customerRecord = customerRecordArr[i];

      // Kiểm tra tin nhắn cho khách hàng này ngày hôm nay đã có chưa
      const existedMessage = await MessageCustomerMarketingResourceAccess.customSearch(
        {
          customerMessagePhone: customerRecord.customerRecordPhone,
          customerMessagePlateNumber: customerRecord.customerRecordPlatenumber,
          customerStationId: stationsId,
          customerMessageCategories: customerMessageCategories,
        },
        0,
        1,
        moment().startOf('day').format(),
        moment().endOf('day').format(),
      );

      // Ngày hôm nay đã tạo tin nhắn cho khách hàng thì bỏ qua
      if (existedMessage && existedMessage.length > 0) {
        continue;
      }

      let templateData = {
        customerRecordPlatenumber: customerRecord.customerRecordPlatenumber,
        vehiclePlateNumber: customerRecord.customerRecordPlatenumber,
        customerRecordCheckExpiredDate: customerRecord.customerRecordCheckExpiredDate,
        stationsName: stationData.stationsName,
        stationsAddress: stationData.stationsAddress,
        stationsHotline: stationData.stationsHotline,
        stationCode: stationData.stationCode,
      };
      let customerMessageContent = Handlebars.compile(messageTemplate.messageTemplateContent)(templateData);
      templateData = UtilsFunction.tryStringify(templateData);
      let _newMarketingMessage = {
        customerMessagePhone: customerRecord.customerRecordPhone,
        customerMessagePlateNumber: customerRecord.customerRecordPlatenumber,
        customerStationId: stationsId,
        messageContent: customerMessageContent,
        messageTemplateData: templateData,
        messageTitle: messageTemplate.messageTemplateName,
        customerMessageCategories: customerMessageCategories,
        messagePrice: messageTemplate.messageTemplatePrice,
        messageZNSTemplateId: messageTemplate.messageZNSTemplateId,
      };
      _newMessageList.push(_newMarketingMessage);
    }

    if (_newMessageList.length > 0) {
      return await MessageCustomerMarketingResourceAccess.insert(_newMessageList);
    }
  }
  console.error('messageTemplate undefined');
  return undefined;
}
autoSendStationsMessage();

module.exports = {
  autoSendStationsMessage,
};
