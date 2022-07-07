const WalletRecord = require('./WalletRecordRouter');
const WalletRecord_User = require('./WalletRecord_UserRouter');

module.exports = [
  { method: 'POST', path: '/WalletRecord/find', config: WalletRecord.find },
  { method: 'POST', path: '/WalletRecord/user/viewHistoryBTC', config: WalletRecord_User.userHistoryBTC },
  { method: 'POST', path: '/WalletRecord/user/viewHistoryFAC', config: WalletRecord_User.userHistoryFAC },
  { method: 'POST', path: '/WalletRecord/user/viewHistoryPOINT', config: WalletRecord_User.userHistoryPOINT },
];