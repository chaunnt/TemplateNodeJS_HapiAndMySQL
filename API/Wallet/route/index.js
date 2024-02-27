/* Copyright (c) 2022-2024 Reminano */

const WalletRoute = require('./WalletRoute');

module.exports = [
  { method: 'POST', path: '/Wallet/increaseBalance', config: WalletRoute.increaseBalance },
  { method: 'POST', path: '/Wallet/decreaseBalance', config: WalletRoute.decreaseBalance },
  { method: 'POST', path: '/Wallet/insert', config: WalletRoute.insert },
];
