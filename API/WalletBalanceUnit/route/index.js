/* Copyright (c) 2022-2023 Reminano */

const WalletBalanceUnit = require('./WalletBalanceUnitRoute');

module.exports = [
  {
    method: 'POST',
    path: '/WalletBalanceUnit/insert',
    config: WalletBalanceUnit.insert,
  },
  {
    method: 'POST',
    path: '/WalletBalanceUnit/find',
    config: WalletBalanceUnit.find,
  },
  {
    method: 'POST',
    path: '/WalletBalanceUnit/findById',
    config: WalletBalanceUnit.findById,
  },
  {
    method: 'POST',
    path: '/WalletBalanceUnit/updateById',
    config: WalletBalanceUnit.updateById,
  },
  {
    method: 'POST',
    path: '/WalletBalanceUnit/deleteById',
    config: WalletBalanceUnit.deleteById,
  },
  {
    method: 'POST',
    path: '/WalletBalanceUnit/user/getList',
    config: WalletBalanceUnit.getList,
  },
];
