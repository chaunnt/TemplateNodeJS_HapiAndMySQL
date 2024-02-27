/* Copyright (c) 2022-2023 Reminano */

const WalletRecord = require('./WalletRecordRouter');
const WalletRecord_User = require('./WalletRecord_UserRouter');

module.exports = [
  { method: 'POST', path: '/WalletRecord/find', config: WalletRecord.find },
  { method: 'POST', path: '/WalletRecord/findById', config: WalletRecord.findById },
  { method: 'POST', path: '/WalletRecord/summaryRecordBySystemUser', config: WalletRecord.summaryRecordBySystemUser },

  { method: 'POST', path: '/WalletRecord/user/viewHistory', config: WalletRecord_User.userViewWalletHistory },
  { method: 'POST', path: '/WalletRecord/user/summaryByUser', config: WalletRecord_User.summaryByUser },
];
