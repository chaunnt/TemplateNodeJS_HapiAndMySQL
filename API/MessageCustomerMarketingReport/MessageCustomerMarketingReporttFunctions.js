/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const MessageCustomerMarketingtResourceAccess = require('../MessageCustomerMarketing/resourceAccess/MessageCustomerMarketingResourceAccess');
const MsgMarketingReportResourceAccess = require('./resourceAccess/MsgMarketingReportResourceAccess');
const { MARKETING_MESSAGE_CATEGORY, MARKETING_MESSAGE_SEND_STATUS } = require('../MessageCustomerMarketing/MessageCustomerMarketingConstant');
const moment = require('moment');
const { REPORT_DATE_DISPLAY_FORMAT, REPORT_DATE_DATA_FORMAT } = require('./MessageCustomerMarketingReportConstants');

async function updateMsgCustomerMarketingStationReportByDay(stationId, reportDay, reportData, forceUpdate = true) {
  reportDay = moment(reportDay, REPORT_DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT);

  let _existingReport = await MsgMarketingReportResourceAccess.findOne({
    stationId: stationId,
    reportDay: reportDay,
  });

  if (_existingReport && forceUpdate === false) {
    return _existingReport;
  }

  if (!_existingReport) {
    let _newStationReport = {
      stationId: stationId,
      reportDay: reportDay,
      ...reportData,
    };

    let _newReportId = await MsgMarketingReportResourceAccess.insert(_newStationReport);
    if (_newReportId) {
      _newReportId = _newReportId[0];
      _existingReport = await MsgMarketingReportResourceAccess.findById(_newReportId);
    } else {
      console.error(reportData);
      console.error(`can not insert new report for station ${stationId} - at ${reportDay}`);
      return undefined;
    }
  }

  if (!_existingReport) {
    console.error(`invalid report to update for station ${stationId} - at ${reportDay}`);
    return undefined;
  }

  await MsgMarketingReportResourceAccess.updateById(_existingReport.msgCustomerMarketingReportId, reportData);

  _existingReport = await MsgMarketingReportResourceAccess.findById(_existingReport.msgCustomerMarketingReportId);

  return _existingReport;
}

