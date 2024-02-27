/* Copyright (c) 2022-2023 Reminano */

const PaymentBonusTransaction = require('./PaymentBonusTransactionRoute');
const PaymentBonusTransaction_UserRoute = require('./PaymentBonusTransaction_UserRoute');

module.exports = [
  //Payment Deposit  APIs
  { method: 'POST', path: '/PaymentBonusTransaction/insert', config: PaymentBonusTransaction.insert },
  { method: 'POST', path: '/PaymentBonusTransaction/find', config: PaymentBonusTransaction.find },
  { method: 'POST', path: '/PaymentBonusTransaction/getReferredBonus', config: PaymentBonusTransaction.getReferredBonusOfUser },
  { method: 'POST', path: '/PaymentBonusTransaction/updateById', config: PaymentBonusTransaction.updateById },
  { method: 'POST', path: '/PaymentBonusTransaction/findById', config: PaymentBonusTransaction.findById },
  { method: 'POST', path: '/PaymentBonusTransaction/deleteById', config: PaymentBonusTransaction.deleteById },
  { method: 'POST', path: '/PaymentBonusTransaction/approveBonusTransaction', config: PaymentBonusTransaction.approveBonusTransaction },
  { method: 'POST', path: '/PaymentBonusTransaction/denyBonusTransaction', config: PaymentBonusTransaction.denyBonusTransaction },
  {
    method: 'POST',
    path: '/PaymentBonusTransaction/getWaitingApproveCount',
    config: PaymentBonusTransaction.getWaitingApproveCount,
  },
  {
    method: 'POST',
    path: '/PaymentBonusTransaction/user/requestWithdraw',
    config: PaymentBonusTransaction_UserRoute.userRequestWithdraw,
  },
  {
    method: 'POST',
    path: '/PaymentBonusTransaction/user/bonusHistory',
    config: PaymentBonusTransaction_UserRoute.userGetBonusHistory,
  },
  {
    method: 'POST',
    path: '/PaymentBonusTransaction/user/missionBonusHistory',
    config: PaymentBonusTransaction_UserRoute.userGetMissionBonusHistory,
  },
];
