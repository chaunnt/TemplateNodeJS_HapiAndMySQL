/* Copyright (c) 2022 Reminano */

/**
 * Created by A on 7/18/17.
 */
'use strict';

const BetRecordsResource = require('./resourceAccess/BetRecordsResourceAccess');

async function sumTotalUserBetAmountByDate(appUserId, startDate, endDate) {
  let _totalBetAmount = 0;
  let sumResult = await BetRecordsResource.customSum(
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
  let sumResult = await BetRecordsResource.customSumReferedUserByUserId(appUserId, 'betRecordAmountIn', {}, startDate, endDate);
  if (sumResult && sumResult.length > 0) {
    _totalBetAmount = sumResult[0].sumResult;
  }

  return _totalBetAmount;
}

module.exports = {
  sumTotalUserBetAmountByDate,
  sumTotalUserSystemBetAmountByDate,
};
