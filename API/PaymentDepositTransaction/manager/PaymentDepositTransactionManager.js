/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
require('dotenv').config();
const DepositTransactionAccess = require('../resourceAccess/PaymentDepositTransactionResourceAccess');
const PaymentDepositTransactionUserView = require('../resourceAccess/PaymentDepositTransactionUserView');
const DepositTransactionMethodView = require('../resourceAccess/PaymentDepositMethodView');
const UserResource = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const DepositFunction = require('../PaymentDepositTransactionFunctions');
const Logger = require('../../../utils/logging');
const StaffResourceAccess = require('../../Staff/resourceAccess/StaffResourceAccess');
const PaymentMethodResourceAccess = require('../../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const {
  MINIMUM_DEPOSIT_AMOUNT,
  DEPOSIT_TRX_STATUS,
  DEPOSIT_TRX_TYPE,
  DEPOSIT_ERROR,
  DEPOSIT_TRX_CATEGORY,
  DEPOSIT_TRX_UNIT,
} = require('../PaymentDepositTransactionConstant');
// const ExcelFunction = require('../../../ThirdParty/Excel/ExcelFunction');
const INVALID_WALLET = undefined;
const INVALID_PAYMENT_REF = undefined;
const INVALID_BANKINFOMATION = undefined;

const ERROR = require('../../Common/CommonConstant');
const { WALLET_TYPE } = require('../../Wallet/WalletConstant');

const { DEPOSIT_REQUEST, USER_ERROR } = require('../../AppUsers/AppUserConstant');
const { ROLE_NAME, PERMISSION_NAME } = require('../../StaffRole/StaffRoleConstants');
const StaffUserResourceAccess = require('../../StaffUser/resourceAccess/StaffUserResourceAccess');
const { verifyStaffUser } = require('../../Common/CommonFunctions');
const PaymentDepositTransactionResourceAccess = require('../resourceAccess/PaymentDepositTransactionResourceAccess');
const AppUsersResourceAccess = require('../../AppUsers/resourceAccess/AppUsersResourceAccess');
const { updateTotalDepositForUser } = require('../../LeaderBoard/LeaderFunction');
const { reportToTelegram, reportToTelegramByConfig } = require('../../../ThirdParty/TelegramBot/TelegramBotFunctions');
const { publishJSONToClient } = require('../../../ThirdParty/SocketIO/SocketIOClient');
const AppUserDevices = require('../../AppUserDevices/resourceAccess/AppUserDevicesResourceAccess');
const { getUserDeviceFromUserAgent, saveUserDevice } = require('../../AppUserDevices/AppUserDevicesFunctions');
const { ACTION } = require('../../AppUserDevices/AppUserDevicesConstants');
const { replaceCharactersToHide, isNotEmptyStringValue } = require('../../ApiUtils/utilFunctions');
const {
  createCheckoutPaymentBank,
  createCheckoutPaymentUSDT,
  createCheckoutPaymentElecWallet,
} = require('../../../ThirdParty/SunpayGateway/SunpayGatewayFunction');