async function fetchDataMsgCustomerMarketingStationReportByDay(stationId, reportDay) {
  let startDate = moment(reportDay, REPORT_DATE_DISPLAY_FORMAT).startOf('day').format();
  let endDate = moment(reportDay, REPORT_DATE_DISPLAY_FORMAT).endOf('day').format();

  let promiseList = [];

  let _filter = {
    customerStationId: stationId,
  };

  // ==================================SMS CSKH =================================================

  //Tổng SL sms cskh gửi thành công
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL sms cskh đã hủy
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL sms cskh thất bại
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
      },
      startDate,
      endDate,
    ),
  );

  // ==========================SMS QUANG CAO ==============================================

  //Tổng SL sms quang cao gửi thành công
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL sms quang cao đã hủy
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL sms quang cao thất bại
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.SMS_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
      },
      startDate,
      endDate,
    ),
  );

  // //========================== ZALO CSKH ====================================

  //Tổng SL zalo cskh gửi thành công
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL zalo cskh đã hủy
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL zalo cskh thất bại
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_CSKH,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
      },
      startDate,
      endDate,
    ),
  );

  // //=================================== ZALO QUANG CAO ============================================

  //Tổng SL Zalo quang cao gửi thành công
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.COMPLETED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL Zalo quang cao đã hủy
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.CANCELED,
      },
      startDate,
      endDate,
    ),
  );

  //Tổng SL Zalo quang cao thất bại
  promiseList.push(
    MessageCustomerMarketingtResourceAccess.customCount(
      {
        ..._filter,
        customerMessageCategories: MARKETING_MESSAGE_CATEGORY.ZALO_PROMOTION,
        messageSendStatus: MARKETING_MESSAGE_SEND_STATUS.FAILED,
      },
      startDate,
      endDate,
    ),
  );

  let _stationMsgMarketingReportData = await Promise.all(promiseList);
  let outputReportData = {
    totalMsgSmsCSKH: 0,
    totalMsgSmsCSKHCompleted: 0,
    totalMsgSmsCSKHCanceled: 0,
    totalMsgSmsCSKHFailed: 0,

    totalMsgSmsPromotion: 0,
    totalMsgSmsPromotionCompleted: 0,
    totalMsgSmsPromotionCanceled: 0,
    totalMsgSmsPromotionFailed: 0,

    totalMsgZaloCSKH: 0,
    totalMsgZaloCSKHCompleted: 0,
    totalMsgZaloCSKHCanceled: 0,
    totalMsgZaloCSKHFailed: 0,

    totalMsgZaloPromotion: 0,
    totalMsgZaloPromotionCompleted: 0,
    totalMsgZaloPromotionCanceled: 0,
    totalMsgZaloPromotionFailed: 0,
  };

  if (_stationMsgMarketingReportData) {
    // ==================================SMS CSKH =================================================

    if (_stationMsgMarketingReportData[0]) {
      outputReportData.totalMsgSmsCSKHCompleted = _stationMsgMarketingReportData[0];
    }

    if (_stationMsgMarketingReportData[1]) {
      outputReportData.totalMsgSmsCSKHCanceled = _stationMsgMarketingReportData[1];
    }

    if (_stationMsgMarketingReportData[2]) {
      outputReportData.totalMsgSmsCSKHFailed = _stationMsgMarketingReportData[2];
    }

    // ==========================SMS QUANG CAO ==============================================

    if (_stationMsgMarketingReportData[3]) {
      outputReportData.totalMsgSmsPromotionCompleted = _stationMsgMarketingReportData[3];
    }

    if (_stationMsgMarketingReportData[4]) {
      outputReportData.totalMsgSmsPromotionCanceled = _stationMsgMarketingReportData[4];
    }

    if (_stationMsgMarketingReportData[5]) {
      outputReportData.totalMsgSmsPromotionFailed = _stationMsgMarketingReportData[5];
    }

    // //========================== ZALO CSKH ====================================

    if (_stationMsgMarketingReportData[6]) {
      outputReportData.totalMsgZaloCSKHCompleted = _stationMsgMarketingReportData[6];
    }

    if (_stationMsgMarketingReportData[7]) {
      outputReportData.totalMsgZaloCSKHCanceled = _stationMsgMarketingReportData[7];
    }

    if (_stationMsgMarketingReportData[8]) {
      outputReportData.totalMsgZaloCSKHFailed = _stationMsgMarketingReportData[8];
    }

    // //=================================== ZALO QUANG CAO ============================================

    if (_stationMsgMarketingReportData[9]) {
      outputReportData.totalMsgZaloPromotionCompleted = _stationMsgMarketingReportData[9];
    }

    if (_stationMsgMarketingReportData[10]) {
      outputReportData.totalMsgZaloPromotionCanceled = _stationMsgMarketingReportData[10];
    }

    if (_stationMsgMarketingReportData[11]) {
      outputReportData.totalMsgZaloPromotionFailed = _stationMsgMarketingReportData[11];
    }

    outputReportData.totalMsgSmsCSKH =
      outputReportData.totalMsgSmsCSKHCompleted + outputReportData.totalMsgSmsCSKHCanceled + outputReportData.totalMsgSmsCSKHFailed;

    outputReportData.totalMsgSmsPromotion =
      outputReportData.totalMsgSmsPromotionCompleted + outputReportData.totalMsgSmsPromotionCanceled + outputReportData.totalMsgSmsPromotionFailed;

    outputReportData.totalMsgZaloCSKH =
      outputReportData.totalMsgZaloCSKHCompleted + outputReportData.totalMsgZaloCSKHCanceled + outputReportData.totalMsgZaloCSKHFailed;

    outputReportData.totalMsgZaloPromotion =
      outputReportData.totalMsgZaloPromotionCompleted + outputReportData.totalMsgZaloPromotionCanceled + outputReportData.totalMsgZaloPromotionFailed;
  }

  return outputReportData;
}

function convertReportDayOfArrayReports(arrDate) {
  return arrDate.map(item => {
    const yyyymmdd = item.reportDay; // Replace 'reportDay' with the actual field name in your object
    if (yyyymmdd) {
      const formattedDate = moment(yyyymmdd, REPORT_DATE_DATA_FORMAT).format(REPORT_DATE_DISPLAY_FORMAT);
      return {
        ...item,
        reportDay: formattedDate,
      };
    }
    return item;
  });
}

module.exports = {
  updateMsgCustomerMarketingStationReportByDay,
  fetchDataMsgCustomerMarketingStationReportByDay,
  convertReportDayOfArrayReports,
};
