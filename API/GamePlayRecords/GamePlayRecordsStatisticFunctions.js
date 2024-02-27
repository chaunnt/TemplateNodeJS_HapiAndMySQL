/* Copyright (c) 2022-2023 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const moment = require('moment');
const GamePlayRecordsResource = require('./resourceAccess/GamePlayRecordsResourceAccess');
const { isValidValue } = require('../ApiUtils/utilFunctions');

async function sumTotalUserBetAmountByDate(appUserId, startDate, endDate) {
  let _totalBetAmount = 0;
  let sumResult = await GamePlayRecordsResource.customSum(
    'betRecordAmountIn',
    {
      appUserId: appUserId,
    },
    startDate,
    endDate,
  );
  if (sumResult && sumResult.length > 0) {
    _totalBetAmount = sumResult[0].sumResult;
  }

  return _totalBetAmount;
}

async function sumTotalUserSystemBetAmountByDate(appUserId, startDate, endDate) {
  let _totalBetAmount = 0;
  let sumResult = await GamePlayRecordsResource.customSumReferedUserByUserId(appUserId, 'betRecordAmountIn', {}, startDate, endDate);
  if (sumResult && sumResult.length > 0) {
    _totalBetAmount = sumResult[0].sumResult;
  }

  return _totalBetAmount;
}

async function sumTotalSystemBetByDate(betRecordType) {
  const startDate = moment().format('YYYY-MM-DD 00:00:00');
  const endDate = moment().add(1, 'd').format('YYYY-MM-DD 00:00:00');
  const statisticalGameAmount = await Promise.all([
    GamePlayRecordsResource.sumaryPointAmount(startDate, endDate, {
      betRecordType,
    }),
    GamePlayRecordsResource.sumaryWinLoseAmount(startDate, endDate, {
      betRecordType,
    }),
  ]);
  const objectStatisticalGameAmount = {
    totalPlayedAmount: statisticalGameAmount[0][0].sumResult || 0,
    totalWinningAmount: statisticalGameAmount[1][0].sumResult || 0,
  };
  objectStatisticalGameAmount.totalBonusAmount = objectStatisticalGameAmount.totalPlayedAmount + objectStatisticalGameAmount.totalWinningAmount;

  return objectStatisticalGameAmount;
}

async function sumTotalPlayAmountUserId(appUserId, startDate, endDate) {
  const statisticalGameAmount = await GamePlayRecordsResource.customSum('betRecordAmountIn', { appUserId: appUserId }, startDate, endDate);
  if (isValidValue(statisticalGameAmount) && isValidValue(statisticalGameAmount[0].sumResult)) {
    return statisticalGameAmount[0].sumResult;
  } else {
    return 0;
  }
}

module.exports = {
  sumTotalUserBetAmountByDate,
  sumTotalUserSystemBetAmountByDate,
  sumTotalSystemBetByDate,
  sumTotalPlayAmountUserId,
};
