/* Copyright (c) 2023 TORITECH LIMITED 2022 */
'use strict';
const MessageCustomerMarketingResourceAccess = require('../CustomerMessage/resourceAccess/MessageCustomerMarketingResourceAccess');
const StationsResourceAccess = require('../Stations/resourceAccess/StationsResourceAccess');
const moment = require('moment');
const StationMessageDailyReportResourceAccess = require('./resourceAccess/StationMessageDailyReportResourceAccess');
const { MARKETING_MESSAGE_CATEGORY, MARKETING_MESSAGE_SEND_STATUS } = require('../MessageCustomerMarketing/MessageCustomerMarketingConstant');
async function countStationMessageReport(startDate, endDate) {
  let skip = 0;
  let limit = 50;
  let resultReport = [];
  while (true) {
    let stationsList = await StationsResourceAccess.find({}, skip, limit);
    if (stationsList && stationsList.length > 0) {
      for (let i = 0; i < stationsList.length; i++) {
        const stationId = stationsList[i].stationsId;
        let result = await countMessageReportByStation(stationId, startDate, endDate);
        resultReport.push(result);
      }
    } else {
      break;
    }
    skip += limit;
  }
  return resultReport;
}
async function countMessageReportByStation(stationId, startDate, endDate) {
  let totalSMSCskh = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
    },
    startDate,
    endDate,
  );
  let totalZnsCskh = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
    },
    startDate,
    endDate,
  );
  let totalEmail = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.EMAIL,
    },
    startDate,
    endDate,
  );
  let totalAPNS = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.APNS,
    },
    startDate,
    endDate,
  );
  let totalSMSPromotion = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_PROMOTION,
    },
    startDate,
    endDate,
  );
  let totalZnsPromotion = await MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_PROMOTION,
    },
    startDate,
    endDate,
  );

  let smsCskhResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.SMS_CSKH, stationId, stationId);
  let znsCskhResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.ZALO_CSKH, stationId);
  let emailResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.EMAIL, stationId);
  let apnsResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.APNS, stationId);
  let smsPromotionResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.SMS_PROMOTION, stationId);
  let znsPromotionResult = await _countMessageByCategory(startDate, endDate, MARKETING_MESSAGE_CATEGORY.ZALO_PROMOTION, stationId);

  // Hiện tại chưa có dữ liệu ở systemConfiguration, sẽ bổ sung sau
  let totalPaySMSCskh = null;
  let totalPayZNSCskh = null;
  let totalPayEmail = null;
  let totalPayAPNS = null;
  let totalPaySMSPromotion = null;
  let totalPayZnsPromotion = null;

  let currentDate = moment().format('YYYYMMDD');

  let objSMSCskh = {
    numOfSMSCskh: totalSMSCskh,
    numOfSMSCskhNew: smsCskhResult.totalNew,
    numOfSMSCskhSending: smsCskhResult.totalSending,
    numOfSMSCskhCompleted: smsCskhResult.totalCompleted,
    numOfSMSCskhFailed: smsCskhResult.totalFailed,
    numOfSMSCskhCanceled: smsCskhResult.totalCanceled,
    totalPaySMSCskh: totalPaySMSCskh,
  };

  let objZnsCskh = {
    numOfZNSCskh: totalZnsCskh,
    numOfZNSCskhNew: znsCskhResult.totalNew,
    numOfZNSCskhSending: znsCskhResult.totalSending,
    numOfZNSCskhCompleted: znsCskhResult.totalCompleted,
    numOfZNSCskhFailed: znsCskhResult.totalFailed,
    numOfZNSCskhCanceled: znsCskhResult.totalCanceled,
    totalPayZNSCskh: totalPayZNSCskh,
  };

  let objEmail = {
    numOfEmail: totalEmail,
    numOfEmailNew: emailResult.totalNew,
    numOfEmailSending: emailResult.totalSending,
    numOfEmailCompleted: emailResult.totalCompleted,
    numOfEmailFailed: emailResult.totalFailed,
    numOfEmailCanceled: emailResult.totalCanceled,
    totalPayEmail: totalPayEmail,
  };

  let objAPNS = {
    numOfAPNS: totalAPNS,
    numOfAPNSNew: apnsResult.totalNew,
    numOfAPNSSending: apnsResult.totalSending,
    numOfAPNSCompleted: apnsResult.totalCompleted,
    numOfAPNSFailed: apnsResult.totalFailed,
    numOfAPNSCanceled: apnsResult.totalCanceled,
    totalPayAPNS: totalPayAPNS,
  };

  let objSMSPromotion = {
    numOfSMSPromotion: totalSMSPromotion,
    numOfSMSPromotionNew: smsPromotionResult.totalNew,
    numOfSMSPromotionSending: smsPromotionResult.totalSending,
    numOfSMSPromotionCompleted: smsPromotionResult.totalCompleted,
    numOfSMSPromotionFailed: smsPromotionResult.totalFailed,
    numOfSMSPromotionCanceled: smsPromotionResult.totalCanceled,
    totalPaySMSPromotion: totalPaySMSPromotion,
  };

  let objZnsPromotion = {
    numOfZNSPromotion: totalZnsPromotion,
    numOfZNSPromotionNew: znsPromotionResult.totalNew,
    numOfZNSPromotionSending: znsPromotionResult.totalSending,
    numOfZNSPromotionCompleted: znsPromotionResult.totalCompleted,
    numOfZNSPromotionFailed: znsPromotionResult.totalFailed,
    numOfZNSPromotionCanceled: znsPromotionResult.totalCanceled,
    totalPayZnsPromotion: totalPayZnsPromotion,
  };

  let dataReport = {
    ...objSMSCskh,
    ...objZnsCskh,
    ...objEmail,
    ...objAPNS,
    ...objSMSPromotion,
    ...objZnsPromotion,
    stationId: stationId,
    reportDay: currentDate,
  };
  let result;
  let messageReport = await StationMessageDailyReportResourceAccess.customSearch({ stationId: stationId }, undefined, undefined, startDate, endDate);
  if (messageReport && messageReport.length > 0) {
    result = await StationMessageDailyReportResourceAccess.updateById(messageReport[0].stationMessageDailyReportId, dataReport);
  } else {
    result = await StationMessageDailyReportResourceAccess.insert(dataReport);
  }
  return result;
}

async function _countMessageByCategory(startDate, endDate, messageCategory, stationId) {
  let totalNew = MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: messageCategory,
      messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.NEW,
    },
    startDate,
    endDate,
  );
  let totalSending = MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: messageCategory,
      messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.SENDING,
    },
    startDate,
    endDate,
  );
  let totalCompleted = MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: messageCategory,
      messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
    },
    startDate,
    endDate,
  );
  let totalFailed = MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: messageCategory,
      messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
    },
    startDate,
    endDate,
  );
  let totalCanceled = MessageCustomerMarketingResourceAccess.customCount(
    {
      customerStationId: stationId,
      customerMessageCategories: messageCategory,
      messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
    },
    startDate,
    endDate,
  );
  let result = await Promise.all([totalNew, totalSending, totalCompleted, totalFailed, totalCanceled]);
  return {
    totalNew: result[0],
    totalSending: result[1],
    totalCompleted: result[2],
    totalFailed: result[3],
    totalCanceled: result[4],
  };
}

module.exports = {
  countStationMessageReport,
  countMessageReportByStation,
};
