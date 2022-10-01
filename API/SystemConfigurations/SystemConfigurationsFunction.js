/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const SystemConfigurationsResourceAccess = require('./resourceAccess/SystemConfigurationsResourceAccess');
async function getSystemConfig() {
  let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
  if (config && config.length > 0) {
    return config[0];
  }
  return undefined;
}
async function getExchangeRate(phaseNumber) {
  let result = await getSystemConfig();
  if (result) {
    if (phaseNumber) {
      if (phaseNumber === 1) {
        return result.exchangeRateCoin1;
      }
      if (phaseNumber === 2) {
        return result.exchangeRateCoin2;
      }
      if (phaseNumber === 3) {
        return result.exchangeRateCoin3;
      }
      if (phaseNumber === 4) {
        return result.exchangeRateCoin4;
      }
      if (phaseNumber === 5) {
        return result.exchangeRateCoin5;
      } else {
        return undefined;
      }
    } else {
      if (result.packageCurrentStage === 1) {
        return result.exchangeRateCoin1;
      }
      if (result.packageCurrentStage === 2) {
        return result.exchangeRateCoin2;
      }
      if (result.packageCurrentStage === 3) {
        return result.exchangeRateCoin3;
      }
      if (result.packageCurrentStage === 4) {
        return result.exchangeRateCoin4;
      }
      if (result.packageCurrentStage === 5) {
        return result.exchangeRateCoin5;
      } else {
        return undefined;
      }
    }
  } else {
    return undefined;
  }
}

async function totalUserExploitFAC() {
  const UserPackageResource = require('../PaymentServicePackage/resourceAccess/PaymentServicePackageUserResourceAccess');

  let result = await UserPackageResource.customCountDistinct({}, 'appUserId');
  if (result) {
    return result[0].CountResult;
  } else {
    return 0;
  }
}
async function totalExploitFAC() {
  const UserPackageResource = require('../PaymentServicePackage/resourceAccess/PaymentServicePackageUserResourceAccess');
  let profitClaimed = await UserPackageResource.customSum('profitClaimed', {});
  let profitActual = await UserPackageResource.customSum('profitActual', {});
  if (profitClaimed && profitActual) {
    return profitClaimed[0].sumResult + profitActual[0].sumResult;
  } else {
    return 0;
  }
}
module.exports = {
  getSystemConfig,
  getExchangeRate,
  totalExploitFAC,
  totalUserExploitFAC,
};
