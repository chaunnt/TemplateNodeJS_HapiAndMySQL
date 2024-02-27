/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const { updateTotalDepositForUser } = require('../../LeaderBoard/LeaderFunction');
const { getSystemConfig } = require('../../SystemConfigurations/SystemConfigurationsFunction');
const SystemConfigurationsResourceAccess = require('../../SystemConfigurations/resourceAccess/SystemConfigurationsResourceAccess');
const { DEPOSIT_TRX_STATUS, DEPOSIT_TRX_UNIT, DEPOSIT_TRX_CATEGORY } = require('../PaymentDepositTransactionConstant');
const { approveDepositTransaction, updateFirstDepositForUser, denyDepositTransaction } = require('../PaymentDepositTransactionFunctions');
const PaymentDepositTransactionResourceAccess = require('../resourceAccess/PaymentDepositTransactionResourceAccess');
const moment = require('moment');
async function autoCancelDeposit() {
  const systemConfig = await getSystemConfig();
  if (systemConfig.cancelDepositEnable === 0) {
    return;
  }
  let transactionListNew = await PaymentDepositTransactionResourceAccess.find({
    paymentStatus: DEPOSIT_TRX_STATUS.NEW,
    // paymentUnit: DEPOSIT_TRX_UNIT.VND,
  });
  if (transactionListNew && transactionListNew.length > 0) {
    for (let i = 0; i < transactionListNew.length; i++) {
      let transaction = transactionListNew[i];
      let transactionCreatedAt = moment(transaction.createdAt);
      let now = moment();
      let diff = now.diff(transactionCreatedAt, 'minutes');
      if (diff * 1 >= systemConfig.cancelDepositTime * 1) {
        let approveResult = await denyDepositTransaction(transaction.paymentDepositTransactionId, undefined, undefined);
      }
    }
  }
}

module.exports = {
  autoCancelDeposit,
};
