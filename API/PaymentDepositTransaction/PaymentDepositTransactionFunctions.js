/**
 * Created by A on 7/18/17.
 */
'use strict';
const DepositTransactionAccess = require("./resourceAccess/PaymentDepositTransactionResourceAccess");
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');
const { PAYMENT_NOTE , DEPOSIT_TRX_CATEGORY} = require("./PaymentDepositTransactionConstant");
const SystemConfigurationsFunction = require('../SystemConfigurations/SystemConfigurationsFunction');
const DEPOSIT_TRX_STATUS = require('./PaymentDepositTransactionConstant').DEPOSIT_TRX_STATUS;
const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;
// const { APPROVED_PAYMENT, MESSAGE_TYPE, REFUSED_PAYMENT, REWARD_POINT } = require('../CustomerMessage/CustomerMessageConstant');
// const Handlebars = require('handlebars');
// const moment = require('moment');
// const { handleSendMessage } = require('../Common/CommonFunctions');

async function createDepositTransaction(user, amount, paymentCategory, paymentRef) {
  let wallet = await UserWallet.find({
    appUserId: user.appUserId,
    walletType: WALLET_TYPE.USDT
  });

  if (!wallet || wallet.length < 1) {
    console.error("user wallet is invalid");
    return undefined;
  }
  wallet = wallet[0];

  let transactionData = {
    appUserId: user.appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
    
    paymentCategory: paymentCategory ? paymentCategory : DEPOSIT_TRX_CATEGORY.BLOCKCHAIN
  };

  let _configs = await SystemConfigurationsFunction.getSystemConfig();
  let _convertedPrice = _configs.exchangeVNDPrice || 1;
  transactionData.paymentRefAmount = amount * _convertedPrice;
  
  if (paymentRef) {
    transactionData.paymentRef = paymentRef;
    //check existing paymentRef, paymentRef must be unique
    let _existingPaymentRefs = await DepositTransactionAccess.find({
      paymentRef: paymentRef,
    });
    if (_existingPaymentRefs && _existingPaymentRefs.length > 0) {
      for (let i = 0; i < _existingPaymentRefs.length; i++) {
        const _payment = _existingPaymentRefs[i];
        if (_payment.paymentStatus === DEPOSIT_TRX_STATUS.NEW || _payment.paymentStatus === DEPOSIT_TRX_STATUS.COMPLETED) {
          //khong cho trung transaction Id
          throw('DUPLICATE_TRANSACTION_ID');
        }
      }
    }
  }

  let result = await DepositTransactionAccess.insert(transactionData);
  if (result) {
    return result;
  } else {
    console.error("insert deposit transaction error");
    return undefined;
  }
}

async function approveDepositTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await DepositTransactionAccess.find({
    paymentDepositTransactionId: transactionId
  });

  if (!transaction || transaction.length < 1) {
    console.error("transaction is invalid");
    return undefined;
  }
  transaction = transaction[0];

  if (!(transaction.status === DEPOSIT_TRX_STATUS.NEW || transaction.status === DEPOSIT_TRX_STATUS.WAITING || transaction.status !== DEPOSIT_TRX_STATUS.PENDING)) {
    console.error("deposit transaction was approved or canceled");
    return undefined;
  }

  //get wallet info of user
  let usdtWallet = await UserWallet.find({
    appUserId: transaction.appUserId,
    walletType: WALLET_TYPE.USDT
  });

  if (!usdtWallet || usdtWallet.length < 1) {
    console.error("usdtWallet is invalid");
    return undefined;
  }
  usdtWallet = usdtWallet[0];

  //Change payment status and store info of PIC
  transaction.paymentStatus = DEPOSIT_TRX_STATUS.COMPLETED;
  if (staff) {
    transaction.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }
  
  transaction.paymentApproveDate = new Date();

  delete transaction.paymentDepositTransactionId;

  //Update payment in DB

  let updateTransactionResult = await DepositTransactionAccess.updateById(transactionId, transaction);
  if (updateTransactionResult) {
    //Update wallet balance in DB
    let updateWalletResult = await UserWallet.incrementBalance(usdtWallet.walletId, transaction.paymentAmount);
    if (updateWalletResult) {
      // //send message
      // const template = Handlebars.compile(JSON.stringify(APPROVED_PAYMENT));
      // const data = {
      //   "paymentId": transactionId,
      //   "promotionMoney": transaction.paymentRewardAmount,
      //   "totalMoney": parseFloat(pointWallet.balance) + parseFloat(transaction.paymentRewardAmount)
      // };
      // const message = JSON.parse(template(data));
      // await handleSendMessage(transaction.appUserId, message, {
      //   paymentDepositTransactionId: transactionId
      // }, MESSAGE_TYPE.USER);
      return updateWalletResult;
    } else {
      console.error(`updateWalletResult error pointWallet.walletId ${pointWallet.walletId} - ${JSON.stringify(transaction)}`);
      return undefined;
    }
  } else {
    console.error("approveDepositTransaction error");
    return undefined;
  }
}