async function insert(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let appUserId = req.payload.appUserId;
      let staff = req.currentUser;
      let paymentAmount = req.payload.paymentAmount;
      if (!appUserId) {
        Logger.error(`error payment deposit insert user is invalid`);
        reject('user is invalid');
        return;
      }

      const isAllowed = await verifyStaffUser(appUserId, req.currentUser);
      if (!isAllowed) {
        reject(ERROR.NO_PERMISSION);
        return;
      }

      let user = await UserResource.find({ appUserId: appUserId });
      if (!user || user.length < 1) {
        Logger.error(`error payment deposit insert can not find user AppUserId:${appUserId}`);
        reject('can not find user');
        return;
      }
      user = user[0];

      let result = await DepositFunction.createDepositTransaction(
        user,
        paymentAmount,
        INVALID_PAYMENT_REF,
        INVALID_WALLET,
        INVALID_BANKINFOMATION,
        staff,
      );
      if (result) {
        resolve(result);
      } else {
        Logger.error(`error payment deposit insert AppUserId:${appUserId} `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error payment deposit insert AppUserId:${appUserId} `);
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

      if (filter === undefined) {
        filter = {};
      }
      let _permissions = [];
      if (req.currentUser.permissions) {
        _permissions = req.currentUser.permissions.split(',');
      }

      //neu la superadmin thi thay het, nguoc lai cac role khac thi khong, chi thay duoc user cua minh gioi thieu
      if (req.currentUser.staffRoleId !== ROLE_NAME.SUPER_ADMIN) {
        //neu staff co quyen xem tat ca thi tuong tu nhu superadmin
        if (_permissions.length > 0 && !_permissions.includes(PERMISSION_NAME.VIEW_ALL_WITHDRAW)) {
          filter.paymentStaffId = req.currentUser.staffId;
        }
      }

      if (
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_BANK) && filter.paymentCategory == DEPOSIT_TRX_CATEGORY.BANK) ||
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_USDT) && filter.paymentCategory == DEPOSIT_TRX_CATEGORY.USDT)
      ) {
        if (filter.paymentStaffId) {
          delete filter.paymentStaffId;
        }
      }

      let transactionList = await DepositTransactionMethodView.customSearch(filter, skip, limit, startDate, endDate, searchText, order);
      let transactionCount = await DepositTransactionMethodView.customCount(filter, startDate, endDate, searchText);
      let depositAmount = 0;
      if (filter && filter.paymentUnit == DEPOSIT_TRX_UNIT.USDT) {
        let _sumDepositAmount = await DepositTransactionMethodView.customSum(
          'paymentRefAmount',
          { ...filter, paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED },
          searchText,
          startDate,
          endDate,
        );
        depositAmount = _sumDepositAmount[0].sumResult;
      }
      if (filter && filter.paymentUnit == DEPOSIT_TRX_UNIT.VND) {
        let _sumDepositAmount = await DepositTransactionMethodView.customSum(
          'paymentAmount',
          { ...filter, paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED },
          searchText,
          startDate,
          endDate,
        );
        depositAmount = _sumDepositAmount[0].sumResult;
      }

      if (transactionList && transactionCount && transactionList.length > 0) {
        transactionList = await getDetailTransactionDeposit(transactionList);
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
          totalPaymentAmount: depositAmount,
        });
      } else {
        resolve({
          data: [],
          total: 0,
          totalPaymentAmount: 0,
        });
      }
    } catch (e) {
      Logger.error(`error payment deposit find: `);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await DepositTransactionAccess.findById(req.payload.id);
      if (transaction) {
        const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
        if (!isAllowed) {
          reject(ERROR.NO_PERMISSION);
          return;
        }
      } else {
        resolve({});
      }
      let updateResult = await DepositTransactionAccess.updateById(req.payload.id, req.payload.data);
      if (updateResult) {
        resolve(updateResult);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(`error payment deposit updateById ${req.payload.id}: `);
      reject('failed');
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await PaymentDepositTransactionUserView.find({ paymentDepositTransactionId: req.payload.id });
      if (transaction && transaction.length > 0) {
        const isAllowed = await verifyStaffUser(transaction[0].appUserId, req.currentUser);
        //kiem tra yeu cau nap tien co phai cua user minh tao ra hay khong
        if (!isAllowed) {
          //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
          if (
            req.currentUser.permissions &&
            (req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_DEPOSIT) < 0 ||
              req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_WITHDRAW) < 0)
          ) {
            reject(ERROR.NO_PERMISSION);
            return;
          }
        }
        transaction = await getDetailTransactionDeposit(transaction);
        if (
          req.currentUser.permissions &&
          req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_USERS) < 0 &&
          req.currentUser.permissions.indexOf(PERMISSION_NAME.VIEW_ALL_USERS) < 0
        ) {
          let phoneNumber = transaction[0].phoneNumber;
          if (isNotEmptyStringValue(phoneNumber)) {
            transaction[0].phoneNumber = replaceCharactersToHide(transaction[0].phoneNumber);
          }

          let email = transaction[0].email;
          if (isNotEmptyStringValue(email)) {
            transaction[0].email = replaceCharactersToHide(transaction[0].email);
          }
        }
        resolve(transaction[0]);
      } else {
        resolve({});
      }
    } catch (e) {
      Logger.error(`error payment deposit findById with paymentDepositTransactionId:${req.payload.id}`, e);
      reject('failed');
    }
  });
}

async function depositHistory(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let filter = req.payload.filter;
      let skip = req.payload.skip;
      let limit = req.payload.limit;
      let order = req.payload.order;
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;

      if (filter === undefined) {
        filter = {};
      }

      if (req.currentUser.appUserId) {
        filter.appUserId = req.currentUser.appUserId;
      }

      let transactionList = await PaymentDepositTransactionUserView.customSearch(filter, skip, limit, startDate, endDate, undefined, order);
      let transactionCount = await PaymentDepositTransactionUserView.customCount(filter);

      if (transactionList && transactionCount && transactionList.length > 0) {
        for (let i = 0; i < transactionList.length; i++) {
          const result = await DepositTransactionAccess.findById(transactionList[i].paymentDepositTransactionId);
          const paymentMethod = await PaymentMethodResourceAccess.find({
            paymentMethodId: result.paymentMethodId,
          });
          if (paymentMethod && paymentMethod.length > 0) {
            transactionList[i].paymentMethodType = paymentMethod[0].paymentMethodType;
            transactionList[i].paymentMethodName = paymentMethod[0].paymentMethodName;
          } else {
            transactionList[i].paymentMethodType = null;
            transactionList[i].paymentMethodName = null;
          }
        }
        resolve({
          data: transactionList,
          total: transactionCount[0].count,
        });
      } else {
        resolve({
          data: [],
          total: 0,
        });
      }
    } catch (e) {
      Logger.error(`error payment deposit depositHistory:`, e);
      reject('failed');
    }
  });
}

async function denyDepositTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        let transaction = await DepositTransactionAccess.findById(req.payload.id);
        if (transaction) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
            if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.APPROVE_DEPOSIT) < 0) {
              reject(ERROR.NO_PERMISSION);
              return;
            }
          }
        } else {
          Logger.error('deposit transaction was not approved');
          reject('failed');
          return;
        }
      }
      let denyResult = await DepositFunction.denyDepositTransaction(req.payload.id, req.currentUser, undefined);
      if (denyResult) {
        resolve('success');
      } else {
        Logger.error('deposit transaction was not denied');
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error`, e);
      reject('failed');
    }
  });
}

