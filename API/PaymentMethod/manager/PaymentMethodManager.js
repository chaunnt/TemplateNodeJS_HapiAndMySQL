/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const PaymentMethodResourceAccess = require('../resourceAccess/PaymentMethodResourceAccess');
const QRCodeFunction = require('../../../ThirdParty/QRCode/QRCodeFunctions');
const Logger = require('../../../utils/logging');
const { POPULAR_ERROR } = require('../../Common/CommonConstant');
const { PAYMENT_TYPE, MAX_LIMITED_PAYMENT_METHOD_BANK, PAYMENT_METHOD_ERROR, MAX_LIMITED_PAYMENT_METHOD_USDT } = require('../PaymentMethodConstant');
const { isNotEmptyStringValue, nonAccentVietnamese } = require('../../ApiUtils/utilFunctions');
const { moveFileFromLocalToLinode } = require('../../../ThirdParty/LinodeStorage/LinodeStorageFunctions');
const { getPublicBankListFromLocal, getBankIdFromShortName } = require('../PaymentMethodFunctions');
const SystemConfigurationsResource = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
const { getSystemConfig } = require('../../SystemConfigurations/SystemConfigurationsFunction');
const { logAdminUpdateAppUserData } = require('../../SystemAppChangedLog/SystemAppLogAppUserFunctions');

async function _createQRCodeForPaymentMethod(paymentMethodData) {
  if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.CRYPTO && isNotEmptyStringValue(paymentMethodData.paymentMethodQrCodeUrl) === false) {
    paymentMethodData = await _createQRCodeForCryptoPayment(paymentMethodData);
    return paymentMethodData;
  }
  if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK && isNotEmptyStringValue(paymentMethodData.paymentMethodQrCodeUrl) === false) {
    paymentMethodData = await _createQRCodeForBankPayment(paymentMethodData);
    return paymentMethodData;
  }

  return paymentMethodData;
}

async function _readBankBinIDFromCode(bankCode) {
  let _bankList = await getPublicBankListFromLocal();
  for (let i = 0; i < _bankList.length; i++) {
    const _bank = _bankList[i];
    if (isNotEmptyStringValue(_bank.code) && _bank.code === bankCode) {
      return _bank.bin;
    }
  }
  return undefined;
}
async function _createQRCodeForBankPayment(paymentMethodData) {
  const { createQuickLinkVietQR } = require('../../../ThirdParty/VietQR/VietQRFunction');
  let _bankBinId = await _readBankBinIDFromCode(paymentMethodData.paymentMethodName);
  if (_bankBinId) {
    let _paymentMethodQrCodeUrl = await createQuickLinkVietQR(_bankBinId, paymentMethodData.paymentMethodIdentityNumber);
    if (isNotEmptyStringValue(_paymentMethodQrCodeUrl)) {
      paymentMethodData.paymentMethodQrCodeUrl = _paymentMethodQrCodeUrl;
    }
    return paymentMethodData;
  }
}

