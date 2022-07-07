/**
 * Created by A on 7/18/17.
 */
'use strict';
const BonusTransactionResource = require("./resourceAccess/PaymentBonusTransactionResourceAccess");
const UserWallet = require('../Wallet/resourceAccess/WalletResourceAccess');

const BONUS_TRX_STATUS = require('./PaymentBonusTransactionConstant').BONUS_TRX_STATUS;
const WALLET_TYPE = require('../Wallet/WalletConstant').WALLET_TYPE;

async function increaseBonusForUser(appUserId, amount, referUserId, totalReferAmount) {
  if (amount > 0) {
    await createBonusTransactionByUserId(appUserId, 0, referUserId);

    let existingBonus = await BonusTransactionResource.find({
      appUserId: appUserId,
      paymentStatus: BONUS_TRX_STATUS.NEW,
      referUserId: referUserId
    }, 0, 1);

    if (existingBonus && existingBonus.length > 0) {
      amount = parseFloat(amount).toFixed(2);
      await BonusTransactionResource.incrementPaymentAmount(existingBonus[0].paymentBonusTransactionId, amount);
      if (totalReferAmount) {
        await BonusTransactionResource.updateById(existingBonus[0].paymentBonusTransactionId, {
          totalReferAmount: totalReferAmount
        });
      }
    }
    return existingBonus[0];
  }
  return undefined;
}

//appUserId: id cua user duoc nhan hoa hong
//referUserId: id cua user duoc tham chieu de tinh hoa hong
async function createBonusTransactionByUserId(appUserId, amount, referUserId) {

  if (!appUserId || appUserId === null || appUserId === "" || appUserId === 0) {
    console.error(`cancel createBonusTransactionByUserId invalid appUserId ${appUserId}`)
    return;
  }

  let _filter = {
    appUserId: appUserId,
    paymentStatus: BONUS_TRX_STATUS.NEW,
  };

  //neu co nguoi tham chieu thi luu tru them id nguoi tham chieu
  if (referUserId) {
    _filter.referUserId = referUserId;
  }
  //dam bao luon co 1 record o trang thai NEW
  let existingBonus = await BonusTransactionResource.find(_filter, 0, 1);

  //da ton tai thi ko can tao ra nua
  if (existingBonus && existingBonus.length > 0) {
    return;
  }

  let wallet = await UserWallet.find({
    appUserId: appUserId,
    walletType: WALLET_TYPE.POINT
  });

  if (!wallet || wallet.length < 1) {
    console.error("user wallet is invalid");
    return undefined;
  }
  wallet = wallet[0];

  let transactionData = {
    appUserId: appUserId,
    walletId: wallet.walletId,
    paymentAmount: amount,
  };

  //neu co nguoi tham chieu thi luu tru them id nguoi tham chieu
  if (referUserId) {
    transactionData.referUserId = referUserId;
  }
  let result = await BonusTransactionResource.insert(transactionData);
  if (result) {
    return result;
  } else {
    console.error("insert bonus transaction error");
    return undefined;
  }
}

async function approveBonusTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await BonusTransactionResource.find({
    paymentBonusTransactionId: transactionId
  });

  if (!transaction || transaction.length < 1) {
    console.error("transaction is invalid");
    return undefined;
  }
  transaction = transaction[0];

  if (!(transaction.status === BONUS_TRX_STATUS.NEW || transaction.status === BONUS_TRX_STATUS.WAITING || transaction.status !== BONUS_TRX_STATUS.PENDING)) {
    console.error("bonus transaction was approved or canceled");
    return undefined;
  }

  //Change payment status and store info of PIC
  transaction.paymentStatus = BONUS_TRX_STATUS.COMPLETED;
  if (staff) {
    transaction.paymentPICId = staff.staffId;
  }

  if (paymentNote) {
    transaction.paymentNote = paymentNote;
  }

  transaction.paymentApproveDate = new Date();

  delete transaction.paymentBonusTransactionId;

  //Update payment in DB
  let updateTransactionResult = await BonusTransactionResource.updateById(transactionId, transaction);
  if (updateTransactionResult) {

    //tra tien thuong vao vi hoa hong cho user
    const WalletRecordFunction = require('../WalletRecord/WalletRecordFunction');
    let addBonusResult = await WalletRecordFunction.addReferralBonus(transaction.appUserId, transaction.paymentAmount);

    if (!addBonusResult) {
      // //send message
      // const template = Handlebars.compile(JSON.stringify(APPROVED_PAYMENT));
      // const data = {
      //   "paymentId": transactionId,
      //   "promotionMoney": transaction.paymentRewardAmount,
      //   "totalMoney": parseFloat(pointWallet.balance) + parseFloat(transaction.paymentRewardAmount)
      // };
      // const message = JSON.parse(template(data));
      // await handleSendMessage(transaction.appUserId, message, {
      //   paymentBonusTransactionId: transactionId
      // }, MESSAGE_TYPE.USER);

      console.error(`approveBonusTransaction > addReferralBonus failed for transactionId ${transactionId}`);
      return updateWalletResult;
    }
  } else {
    console.error("approveBonusTransaction error");
    return undefined;
  }
}

async function denyBonusTransaction(transactionId, staff, paymentNote) {
  //get info of transaction
  let transaction = await BonusTransactionResource.find({
    paymentBonusTransactionId: transactionId
  });

  if (!transaction || transaction.length < 1) {
    console.error("transaction is invalid");
    return undefined;
  }
  transaction = transaction[0];

  //Nếu không phải giao dịch "ĐANG CHỜ" (PENDING / WAITING) hoặc "MỚI TẠO" (NEW) thì không xử lý
  if (!(transaction.status === BONUS_TRX_STATUS.NEW || transaction.status === BONUS_TRX_STATUS.WAITING || transaction.status !== BONUS_TRX_STATUS.PENDING)) {
    console.error("bonus transaction was approved or canceled");
    return undefined;
  }

  //Change payment status and store info of PIC
  let updatedData = {
    paymentStatus: BONUS_TRX_STATUS.CANCELED,
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
  //   paymentBonusTransactionId: transactionId
  // }, MESSAGE_TYPE.USER);

  let updateResult = await BonusTransactionResource.updateById(transactionId, updatedData);
  return updateResult;
}

module.exports = {
  createBonusTransactionByUserId,
  approveBonusTransaction,
  denyBonusTransaction,
  increaseBonusForUser
}