async function approveDepositTransaction(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let transaction = await DepositTransactionAccess.findById(req.payload.id);
      if (transaction) {
        if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
          const isAllowed = await verifyStaffUser(transaction.appUserId, req.currentUser);
          if (!isAllowed) {
            //kiem tra xem co quyen nap / rut ALL ko (danh cho doi tac nap tien)
            if (req.currentUser.permissions && req.currentUser.permissions.indexOf(PERMISSION_NAME.APPROVE_DEPOSIT) < 0) {
              reject(ERROR.NO_PERMISSION);
              return;
            }
          }
        }
      } else {
        return reject(ERROR.NO_DATA);
      }

      let approveResult = await DepositFunction.approveDepositTransaction(
        req.payload.id,
        req.currentUser,
        undefined,
        req.payload.paymentMethodId,
        req.payload.paymentRef,
      );
      if (approveResult !== undefined) {
        await DepositFunction.updateFirstDepositForUser(transaction.appUserId);

        //update leader board
        await updateTotalDepositForUser(transaction.appUserId);

        resolve('success');
      } else {
        Logger.error('deposit transaction was not approved');
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function summaryUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;
      filter.userId = req.currentUser.userId;

      let result = await DepositTransactionAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        Logger.error(`error deposit transaction summaryUser: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error deposit transaction summaryUser`, e);
      reject('failed');
    }
  });
}

