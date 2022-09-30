 'use strict';

const WalletRecordResourAccess = require('./resourceAccess/WalletRecordResoureAccess')
const { WALLET_RECORD_TYPE } = require('./WalletRecordConstant');
const WithdrawTransactionResource = require('../PaymentWithdrawTransaction/resourceAccess/PaymentWithdrawTransactionResourceAccess');

async function _storeWalletRecord(appUserId, amount, walletType, recordType, staff, walletRecordRef) {
  const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
  let wallet = await UserWallet.find({
    appUserId: appUserId,
    walletType: walletType
  }, 0, 1);

  if (!wallet || wallet.length < 1) {
    console.error("user wallet is invalid");
    return undefined;
  }
  let historyData = {};
  let resultIncrement = undefined;
  wallet = wallet[0];
  if (recordType.includes('WITHDRAW')) {
    // vì khi yêu cầu rút tiền đã cập nhật ví tiền chính,nên khi Approve
    // không cập nhật lại nữa, chỉ lấy ra tính toán  WalletRecord lịch sử rút tiền cho đúng
    let transactionRequestId = walletRecordRef; // id giao dich rut tien
    let withdrawTransaction = await WithdrawTransactionResource.find({
      paymentWithdrawTransactionId: transactionRequestId,
    });
    //let amountBeforeWithdraw = wallet.balance + amount * -1;
    historyData = {
      appUserId: appUserId,
      walletId: wallet.walletId,
      paymentAmount: amount,
      balanceBefore: withdrawTransaction[0].balanceBefore, // vì đã tính toán ở withdraw Transaction chỉ lấy ra lưu lại thôi
      balanceAfter: withdrawTransaction[0].balanceAfter, // vì đã tính toán ở withdraw Transaction chỉ lấy ra lưu lại thôi
      WalletRecordType: recordType,
      WalletRecordRef: walletRecordRef,
      paymentAmountOut: PAYMENT_AMOUNT.PAYMENT_AMOUNT_OUT,
    };
    if (amount > 0) {
      historyData.paymentAmountIn = amount;
      historyData.paymentAmountInOut = 10; //CREDIT
    } else {
      historyData.paymentAmountOut = amount;
      historyData.paymentAmountInOut = 0; //DEBIT
    }
    resultIncrement = UserWallet.incrementBalance(wallet.walletId, 0);
  }else{
    historyData = {
      appUserId: appUserId,
      walletId: wallet.walletId,
      paymentAmount: amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + amount,
      WalletRecordType: recordType,
      WalletRecordRef: walletRecordRef
    };
    if (amount > 0) {
      historyData.paymentAmountIn = amount;
      historyData.paymentAmountInOut = 10; //CREDIT
    } else {
      historyData.paymentAmountOut = amount;
      historyData.paymentAmountInOut = 0; //DEBIT
    }
    resultIncrement = UserWallet.incrementBalance(wallet.walletId, amount);
  }
 
  if (staff) {
    historyData.staffId = staff.staffId;
  }

  if (resultIncrement) {
    let result = await WalletRecordResourAccess.insert(historyData);
    if (result) {
      return result;
    } else {
      console.error("insert deposit transaction error");
      return undefined;
    }
  }
  else {
    console.error("increment error");
    return undefined;
  }
}

async function adminRewardForUser(appUserId, amount, walletType, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.ADMIN_BONUS, staff, walletRecordRef)
}

async function adminAdjustBalance(appUserId, amount, walletType, staff) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.ADMIN_ADJUST, staff)
}

async function addReferralBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.REWARD, WALLET_RECORD_TYPE.REFER_BONUS);
}

async function addEventBonus(appUserId, amount) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.USDT, WALLET_RECORD_TYPE.EVENT_BONUS);
}

async function depositPointWalletBalance(appUserId, amount, staff) {
  const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
  return _storeWalletRecord(appUserId, amount, WALLET_TYPE.POINT, WALLET_RECORD_TYPE.PAYMENT_DEPOSIT, staff);
}

async function withdrawWalletBalance(appUserId, amount, walletType, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, WALLET_RECORD_TYPE.PAYMENT_WITHDRAW, staff, walletRecordRef);
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function increaseBalance(appUserId, walletType, walletRecordType, amount, staff, walletRecordRef) {
  return _storeWalletRecord(appUserId, amount, walletType, walletRecordType, staff, walletRecordRef);
}

//dieu chinh (them / bot) tien trong vi diem cho user
async function decreaseBalance(appUserId, walletType, walletRecordType, amount, staff, walletRecordRef) {
  if (amount > 0.0000001) {
    return _storeWalletRecord(appUserId, amount * -1, walletType, walletRecordType, staff, walletRecordRef);
  }
}

module.exports = {
  adminRewardForUser,
  addReferralBonus,
  adminAdjustBalance,
  addEventBonus,
  depositPointWalletBalance,
  withdrawWalletBalance,
  increaseBalance,
  decreaseBalance,
}