async function _createQRCodeForCryptoPayment(paymentMethodData) {
  let _paymentMethodQrCodeFilePath = await QRCodeFunction.createQRCode(paymentMethodData.paymentMethodIdentityNumber);
  if (isNotEmptyStringValue(_paymentMethodQrCodeFilePath)) {
    let _fileName = process.cwd() + '/' + _paymentMethodQrCodeFilePath;
    let _paymentMethodQrCodeUrl = await moveFileFromLocalToLinode(_fileName);
    paymentMethodData.paymentMethodQrCodeUrl = _paymentMethodQrCodeUrl;
  }
  return paymentMethodData;
}
async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodData = req.payload;
      paymentMethodData.appUserId = null;

      paymentMethodData = await _createQRCodeForPaymentMethod(paymentMethodData);

      let result = await PaymentMethodResourceAccess.insert(paymentMethodData);
      if (result) {
        resolve(result);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userInsert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodData = req.payload;
      paymentMethodData.appUserId = req.currentUser.appUserId;
      const paymentMethodIdentityNumber = paymentMethodData.paymentMethodIdentityNumber;
      const paymentMethod = await PaymentMethodResourceAccess.find(
        { paymentMethodIdentityNumber: paymentMethodIdentityNumber, paymentMethodName: paymentMethodData.paymentMethodName },
        0,
        10,
      );
      if (paymentMethod && paymentMethod.length > 0) {
        return reject(POPULAR_ERROR.DUPLICATE_DATA);
      }

      const _existingUserMethod = await PaymentMethodResourceAccess.find(
        { appUserId: req.currentUser.appUserId, paymentMethodType: paymentMethodData.paymentMethodType },
        0,
        10,
      );
      if (_existingUserMethod && _existingUserMethod.length > 0) {
        let systemConfigurations = await getSystemConfig();
        let maxLimitedPaymentBank = systemConfigurations.maxLimitedPaymentBank;
        let maxLimitedPaymentUSDT = systemConfigurations.maxLimitedPaymentUSDT;
        if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK && _existingUserMethod.length >= maxLimitedPaymentBank) {
          return reject(PAYMENT_METHOD_ERROR.MAX_LIMITED_PAYMENT_METHOD_BANK);
        }
        if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.CRYPTO && _existingUserMethod.length >= maxLimitedPaymentUSDT) {
          return reject(PAYMENT_METHOD_ERROR.MAX_LIMITED_PAYMENT_METHOD_USDT);
        }
      }

      //neu la TK ngan hang thi kiem tra STK khop voi ten hay khong
      if (
        process.env.ENABLE_VIETQR_API * 1 === 1 &&
        paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK &&
        isNotEmptyStringValue(paymentMethodData.paymentMethodName)
      ) {
        let _bankInfo = getBankIdFromShortName(paymentMethodData.paymentMethodName);
        if (!_bankInfo) {
          return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
        }
        let _bankId = _bankInfo.bin;
        const { crawlBankAccount } = require('../../../ThirdParty/VietQR/VietQRFunction');
        let realBankData = await crawlBankAccount(paymentMethodData.paymentMethodIdentityNumber.trim(), _bankId * 1);

        if (realBankData && isNotEmptyStringValue(realBankData.accountName)) {
          if (
            isNotEmptyStringValue(paymentMethodData.paymentMethodReceiverName.trim()) === false ||
            nonAccentVietnamese(paymentMethodData.paymentMethodReceiverName.trim()).toUpperCase() !==
              nonAccentVietnamese(realBankData.accountName.trim()).toUpperCase()
          ) {
            return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
          }
        } else {
          return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
        }
      }

      paymentMethodData = await _createQRCodeForPaymentMethod(paymentMethodData);

      let result = await PaymentMethodResourceAccess.insert(paymentMethodData);

      if (result) {
        if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK) {
          //kiem tra hop dieu kien thi cong them 1 nhiem vu
          const { addFirstMissionForUser } = require('../../AppUserMission/AppUserMissionFunction');
          let _addResult = await addFirstMissionForUser(req.currentUser.appUserId);
          if (_addResult) {
            const WalletFunction = require('../../Wallet/WalletFunctions');
            const { createMissionBonusRecordForUser } = require('../../PaymentBonusTransaction/PaymentBonusTransactionFunctions');

            await Promise.all([
              createMissionBonusRecordForUser(req.currentUser.appUserId),
              createMissionBonusRecordForUser(req.currentUser.memberReferIdF1),
              WalletFunction.resetMissionWalletBalance(req.currentUser.appUserId),
            ]);
          }
        }
        resolve(result);
      } else {
        reject(POPULAR_ERROR.INSERT_FAILED);
      }
    } catch (e) {
      Logger.error(e);
      reject(POPULAR_ERROR.INSERT_FAILED);
    }
  });
}
async function userCheckBankInfo(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodData = req.payload;
      paymentMethodData.appUserId = req.currentUser.appUserId;

      // kiểm tra trùng tk ngân hàng
      const paymentMethodIdentityNumber = paymentMethodData.paymentMethodIdentityNumber;
      const paymentMethod = await PaymentMethodResourceAccess.find(
        { paymentMethodIdentityNumber: paymentMethodIdentityNumber, paymentMethodName: paymentMethodData.paymentMethodName },
        0,
        10,
      );
      if (paymentMethod && paymentMethod.length > 0) {
        return reject(POPULAR_ERROR.DUPLICATE_DATA);
      }

      // kiểm tra mỗi tk chỉ được có 1 tk ngân hàng hoặc tiền số
      // const paymentMethodUser = await PaymentMethodResourceAccess.find({
      //   appUserId: req.currentUser.appUserId,
      // });
      // if (paymentMethodUser && paymentMethodUser.length > 0) {
      //   return reject(PAYMENT_METHOD_ERROR.MAX_LIMITED_PAYMENT_METHOD);
      // }
      const _existingUserMethod = await PaymentMethodResourceAccess.find(
        { appUserId: req.currentUser.appUserId, paymentMethodType: paymentMethodData.paymentMethodType },
        0,
        10,
      );
      if (_existingUserMethod && _existingUserMethod.length > 0) {
        let systemConfigurations = await getSystemConfig();
        let maxLimitedPaymentBank = systemConfigurations.maxLimitedPaymentBank;
        let maxLimitedPaymentUSDT = systemConfigurations.maxLimitedPaymentUSDT;
        if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK && _existingUserMethod.length >= maxLimitedPaymentBank) {
          return reject(PAYMENT_METHOD_ERROR.MAX_LIMITED_PAYMENT_METHOD_BANK);
        }
        if (paymentMethodData.paymentMethodType === PAYMENT_TYPE.CRYPTO && _existingUserMethod.length >= maxLimitedPaymentUSDT) {
          return reject(PAYMENT_METHOD_ERROR.MAX_LIMITED_PAYMENT_METHOD_USDT);
        }
      }

      //neu la TK ngan hang thi kiem tra STK khop voi ten hay khong
      if (
        process.env.ENABLE_VIETQR_API * 1 === 1 &&
        paymentMethodData.paymentMethodType === PAYMENT_TYPE.ATM_BANK &&
        isNotEmptyStringValue(paymentMethodData.paymentMethodName)
      ) {
        const { crawlBankAccount } = require('../../../ThirdParty/VietQR/VietQRFunction');
        let _bankInfo = getBankIdFromShortName(paymentMethodData.paymentMethodName);
        if (!_bankInfo) {
          return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
        }
        let _bankId = _bankInfo.bin;
        let realBankData = await crawlBankAccount(paymentMethodData.paymentMethodIdentityNumber.trim(), _bankId * 1);

        if (realBankData && isNotEmptyStringValue(realBankData.accountName)) {
          if (
            isNotEmptyStringValue(paymentMethodData.paymentMethodReceiverName.trim()) === false ||
            nonAccentVietnamese(paymentMethodData.paymentMethodReceiverName.trim()).toUpperCase() !==
              nonAccentVietnamese(realBankData.accountName.trim()).toUpperCase()
          ) {
            return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
          }
        } else {
          return reject(PAYMENT_METHOD_ERROR.INVALID_PAYMENT_METHOD_BANK_DATA);
        }
      }
      return resolve('ok');
    } catch (e) {
      Logger.error(e);
      reject(POPULAR_ERROR.INSERT_FAILED);
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

      if (filter === undefined) {
        filter = {};
      }
      let paymentMethods = await PaymentMethodResourceAccess.find(filter, skip, limit, order);
      let paymentMethodsCount = await PaymentMethodResourceAccess.count(filter, order);
      if (paymentMethods && paymentMethodsCount) {
        resolve({ data: paymentMethods, total: paymentMethodsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodId = req.payload.id;
      let paymentMethodData = req.payload.data;
      const paymentMethod = await PaymentMethodResourceAccess.find({
        paymentMethodId,
        appUserId: null,
      });
      if (!paymentMethod || paymentMethod.length == 0) {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
      let result = await PaymentMethodResourceAccess.updateById(paymentMethodId, paymentMethodData);
      if (result) {
        resolve(result);
      } else {
        reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(e);
      reject(POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function userUpdateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodId = req.payload.id;
      let paymentMethodData = req.payload.data;
      const paymentMethod = await PaymentMethodResourceAccess.find({
        paymentMethodId,
        appUserId: req.currentUser.appUserId,
      });
      if (!paymentMethod || paymentMethod.length == 0) {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
      //check trung stk voi record khac
      const paymentMethodIdentityNumber = paymentMethodData.paymentMethodIdentityNumber;
      const paymentMethodByNumber = await PaymentMethodResourceAccess.find(
        { paymentMethodIdentityNumber: paymentMethodIdentityNumber, paymentMethodName: paymentMethodData.paymentMethodName },
        0,
        1,
      );
      if (paymentMethodByNumber && paymentMethodByNumber.length > 0 && paymentMethodByNumber[0].paymentMethodId != paymentMethodId) {
        return reject(POPULAR_ERROR.DUPLICATE_DATA);
      }

      let result = await PaymentMethodResourceAccess.updateById(paymentMethodId, paymentMethodData);
      if (result) {
        resolve(result);
      } else {
        reject(POPULAR_ERROR.UPDATE_FAILED);
      }
    } catch (e) {
      Logger.error(e);
      reject(POPULAR_ERROR.UPDATE_FAILED);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentMethodId = req.payload.id;
      let result = await PaymentMethodResourceAccess.find({ paymentMethodId: paymentMethodId });
      if (result && result.length > 0) {
        resolve(result[0]);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function deleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      const paymentMethod = await PaymentMethodResourceAccess.find({
        paymentMethodId: id,
      });
      if (!paymentMethod || paymentMethod.length == 0) {
        return reject(POPULAR_ERROR.RECORD_NOT_FOUND);
      }
      let result = await PaymentMethodResourceAccess.deleteById(id);
      if (result) {
        for (let i = 0; i < Object.keys(PAYMENT_TYPE).length; i++) {
          const paymentType = Object.keys(PAYMENT_TYPE)[i];
          if (paymentMethod[0].paymentMethodType == PAYMENT_TYPE[paymentType]) {
            await logAdminUpdateAppUserData({ paymentType: paymentType }, { paymentType: 'isDeleted' }, req.currentUser, paymentMethod[0].appUserId);
            break;
          }
        }
        return resolve(result);
      }
      return reject(POPULAR_ERROR.DELETE_FAILED);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(POPULAR_ERROR.DELETE_FAILED);
    }
  });
}

async function userDeleteById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let id = req.payload.id;
      const paymentMethod = await PaymentMethodResourceAccess.find({
        paymentMethodId: id,
        appUserId: req.currentUser.appUserId,
      });
      if (!paymentMethod || paymentMethod.length == 0) {
        return reject('failed');
      }
      let result = await PaymentMethodResourceAccess.deleteById(id);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function getList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;

      if (filter === undefined) {
        filter = {};
      }
      filter.appUserId = null;
      let paymentMethods = await PaymentMethodResourceAccess.find(filter, skip, limit, order);

      if (paymentMethods && paymentMethods.length > 0) {
        let paymentMethodsCount = await PaymentMethodResourceAccess.count(filter, order);
        resolve({ data: paymentMethods, total: paymentMethodsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function getUserPaymentMethod(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter || {};
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      filter.appUserId = req.currentUser.appUserId;

      let paymentMethods = await PaymentMethodResourceAccess.find(filter, skip, limit, order);

      if (paymentMethods && paymentMethods.length > 0) {
        let paymentMethodsCount = await PaymentMethodResourceAccess.count(filter, order);

        resolve({ data: paymentMethods, total: paymentMethodsCount[0].count });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function userGetPublicBankList(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let BANK_LIST = await getPublicBankListFromLocal();
      resolve(BANK_LIST);
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  deleteById,
  getList,
  userGetPublicBankList,
  userInsert,
  userCheckBankInfo,
  getUserPaymentMethod,
  userUpdateById,
  userDeleteById,
};