async function summaryAll(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = req.payload.startDate;
      let endDate = req.payload.endDate;
      let filter = req.payload.filter;

      let result = await DepositTransactionAccess.sumaryPointAmount(startDate, endDate, filter);
      if (result) {
        resolve(result[0]);
      } else {
        Logger.error(`error deposit transaction summaryAll: `);
        reject('failed');
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}

async function addPointForUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let rewardResult = await DepositFunction.addPointForUser(req.payload.id, req.payload.amount, req.currentUser, req.payload.paymentNote);
      if (rewardResult) {
        resolve('success');
      } else {
        Logger.error('fail to add reward point for user');
        reject('failed');
      }
    } catch (e) {
      Logger.error(`error deposit transaction addPointForUser:`, e);
      reject('failed');
    }
  });
}

async function exportHistoryOfUser(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let userId = req.payload.id;
      let history = await DepositTransactionAccess.find({ appUserId: userId });
      if (history && history.length > 0) {
        const fileName = 'userRewardHistory' + (new Date() - 1).toString();
        let filePath = await ExcelFunction.renderExcelFile(fileName, history, 'User Reward History');
        let url = `https://${process.env.HOST_NAME}/${filePath}`;
        resolve(url);
      } else {
        resolve('Not have data');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function exportSalesToExcel(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let startDate = moment(req.payload.startDate).startOf('month').format('YYYY-MM-DD');
      let endDate = moment(req.payload.endDate).endOf('month').format('YYYY-MM-DD');
      let data = await DepositTransactionAccess.customSearch(startDate, endDate);
      if (data && data.length > 0) {
        const fileName = 'SalesHistory' + (new Date() - 1).toString();
        let filePath = await ExcelFunction.renderExcelFile(fileName, data, 'Sales History');
        let url = `https://${process.env.HOST_NAME}/${filePath}`;
        resolve(url);
      } else {
        resolve('Not have data');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userRequestDeposit(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }

      let appUserId = req.currentUser.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      let paymentSecondaryRef = req.payload.paymentSecondaryRef;
      let paymentMethodId = req.payload.paymentMethodId;
      let paymentRef = req.payload.paymentRef;
      let paymentUnit = req.payload.paymentUnit;
      let paymentCategory = req.payload.paymentCategory;
      if (req.currentUser.isAllowedDeposit == DEPOSIT_REQUEST.NOT_ALLOWED) {
        return reject(USER_ERROR.NOT_ALLOWED_DEPOSIT);
      }
      // kiểm tra có lệnh nạp tiền nào đang pending không
      const userAgent = req.headers['user-agent'];
      console.log('userAgent: ', userAgent);
      let userDeposit = await _createNewUserDepositRequest(
        appUserId,
        paymentAmount,
        paymentUnit,
        paymentRef,
        paymentSecondaryRef,
        paymentMethodId,
        req.currentUser.staffId,
        paymentCategory,
        userAgent,
      );
      if (process.env.SUNPAY_ENABLED * 1 === 1) {
        //Tao thong tin ve cong thanh toan
        let createCheckoutPaymentResult = await createCheckoutPaymentUSDT(
          `${moment().format('YYYYMMDDHHmmSS')}_${userDeposit.paymentDepositTransactionId}`,
          userDeposit.paymentRefAmount,
        );
        if (createCheckoutPaymentResult) {
          return resolve(createCheckoutPaymentResult);
        } else {
          Logger.error(`createCheckoutPaymentResult failed`);
          Logger.error(`${createCheckoutPaymentResult}`);
          return reject(ERROR.POPULAR_ERROR.INSERT_FAILED);
        }
      }
    } catch (e) {
      Logger.error(`error BetRecord userRequestDeposit`);
      Logger.error(e);
      if (Object.keys(DEPOSIT_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}
async function userRequestDepositByGateway(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }

      let appUserId = req.currentUser.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      let paymentUnit = req.payload.paymentUnit;
      let paymentCategory = req.payload.paymentCategory;
      if (req.currentUser.isAllowedDeposit == DEPOSIT_REQUEST.NOT_ALLOWED) {
        return reject(USER_ERROR.NOT_ALLOWED_DEPOSIT);
      }
      // kiểm tra có lệnh nạp tiền nào đang pending không
      const userAgent = req.headers['user-agent'];
      let userDeposit = await _createNewUserDepositRequest(
        appUserId,
        paymentAmount,
        paymentUnit,
        undefined,
        undefined,
        undefined,
        req.currentUser.staffId,
        paymentCategory,
        userAgent,
      );

      if (process.env.SUNPAY_ENABLED * 1 === 1) {
        //Tao thong tin ve cong thanh toan
        let createCheckoutPaymentResult = await createCheckoutPaymentBank(
          `${moment().format('YYYYMMDDHHmmSS')}_${userDeposit.paymentDepositTransactionId}`,
          userDeposit.paymentAmount,
        );
        if (createCheckoutPaymentResult) {
          return resolve(createCheckoutPaymentResult);
        } else {
          Logger.error(`createCheckoutPaymentResult failed`);
          Logger.error(`${createCheckoutPaymentResult}`);
          return reject(ERROR.POPULAR_ERROR.INSERT_FAILED);
        }
      }
    } catch (e) {
      Logger.error(`error BetRecord userRequestDepositByGateway`);
      Logger.error(e);
      if (Object.keys(DEPOSIT_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}
async function userRequestDepositByElecWallet(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }

      let appUserId = req.currentUser.appUserId;
      let paymentAmount = req.payload.paymentAmount;
      let paymentUnit = req.payload.paymentUnit;
      let paymentCategory = req.payload.paymentCategory;
      if (req.currentUser.isAllowedDeposit == DEPOSIT_REQUEST.NOT_ALLOWED) {
        return reject(USER_ERROR.NOT_ALLOWED_DEPOSIT);
      }
      const userAgent = req.headers['user-agent'];
      let userDeposit = await _createNewUserDepositRequest(
        appUserId,
        paymentAmount,
        paymentUnit,
        undefined,
        undefined,
        undefined,
        req.currentUser.staffId,
        paymentCategory,
        userAgent,
      );
      if (process.env.SUNPAY_ENABLED * 1 === 1) {
        //Tao thong tin ve cong thanh toan
        let category = '';
        if (paymentCategory === DEPOSIT_TRX_CATEGORY.MOMO_QR) {
          category = 'momo_qr';
        } else if (paymentCategory === DEPOSIT_TRX_CATEGORY.ZALO_QR) {
          category = 'zalo_qr';
        } else if (paymentCategory === DEPOSIT_TRX_CATEGORY.VIETTEL_QR) {
          category = 'viettel_qr';
        }
        let createCheckoutPaymentResult = await createCheckoutPaymentElecWallet(
          `${moment().format('YYYYMMDDHHmmSS')}_${userDeposit.paymentDepositTransactionId}`,
          userDeposit.paymentAmount,
          category,
        );
        if (createCheckoutPaymentResult) {
          return resolve(createCheckoutPaymentResult);
        } else {
          Logger.error(`createCheckoutPaymentResult failed`);
          Logger.error(`${createCheckoutPaymentResult}`);
          return reject(ERROR.POPULAR_ERROR.INSERT_FAILED);
        }
      }
    } catch (e) {
      Logger.error(`error BetRecord userRequestDeposit`);
      Logger.error(e);
      if (Object.keys(DEPOSIT_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(USER_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else if (Object.keys(ERROR.POPULAR_ERROR).indexOf(e) >= 0) {
        reject(e);
      } else {
        reject(ERROR.UNKNOWN_ERROR);
      }
    }
  });
}
async function getWaitingApproveCount(req) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.currentUser) {
        return reject(USER_ERROR.NOT_AUTHORIZED);
      }
      let filter = {
        paymentStatus: DEPOSIT_TRX_STATUS.NEW,
        // paymentCategory: req.payload.paymentCategory,
        paymentUnit: req.payload.paymentUnit,
      };
      let paymentCategory = req.payload.paymentCategory;
      if (paymentCategory) {
        filter.paymentCategory = paymentCategory;
      }
      let _permissions = [];
      if (req.currentUser.permissions) {
        _permissions = req.currentUser.permissions.split(',');
      }

      if (req.currentUser.staffRoleId != ROLE_NAME.SUPER_ADMIN) {
        //neu staff co quyen xem tat ca thi tuong tu nhu superadmin
        if (_permissions.length > 0 && !_permissions.includes(PERMISSION_NAME.VIEW_ALL_WITHDRAW)) {
          filter.paymentStaffId = req.currentUser.staffId;
        }
      }

      if (
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_BANK) && filter.paymentCategory == DEPOSIT_TRX_CATEGORY.BANK) ||
        (_permissions.includes(PERMISSION_NAME.VIEW_TRANSACTION_DEPOSIT_USDT) && filter.paymentCategory == DEPOSIT_TRX_CATEGORY.USDT)
      ) {
        if (filter.paymentStaffId) {
          delete filter.paymentStaffId;
        }
      }

      let _transaction = await PaymentDepositTransactionResourceAccess.count(filter);
      if (_transaction && _transaction.length > 0) {
        resolve(_transaction[0].count);
      } else {
        resolve(0);
      }
    } catch (e) {
      Logger.error(e);
      reject('failed');
    }
  });
}
async function _createNewUserDepositRequest(
  appUserId,
  paymentAmount,
  paymentUnit,
  paymentRef,
  paymentSecondaryRef,
  paymentMethodId,
  staffId,
  paymentCategory,
  userAgent,
) {
  // kiểm tra có lệnh nạp tiền nào đang pending không
  let userDeposit = await DepositTransactionAccess.customSearch({
    appUserId: appUserId,
    paymentStatus: [DEPOSIT_TRX_STATUS.NEW, DEPOSIT_TRX_STATUS.PENDING, DEPOSIT_TRX_STATUS.WAITING],
    paymentCategory: paymentCategory,
  });
  if (!userDeposit || userDeposit.length <= 0) {
    let paymentRefAmount = paymentAmount;
    if (paymentUnit == DEPOSIT_TRX_UNIT.USDT) {
      const SystemConfigurationsResourceAccess = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
      let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
      if (config && config.length > 0) {
        paymentAmount = Math.round(paymentAmount * config[0].exchangeVNDPrice);
        if (paymentAmount < MINIMUM_DEPOSIT_AMOUNT) {
          throw DEPOSIT_ERROR.NOT_ENOUGH_DEPOSIT_AMOUNT;
        }
      }
    }

    let result = await DepositFunction.createDepositTransaction(
      appUserId,
      paymentAmount,
      paymentRef,
      undefined,
      paymentSecondaryRef,
      paymentMethodId,
      paymentUnit,
      staffId,
      paymentRefAmount,
      paymentCategory,
    );
    if (result) {
      let transaction = await DepositTransactionAccess.findById(result[0]);
      publishJSONToClient('USER_DEPOSIT', transaction);
      let user = await AppUsersResourceAccess.findById(appUserId);
      await saveUserDevice(appUserId, userAgent, ACTION.DEPOSIT);
      let messageToTelegram = _createMessageToAdminTelegram(paymentCategory, user, paymentAmount);
      reportToTelegramByConfig(
        messageToTelegram,
        process.env.TELEGRAM_BOT_DEPOSIT_TOKEN || '6010252793:AAFB8g3Vmc8lW-XiD5OEwY9pI6E1lbgq-7k',
        process.env.TELEGRAM_CHAT_ID_DEPOSIT_NOTIFICATION || '@okeda_naptienbot',
      );
      userDeposit = transaction;
      return userDeposit;
    } else {
      Logger.error(`error deposit transaction userRequestDeposit: `);
      throw ERROR.POPULAR_ERROR.INSERT_FAILED;
    }
  } else {
    let paymentRefAmount = paymentAmount;
    if (paymentUnit == DEPOSIT_TRX_UNIT.USDT) {
      const SystemConfigurationsResourceAccess = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
      let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
      if (config && config.length > 0) {
        paymentAmount = Math.round(paymentAmount * config[0].exchangeVNDPrice);
      }
    }
    let dataUpdate = {
      paymentAmount: paymentAmount,
      paymentRefAmount: paymentRefAmount,
    };
    let updateResult = await DepositTransactionAccess.updateById(userDeposit[0].paymentDepositTransactionId, dataUpdate);
    if (updateResult) {
      let transaction = await DepositTransactionAccess.findById(userDeposit[0].paymentDepositTransactionId);
      let user = await AppUsersResourceAccess.findById(appUserId);
      await saveUserDevice(appUserId, userAgent, ACTION.DEPOSIT);
      let messageToTelegram = _createMessageToAdminTelegram(paymentCategory, user, paymentAmount);
      reportToTelegramByConfig(
        messageToTelegram,
        process.env.TELEGRAM_BOT_DEPOSIT_TOKEN || '6010252793:AAFB8g3Vmc8lW-XiD5OEwY9pI6E1lbgq-7k',
        process.env.TELEGRAM_CHAT_ID_DEPOSIT_NOTIFICATION || '@okeda_naptienbot',
      );
      userDeposit = transaction;
      return userDeposit;
    } else {
      Logger.error(`error deposit transaction userRequestDeposit update: `);
      throw ERROR.POPULAR_ERROR.UPDATE_FAILED;
    }
  }
}
function _createMessageToAdminTelegram(paymentCategory, user, paymentAmount) {
  let messageToTelegram = '';
  if (paymentCategory === DEPOSIT_TRX_CATEGORY.BANK) {
    messageToTelegram = `Có yêu cầu nạp tiền qua ngân hàng vào Tài khoản: ${user.username}, Số tiền: ${paymentAmount} qua cổng thanh toán`;
  } else if (paymentCategory === DEPOSIT_TRX_CATEGORY.USDT) {
    messageToTelegram = `Có yêu cầu nạp tiền số USDT vào Tài khoản: ${user.username}, Số tiền:  ${paymentAmount}`;
  } else {
    messageToTelegram = `Có yêu cầu nạp tiền qua ${paymentCategory} vào Tài khoản: ${user.username}, Số tiền:  ${paymentAmount}`;
  }
  return messageToTelegram;
}
async function _addStaffNameInTransactionList(transactionList, storeStaffName = {}) {
  for (let transaction of transactionList) {
    if (transaction.paymentPICId) {
      let staffId = transaction.paymentPICId;
      let staffName = '';
      if (storeStaffName && storeStaffName.hasOwnProperty(staffId)) {
        staffName = storeStaffName[staffId]; // get staffName
        transaction.staffName = staffName;
      } else {
        let staff = await StaffResourceAccess.findById(staffId);
        staffName = `${staff.lastName} ${staff.firstName}`;
        storeStaffName[staffId] = staffName; // set stationName với key là stationId
        transaction.staffName = staffName;
      }
    }
  }
  return transactionList;
}

function _transactionsSetPaymentMethodTypeName(transactionList) {
  const PaymentMethodFunctions = require('../../PaymentMethod/PaymentMethodFunctions');
  for (let transaction of transactionList) {
    if (transaction.paymentMethodId) {
      transaction.paymentMethodType = PaymentMethodFunctions.getPaymentMethodTypeName(transaction.paymentMethodType);
    }
  }
  return transactionList;
}

async function getDetailTransactionDeposit(transactionList) {
  let transactionListWithStaffName = await _addStaffNameInTransactionList(transactionList);
  //let result = _transactionsSetPaymentMethodTypeName(transactionListWithStaffName);
  return transactionListWithStaffName;
}

module.exports = {
  insert,
  find,
  updateById,
  findById,
  approveDepositTransaction,
  summaryAll,
  summaryUser,
  denyDepositTransaction,
  userRequestDeposit,
  userRequestDepositByGateway,
  depositHistory,
  addPointForUser,
  exportHistoryOfUser,
  exportSalesToExcel,
  getWaitingApproveCount,
  userRequestDepositByElecWallet,
};
