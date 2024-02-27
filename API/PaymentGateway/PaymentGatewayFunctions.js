/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const VNPAYFunctions = require('../../ThirdParty/PaymentGatewayVNPAYQR/VNPAYGatewayFunctions');
const MOMOFunctions = require('../../ThirdParty/PaymentGatewayMOMO/MOMOFunctions');
const CustomerReceiptResourceAccess = require('../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const AppUserResourceAccess = require('../AppUsers/resourceAccess/AppUsersResourceAccess');
const StationVNPayResourceAccess = require('../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const { CUSTOMER_RECEIPT_STATUS } = require('../CustomerReceipt/CustomerReceiptConstant');
const OrderResourceAccess = require('../Order/resourceAccess/OrderResourceAccess');
const { logCustomerSchedulePaymentChanged } = require('../SystemAppLogChangeSchedule/SystemAppLogChangeScheduleFunctions');
const moment = require('moment');

async function createVNPAYPaymentRequest(transactionId, paymentAmount, paymentType, ipAddr, vnpaySecret) {
  return await VNPAYFunctions.makePaymentRequestVNPAY(transactionId, transactionId, paymentAmount, paymentType, paymentType, ipAddr, vnpaySecret);
}

async function _failureTransaction(receiptData, confirmResult) {
  //update transaction record status
  await CustomerReceiptResourceAccess.updateById(receiptData.customerReceiptId, {
    customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.FAILED,
    paymentApproveDate: moment().toDate(),
    paymentResult: JSON.stringify(confirmResult),
  });

  const failureData = {
    paymentStatus: CUSTOMER_RECEIPT_STATUS.FAILED,
    closedDate: new Date(),
  };

  const orderData = await OrderResourceAccess.findById(receiptData.orderId);
  const updateResult = await OrderResourceAccess.updateById(receiptData.orderId, failureData);
}

async function _succeedTransaction(receiptData) {
  //update transaction record status
  await CustomerReceiptResourceAccess.updateById(receiptData.customerReceiptId, {
    customerReceiptStatus: CUSTOMER_RECEIPT_STATUS.SUCCESS,
    paymentApproveDate: moment().toDate(),
  });

  const successData = {
    paymentStatus: CUSTOMER_RECEIPT_STATUS.SUCCESS,
    approveDate: new Date(),
  };

  const orderData = await OrderResourceAccess.findById(receiptData.orderId);
  const updateResult = await OrderResourceAccess.updateById(receiptData.orderId, successData);
}

async function receiveVNPAYPaymentRequest(vnpayData) {
  let transactionCode = vnpayData.vnp_TxnRef;

  let confirmResult = undefined;

  if (!transactionCode) {
    return confirmResult;
  }

  let customerReceipt = await CustomerReceiptResourceAccess.find(
    {
      customerReceiptExternalRef: transactionCode,
    },
    0,
    1,
  );
  if (customerReceipt && customerReceipt.length > 0) {
    customerReceipt = customerReceipt[0];

    let paymentStatus = customerReceipt.customerReceiptStatus;
    let paymentAmount = customerReceipt.total;

    const appUserData = await AppUserResourceAccess.findById(customerReceipt.appUserId);
    let stationData = await StationVNPayResourceAccess.find({ stationsId: appUserData.stationsId });
    stationData = stationData[0];

    const vnpaySecret = {
      vnpayQRSecret: stationData.vnpayQRSecret,
      vnpayQRTMNCode: stationData.vnpayQRTMNCode,
      vnpayQRRedirectURL: stationData.vnpayQRRedirectURL,
      vnpayQRBankCode: stationData.vnpayQRBankCode,
    };

    confirmResult = await VNPAYFunctions.verifyPaymentFromVNPAY(vnpayData, transactionCode, paymentAmount, paymentStatus, vnpaySecret);

    //check payment result
    if (confirmResult && confirmResult.result && confirmResult.result.RspCode === '00' && confirmResult.paymentStatus === 'Success') {
      await _succeedTransaction(customerReceipt);
    } else {
      await _failureTransaction(customerReceipt, confirmResult);
    }
  } else {
    confirmResult = {
      result: VNPAYFunctions.errorCodes.ORDER_NOT_FOUND,
      paymentStatus: 'Failed',
    };
  }
  return confirmResult;
}

async function verifyVNPAYPayment(data) {}

async function createMOMOPaymentRequest(transactionId, paymentAmount) {
  // return await MOMOFunctions.makePaymentRequestMOMO(transactionId, transactionId, paymentAmount)
}

async function receiveMOMOPaymentRequest(momoData) {
  // READ MORE AT: https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/resultcode
  // const SUCCESS_CODE = 9000; // khi gửi request create payment để `autoCapture: false`
  const SUCCESS_CODE = 0;
  let confirmResult = undefined;
  if (!momoData) {
    return confirmResult;
  }

  let transactionData = await CustomerReceiptResourceAccess.findById(Number(momoData.orderId));
  if (transactionData) {
    // confirmResult = await MOMOFunctions.verifyPaymentFromMOMO(
    //   momoData,
    //   transactionData.customerReceiptId,
    //   transactionData.total,
    //   transactionData.customerReceiptStatus,
    //   transactionData.customerReceiptExternalRef,
    // );
    //check payment result
    // if (confirmResult && confirmResult.paymentStatus === CUSTOMER_RECEIPT_STATUS.SUCCESS) {
    if (momoData.resultCode === SUCCESS_CODE) {
      await _succeedTransaction(transactionData);
    } else {
      await _failureTransaction(transactionData, momoData);
    }
    return 'success';
  }
  return confirmResult;
}

module.exports = {
  createVNPAYPaymentRequest,
  receiveVNPAYPaymentRequest,
  createMOMOPaymentRequest,
  receiveMOMOPaymentRequest,
  verifyVNPAYPayment,
};
