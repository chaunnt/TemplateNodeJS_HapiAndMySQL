/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

'use strict';
require('dotenv').config();
const Logger = require('../../../utils/logging');
const PaymentGatewayFunctions = require('../PaymentGatewayFunctions');
// const PaymentDepositResource = require('../../PaymentDepositTransaction/resourceAccess/PaymentDepositTransactionResourceAccess');
// const PaymentServicePackage = require('../../PaymentServicePackage/resourceAccess/PaymentServicePackageResourceAccess');
// const WalletResource = require('../../Wallet/resourceAccess/WalletResourceAccess');
// const { PAYMENT_METHOD } = require('../../PaymentMethod/PaymentMethodConstant');
// const { WALLET_TYPE } = require('../../Wallet/WalletConstant');
const MOMOFunctions = require('../../../ThirdParty/PaymentGatewayMOMO/MOMOFunctions');
const CustomerReceiptView = require('../../CustomerReceipt/resourceAccess/CustomerReceiptView');
const CustomerReceiptResourceAccess = require('../../CustomerReceipt/resourceAccess/CustomerReceiptResourceAccess');
const StationVNPayResourceAccess = require('../../StationVNPay/resourceAccess/StationVNPayResourceAccess');
const OrderResourceAccess = require('../../Order/resourceAccess/OrderResourceAccess');
const {
  CUSTOMER_RECEIPT_STATUS,
  PAYMENT_METHOD,
  MAPPING_MOMO_PAYMENT_METHOD_ALLOWANCE_TO_TYPE,
} = require('../../CustomerReceipt/CustomerReceiptConstant');
const { ORDER_PAYMENT_STATUS } = require('../../Order/OrderConstant');
const { reportToTelegram } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const StationPaymentConfig = require('../../StationPaymentConfigs/resourceAccess/StationPaymentConfigsResourceAccess');
const Joi = require('joi');
const { PAYMENT_ERROR } = require('../PaymentGatewayConstant');

// async function _createNewDepositRecord(user, servicePackage, paymentMethodId = PAYMENT_METHOD.CASH) {
// let _paymentAmount = servicePackage.rechargePackage;
// if (servicePackage.promotion && servicePackage.promotion !== null && servicePackage.promotion !== '') {
//   _paymentAmount = _paymentAmount - servicePackage.rechargePackage * servicePackage.promotion / 100;
// }

// let userWallet = await WalletResource.find({
//   appUserId: user.appUserId,
//   walletType: WALLET_TYPE.POINT,
// }, 0, 1);

// if (!userWallet || userWallet.length <= 0) {
//   Logger.error(`can not find wallet for user ${user.appUserId} to _createNewDepositRecord`);
//   return undefined
// }

// let depositData = {
//   appUserId: user.appUserId,
//   walletId: userWallet[0].walletId,
//   paymentMethodId: paymentMethodId,
//   paymentAmount: _paymentAmount,
//   paymentRewardAmount: servicePackage.rechargePackage,
// };

// let createResult = await PaymentDepositResource.insert(depositData);
// if (createResult) {
//   return createResult[0];
// } else {
//   Logger.error(`can not _createNewDepositRecord ${user.appUserId} - amount ${amount}`);
//   return undefined;
// }
// }

async function receivePaymentVNPAY(req) {
  let params = req.query;

  const xFF = req.headers['x-forwarded-for'];
  const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;
  console.info('IP from IPN: ', ip);
  console.info('Data from IPN: ', params);
  let transactionResult = await PaymentGatewayFunctions.receiveVNPAYPaymentRequest(params);
  if (transactionResult) {
    return transactionResult.result;
  } else {
    //default response for VNPAY
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}

function makePaymentRequestVNPAY(req) {
  return new Promise(async (resolve, reject) => {
    let customerReceiptId = req.payload.customerReceiptId;

    let _receipt = await CustomerReceiptView.findById(customerReceiptId);
    if (!_receipt) {
      Logger.info(`can not CustomerReceiptResourceAccess.findById ${customerReceiptId}`);
      reject('failed');
      return;
    }

    if (_receipt.customerReceiptStatus !== CUSTOMER_RECEIPT_STATUS.PENDING) {
      Logger.info('customerReceiptStatus', _receipt.customerReceiptStatus);
      reject('failed');
      return;
    }

    let _paymentAmount = _receipt.total;
    const xFF = req.headers['x-forwarded-for'];
    const ip = xFF ? xFF.split(',')[0] : req.info.remoteAddress;

    let stationVNPayData = await StationVNPayResourceAccess.find({
      stationsId: _receipt.stationsId,
    });
    if (!(stationVNPayData && stationVNPayData.length > 0)) {
      stationVNPayData = {
        isUseDefaultSetting: 1,
      };
    } else {
      stationVNPayData = stationVNPayData[0];
    }

    const vnpayScecret = {
      vnpayQRSecret: '',
      vnpayQRTMNCode: '',
      vnpayQRRedirectURL: '',
    };
    if (stationVNPayData.isUseDefaultSetting === 1) {
      vnpayScecret.vnpayQRSecret = process.env.VNPAYQR_SECRET;
      vnpayScecret.vnpayQRTMNCode = process.env.VNPAYQR_TMNCODE;
      vnpayScecret.vnpayQRRedirectURL = process.env.VNPAYQR_REDIRECT_URL;
    } else {
      vnpayScecret.vnpayQRSecret = stationVNPayData.vnpayQRSecret;
      vnpayScecret.vnpayQRTMNCode = stationVNPayData.vnpayQRTMNCode;
      vnpayScecret.vnpayQRRedirectURL = stationVNPayData.vnpayQRRedirectURL;
    }

    let transactionResult = await PaymentGatewayFunctions.createVNPAYPaymentRequest(
      customerReceiptId,
      _paymentAmount,
      _receipt.paymentMethod,
      ip,
      vnpayScecret,
    );
    if (transactionResult) {
      await CustomerReceiptResourceAccess.updateById(customerReceiptId, {
        customerReceiptExternalRef: transactionResult.transactionCode,
      });
      resolve({
        ...transactionResult,
        transactionId: customerReceiptId,
      });
    } else {
      reject('failed');
    }
  });
}

//This API is used for mobile only with payment method app-to-app via ATM card
//with this redirect URL, SDK from VNPAY will callback to our app
function finishVNPAYPayment(req) {
  return `<head><meta http-equiv='refresh' content='0; URL=http://sdk.merchantbackapp'></head>`;
}

function verifyVNPAYPayment(req) {
  return new Promise((resolve, reject) => {
    const data = req.payload;

    const result = PaymentGatewayFunctions.verifyVNPAYPayment(data);
    resolve(result);
  });
}

async function receivePaymentMOMO(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentData = req.payload;
      reportToTelegram(`>>>> Receive request from MOMO: ${JSON.stringify(paymentData)}`);
      let transactionResult = await PaymentGatewayFunctions.receiveMOMOPaymentRequest(paymentData);
      if (transactionResult) {
        resolve(transactionResult);
      } else {
        reject('transaction failed');
      }
    } catch (error) {
      console.error(error);
      reject('transaction error');
    }
  });
}

