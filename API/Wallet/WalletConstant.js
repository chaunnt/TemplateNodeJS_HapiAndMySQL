/* Copyright (c) 2022-2024 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

module.exports = {
  WALLET_TYPE: {
    USDT: 'USDTWallet',
    FAC: 'FACWallet',
    BTC: 'BTCWallet',
    CRYPTO: 'CryptoWallet',
    POINT: 'PointWallet', // vi tiền chính của user
    REWARD: 'RewardWallet', // ví khuyến mãi
    BONUS: 'BonusWallet', // ví hoa hồng
    WIN: 'WinWallet', // ví thưởng
    FAKE: 'FakeWallet', // vi ảo
    MISSION: 'MissionWallet', // vi nhiem vu
  },
  BALANCE_UNIT: {
    VND: 'VND',
    USD: 'USD',
  },
  WALLET_ERROR: {
    NOT_ENOUGH_BALANCE: 'NOT_ENOUGH_BALANCE',
  },
};
