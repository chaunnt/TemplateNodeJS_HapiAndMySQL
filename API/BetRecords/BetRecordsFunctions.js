/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const BetRecordsResource = require('./resourceAccess/BetRecordsResourceAccess');
const WalletResource = require('../Wallet/resourceAccess/WalletResourceAccess');
const { WALLET_TYPE } = require('../Wallet/WalletConstant');

const Logger = require('../../utils/logging');

async function getCurrentBetSection(sectionName, betType) {
  const GameRecordResource = require('../GameRecord/resourceAccess/GameRecordsResourceAccess');
  const { GAME_RECORD_STATUS } = require('../GameRecord/GameRecordConstant');
  const _order = {
    key: 'gameRecordSection',
    value: 'asc',
  };

  let gameRecord = await GameRecordResource.find(
    {
      gameRecordSection: sectionName,
      gameRecordType: betType,
      gameRecordStatus: GAME_RECORD_STATUS.NEW,
    },
    0,
    1,
    _order,
  );

  if (gameRecord && gameRecord.length > 0) {
    return gameRecord[0];
  }

  return undefined;
}

async function _placeNewBet(userId, betRecordAmountIn, sectionName, wallet, betType, betRecordValue) {
  let _currentSection = await getCurrentBetSection(sectionName, betType);
  if (!_currentSection) {
    Logger.error(`can not _placeNewBet with empty _currentSection`);
    return undefined;
  }

  if (wallet.balance * 1 < betRecordAmountIn * 1) {
    Logger.error(`not enough balance to _placeNewBet`);
    return undefined;
  }
  let decrementResult = await WalletResource.decrementBalance(wallet.walletId, betRecordAmountIn);
  if (!decrementResult) {
    Logger.error(`failed to decrease balance when _placeNewBet`);
    return undefined;
  }

  let newBetData = {
    appUserId: userId,
    betRecordAmountIn: betRecordAmountIn,
    walletId: wallet.walletId,
    betRecordType: betType,
    betRecordSection: sectionName,
    betRecordValue: betRecordValue,
  };

  let newBetResult = await BetRecordsResource.insert(newBetData);

  if (!newBetResult) {
    Logger.error(`failed to _placeNewBet`);
  }

  return newBetResult;
}

async function placeUserBet(userId, betRecordAmountIn, sectionName, betType, betRecordValue) {
  if (!userId || userId < 1) {
    console.error('null userid can not place bet');
    return undefined;
  }

  if (!sectionName || sectionName === '') {
    console.error('null sectionName can not place bet');
    return undefined;
  }

  let wallet = await WalletResource.find(
    {
      appUserId: userId,
      walletType: WALLET_TYPE.POINT, //vi diem
    },
    0,
    1,
  );

  if (wallet && wallet.length > 0) {
    wallet = wallet[0];
  } else {
    Logger.error('can not find wallet to placeNewBet');
    return undefined;
  }

  return await _placeNewBet(userId, betRecordAmountIn, sectionName, wallet, betType, betRecordValue);
}

module.exports = {
  placeUserBet,
  getCurrentBetSection,
};
