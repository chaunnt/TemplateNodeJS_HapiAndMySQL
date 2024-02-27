/* Copyright (c) 2022-2023 TORITECH LIMITED 2022 */

/**
 * Created by A on 7/18/17.
 */
'use strict';
const SystemConfigurationsResource = require('../resourceAccess/SystemConfigurationsResourceAccess');
const Logger = require('../../../utils/logging');
const { UNKNOWN_ERROR, NOT_FOUND } = require('../../Common/CommonConstant');
const PublicSystemConfigModel = require('../model/PublicSystemConfigModel');
const { META_DATA } = require('../data/metaData');

const SYSTEM_CONFIG_ID = 1;
async function updateById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      let systemConfig = req.payload.data;
      let result = await SystemConfigurationsResource.updateById(SYSTEM_CONFIG_ID, systemConfig);
      if (result) {
        resolve(result);
      }
      reject('failed');
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function findById(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //only support for 1 system configuration
      let sysmteConfig = await SystemConfigurationsResource.findById(SYSTEM_CONFIG_ID);
      if (sysmteConfig) {
        resolve(sysmteConfig);
      } else {
        reject('failed');
      }
    } catch (e) {
      Logger.error(__filename, e);
      reject(UNKNOWN_ERROR);
    }
  });
}

async function getPublicSystemConfigurations(req) {
  return new Promise(async (resolve, reject) => {
    try {
      //get all system banner
      let result = await SystemConfigurationsResource.findById(SYSTEM_CONFIG_ID);

      let publicConfig = await PublicSystemConfigModel.fromData(result);

      if (publicConfig) {
        resolve(publicConfig);
      } else {
        return reject(NOT_FOUND);
      }
    } catch (e) {
      Logger.error(__filename, e);
      return reject(UNKNOWN_ERROR);
    }
  });
}

async function getMetaData(req) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(META_DATA);
    } catch (e) {
      Logger.error(__filename, e);
      return reject(UNKNOWN_ERROR);
    }
  });
}

module.exports = {
  updateById,
  findById,
  getPublicSystemConfigurations,
  getMetaData,
};