async function _getMoMoConfig(stationsId) {
  try {
    let stationPaymentConfig = await StationPaymentConfig.findById(stationsId);
    if (!stationPaymentConfig || !stationPaymentConfig.momoBusinessConfigs) {
      return undefined;
    }
    let momoBusinessConfigs = JSON.parse(stationPaymentConfig.momoBusinessConfigs);
    const momoBusinessConfigsSchema = Joi.object({
      partnerCode: Joi.string().required(),
      secretKey: Joi.string().required(),
      accessKey: Joi.string().required(),
    });
    if (momoBusinessConfigsSchema.validate(momoBusinessConfigs).error === null) {
      return momoBusinessConfigs;
    } else {
      return undefined;
    }
  } catch (error) {
    Logger.error(__filename, error);
    return undefined;
  }
}

function makePaymentRequestMOMO(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let receiptId = req.payload.receiptId;

      let receiptData = await CustomerReceiptResourceAccess.findById(receiptId);
      if (!receiptData) {
        Logger.error(`can not CustomerReceiptResourceAccess.findById ${orderId}`);
        reject(PAYMENT_ERROR.RECEIPT_NOT_FOUND);
        return;
      }

      if (!(receiptData.paymentMethod in MAPPING_MOMO_PAYMENT_METHOD_ALLOWANCE_TO_TYPE)) {
        Logger.error(`payment method ${receiptData.paymentMethod} is not allow`);
        reject(PAYMENT_ERROR.WRONG_PAYMENT_METHOD);
        return;
      }

      let orderData = await OrderResourceAccess.findById(receiptData.orderId);
      if (!orderData) {
        Logger.error(`can not Order.findById ${orderId}`);
        reject(PAYMENT_ERROR.INVALID_ORDER);
        return;
      }
      if (orderData.paymentStatus === ORDER_PAYMENT_STATUS.SUCCESS && orderData.paymentStatus === ORDER_PAYMENT_STATUS.PROCESSING) {
        Logger.error(`order status is invalid`);
        reject(PAYMENT_ERROR.INVALID_ORDER);
        return;
      }

      if (orderData.paymentStatus === ORDER_PAYMENT_STATUS.NEW) {
        orderData.paymentStatus = ORDER_PAYMENT_STATUS.PENDING;
        await OrderResourceAccess.updateById(orderData.orderId, { paymentStatus: ORDER_PAYMENT_STATUS.PENDING });
      }

      let momoBusinessConfigs = await _getMoMoConfig(receiptData.stationsId);
      if (!momoBusinessConfigs) {
        reject(PAYMENT_ERROR.WRONG_MOMO_CONFIG_DATA);
        return;
      }

      let transactionResult = await MOMOFunctions.makePaymentRequestMOMO(
        receiptId,
        receiptData.total,
        receiptData.customerReceiptStatus,
        MAPPING_MOMO_PAYMENT_METHOD_ALLOWANCE_TO_TYPE[receiptData.paymentMethod],
        momoBusinessConfigs,
      );
      if (transactionResult) {
        await CustomerReceiptResourceAccess.updateById(receiptId, { customerReceiptExternalRef: transactionResult.signature });
        delete transactionResult.signature;
        resolve(transactionResult);
      } else {
        reject('failed');
      }
    } catch (error) {
      Logger.error(__filename, error);
      reject('failed');
    }
  });
}

module.exports = {
  receivePaymentVNPAY,
  makePaymentRequestVNPAY,
  verifyVNPAYPayment,
  finishVNPAYPayment,
  makePaymentRequestMOMO,
  receivePaymentMOMO,
};
