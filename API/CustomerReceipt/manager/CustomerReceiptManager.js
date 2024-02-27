/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
const Logger = require('../../../utils/logging');
const { USER_VERIFY_PHONE_NUMBER_STATUS } = require('../../AppUsers/AppUsersConstant');
const { SCHEDULE_STATUS } = require('../../CustomerSchedule/CustomerScheduleConstants');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const CustomerScheduleResourceAccess = require('../../CustomerSchedule/resourceAccess/CustomerScheduleResourceAccess');
const { CUSTOMER_RECEIPT_STATUS, RECEIPT_ERROR } = require('../CustomerReceiptConstant');
const CustomerReceiptResourceAccess = require('../resourceAccess/CustomerReceiptResourceAccess');
const StationResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const OrderResourceAccess = require('../../Order/resourceAccess/OrderResourceAccess');
const OrderItemResourceAccess = require('../../Order/resourceAccess/OrderItemResourceAccess');
const { UNKNOWN_ERROR, API_FAILED } = require('../../Common/CommonConstant');
// const ExcelFunction = require('../../../ThirdParty/Excel/excelFunction');
const moment = require('moment');
const { ORDER_PAYMENT_STATUS } = require('../../Order/OrderConstant');
const { isValidValue, isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const { createNewUser } = require('../../AppUsers/AppUsersFunctions');
const StationsResourceAccess = require('../../Stations/resourceAccess/StationsResourceAccess');
const { logCustomerReceiptChanged } = require('../../SystemAppLogChangeReceipt/SystemAppLogChangeReceiptFunctions');
const SystemAppLogChangeReceiptResourceAccess = require('../../SystemAppLogChangeReceipt/resourceAccess/SystemAppLogChangeReceiptResourceAccess');
const { DATE_DISPLAY_FORMAT } = require('../../CustomerRecord/CustomerRecordConstants');

async function _attachOrderInfoForReceipt(customerRecept) {
  let _output = {
    ...customerRecept,
    order: {},
  };
  if (isValidValue(customerRecept.orderId)) {
    let orderData = await OrderResourceAccess.findById(customerRecept.orderId);
    if (orderData) {
      let orderItems = await OrderItemResourceAccess.find({ orderId: customerRecept.orderId });
      orderData.orderItems = orderItems;
      _output.order = orderData;
    }
  }

  return _output;
}

async function _attachScheduleinfoForRecept(customerRecept) {
  let _output = {
    ...customerRecept,
  };
  if (customerRecept.customerReceiptInternalRef) {
    const _scheduleData = await CustomerScheduleResourceAccess.findById(customerRecept.customerReceiptInternalRef);
    if (_scheduleData) {
      _output.schedule = _scheduleData;
    }
  }
  return _output;
}

async function _attachScheduleData(receiptsList) {
  for (let i = 0; i < receiptsList.length; i++) {
    const _receipt = receiptsList[i];
    receiptsList[i] = await _attachScheduleinfoForRecept(_receipt);
  }
}

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await CustomerReceiptResourceAccess.insert(req.payload);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
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

      let data = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (data && data.length > 0) {
        await _attachStationDataToReceiptList(data);
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        await _attachScheduleData(data);
        resolve({ data: data, total: count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetListOneUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let _currentUser = req.currentUser;
      filter.appUserId = _currentUser.appUserId;

      let receiptsList = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      if (receiptsList && receiptsList.length > 0) {
        await _attachStationDataToReceiptList(receiptsList);
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        resolve({ data: receiptsList, total: count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}
async function _attachStationDataToReceiptList(receiptsList) {
  const promises = receiptsList.map(async customerReceipt => {
    if (customerReceipt.stationsId) {
      let currentStation = await StationsResourceAccess.findById(customerReceipt.stationsId);
      if (currentStation) {
        customerReceipt.stationsName = currentStation.stationsName;
        customerReceipt.stationCode = currentStation.stationCosde;
      } else {
        customerReceipt.stationsName = null;
        customerReceipt.stationCode = null;
      }
    } else {
      customerReceipt.stationsName = null;
      customerReceipt.stationCode = null;
    }
  });
  await Promise.all(promises);
}
async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let result = await CustomerReceiptResourceAccess.findById(id);

      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;

      let result = await CustomerReceiptResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userCreateReceipt(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let _currentUser = req.currentUser;

      const scheduleData = await CustomerScheduleResourceAccess.findById(data.customerReceiptInternalRef);
      if (
        !scheduleData ||
        scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED || // lich da huy
        scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CLOSED // lich da dong
      ) {
        reject(RECEIPT_ERROR.CANCALED_SCHEDULE);
        return;
      }

      const stationData = await StationResourceAccess.findById(scheduleData.stationsId);
      if (!stationData || stationData.enablePaymentGateway === 0) {
        reject(RECEIPT_ERROR.STATION_DISABLE_PAYMENT);
        return;
      }

      let orderData = await OrderResourceAccess.find({ customerScheduleId: data.customerReceiptInternalRef }, 0, 1, {
        key: 'orderId',
        value: 'DESC',
      });
      if (!(orderData && orderData.length > 0)) {
        reject(RECEIPT_ERROR.INVALID_ORDER);
        return;
      }
      orderData = orderData[0];
      // paid order
      if (orderData.paymentStatus === ORDER_PAYMENT_STATUS.SUCCESS) {
        reject(RECEIPT_ERROR.PAID_ORDER);
        return;
      }

      let result = await CustomerReceiptResourceAccess.insert({
        ...data,
        total: orderData.totalPayment,
        fee: orderData.taxAmount,
        appUserId: _currentUser.appUserId,
        customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.PENDING,
        customerReceiptName: _currentUser.firstName,
        customerReceiptEmail: _currentUser.email,
        customerReceiptPhone: _currentUser.phoneNumber,
        customerReceiptAmount: orderData.total,
        customerReceiptContent: `Thanh toan hoa don dang kiem ${scheduleData.scheduleHash} vao luc ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
        orderId: orderData.orderId,
        stationsId: orderData.stationsId,
      });
      if (result && result.length > 0) {
        await CustomerScheduleResourceAccess.updateById(data.customerReceiptInternalRef, {
          customerReceiptId: result[0],
        });
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userGetList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let searchText = req.payload.searchText;
      let data = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (data && data.length > 0) {
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);
        resolve({ data: data, total: count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _createReceptByScheduleId(customerScheduleId) {
  if (customerScheduleId) {
    const scheduleData = await CustomerScheduleResourceAccess.findById(customerScheduleId);
    if (
      !scheduleData ||
      scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CANCELED || // lich da huy
      scheduleData.CustomerScheduleStatus === SCHEDULE_STATUS.CLOSED // lich da dong
    ) {
      throw RECEIPT_ERROR.CANCALED_SCHEDULE;
    }
    let orderData = await OrderResourceAccess.find({ customerScheduleId: data.customerReceiptInternalRef }, 0, 1, {
      key: 'orderId',
      value: 'DESC',
    });
    if (!(orderData && orderData.length > 0)) {
      reject(RECEIPT_ERROR.INVALID_ORDER);
      return;
    }
    orderData = orderData[0];
    // paid order
    if (orderData.paymentStatus === ORDER_PAYMENT_STATUS.SUCCESS) {
      reject(RECEIPT_ERROR.PAID_ORDER);
      return;
    }

    let result = await CustomerReceiptResourceAccess.insert({
      ...data,
      total: orderData.totalPayment,
      fee: orderData.taxAmount,
      appUserId: _currentUser.appUserId,
      customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.PENDING,
      customerReceiptName: _currentUser.firstName,
      customerReceiptEmail: _currentUser.email,
      customerReceiptPhone: _currentUser.phoneNumber,
      customerReceiptAmount: orderData.total,
      customerReceiptContent: `Thanh toan hoa don dang kiem ${scheduleData.scheduleHash} vao luc ${moment().format('DD/MM/YYYY HH:mm:ss')}`,
      orderId: orderData.orderId,
      stationsId: orderData.stationsId,
    });
    if (result && result.length > 0) {
      await CustomerScheduleResourceAccess.updateById(data.customerReceiptInternalRef, {
        customerReceiptId: result[0],
      });
    }
  }
}
async function advanceUserCreateReceipt(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = req.payload;
      let _currentUser = req.currentUser;

      const stationData = await StationResourceAccess.findById(_currentUser.stationsId);
      if (!stationData || stationData.enablePaymentGateway === 0) {
        reject(RECEIPT_ERROR.STATION_DISABLE_PAYMENT);
        return;
      }
      if (!data.customerReceiptPhone) {
        reject(RECEIPT_ERROR.NO_PHONE_NUMBER);
      }
      const appUserAccount = await AppUsersResourceAccess.find({ username: data.customerReceiptPhone });
      if (appUserAccount && appUserAccount.length > 0) {
        data.appUserId = appUserAccount[0].appUserId;
      } else {
        // register account
        const newUserAccountId = await _createAccountFromReceipt(data);
        if (newUserAccountId) {
          data.appUserId = newUserAccountId;
        } else {
          Logger.error('Create user failed !');
          reject('Create user failed !');
        }
      }
      if (data.customerReceiptInternalRef) {
        return await _createReceptByScheduleId(data.customerReceiptInternalRef);
      }

      let result = await CustomerReceiptResourceAccess.insert({
        ...data,
        total: data.customerReceiptAmount,
        createdBy: _currentUser.appUserId,
        stationsId: _currentUser.stationsId,
      });
      if (result) {
        return resolve(result);
      } else {
        return reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _createAccountFromReceipt(data) {
  const userData = {};
  const phoneNumber = data.customerReceiptPhone;

  if (isNotEmptyStringValue(phoneNumber)) {
    userData.username = phoneNumber;
    userData.password = phoneNumber;
    userData.firstName = data.customerReceiptName;
    userData.phoneNumber = phoneNumber;
    if (data.customerReceiptEmail) {
      userData.email = data.customerReceiptEmail;
    }

    userData.isVerifiedPhoneNumber = USER_VERIFY_PHONE_NUMBER_STATUS.NOT_VERIFIED;
    const newAppUserId = await createNewUser(userData);
    return newAppUserId;
  }
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
      filter.stationsId = req.currentUser.stationsId;

      let data = await CustomerReceiptResourceAccess.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

      if (data && data.length > 0) {
        let count = await CustomerReceiptResourceAccess.customCount(filter, startDate, endDate, searchText, order);

        await _attachScheduleData(data);

        resolve({ data: data, total: count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserCancelById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = {
        customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.CANCELED,
        canceledBy: req.currentUser.appUserId,
        canceledAt: new Date(),
      };

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function advanceUserPayById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = {
        customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.SUCCESS,
        paidBy: req.currentUser.appUserId,
        paidAt: new Date(),
        paymentApproveDate: new Date(),
        approvedBy: req.currentUser.appUserId,
      };

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
      if (result) {
        resolve(result);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function _attachHistoryCustomerReceipt(customerReceipt) {
  let changeHistory = await SystemAppLogChangeReceiptResourceAccess.find({ customerReceiptId: customerReceipt.customerReceiptId });
  if (changeHistory && changeHistory.length > 0) {
    changeHistory.forEach(history => {
      history.createdAt = moment(history.createdAt).format(DATE_DISPLAY_FORMAT);
    });
  }
  customerReceipt.changeHistory = changeHistory || [];
  return customerReceipt;
}

async function getDetailById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let _receiptDetail = await CustomerReceiptResourceAccess.findById(id);

      if (_receiptDetail) {
        _receiptDetail = await _attachOrderInfoForReceipt(_receiptDetail);
        _receiptDetail = await _attachHistoryCustomerReceipt(_receiptDetail);
        resolve(_receiptDetail);
      } else {
        reject(API_FAILED);
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function userUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      let data = req.payload.data;

      const prevCustomerReceipt = await CustomerReceiptResourceAccess.findById(id);

      let result = await CustomerReceiptResourceAccess.updateById(id, data);
      if (result) {
        await logCustomerReceiptChanged(prevCustomerReceipt, data, req.currentUser, id);

        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getDetailByExternalRef(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let customerReceiptExternalRef = req.payload.customerReceiptExternalRef;
      let result = await CustomerReceiptResourceAccess.find({
        customerReceiptExternalRef: customerReceiptExternalRef,
      });
      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

// async function _exportReceiptToExcel(records, filepath) {
//   const workSheetName = 'Danh sách hoá đơn';
//   const dataRows = [];

//   //table headers
//   const workSheetColumnNames = [
//     'Mã hoá đơn',
//     'Biển số xe',
//     'Họ và Tên',
//     'Số điện thoại',
//     'Email',
//     'Nội dung',
//     'Trạng thái',
//     'Phương thức thanh toán',
//     'Ngày thanh toán',
//     'Tổng tiền thanh toán',
//   ];
//   dataRows.push(workSheetColumnNames);

//   //Table data
//   for (let record of records) {
//     dataRows.push([
//       record.customerReceiptId,
//       record.licensePlates,
//       record.customerReceiptName,
//       record.customerReceiptPhone,
//       record.customerReceiptEmail,
//       record.customerReceiptContent,
//       CUSTOMER_RECEIPT_STATUS_TO_TEXT[record.customerReceiptStatus.toUpperCase()],
//       record.paymentMethod,
//       record.paymentApproveDate ? moment(record.paymentApproveDate).format('DD/MM/YYYY HH:mm:ss') : '',
//       record.total,
//     ]);
//   }

//   ExcelFunction.exportExcelOldFormat(dataRows, workSheetName, filepath);
//   return 'OK';
// }

// async function _exportReceiptExcel(req) {
//   return new Promise(async (resolve, reject) => {
//     let fileName = 'DS_HOA_DON_' + moment().format('YYYYMMDDHHmm') + '.xlsx';
//     const filepath = 'uploads/exportExcel/' + fileName;
//     try {
//       let filter = req.payload.filter;
//       let skip = undefined;
//       let limit = undefined;
//       let order = req.payload.order;
//       let startDate = req.payload.startDate;
//       let endDate = req.payload.endDate;
//       let searchText = req.payload.searchText;

//       let data = await CustomerReceiptView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);

//       if (data && data.length > 0) {
//         let newData = await _exportReceiptToExcel(data, filepath);
//         if (newData) {
//           let newExcelUrl = 'https://' + process.env.HOST_NAME + '/' + filepath;
//           return resolve(newExcelUrl);
//         }
//       }
//       console.error(`error exportReceiptExcel CustomerReceipt: ${UNKNOWN_ERROR}`);
//       return reject(UNKNOWN_ERROR);
//     } catch (e) {
//       Logger.error(__filename, e);
//       reject('failed');
//     }
//   });
// }

// async function exportReceiptExcel(req) {
//   return await _exportReceiptExcel(req);
// }

// async function advanceUserExportReceiptExcel(req) {
//   req.payload.filter.stationsId = req.currentUser.stationsId;
//   return await _exportReceiptExcel(req);
// }

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  userGetList,
  getDetailById,
  userUpdateById,
  userCreateReceipt,
  getDetailByExternalRef,
  // advanceUserExportReceiptExcel,
  // exportReceiptExcel,
  advanceUserCancelById,
  advanceUserCreateReceipt,
  advanceUserPayById,
  advanceUserGetList,
  userGetListOneUser,
};
