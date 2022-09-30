/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

const WalletRecord = require('./WalletRecordRouter');
const WalletRecord_User = require('./WalletRecord_UserRouter');

module.exports = [
  { method: 'POST', path: '/WalletRecord/find', config: WalletRecord.find },
  { method: 'POST', path: '/WalletRecord/user/viewHistoryBTC', config: WalletRecord_User.userHistoryBTC },
  { method: 'POST', path: '/WalletRecord/user/viewHistoryFAC', config: WalletRecord_User.userHistoryFAC },
  { method: 'POST', path: '/WalletRecord/user/viewHistory', config: WalletRecord_User.userHistory },
  {
    method: 'POST',
    path: '/WalletRecord/user/viewHistoryDepositPointWallet',
    config: WalletRecord_User.userHistoryDepositPointWallet,
  },
  {
    method: 'POST',
    path: '/WalletRecord/user/viewHistoryWithdrawPointWallet',
    config: WalletRecord_User.userHistoryWithdrawPointWallet,
  },
];
