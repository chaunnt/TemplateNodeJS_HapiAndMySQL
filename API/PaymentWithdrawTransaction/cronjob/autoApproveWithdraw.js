/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { updateTotalDepositForUser, updateTotalWithdrawForUser } = require('../../LeaderBoard/LeaderFunction');
const { getSystemConfig } = require('../../SystemConfigurations/SystemConfigurationsFunction');
const SystemConfigurationsResourceAccess = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
const { WITHDRAW_TRX_STATUS, WITHDRAW_TRX_CATEGORY } = require('../PaymentWithdrawTransactionConstant');
const WithdrawTransactionResourceAccess = require('../resourceAccess/PaymentWithdrawTransactionResourceAccess');
const WithdrawTransactionFunction = require('../PaymentWithdrawTransactionFunctions');
const utilFunctions = require('../../ApiUtils/utilFunctions');
const moment = require('moment');
const CustomerMessageResourceAccess = require('../../CustomerMessage/resourceAccess/CustomerMessageResourceAccess');
const ERROR = require('../../Common/CommonConstant');
const { MESSAGE_CATEGORY, MESSAGE_TOPIC } = require('../../CustomerMessage/CustomerMessageConstant');
const Logger = require('../../../utils/logging');
const PaymentMethodResourceAccess = require('../../PaymentMethod/resourceAccess/PaymentMethodResourceAccess');
const { getBankCode, createPayoutRequest } = require('../../../ThirdParty/SunpayGateway/SunpayGatewayFunction');

