const WalletRoute = require('./WalletRoute');

module.exports = [
  { method: 'POST', path: '/Wallet/increaseBalance', config: WalletRoute.increaseBalance },
  { method: 'POST', path: '/Wallet/decreaseBalance', config: WalletRoute.decreaseBalance },
]