async function denyDepositTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await DepositTransactionAccess.find({
    paymentDepositTransactionId: transactionId
  });

  if (!transaction || transaction.length < 1) {
    console.error("transaction is invalid");
    return undefined;
  }
  transaction = transaction[0];

  //Nếu không phải giao dịch "ĐANG CHỜ" (PENDING / WAITING) hoặc "MỚI TẠO" (NEW) thì không xử lý
  if (!(transaction.status === DEPOSIT_TRX_STATUS.NEW || transaction.status === DEPOSIT_TRX_STATUS.WAITING || transaction.status !== DEPOSIT_TRX_STATUS.PENDING)) {
    console.error("deposit transaction was approved or canceled");
    return undefined;
  }

  //Change payment status and store info of PIC
  let updatedData = {
    paymentStatus: DEPOSIT_TRX_STATUS.CANCELED,
    paymentApproveDate: new Date()
  }

  //if transaction was performed by Staff, then store staff Id for later check
  if (staff) {
    updatedData.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    updatedData.paymentNote = paymentNote;
  }
  // //send message
  // const template = Handlebars.compile(JSON.stringify(REFUSED_PAYMENT));
  // const data = {
  //   "paymentId": transactionId
  // };
  // const message = JSON.parse(template(data));
  // await handleSendMessage(transaction.appUserId, message, {
  //   paymentDepositTransactionId: transactionId
  // }, MESSAGE_TYPE.USER);

  let updateResult = await DepositTransactionAccess.updateById(transactionId, updatedData);
  return updateResult;
}

//Thêm tiền cho user vì 1 số lý do. Ví dụ hoàn tất xác thực thông tin cá nhân
//Nên tạo ra 1 transaction đồng thời lưu lại luôn vào lịch sử để dễ kiểm soát
async function addPointForUser(appUserId, rewardAmount, staff, paymentNote) {
  let rewardWallet = await UserWallet.find({
    appUserId: appUserId,
    walletType: WALLET_TYPE.USDT
  });

  if (rewardWallet === undefined || rewardWallet.length < 0) {
    console.error(`Can not find reward wallet to add point for user id ${appUserId}`)
    return undefined;
  }
  rewardWallet = rewardWallet[0];

  //Tạo 1 transaction mới và tự động complete
  let newRewardTransaction = {
    paymentStatus: DEPOSIT_TRX_STATUS.COMPLETED,
    paymentApproveDate: new Date(),
    appUserId: appUserId,
    walletId: rewardWallet.walletId,
    paymentRewardAmount: rewardAmount
  }

  //if transaction was performed by Staff, then store staff Id for later check
  if (staff) {
    newRewardTransaction.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    newRewardTransaction.paymentNote = paymentNote;
  }
  let insertResult = await DepositTransactionAccess.insert(newRewardTransaction);

  if (insertResult) {
    // send message
    // const template = Handlebars.compile(JSON.stringify(REWARD_POINT));
    // const data = {
    //   "money": rewardAmount,
    //   "time": moment().format("hh:mm DD/MM/YYYY")
    // };
    // const message = JSON.parse(template(data));
    // await handleSendMessage(appUserId, message, {
    //   paymentDepositTransactionId: insertResult[0]
    // }, MESSAGE_TYPE.USER);

    // tự động thêm tiền vào ví thưởng của user
    await UserWallet.incrementBalance(rewardWallet.walletId, rewardAmount);
    return insertResult;
  } else {
    console.error(`can not create reward point transaction`);
    return undefined;
  }
}
module.exports = {
  createDepositTransaction,
  approveDepositTransaction,
  denyDepositTransaction,
  addPointForUser,
}