async function autoApproveWithdraw() {
  const systemConfig = await getSystemConfig();
  if (systemConfig.approveWithdrawEnable === 0) {
    return;
  }
  let transactionListNew = await WithdrawTransactionResourceAccess.find({
    paymentStatus: WITHDRAW_TRX_STATUS.NEW,
    paymentCategory: WITHDRAW_TRX_CATEGORY.BANK,
  });
  if (transactionListNew && transactionListNew.length > 0) {
    for (let i = 0; i < transactionListNew.length; i++) {
      let transaction = transactionListNew[i];
      if (transaction.paymentAmount > systemConfig.approveWithdrawAmount) {
        continue;
      }
      // if (transaction.paymentCategory === WITHDRAW_TRX_CATEGORY.USDT) {
      //     // console.log('transaction.paymentCategoryUSDT: ', transaction.paymentCategory);
      //     // let result = await WithdrawTransactionFunction.acceptWithdrawRequest(transaction.paymentWithdrawTransactionId);
      //     // if (result !== undefined) {
      //     //     let transactionUpdated = await WithdrawTransactionResourceAccess.findById(transaction.paymentWithdrawTransactionId);
      //     //     const amount = utilFunctions.formatCurrency(transactionUpdated.paymentAmount);
      //     //     let _currency = 'VNĐ';
      //     //     await CustomerMessageResourceAccess.insert({
      //     //       customerMessageContent: `Bạn đã rút thành công ${amount} ${_currency} vào lúc ${moment().format(ERROR.DATETIME_DISPLAY_FORMAT)}`,
      //     //       customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
      //     //       customerMessageTopic: MESSAGE_TOPIC.USER,
      //     //       customerMessageTitle: `Rút tiền thành công`,
      //     //     //   staffId: req.currentUser.appUserId,
      //     //       customerId: transactionUpdated.appUserId,
      //     //     });
      //     //     await WithdrawTransactionFunction.updateLastWithdrawForUser(transactionUpdated.appUserId, transactionUpdated.paymentAmount);

      //     //     //Update leader board
      //     //     await updateTotalWithdrawForUser(transactionUpdated.appUserId);
      //     //   }else {
      //     //     Logger.error('error withdraw transaction approveAndPayWithdrawTransaction');
      //     //   }
      //     continue;
      // }else if(transaction.paymentCategory === WITHDRAW_TRX_CATEGORY.BANK){
      let result = await WithdrawTransactionFunction.acceptAndWaitWithdrawRequest(transaction.paymentWithdrawTransactionId);
      if (result !== undefined) {
        let transactionUpdated = await WithdrawTransactionResourceAccess.findById(transaction.paymentWithdrawTransactionId);
        const amount = utilFunctions.formatCurrency(transactionUpdated.paymentAmount);
        let _currency = 'VNĐ';
        await CustomerMessageResourceAccess.insert({
          customerMessageContent: `Bạn đã rút thành công ${amount} ${_currency} vào lúc ${moment().format(
            ERROR.DATETIME_DISPLAY_FORMAT,
          )}. Tiền sẽ về tài khoản của bạn trong ít phút nữa`,
          customerMessageCategories: MESSAGE_CATEGORY.FIREBASE_PUSH,
          customerMessageTopic: MESSAGE_TOPIC.USER,
          customerMessageTitle: `Rút tiền thành công`,
          //   staffId: req.currentUser.appUserId,
          customerId: transactionUpdated.appUserId,
        });

        //tao yeu cau rut tien qua cong thanh toan Sunpay
        {
          let paymentMethodId = transactionUpdated.paymentMethodId;
          let _userReceiveMethod = await PaymentMethodResourceAccess.findById(paymentMethodId);
          if (_userReceiveMethod) {
            let _sunpayBankCode = getBankCode(_userReceiveMethod.paymentMethodName);
            if (utilFunctions.isNotEmptyStringValue(_sunpayBankCode)) {
              let _payoutResult = await createPayoutRequest(
                `${moment().format('YYYYMMDDHHmmSS')}_${transactionUpdated.paymentWithdrawTransactionId}`,
                transactionUpdated.paymentAmount,
                _sunpayBankCode,
                _userReceiveMethod.paymentMethodIdentityNumber,
                _userReceiveMethod.paymentMethodReceiverName,
              );
              if (_payoutResult && _payoutResult.code === '200') {
                await WithdrawTransactionResourceAccess.updateById(transactionUpdated.paymentWithdrawTransactionId, {
                  paymentStatus: WITHDRAW_TRX_STATUS.WAITING,
                });
              }
            } else {
              let paymentNote = `Đến: ${_userReceiveMethod.paymentMethodName}`;
              paymentNote += ` - ${utilFunctions.replaceCharactersToHide(_userReceiveMethod.paymentMethodReceiverName, 1)}`;
              paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(
                _userReceiveMethod.paymentMethodIdentityNumber,
                0,
                3,
              )} tự động từ chối do ngân hàng nhận không nằm trong danh sách`;

              await WithdrawTransactionFunction.rejectWithdrawRequest(transaction.paymentWithdrawTransactionId, undefined, paymentNote);
              Logger.error(`approveAndPayWithdrawTransaction can not getBankCode with name ${_userReceiveMethod.paymentMethodName}`);
            }
          } else {
            let paymentNote = `Đến: ${_userReceiveMethod.paymentMethodName}`;
            paymentNote += ` - ${utilFunctions.replaceCharactersToHide(_userReceiveMethod.paymentMethodReceiverName, 1)}`;
            paymentNote += ` - ${utilFunctions.replaceCharactersFirstLast(
              _userReceiveMethod.paymentMethodIdentityNumber,
              0,
              3,
            )} tự động từ chối do ngân hàng nhận không nằm trong danh sách`;

            await WithdrawTransactionFunction.rejectWithdrawRequest(transaction.paymentWithdrawTransactionId, undefined, paymentNote);
            Logger.error(`approveAndPayWithdrawTransaction invalid user paymentMethodId ${paymentMethodId}`);
          }
        }
      } else {
        Logger.error(
          `error withdraw transaction approveAndPayWithdrawTransaction with transactionRequestId:${transaction.paymentWithdrawTransactionId}: `,
        );
      }
      // }
    }
  }
}

module.exports = {
  autoApproveWithdraw,
};
