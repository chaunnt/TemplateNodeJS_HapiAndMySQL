/* Copyright (c) 2022 Toriti Tech Team https://t.me/ToritiTech */

/**
 * Created by Huu on 11/18/21.
 */

'use strict';
const SystemConfigurationsResourceAccess = require('../resourceAccess/SystemConfigurationsResourceAccess');
const Logger = require('../../../utils/logging');
const SystemConfigurationsFunction = require('../SystemConfigurationsFunction');
const { ERROR } = require('../../Common/CommonConstant');
async function find(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await SystemConfigurationsResourceAccess.find({}, 0, 1);

      if (data) {
        resolve({ data: data, total: 1 });
      } else {
        resolve({ data: [], total: 0 });
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let config = await SystemConfigurationsResourceAccess.find({}, 0, 1);
      let data = req.payload.data;
      let result = await SystemConfigurationsResourceAccess.updateById(config[0].systemConfigurationsId, data);

      if (data.packageCurrentStage && data.packageCurrentStage !== config[0].packageCurrentStage) {
        const PackageFunction = require('../../PaymentServicePackage/PaymentServicePackageFunctions');
        await PackageFunction.regenerateAllPresalePackage();
      }
      if (result) {
        resolve(result);
      }
      console.error(
        `error SystemConfiguration updateById with systemConfigurationsId ${config[0].systemConfigurationsId}:${ERROR}`,
      );
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

async function userGetDetail(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await SystemConfigurationsResourceAccess.find({}, 0, 1);

      if (data && data.length > 0) {
        let _systemConfig = data[0];

        if (_systemConfig.USDTWalletAddress && _systemConfig.USDTWalletAddress !== null) {
          //them QRCode cho front-end
          const QRCodeFunction = require('../../../ThirdParty/QRCode/QRCodeFunctions');
          const QRCodeImage = await QRCodeFunction.createQRCode(_systemConfig.USDTWalletAddress);
          if (QRCodeImage) {
            _systemConfig.USDTWalletAddressQRCode = `https://${process.env.HOST_NAME}/${QRCodeImage}`;
          }
        }

        resolve(_systemConfig);
      } else {
        console.error(`error SystemConfiguration userGetDetail :${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}
async function getExchangeRate(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await SystemConfigurationsFunction.getExchangeRate();
      if (result) {
        resolve(result);
      } else {
        console.error(`error SystemConfiguration getExchangeRate :${ERROR}`);
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject('failed');
    }
  });
}

module.exports = {
  find,
  updateById,
  userGetDetail,
  getExchangeRate,
};
