/* Copyright (c) 2023 TORITECH LIMITED 2022 */

const StationReportResourceAccess = require('./resourceAccess/StationReportResourceAccess');
const StationCustomerAccess = require('../StationCustomer/resourceAccess/StationCustomerAccess');

const CustomerRecordResourceAccess = require('../CustomerRecord/resourceAccess/CustomerRecordResourceAccess');
const CustomerScheduleResourceAccess = require('../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { CHECKING_STATUS } = require('../CustomerRecord/CustomerRecordConstants');
const { SCHEDULE_STATUS } = require('../CustomerSchedule/CustomerScheduleConstants');
const moment = require('moment');
const { REPORT_DATE_DISPLAY_FORMAT, REPORT_DATE_DATA_FORMAT } = require('./StationReportConstants');

async function updateStationReportByDay(stationId, reportDay, reportData, forceUpdate = true) {
  reportDay = moment(reportDay, REPORT_DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT);

  let _existingReport = await StationReportResourceAccess.findOne({
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

    let _newReportId = await StationReportResourceAccess.insert(_newStationReport);
    if (_newReportId) {
      _newReportId = _newReportId[0];
      _existingReport = await StationReportResourceAccess.findById(_newReportId);
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

  await StationReportResourceAccess.updateById(_existingReport.stationReportId, reportData);

  _existingReport = await StationReportResourceAccess.findById(_existingReport.stationReportId);

  return _existingReport;
}

async function fetchDataStationReportByDay(stationId, reportDay) {
  let promiseList = [];

  let _filterCustomerRecord = {
    customerStationId: stationId,
    customerRecordCheckDate: reportDay,
  };

  //kết quả xử lý: (customerrecord): đã hoàn thành
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.COMPLETED,
    }),
  );

  //kết quả xử lý: (customerrecord): đã hủy
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.CANCELED,
    }),
  );

  //kết quả xử lý: (customerrecord): bị lỗi
  promiseList.push(
    CustomerRecordResourceAccess.count({
      ..._filterCustomerRecord,
      customerRecordCheckStatus: CHECKING_STATUS.FAILED,
    }),
  );

  let _filterCustomerSchedule = {
    dateSchedule: reportDay,
    stationsId: stationId,
  };

  //số lịch hẹn:  đã đóng
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.CLOSED,
    }),
  );

  //số lịch hẹn: đã hủy
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.CANCELED,
    }),
  );

  //số lịch hẹn: chưa xác nhận
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.NEW,
    }),
  );

  let _filterNewCustomer = {
    createdDate: moment(reportDay, REPORT_DATE_DISPLAY_FORMAT).format(REPORT_DATE_DATA_FORMAT),
    stationsId: stationId,
  };

  // Số KH của trung tâm: mới
  promiseList.push(
    StationCustomerAccess.count({
      ..._filterNewCustomer,
    }),
  );

  //số lịch hẹn: đã xác nhận
  promiseList.push(
    CustomerScheduleResourceAccess.count({
      ..._filterCustomerSchedule,
      CustomerScheduleStatus: SCHEDULE_STATUS.CONFIRMED,
    }),
  );

  let _stationReportData = await Promise.all(promiseList);
  let outputReportData = {
    totalCustomerChecking: 0,
    totalCustomerCheckingCompleted: 0,
    totalCustomerCheckingCanceled: 0,
    totalCustomerCheckingFailed: 0,
    totalCustomerScheduleConfirm: 0,
    totalCustomerSchedule: 0,
    totalCustomerScheduleClosed: 0,
    totalCustomerScheduleCanceled: 0,
    totalCustomerScheduleNew: 0,
    totalCustomerNew: 0,
  };

  if (_stationReportData) {
    if (_stationReportData[0]) {
      outputReportData.totalCustomerCheckingCompleted = _stationReportData[0];
    }

    if (_stationReportData[1]) {
      outputReportData.totalCustomerCheckingCanceled = _stationReportData[1];
    }

    if (_stationReportData[2]) {
      outputReportData.totalCustomerCheckingFailed = _stationReportData[2];
    }

    if (_stationReportData[3]) {
      outputReportData.totalCustomerScheduleClosed = _stationReportData[3];
    }

    if (_stationReportData[4]) {
      outputReportData.totalCustomerScheduleCanceled = _stationReportData[4];
    }

    if (_stationReportData[5]) {
      outputReportData.totalCustomerScheduleNew = _stationReportData[5];
    }

    if (_stationReportData[6]) {
      outputReportData.totalCustomerNew = _stationReportData[6];
    }

    if (_stationReportData[7]) {
      outputReportData.totalCustomerScheduleConfirm = _stationReportData[7];
    }

    outputReportData.totalCustomerSchedule =
      outputReportData.totalCustomerScheduleClosed +
      outputReportData.totalCustomerScheduleCanceled +
      outputReportData.totalCustomerScheduleNew +
      outputReportData.totalCustomerScheduleConfirm;

    outputReportData.totalCustomerChecking =
      outputReportData.totalCustomerCheckingCompleted + outputReportData.totalCustomerCheckingCanceled + outputReportData.totalCustomerCheckingFailed;
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
  updateStationReportByDay,
  fetchDataStationReportByDay,
  convertReportDayOfArrayReports,
};
